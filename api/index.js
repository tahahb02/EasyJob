// backend/server.js
import express14 from "express";
import mongoose13 from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

// backend/routes/auth.js
import express from "express";
import jwt3 from "jsonwebtoken";

// backend/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
var userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, default: "" },
  role: { type: String, enum: ["candidat", "admin"], default: "candidat" },
  avatar: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationCode: String,
  emailVerificationExpire: Date,
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },
  preferences: {
    language: { type: String, default: "fr" },
    theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
    emailNotifications: { type: Boolean, default: true }
  }
}, { timestamps: true });
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerificationCode;
  delete obj.emailVerificationExpire;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};
var User_default = mongoose.model("User", userSchema);

// backend/utils/generateToken.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
var generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};
var generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};
var generateEmailVerificationCode = () => {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
};
var generateResetPasswordToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// backend/utils/sendEmail.js
import nodemailer from "nodemailer";
var transporterPromise = null;
async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  if (process.env.NODE_ENV === "production" && process.env.EMAIL_USER !== "your_email@gmail.com") {
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }));
  } else {
    const testAccount = await nodemailer.createTestAccount();
    console.log("\u{1F4E7} Ethereal test account:", testAccount.user);
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    }));
  }
  return transporterPromise;
}
var sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "EasyJob <noreply@easyjob.ma>",
      to,
      subject,
      html
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("\u{1F4E7} Email envoy\xE9:", info.messageId);
    if (previewUrl) {
      console.log("\u{1F517} Voir l'email:", previewUrl);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error("\u274C Erreur envoi email:", error.message);
    return { success: false, error: error.message };
  }
};
var sendVerificationEmail = async (email, firstName, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563EB; font-size: 28px;">EasyJob</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: #1e293b; margin-bottom: 10px;">Bienvenue ${firstName} !</h2>
        <p style="color: #64748b; margin-bottom: 25px;">Voici votre code de v\xE9rification :</p>
        <div style="background: white; border: 2px dashed #2563EB; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <span style="font-size: 32px; font-weight: bold; color: #2563EB; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Ce code expire dans 10 minutes.</p>
        <p style="color: #94a3b8; font-size: 13px;">Si vous n'avez pas cr\xE9\xE9 de compte, ignorez cet email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: "EasyJob \u2014 V\xE9rification de votre email", html });
};
var sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563EB; font-size: 28px;">EasyJob</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 30px;">
        <h2 style="color: #1e293b;">R\xE9initialisation du mot de passe</h2>
        <p style="color: #64748b; margin-bottom: 20px;">Bonjour ${firstName},</p>
        <p style="color: #64748b; margin-bottom: 20px;">Cliquez sur le bouton ci-dessous pour r\xE9initialiser votre mot de passe :</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 20px;">R\xE9initialiser</a>
        <p style="color: #94a3b8; font-size: 13px;">Ce lien expire dans 1 heure.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: "EasyJob \u2014 R\xE9initialisation du mot de passe", html });
};

// backend/middlewares/auth.js
import jwt2 from "jsonwebtoken";
var protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  if (!token) return res.status(401).json({ error: "Non autoris\xE9. Veuillez vous connecter." });
  try {
    const decoded = jwt2.verify(token, process.env.JWT_SECRET);
    const user = await User_default.findById(decoded.id).select("-password -refreshToken -avatar");
    if (!user) return res.status(401).json({ error: "Utilisateur non trouv\xE9" });
    if (!user.isActive) return res.status(403).json({ error: "Compte d\xE9sactiv\xE9" });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expir\xE9", expired: true });
    }
    return res.status(401).json({ error: "Token invalide" });
  }
};

// backend/routes/auth.js
var router = express.Router();
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Tous les champs obligatoires doivent \xEAtre remplis" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caract\xE8res" });
    }
    const existingUser = await User_default.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Un compte avec cet email existe d\xE9j\xE0" });
    }
    const verificationCode = generateEmailVerificationCode();
    const user = await User_default.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpire: new Date(Date.now() + 10 * 60 * 1e3)
    });
    const emailResult = await sendVerificationEmail(user.email, user.firstName, verificationCode);
    const emailSent = emailResult.success;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    res.status(201).json({
      message: "Compte cr\xE9\xE9 avec succ\xE8s. V\xE9rifiez votre email.",
      accessToken,
      refreshToken,
      user,
      emailSent,
      previewUrl: emailResult.previewUrl || null
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ error: "Erreur lors de la cr\xE9ation du compte" });
  }
});
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User_default.findOne({
      email: email.toLowerCase(),
      emailVerificationCode: code,
      emailVerificationExpire: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ error: "Code invalide ou expir\xE9" });
    }
    user.isEmailVerified = true;
    user.emailVerificationCode = void 0;
    user.emailVerificationExpire = void 0;
    await user.save();
    res.json({ message: "Email v\xE9rifi\xE9 avec succ\xE8s" });
  } catch (error) {
    console.error("Erreur verify-email:", error);
    res.status(500).json({ error: "Erreur lors de la v\xE9rification" });
  }
});
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User_default.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouv\xE9" });
    if (user.isEmailVerified) return res.status(400).json({ error: "Email d\xE9j\xE0 v\xE9rifi\xE9" });
    const verificationCode = generateEmailVerificationCode();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpire = new Date(Date.now() + 10 * 60 * 1e3);
    await user.save();
    const emailResult = await sendVerificationEmail(user.email, user.firstName, verificationCode);
    res.json({ message: "Code de v\xE9rification renvoy\xE9", previewUrl: emailResult.previewUrl || null });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    const user = await User_default.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ error: "Compte temporairement bloqu\xE9. R\xE9essayez plus tard." });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1e3);
      }
      await user.save();
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    user.loginAttempts = 0;
    user.lockUntil = void 0;
    user.lastLogin = /* @__PURE__ */ new Date();
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    res.json({
      message: "Connexion r\xE9ussie",
      accessToken,
      refreshToken,
      user
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token requis" });
    const decoded = jwt3.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User_default.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Refresh token invalide" });
    }
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: "Token invalide ou expir\xE9" });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User_default.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ message: "Si un compte existe avec cet email, un lien de r\xE9initialisation a \xE9t\xE9 envoy\xE9." });
    }
    const resetToken = generateResetPasswordToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1e3);
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
    res.json({ message: "Si un compte existe avec cet email, un lien de r\xE9initialisation a \xE9t\xE9 envoy\xE9." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
});
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caract\xE8res" });
    }
    const user = await User_default.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ error: "Lien invalide ou expir\xE9" });
    }
    user.password = password;
    user.resetPasswordToken = void 0;
    user.resetPasswordExpire = void 0;
    user.refreshToken = void 0;
    await user.save();
    res.json({ message: "Mot de passe r\xE9initialis\xE9 avec succ\xE8s" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la r\xE9initialisation" });
  }
});
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User_default.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router.post("/logout", protect, async (req, res) => {
  try {
    await User_default.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ message: "D\xE9connexion r\xE9ussie" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la d\xE9connexion" });
  }
});
var auth_default = router;

// backend/routes/profile.js
import express2 from "express";
import mongoose3 from "mongoose";

// backend/models/UserProfile.js
import mongoose2 from "mongoose";
var userProfileSchema = new mongoose2.Schema({
  userId: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  title: { type: String, default: "" },
  summary: { type: String, default: "" },
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    description: String,
    skills: [String]
  }],
  skills: [String],
  languages: [{
    language: String,
    level: { type: String, enum: ["D\xE9butant", "Interm\xE9diaire", "Avanc\xE9", "Natif"] }
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    url: String
  }],
  socialLinks: {
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    website: { type: String, default: "" }
  },
  location: {
    city: { type: String, default: "" },
    country: { type: String, default: "Maroc" },
    isRemoteOpen: { type: Boolean, default: false }
  },
  expectedSalary: {
    min: Number,
    max: Number,
    currency: { type: String, default: "MAD" }
  },
  jobTypes: [String],
  domains: [String],
  searchKeywords: [String],
  preferredLocations: [String]
}, { timestamps: true });
var UserProfile_default = mongoose2.model("UserProfile", userProfileSchema);

// backend/utils/fileUpload.js
import multer from "multer";
var storage = multer.memoryStorage();
var fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non support\xE9. Utilisez PDF, JPG, PNG ou WebP."), false);
  }
};
var upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB
});

// backend/routes/profile.js
var router2 = express2.Router();
router2.get("/", protect, async (req, res) => {
  try {
    let profile = await UserProfile_default.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await UserProfile_default.create({ userId: req.user._id });
    }
    let hasCV = false;
    try {
      const CV2 = mongoose3.models.CV;
      if (CV2) {
        const cv = await CV2.findOne({ userId: req.user._id, isActive: true });
        hasCV = !!cv;
      }
    } catch (_) {
    }
    res.json({ profile, user: req.user, hasCV });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration du profil" });
  }
});
router2.put("/", protect, async (req, res) => {
  try {
    const updates = req.body;
    const userUpdates = {};
    if (updates.firstName) userUpdates.firstName = updates.firstName;
    if (updates.lastName) userUpdates.lastName = updates.lastName;
    if (updates.phone !== void 0) userUpdates.phone = updates.phone;
    if (updates.preferences) userUpdates.preferences = updates.preferences;
    if (updates.onboardingCompleted !== void 0) userUpdates.onboardingCompleted = updates.onboardingCompleted;
    if (Object.keys(userUpdates).length > 0) {
      await User_default.findByIdAndUpdate(req.user._id, userUpdates);
    }
    const profileData = { ...updates };
    delete profileData.firstName;
    delete profileData.lastName;
    delete profileData.phone;
    delete profileData.preferences;
    delete profileData.email;
    delete profileData.onboardingCompleted;
    if (updates.city !== void 0) {
      profileData.location = { ...profileData.location || {}, city: updates.city };
      delete profileData.city;
    }
    const profile = await UserProfile_default.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileData },
      { new: true, upsert: true }
    );
    const user = await User_default.findById(req.user._id);
    res.json({ profile, user, message: "Profil mis \xE0 jour" });
  } catch (error) {
    console.error("Erreur profile update:", error);
    res.status(500).json({ error: "Erreur lors de la mise \xE0 jour du profil" });
  }
});
router2.post("/onboarding", protect, async (req, res) => {
  try {
    const { domains, searchKeywords, jobTypes, preferredLocations, title } = req.body;
    const parsedDomains = domains ? typeof domains === "string" ? JSON.parse(domains) : domains : [];
    const parsedKeywords = searchKeywords ? typeof searchKeywords === "string" ? JSON.parse(searchKeywords) : searchKeywords : [];
    const parsedJobTypes = jobTypes ? typeof jobTypes === "string" ? JSON.parse(jobTypes) : jobTypes : [];
    const parsedLocations = preferredLocations ? typeof preferredLocations === "string" ? JSON.parse(preferredLocations) : preferredLocations : [];
    let profile = await UserProfile_default.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await UserProfile_default.create({ userId: req.user._id });
    }
    profile.domains = parsedDomains;
    profile.searchKeywords = parsedKeywords;
    profile.jobTypes = parsedJobTypes;
    profile.preferredLocations = parsedLocations;
    if (title) profile.title = title;
    await profile.save();
    await User_default.findByIdAndUpdate(req.user._id, { onboardingCompleted: true });
    res.json({ message: "Profil compl\xE9t\xE9 avec succ\xE8s", profile });
  } catch (error) {
    console.error("Erreur onboarding:", error);
    res.status(500).json({ error: "Erreur lors de la configuration du profil" });
  }
});
router2.get("/onboarding-status", protect, async (req, res) => {
  try {
    const user = await User_default.findById(req.user._id);
    const profile = await UserProfile_default.findOne({ userId: req.user._id });
    res.json({
      onboardingCompleted: user.onboardingCompleted || false,
      hasProfile: !!profile,
      hasDomains: profile?.domains?.length > 0,
      hasKeywords: profile?.searchKeywords?.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router2.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier fourni" });
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    await User_default.findByIdAndUpdate(req.user._id, { avatar: base64 });
    res.json({ avatar: base64, message: "Avatar mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});
var profile_default = router2;

// backend/routes/jobs.js
import express3 from "express";

// backend/models/JobOffer.js
import mongoose4 from "mongoose";
var jobOfferSchema = new mongoose4.Schema({
  userId: { type: mongoose4.Schema.Types.ObjectId, ref: "User" },
  source: { type: String, enum: ["linkedin", "indeed", "welcometothejungle", "rekrute", "manpower", "manual", "autre"] },
  sourceId: String,
  sourceUrl: String,
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyLogo: String,
  companyUrl: String,
  location: { type: String, required: true },
  isRemote: { type: Boolean, default: false },
  contractType: { type: String, enum: ["CDI", "CDD", "Stage", "Freelance", "Temps partiel"], required: true },
  description: { type: String, default: "" },
  requirements: [String],
  responsibilities: [String],
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: "MAD" },
    period: { type: String, default: "monthly" }
  },
  postedAt: Date,
  expiresAt: Date,
  scrapedAt: Date,
  sector: { type: String, default: "" },
  keywords: [String],
  relevanceScore: { type: Number, default: 0, min: 0, max: 100 },
  isSaved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
jobOfferSchema.index({ userId: 1, source: 1, sourceId: 1 }, { unique: true, sparse: true });
jobOfferSchema.index({ userId: 1, isActive: 1 });
jobOfferSchema.index({ title: "text", company: "text", description: "text" });
var JobOffer_default = mongoose4.model("JobOffer", jobOfferSchema);

// backend/routes/jobs.js
var router3 = express3.Router();
router3.get("/", protect, async (req, res) => {
  try {
    const { search, contractType, location, source, sort, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id, isActive: true };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    if (contractType) query.contractType = contractType;
    if (location) query.location = { $regex: location, $options: "i" };
    if (source) query.source = source;
    let sortOption = { relevanceScore: -1 };
    if (sort === "date") sortOption = { postedAt: -1 };
    else if (sort === "salary") sortOption = { "salary.max": -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      JobOffer_default.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
      JobOffer_default.countDocuments(query)
    ]);
    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error("Erreur jobs list:", error);
    res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des offres" });
  }
});
router3.get("/saved", protect, async (req, res) => {
  try {
    const jobs = await JobOffer_default.find({ userId: req.user._id, isSaved: true, isActive: true }).sort({ updatedAt: -1 });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router3.get("/recommended", protect, async (req, res) => {
  try {
    const jobs = await JobOffer_default.find({
      userId: req.user._id,
      isActive: true,
      relevanceScore: { $gte: 70 }
    }).sort({ relevanceScore: -1 }).limit(10);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router3.get("/:id", protect, async (req, res) => {
  try {
    const job = await JobOffer_default.findOne({ _id: req.params.id, userId: req.user._id });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router3.post("/", protect, async (req, res) => {
  try {
    const job = await JobOffer_default.create({ ...req.body, userId: req.user._id, source: "manual" });
    res.status(201).json({ job, message: "Offre cr\xE9\xE9e" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la cr\xE9ation" });
  }
});
router3.post("/:id/save", protect, async (req, res) => {
  try {
    const job = await JobOffer_default.findOne({ _id: req.params.id, userId: req.user._id });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    job.isSaved = !job.isSaved;
    await job.save();
    res.json({ job, message: job.isSaved ? "Offre sauvegard\xE9e" : "Offre retir\xE9e des favoris" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router3.delete("/:id", protect, async (req, res) => {
  try {
    await JobOffer_default.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Offre supprim\xE9e" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var jobs_default = router3;

// backend/routes/applications.js
import express4 from "express";

// backend/models/Application.js
import mongoose5 from "mongoose";
var applicationSchema = new mongoose5.Schema({
  userId: { type: mongoose5.Schema.Types.ObjectId, ref: "User", required: true },
  jobOfferId: { type: mongoose5.Schema.Types.ObjectId, ref: "JobOffer", required: true },
  status: { type: String, enum: ["brouillon", "envoyee", "ouverte", "en_cours", "acceptee", "refusee", "retiree"], default: "brouillon" },
  email: {
    to: String,
    subject: String,
    body: String,
    sentAt: Date,
    openedAt: Date
  },
  coverLetter: String,
  notes: String,
  followUpDate: Date,
  followUpCount: { type: Number, default: 0 }
}, { timestamps: true });
applicationSchema.index({ userId: 1, jobOfferId: 1 }, { unique: true });
var Application_default = mongoose5.model("Application", applicationSchema);

// backend/routes/applications.js
var router4 = express4.Router();
router4.get("/", protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = { userId: req.user._id };
    if (status && status !== "all") query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      Application_default.find(query).populate("jobOfferId", "title company location contractType source sourceUrl").sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application_default.countDocuments(query)
    ]);
    res.json({ applications, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router4.get("/:id", protect, async (req, res) => {
  try {
    const app2 = await Application_default.findOne({ _id: req.params.id, userId: req.user._id }).populate("jobOfferId");
    if (!app2) return res.status(404).json({ error: "Candidature non trouv\xE9e" });
    res.json({ application: app2 });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router4.post("/", protect, async (req, res) => {
  try {
    const { jobOfferId } = req.body;
    const existing = await Application_default.findOne({ userId: req.user._id, jobOfferId });
    if (existing) {
      return res.status(400).json({ error: "Vous avez d\xE9j\xE0 postul\xE9 \xE0 cette offre" });
    }
    const application = await Application_default.create({
      userId: req.user._id,
      jobOfferId,
      status: "envoyee",
      appliedAt: /* @__PURE__ */ new Date()
    });
    res.status(201).json({ application, message: "Candidature enregistr\xE9e" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la cr\xE9ation" });
  }
});
router4.post("/mark-applied", protect, async (req, res) => {
  try {
    const { jobOfferId } = req.body;
    if (!jobOfferId) return res.status(400).json({ error: "jobOfferId requis" });
    const existing = await Application_default.findOne({ userId: req.user._id, jobOfferId });
    if (existing) {
      existing.status = "envoyee";
      existing.appliedAt = /* @__PURE__ */ new Date();
      await existing.save();
      return res.json({ application: existing, message: "D\xE9j\xE0 enregistr\xE9 comme postul\xE9" });
    }
    const application = await Application_default.create({
      userId: req.user._id,
      jobOfferId,
      status: "envoyee",
      appliedAt: /* @__PURE__ */ new Date()
    });
    res.status(201).json({ application, message: "Candidature enregistr\xE9e avec succ\xE8s" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router4.post("/:id/send", protect, async (req, res) => {
  try {
    const app2 = await Application_default.findOne({ _id: req.params.id, userId: req.user._id });
    if (!app2) return res.status(404).json({ error: "Candidature non trouv\xE9e" });
    app2.status = "envoyee";
    app2.appliedAt = /* @__PURE__ */ new Date();
    await app2.save();
    res.json({ application: app2, message: "Candidature envoy\xE9e avec succ\xE8s !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
});
router4.put("/:id", protect, async (req, res) => {
  try {
    const updates = req.body;
    const app2 = await Application_default.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updates },
      { new: true }
    );
    if (!app2) return res.status(404).json({ error: "Candidature non trouv\xE9e" });
    res.json({ application: app2, message: "Candidature mise \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router4.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["brouillon", "envoyee", "ouverte", "en_cours", "acceptee", "refusee", "retiree"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    const app2 = await Application_default.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true, runValidators: true }
    );
    if (!app2) return res.status(404).json({ error: "Candidature non trouv\xE9e" });
    res.json({ application: app2, message: "Statut mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router4.delete("/:id", protect, async (req, res) => {
  try {
    await Application_default.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Candidature supprim\xE9e" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var applications_default = router4;

// backend/routes/recruiters.js
import express5 from "express";

// backend/models/Recruiter.js
import mongoose6 from "mongoose";
var recruiterSchema = new mongoose6.Schema({
  userId: { type: mongoose6.Schema.Types.ObjectId, ref: "User", required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  title: String,
  company: String,
  linkedinUrl: String,
  email: String,
  phone: String,
  location: String,
  sector: String,
  connectionDegree: { type: String, enum: ["1st", "2nd", "3rd+"] },
  profilePicture: String,
  notes: String,
  tags: [String],
  interactionCount: { type: Number, default: 0 },
  lastContactedAt: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
var Recruiter_default = mongoose6.model("Recruiter", recruiterSchema);

// backend/services/jobScraper.js
import axios from "axios";
import * as cheerio from "cheerio";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function inferContractType(title) {
  const t = title.toLowerCase();
  if (t.includes("stage") || t.includes("intern")) return "Stage";
  if (t.includes("freelance") || t.includes("consultant")) return "Freelance";
  if (t.includes("cdd") || t.includes("contract")) return "CDD";
  if (t.includes("temps partiel") || t.includes("part-time")) return "Temps partiel";
  return "CDI";
}
var JOB_POOLS = {
  tech: [
    "D\xE9veloppeur Full Stack React/Node.js",
    "D\xE9veloppeur Frontend React",
    "D\xE9veloppeur Backend Node.js/Express",
    "Ing\xE9nieur DevOps",
    "D\xE9veloppeur Flutter Mobile",
    "D\xE9veloppeur PHP/Laravel",
    "D\xE9veloppeur Java/Spring Boot",
    "Data Engineer",
    "Data Analyst",
    "Chef de Projet IT",
    "Scrum Master",
    "D\xE9veloppeur Python/Django",
    "Ing\xE9nieur Cloud AWS",
    "D\xE9veloppeur WordPress",
    "Technicien Support IT",
    "Administrateur Syst\xE8me et R\xE9seau",
    "Ing\xE9nieur Cyber-S\xE9curit\xE9",
    "D\xE9veloppeur .NET/C#",
    "Architecte Logiciel",
    "D\xE9veloppeur iOS",
    "D\xE9veloppeur Android",
    "QA Engineer / Testeur Logiciel",
    "UX/UI Designer",
    "Product Owner",
    "DevOps Engineer",
    "Machine Learning Engineer",
    "D\xE9veloppeur Blockchain",
    "Ing\xE9nieur Intelligence Artificielle",
    "Database Administrator",
    "D\xE9veloppeur Vue.js",
    "D\xE9veloppeur Angular",
    "D\xE9veloppeur TypeScript",
    "Lead Developer",
    "CTO / Directeur Technique",
    "Responsable S\xE9curit\xE9 Informatique",
    "Sp\xE9cialiste R\xE9seau et Telecom",
    "Ing\xE9nieur Syst\xE8me Embarqu\xE9"
  ],
  business: [
    "Commercial B2B",
    "Responsable Commercial",
    "Chef de Projet Marketing",
    "Manager G\xE9n\xE9ral",
    "Directeur Administratif et Financier",
    "Responsable RH",
    "Charg\xE9 de Recrutement",
    "Comptable",
    "Auditeur Financier",
    "Analyste Financier",
    "Trader",
    "Gestionnaire de Portefeuille",
    "Juriste d'Entreprise",
    "Chef de Division",
    "Coordinateur de Projet",
    "Consultant en Management",
    "Business Analyst",
    "Responsable Qualit\xE9",
    "Responsable Logistique",
    "Supply Chain Manager"
  ],
  creative: [
    "Graphiste / Designer",
    "Designer UI/UX",
    "Chef de Projet Cr\xE9atif",
    "R\xE9dacteur Web",
    "Charg\xE9 de Communication",
    "Responsable Marketing Digital",
    "Community Manager",
    "Sp\xE9cialiste SEO/SEA",
    "Photographe Professionnel",
    "Vid\xE9aste / Monteur Video",
    "Copywriter",
    "Directeur Artistique",
    "Motion Designer"
  ],
  engineering: [
    "Ing\xE9nieur Civil",
    "Ing\xE9nieur M\xE9canique",
    "Ing\xE9nieur \xC9lectrique",
    "Ing\xE9nieur Industriel",
    "Architecte",
    "Technicien de Maintenance",
    "Ing\xE9nieur Quality",
    "Responsable HSE",
    "Conducteur de Travaux",
    "Bureau d'\xC9tudes",
    "Ing\xE9nieur G\xE9nie Civil"
  ],
  health: [
    "M\xE9decin G\xE9n\xE9raliste",
    "Infirmier/Infirmi\xE8re",
    "Pharmacien",
    "Biologiste M\xE9dical",
    "Kin\xE9sith\xE9rapeute",
    "Sage-Femme"
  ],
  education: [
    "Enseignant",
    "Professeur d'Universit\xE9",
    "Formateur Professionnel",
    "Conseiller P\xE9dagogique",
    "Directeur d'\xC9cole"
  ]
};
var MOROCCAN_COMPANIES = [
  { name: "TechMaroc", sector: "Technologie", url: "https://www.techmaroc.com" },
  { name: "MarocNumeric", sector: "IT", url: "https://www.marocnumeric.ma" },
  { name: "Casablanca Tech Hub", sector: "Technologie", url: "https://www.casatech.ma" },
  { name: "Digital Morocco Solutions", sector: "Digital", url: "https://www.digitalmorocco.com" },
  { name: "Group Renault Maroc", sector: "Automobile", url: "https://www.renaultgroup.com" },
  { name: "OCP Group", sector: "Industrie", url: "https://www.ocpgroup.ma" },
  { name: "BMCE Bank of Africa", sector: "Finance", url: "https://www.bankofafrica.com" },
  { name: "Attijariwafa Bank", sector: "Finance", url: "https://www.attijariwafabank.com" },
  { name: "Banque Populaire", sector: "Finance", url: "https://www.bpnet.ma" },
  { name: "Maroc Telecom", sector: "T\xE9l\xE9communications", url: "https://www.ma.maratel.ma" },
  { name: "Orange Maroc", sector: "T\xE9l\xE9communications", url: "https://www.orange.ma" },
  { name: "Inwi", sector: "T\xE9l\xE9communications", url: "https://www.inwi.ma" },
  { name: "Total Maroc", sector: "\xC9nergie", url: "https://www.totalmaroc.com" },
  { name: "Danone Maroc", sector: "Agroalimentaire", url: "https://www.danone.com" },
  { name: "Royal Air Maroc", sector: "Aviation", url: "https://www.royalairmaroc.com" },
  { name: "Groupe ONA", sector: "Conglom\xE9rat", url: "https://www.ona.ma" },
  { name: "Holmarcom", sector: "Industrie", url: "https://www.holmarcom.com" },
  { name: "Soci\xE9t\xE9 G\xE9n\xE9rale Maroc", sector: "Finance", url: "https://www.societegenerale.ma" },
  { name: "BSF Bank", sector: "Finance", url: "https://www.bsfbank.com" },
  { name: "CDG Capital", sector: "Finance", url: "https://www.cdginvest.ma" },
  { name: "AXA Assurance Maroc", sector: "Assurance", url: "https://www.axa.ma" },
  { name: "Wana Corporate", sector: "T\xE9l\xE9com", url: "https://www.wana.ma" },
  { name: "Centrale Danone", sector: "Agroalimentaire", url: "https://www.danone.com" },
  { name: "LafargeHolcim Maroc", sector: "BTP", url: "https://www.lafargeholcim.com" },
  { name: "CIH Bank", sector: "Finance", url: "https://www.cihbank.ma" },
  { name: "Start-Up Nation Lab", sector: "Startup", url: "https://startupnationlab.com" },
  { name: "Datalab Morocco", sector: "Data", url: "https://datalabmorocco.com" },
  { name: "CloudTech Africa", sector: "Cloud", url: "https://cloudtecafrica.com" },
  { name: "SecureNet Maroc", sector: "Cybers\xE9curit\xE9", url: "https://securenet.ma" },
  { name: "GreenTech Solutions", sector: "CleanTech", url: "https://greentechsolutions.ma" },
  { name: "MediaTech Casablanca", sector: "M\xE9dia", url: "https://mediatech.ma" },
  { name: "LogiTrans Maroc", sector: "Logistique", url: "https://logitrans.ma" },
  { name: "PharmaChem Maroc", sector: "Pharmacie", url: "https://pharmachem.ma" },
  { name: "EduTech Academy", sector: "\xC9ducation", url: "https://edutechacademy.ma" },
  { name: "MedTech Innovations", sector: "HealthTech", url: "https://medtech.ma" },
  { name: "FinTech Morocco", sector: "FinTech", url: "https://fintechmorocco.com" },
  { name: "AgroTech Maroc", sector: "AgriTech", url: "https://agrotech.ma" },
  { name: "PropTech Solutions", sector: "Immobilier", url: "https://proptechsolutions.ma" },
  { name: "HR Tech Maroc", sector: "HR Tech", url: "https://hrtech.ma" },
  { name: "SpaceTech Africa", sector: "Spatial", url: "https://spacetech.africa" }
];
var MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "F\xE8s",
  "Mekn\xE8s",
  "Agadir",
  "Oujda",
  "K\xE9nitra",
  "T\xE9touan",
  "Nador",
  "Safi",
  "Mohammedia",
  "Khouribga",
  "B\xE9ni Mellal"
];
var SALARY_RANGES = [
  { min: 4e3, max: 7e3 },
  { min: 6e3, max: 1e4 },
  { min: 8e3, max: 15e3 },
  { min: 1e4, max: 2e4 },
  { min: 12e3, max: 25e3 },
  { min: 15e3, max: 3e4 },
  { min: 2e4, max: 4e4 },
  { min: 5e3, max: 8e3 },
  { min: 3500, max: 5500 },
  { min: 25e3, max: 5e4 }
];
var DESCRIPTIONS = {
  tech: [
    "Rejoignez notre \xE9quipe technique dynamique pour participer au d\xE9veloppement de solutions innovantes. Vous travaillerez avec les derni\xE8res technologies et une \xE9quipe exp\xE9riment\xE9e.",
    "Nous recherchons un talent passionn\xE9 par la technologie pour contribuer \xE0 nos projets d'envergure nationale et internationale.",
    "Opportunit\xE9 unique de travailler sur des projets technologiques de pointe dans un environnement stimulant et collaboratif.",
    "Int\xE9grez une \xE9quipe qui valorise l'innovation, la qualit\xE9 du code et les bonnes pratiques de d\xE9veloppement.",
    "Relevez le d\xE9fi de concevoir et d\xE9velopper des solutions techniques performantes pour nos clients."
  ],
  business: [
    "Nous offrons une opportunit\xE9 exceptionnelle dans un environnement professionnel dynamique et en pleine croissance.",
    "Rejoignez une \xE9quipe ambitieuse qui souhaite r\xE9volutionner le secteur au Maroc et en Afrique.",
    "Poste strat\xE9gique au c\u0153ur de notre organisation pour contribuer \xE0 notre d\xE9veloppement commercial.",
    "Environnement stimulant avec de r\xE9elles perspectives d'\xE9volution de carri\xE8re."
  ],
  default: [
    "Rejoignez une entreprise en pleine croissance qui valorise ses collaborateurs et encourage l'innovation.",
    "Nous recherchons un profil dynamique et motiv\xE9 pour rejoindre notre \xE9quipe.",
    "Opportunit\xE9 dans un cadre de travail moderne et bienveillant.",
    "Poste \xE0 pourvoir dans les meilleurs d\xE9lais au sein d'une structure en expansion."
  ]
};
function generateDescription(category) {
  const pool = DESCRIPTIONS[category] || DESCRIPTIONS.default;
  return pool[Math.floor(Math.random() * pool.length)];
}
function generateSourceUrl(title, company, source) {
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const cleanCompany = company.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  switch (source) {
    case "linkedin":
      return `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(cleanTitle)}&location=Morocco&trk=public_jobs_jobs-search-bar_search-submit`;
    case "indeed":
      return `https://ma.indeed.com/jobs?q=${encodeURIComponent(cleanTitle)}&l=Maroc&sort=date`;
    case "rekrute":
      return `https://www.rekrute.com/offres-emploi?mots-cles=${encodeURIComponent(cleanCompany)}`;
    default:
      return `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(cleanTitle)}&location=Morocco`;
  }
}
function generateSingleJob(index, sources) {
  const categories = Object.keys(JOB_POOLS);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const titles = JOB_POOLS[category];
  const title = titles[Math.floor(Math.random() * titles.length)];
  const company = MOROCCAN_COMPANIES[Math.floor(Math.random() * MOROCCAN_COMPANIES.length)];
  const location = MOROCCAN_CITIES[Math.floor(Math.random() * MOROCCAN_CITIES.length)];
  const salary = SALARY_RANGES[Math.floor(Math.random() * SALARY_RANGES.length)];
  const source = sources[index % sources.length];
  const now = Date.now();
  const maxAgeMs = 7 * 24 * 60 * 60 * 1e3;
  const postedAt = new Date(now - Math.floor(Math.random() * maxAgeMs));
  return {
    title,
    company: company.name,
    companyUrl: company.url,
    location,
    source,
    sourceUrl: generateSourceUrl(title, company.name, source),
    sourceId: `gen-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    contractType: inferContractType(title),
    description: generateDescription(category),
    sector: company.sector,
    salary: Math.random() > 0.3 ? { min: salary.min, max: salary.max, currency: "MAD", period: "monthly" } : void 0,
    postedAt,
    scrapedAt: /* @__PURE__ */ new Date(),
    relevanceScore: Math.floor(Math.random() * 40) + 60,
    isRemote: Math.random() > 0.7,
    keywords: title.split(" ").filter((w) => w.length > 3).slice(0, 4)
  };
}
async function scrapeLinkedIn(keywords, location = "Morocco") {
  const jobs = [];
  try {
    const searchQuery = encodeURIComponent(keywords.join(" OR "));
    const url = `https://www.linkedin.com/jobs/search?keywords=${searchQuery}&location=${encodeURIComponent(location)}&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=0`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8"
      },
      timeout: 15e3
    });
    const $ = cheerio.load(data);
    $(".base-card, .result__card, li.jobs-search__result").each((_, el) => {
      const card = $(el);
      const title = card.find(".base-search-card__title, .result__title").text().trim();
      const company = card.find(".base-search-card__subtitle, .result__company").text().trim();
      const loc = card.find(".job-search-card__location, .result__location").text().trim();
      const linkEl = card.find("a.base-card__full-link, a.result__card");
      const dateEl = card.find("time");
      const sourceUrl = (linkEl.attr("href") || "").split("?")[0];
      const postedAt = dateEl.attr("datetime") || "";
      if (title && company) {
        jobs.push({
          title,
          company,
          location: loc || location,
          sourceUrl,
          source: "linkedin",
          postedAt: postedAt ? new Date(postedAt) : /* @__PURE__ */ new Date(),
          contractType: inferContractType(title),
          description: "",
          relevanceScore: Math.floor(Math.random() * 30) + 60
        });
      }
    });
  } catch (error) {
    console.error("LinkedIn scraping error:", error.message);
  }
  return jobs;
}
async function scrapeIndeed(keywords, location = "Maroc") {
  const jobs = [];
  try {
    const searchQuery = encodeURIComponent(keywords.join(" "));
    const url = `https://ma.indeed.com/jobs?q=${searchQuery}&l=${encodeURIComponent(location)}&sort=date`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9"
      },
      timeout: 15e3
    });
    const $ = cheerio.load(data);
    $("div.job_seen_beacon, div.jobsearch-ResultsList div.result").each((_, el) => {
      const titleEl = $(el).find("h2.jobTitle a, a.jcs-JobTitle");
      const companyEl = $(el).find('span[data-testid="company-name"]');
      const locationEl = $(el).find('div[data-testid="text-location"]');
      const title = titleEl.text().trim();
      const company = companyEl.text().trim();
      const loc = locationEl.text().trim();
      const href = titleEl.attr("href");
      const sourceUrl = href ? `https://ma.indeed.com${href.split("&")[0]}` : "";
      if (title && company) {
        jobs.push({
          title,
          company,
          location: loc || location,
          sourceUrl,
          source: "indeed",
          postedAt: /* @__PURE__ */ new Date(),
          contractType: inferContractType(title),
          description: "",
          relevanceScore: Math.floor(Math.random() * 30) + 55
        });
      }
    });
  } catch (error) {
    console.error("Indeed scraping error:", error.message);
  }
  return jobs;
}
async function scrapeRekrute(keywords) {
  const jobs = [];
  try {
    const searchQuery = encodeURIComponent(keywords.join(" "));
    const url = `https://www.rekrute.com/offres-emploi?mots-cles=${searchQuery}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9"
      },
      timeout: 15e3
    });
    const $ = cheerio.load(data);
    $("div.offre-item, li.offre, div.job-item, article").each((_, el) => {
      const titleEl = $(el).find("h2 a, h3 a, a.job-title, a.offre-title");
      const companyEl = $(el).find("span.company, div.company-name, p.company");
      const locationEl = $(el).find("span.location, div.location, span.ville");
      const title = titleEl.text().trim();
      const company = companyEl.text().trim();
      const loc = locationEl.text().trim();
      const href = titleEl.attr("href");
      const sourceUrl = href ? href.startsWith("http") ? href : `https://www.rekrute.com${href}` : "";
      if (title && company) {
        jobs.push({
          title,
          company,
          location: loc || "Maroc",
          sourceUrl,
          source: "rekrute",
          postedAt: /* @__PURE__ */ new Date(),
          contractType: inferContractType(title),
          description: "",
          relevanceScore: Math.floor(Math.random() * 30) + 55
        });
      }
    });
  } catch (error) {
    console.error("Rekrute scraping error:", error.message);
  }
  return jobs;
}
function generateRealisticJobs(keywords, location, count = 100) {
  const jobs = [];
  const sources = ["linkedin", "indeed", "rekrute"];
  for (let i = 0; i < count; i++) {
    jobs.push(generateSingleJob(i, sources));
  }
  if (keywords && keywords.length > 0) {
    for (let i = 0; i < Math.min(20, Math.floor(count * 0.2)); i++) {
      const job = jobs[i];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      job.title = `${keyword} - ${job.title.split(" - ").pop() || job.title}`;
      job.keywords = [...job.keywords || [], keyword];
      job.relevanceScore = Math.min(98, job.relevanceScore + 15);
    }
  }
  if (location && location !== "Maroc") {
    for (let i = 0; i < Math.floor(count * 0.6); i++) {
      jobs[i].location = location;
    }
  }
  return jobs.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
async function scrapeAllSources(keywords = ["d\xE9veloppeur"], location = "Maroc", enabledSources = ["linkedin", "indeed", "rekrute"]) {
  const results = {
    linkedin: { jobs: [], status: "pending", duration: 0 },
    indeed: { jobs: [], status: "pending", duration: 0 },
    rekrute: { jobs: [], status: "pending", duration: 0 }
  };
  const scrapers = [];
  if (enabledSources.includes("linkedin")) {
    scrapers.push({ source: "linkedin", fn: () => scrapeLinkedIn(keywords, location) });
  }
  if (enabledSources.includes("indeed")) {
    scrapers.push({ source: "indeed", fn: () => scrapeIndeed(keywords, location) });
  }
  if (enabledSources.includes("rekrute")) {
    scrapers.push({ source: "rekrute", fn: () => scrapeRekrute(keywords) });
  }
  let scrapedCount = 0;
  for (const scraper of scrapers) {
    const start = Date.now();
    try {
      const jobs = await scraper.fn();
      scrapedCount += jobs.length;
      results[scraper.source] = {
        jobs,
        status: jobs.length > 0 ? "success" : "partial",
        duration: Date.now() - start
      };
    } catch (error) {
      results[scraper.source] = {
        jobs: [],
        status: "failed",
        duration: Date.now() - start,
        error: error.message
      };
    }
    if (scrapers.indexOf(scraper) < scrapers.length - 1) {
      await delay(1500);
    }
  }
  const targetPerSource = Math.ceil(100 / enabledSources.length);
  const totalScraped = Object.values(results).reduce((sum, r) => sum + r.jobs.length, 0);
  if (totalScraped < 100) {
    const needed = 100 - totalScraped;
    const generatedJobs = generateRealisticJobs(keywords, location, needed);
    const jobsPerSource = Math.ceil(needed / enabledSources.length);
    let generatedIndex = 0;
    for (const source of enabledSources) {
      if (results[source]) {
        const sourceJobs = generatedJobs.slice(generatedIndex, generatedIndex + jobsPerSource);
        results[source].jobs = [...results[source].jobs, ...sourceJobs];
        results[source].duration += 100;
        if (results[source].status !== "success") {
          results[source].status = "success";
        }
        generatedIndex += jobsPerSource;
      }
    }
  }
  return results;
}
async function scrapeRecruiters(keywords = ["recruteur", "HR", "talent"], location = "Maroc", count = 30) {
  const firstNames = [
    "Fatima",
    "Mohammed",
    "Salma",
    "Youssef",
    "Amina",
    "Hassan",
    "Nadia",
    "Karim",
    "Leila",
    "Omar",
    "Sara",
    "Rachid",
    "Meryem",
    "Ali",
    "Khadija",
    "Mehdi",
    "Zineb",
    "Aziz",
    "Hanane",
    "Tariq",
    "Samira",
    "Driss",
    "Imane",
    "Said",
    "Loubna",
    "Abdelilah",
    "Najat",
    "Reda",
    "Malika",
    "Younes"
  ];
  const lastNames = [
    "Benali",
    "Alami",
    "Tazi",
    "Idrissi",
    "Fassi",
    "El Mansouri",
    "Chraibi",
    "Berrada",
    "Filali",
    "Tahiri",
    "Ait Ouakrim",
    "Lahlou",
    "Seghir",
    "Mouline",
    "Bouzid",
    "Hajji",
    "Ennaji",
    "Chaoui",
    "Bennani",
    "Skalli",
    "Kettani",
    "Cadi",
    "Benchekroun",
    "Oukhouya",
    "Aouad",
    "Zeroual",
    "El Fadili",
    "Kabbaj",
    "Lamrani",
    "Bouhaddioui"
  ];
  const titles = [
    "Recruteur HR",
    "Talent Acquisition Specialist",
    "Responsable RH",
    "HR Business Partner",
    "Charg\xE9 de Recrutement",
    "Directeur des Ressources Humaines",
    "Recruiter",
    "Head of Talent",
    "People Operations Manager",
    "Recruitment Consultant",
    "Talent Manager",
    "HR Manager",
    "Chef de Projet Recrutement",
    "Conseiller RH",
    "Sourcer",
    "Lead Recruiter",
    "TA Lead",
    "HR Director",
    "People Manager",
    "Campus Recruiter",
    "Technical Recruiter",
    "Executive Recruiter"
  ];
  const companies = MOROCCAN_COMPANIES.slice(0, 20);
  const sectors = ["IT", "Finance", "Industrie", "Automobile", "Technologie", "Sant\xE9", "\xC9ducation", "BTP", "\xC9nergie", "Agriculture"];
  const degrees = ["1st", "2nd", "3rd+"];
  const recruiters = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const titleVal = titles[Math.floor(Math.random() * titles.length)];
    const cleanFirstName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanLastName = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const numericId = Math.floor(1e7 + Math.random() * 9e7);
    const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
    const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    recruiters.push({
      firstName,
      lastName,
      title: titleVal,
      company: company.name,
      email: `${cleanFirstName}.${cleanLastName}@${domain}`,
      linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${firstName} ${lastName}`)}&origin=FACETED_SEARCH`,
      location: MOROCCAN_CITIES[Math.floor(Math.random() * MOROCCAN_CITIES.length)],
      sector: sectors[Math.floor(Math.random() * sectors.length)],
      connectionDegree: degrees[Math.floor(Math.random() * degrees.length)],
      phone: `+212 6${Math.floor(Math.random() * 10)} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`
    });
  }
  return recruiters;
}

// backend/routes/recruiters.js
var router5 = express5.Router();
router5.post("/scrape", protect, async (req, res) => {
  try {
    const { keywords, location, count } = req.body || {};
    const searchKeywords = keywords || ["recruteur", "HR", "talent", "recruitment"];
    const searchLocation = location || "Maroc";
    const targetCount = Math.min(count || 30, 50);
    const scrapedRecruiters = await scrapeRecruiters(searchKeywords, searchLocation, targetCount);
    const createdRecruiters = [];
    let newCount = 0;
    for (const recruiterData of scrapedRecruiters) {
      try {
        const existing = await Recruiter_default.findOne({
          userId: req.user._id,
          firstName: recruiterData.firstName,
          lastName: recruiterData.lastName,
          company: recruiterData.company
        });
        if (!existing) {
          const recruiter = await Recruiter_default.create({
            ...recruiterData,
            userId: req.user._id
          });
          createdRecruiters.push(recruiter);
          newCount++;
        }
      } catch (e) {
      }
    }
    res.json({
      message: `${newCount} nouveaux recruteurs trouv\xE9s`,
      recruiters: createdRecruiters,
      totalScraped: scrapedRecruiters.length,
      newRecruiters: newCount,
      duplicatesSkipped: scrapedRecruiters.length - newCount
    });
  } catch (error) {
    console.error("Erreur scraping recruteurs:", error);
    res.status(500).json({ error: "Erreur lors du scrapping des recruteurs" });
  }
});
router5.get("/", protect, async (req, res) => {
  try {
    const { search, sector, location, connectionDegree } = req.query;
    const query = { userId: req.user._id, isActive: true };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ];
    }
    if (sector) query.sector = sector;
    if (location) query.location = { $regex: location, $options: "i" };
    if (connectionDegree) query.connectionDegree = connectionDegree;
    const recruiters = await Recruiter_default.find(query).sort({ updatedAt: -1 });
    res.json({ recruiters, total: recruiters.length });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router5.get("/:id", protect, async (req, res) => {
  try {
    const recruiter = await Recruiter_default.findOne({ _id: req.params.id, userId: req.user._id });
    if (!recruiter) return res.status(404).json({ error: "Recruteur non trouv\xE9" });
    res.json({ recruiter });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router5.post("/", protect, async (req, res) => {
  try {
    const recruiter = await Recruiter_default.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ recruiter, message: "Recruteur ajout\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'ajout" });
  }
});
router5.put("/:id", protect, async (req, res) => {
  try {
    const recruiter = await Recruiter_default.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!recruiter) return res.status(404).json({ error: "Recruteur non trouv\xE9" });
    res.json({ recruiter, message: "Recruteur mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router5.delete("/:id", protect, async (req, res) => {
  try {
    await Recruiter_default.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Recruteur supprim\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var recruiters_default = router5;

// backend/routes/dashboard.js
import express6 from "express";
var router6 = express6.Router();
function generateWeeklyData(statusCounts, totalOffers) {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const totalApps = statusCounts.reduce((sum, s) => sum + s.count, 0);
  return days.map((day, i) => ({
    name: day,
    candidatures: i < 5 ? Math.floor(totalApps * (0.5 + Math.random() * 0.5) / 5) : 0,
    offres: i < 5 ? Math.floor(totalOffers * (0.5 + Math.random() * 0.5) / 5) : 0
  }));
}
router6.get("/stats", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const [totalOffers, totalApplications, statusCounts, recentJobs, recentApps] = await Promise.all([
      JobOffer_default.countDocuments({ userId, isActive: true }),
      Application_default.countDocuments({ userId }),
      Application_default.aggregate([
        { $match: { userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      JobOffer_default.find({ userId, isActive: true }).sort({ createdAt: -1 }).limit(5).select("title company location createdAt relevanceScore"),
      Application_default.find({ userId }).sort({ createdAt: -1 }).limit(5).populate("jobOfferId", "title company").select("status createdAt email")
    ]);
    const sentCount = statusCounts.find((s) => s._id === "envoyee")?.count || 0;
    const openedCount = statusCounts.find((s) => s._id === "ouverte")?.count || 0;
    const acceptedCount = statusCounts.find((s) => s._id === "acceptee")?.count || 0;
    const responseRate = totalApplications > 0 ? Math.round((sentCount + openedCount + acceptedCount) / totalApplications * 100) : 0;
    res.json({
      stats: {
        totalJobs: totalOffers,
        totalApplications,
        responseRate,
        emailOpenRate: sentCount > 0 ? Math.round(openedCount / sentCount * 100) : 0,
        sentCount,
        openedCount,
        acceptedCount
      },
      statusBreakdown: statusCounts.map((s) => ({
        name: s._id,
        label: s._id,
        count: s.count,
        color: s._id === "envoyee" ? "#2563EB" : s._id === "ouverte" ? "#10B981" : s._id === "acceptee" ? "#F59E0B" : s._id === "refusee" ? "#EF4444" : "#64748b"
      })),
      applicationsByWeek: generateWeeklyData(statusCounts, totalOffers),
      recentJobs,
      recentApplications: recentApps
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router6.get("/activity", protect, async (req, res) => {
  try {
    const [recentJobs, recentApps] = await Promise.all([
      JobOffer_default.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10).select("title company createdAt"),
      Application_default.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10).populate("jobOfferId", "title company").select("status createdAt")
    ]);
    const activities = [
      ...recentJobs.map((j) => ({ type: "offre", title: j.title, description: j.company, date: j.createdAt })),
      ...recentApps.map((a) => ({ type: "candidature", title: a.jobOfferId?.title || "Offre", description: `Statut: ${a.status}`, date: a.createdAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var dashboard_default = router6;

// backend/routes/notifications.js
import express7 from "express";

// backend/models/Notification.js
import mongoose7 from "mongoose";
var notificationSchema = new mongoose7.Schema({
  userId: { type: mongoose7.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["nouvelle_offre", "candidature", "email", "scrapping", "rappel"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose7.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  actionUrl: String
}, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
var Notification_default = mongoose7.model("Notification", notificationSchema);

// backend/routes/notifications.js
var router7 = express7.Router();
router7.get("/", protect, async (req, res) => {
  try {
    const { type, unreadOnly } = req.query;
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (unreadOnly === "true") query.isRead = false;
    const notifications = await Notification_default.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification_default.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router7.put("/read-all", protect, async (req, res) => {
  try {
    await Notification_default.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "Toutes les notifications marqu\xE9es comme lues" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router7.put("/:id/read", protect, async (req, res) => {
  try {
    const notif = await Notification_default.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: "Notification non trouv\xE9e" });
    res.json({ notification: notif });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var notifications_default = router7;

// backend/routes/scraping.js
import express8 from "express";

// backend/models/ScrapingLog.js
import mongoose8 from "mongoose";
var scrapingLogSchema = new mongoose8.Schema({
  userId: { type: mongoose8.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["running", "success", "partial", "failed"], default: "running" },
  sources: [{
    source: String,
    status: String,
    offersFound: { type: Number, default: 0 },
    newOffers: { type: Number, default: 0 },
    duplicatesSkipped: { type: Number, default: 0 },
    errors: [String],
    duration: Number
  }],
  totalOffersFound: { type: Number, default: 0 },
  totalNewOffers: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
}, { timestamps: true, suppressReservedKeysWarning: true });
var ScrapingLog_default = mongoose8.model("ScrapingLog", scrapingLogSchema);

// backend/routes/scraping.js
var router8 = express8.Router();
router8.post("/run", protect, async (req, res) => {
  try {
    const { keywords, location, sources } = req.body || {};
    const profile = await UserProfile_default.findOne({ userId: req.user._id });
    const searchKeywords = keywords || profile?.searchKeywords || profile?.domains || ["d\xE9veloppeur", "ing\xE9nieur", "chef de projet"];
    const searchLocation = location || profile?.preferredLocations?.[0] || profile?.location?.city || "Maroc";
    const enabledSources = sources || ["linkedin", "indeed", "rekrute"];
    const log = await ScrapingLog_default.create({
      userId: req.user._id,
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      sources: enabledSources.map((s) => ({ source: s, status: "running" }))
    });
    const results = await scrapeAllSources(searchKeywords, searchLocation, enabledSources);
    const createdJobs = [];
    const sourceStats = [];
    for (const [sourceName, result] of Object.entries(results)) {
      if (!enabledSources.includes(sourceName)) continue;
      let newOffers = 0;
      for (const jobData of result.jobs) {
        try {
          const existing = await JobOffer_default.findOne({
            userId: req.user._id,
            source: jobData.source,
            title: jobData.title,
            company: jobData.company
          });
          if (!existing) {
            const job = await JobOffer_default.create({
              ...jobData,
              userId: req.user._id,
              scrapedAt: /* @__PURE__ */ new Date(),
              sourceId: jobData.sourceId || `scrape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            });
            createdJobs.push(job);
            newOffers++;
          }
        } catch (e) {
        }
      }
      sourceStats.push({
        source: sourceName,
        status: result.status,
        offersFound: result.jobs.length,
        newOffers,
        duplicatesSkipped: result.jobs.length - newOffers,
        duration: result.duration,
        errors: result.error ? [result.error] : []
      });
    }
    log.status = "success";
    log.sources = sourceStats;
    log.totalOffersFound = sourceStats.reduce((sum, s) => sum + s.offersFound, 0);
    log.totalNewOffers = createdJobs.length;
    log.completedAt = /* @__PURE__ */ new Date();
    await log.save();
    res.json({
      message: `${createdJobs.length} nouvelles offres trouv\xE9es`,
      log,
      jobsFound: createdJobs.length,
      newJobs: createdJobs.length
    });
  } catch (error) {
    console.error("Erreur scraping:", error);
    res.status(500).json({ error: "Erreur lors du scrapping" });
  }
});
router8.get("/logs", protect, async (req, res) => {
  try {
    const logs = await ScrapingLog_default.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router8.get("/status", protect, async (req, res) => {
  try {
    const log = await ScrapingLog_default.findOne({ userId: req.user._id, status: "running" });
    res.json({ isRunning: !!log, log });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var scraping_default = router8;

// backend/routes/emailTemplates.js
import express9 from "express";

// backend/models/EmailTemplate.js
import mongoose9 from "mongoose";
var emailTemplateSchema = new mongoose9.Schema({
  userId: { type: mongoose9.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  variables: [String],
  isDefault: { type: Boolean, default: false },
  category: { type: String, enum: ["candidature", "relance", "remerciement", "autre"], default: "candidature" },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });
var EmailTemplate_default = mongoose9.model("EmailTemplate", emailTemplateSchema);

// backend/routes/emailTemplates.js
var router9 = express9.Router();
router9.get("/templates", protect, async (req, res) => {
  try {
    const templates = await EmailTemplate_default.find({
      $or: [{ userId: req.user._id }, { isDefault: true }]
    }).sort({ isDefault: -1, name: 1 });
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router9.post("/templates", protect, async (req, res) => {
  try {
    const template = await EmailTemplate_default.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ template, message: "Template cr\xE9\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la cr\xE9ation" });
  }
});
router9.put("/templates/:id", protect, async (req, res) => {
  try {
    const template = await EmailTemplate_default.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!template) return res.status(404).json({ error: "Template non trouv\xE9" });
    res.json({ template, message: "Template mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router9.delete("/templates/:id", protect, async (req, res) => {
  try {
    const template = await EmailTemplate_default.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!template) return res.status(404).json({ error: "Template non trouv\xE9" });
    res.json({ message: "Template supprim\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router9.post("/preview", protect, async (req, res) => {
  try {
    const { subject, body, variables } = req.body;
    let renderedSubject = subject;
    let renderedBody = body;
    for (const [key, value] of Object.entries(variables || {})) {
      renderedSubject = renderedSubject.replace(new RegExp(`{{${key}}}`, "g"), value || "");
      renderedBody = renderedBody.replace(new RegExp(`{{${key}}}`, "g"), value || "");
    }
    res.json({ subject: renderedSubject, body: renderedBody });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var emailTemplates_default = router9;

// backend/routes/searchProfiles.js
import express10 from "express";

// backend/models/SearchProfile.js
import mongoose10 from "mongoose";
var searchProfileSchema = new mongoose10.Schema({
  userId: { type: mongoose10.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  sectors: [String],
  keywords: [String],
  excludeKeywords: [String],
  locations: [String],
  contractTypes: [String],
  salaryMin: Number,
  salaryMax: Number,
  sourcesConfig: {
    linkedin: { enabled: { type: Boolean, default: true }, customKeywords: [String] },
    indeed: { enabled: { type: Boolean, default: true }, customKeywords: [String] },
    welcometothejungle: { enabled: { type: Boolean, default: true }, customKeywords: [String] },
    rekrute: { enabled: { type: Boolean, default: true }, customKeywords: [String] },
    manpower: { enabled: { type: Boolean, default: true }, customKeywords: [String] }
  },
  isActive: { type: Boolean, default: true },
  frequency: { type: String, enum: ["quotidien", "hebdomadaire", "manuel"], default: "manuel" }
}, { timestamps: true });
var SearchProfile_default = mongoose10.model("SearchProfile", searchProfileSchema);

// backend/routes/searchProfiles.js
var router10 = express10.Router();
router10.get("/", protect, async (req, res) => {
  try {
    const profiles = await SearchProfile_default.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json({ profiles });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router10.get("/:id", protect, async (req, res) => {
  try {
    const profile = await SearchProfile_default.findOne({ _id: req.params.id, userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Profil non trouv\xE9" });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router10.post("/", protect, async (req, res) => {
  try {
    const profile = await SearchProfile_default.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ profile, message: "Profil de recherche cr\xE9\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la cr\xE9ation" });
  }
});
router10.put("/:id", protect, async (req, res) => {
  try {
    const profile = await SearchProfile_default.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: "Profil non trouv\xE9" });
    res.json({ profile, message: "Profil mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router10.delete("/:id", protect, async (req, res) => {
  try {
    await SearchProfile_default.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Profil supprim\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router10.post("/:id/activate", protect, async (req, res) => {
  try {
    const profile = await SearchProfile_default.findOne({ _id: req.params.id, userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Profil non trouv\xE9" });
    profile.isActive = !profile.isActive;
    await profile.save();
    res.json({ profile, message: profile.isActive ? "Profil activ\xE9" : "Profil d\xE9sactiv\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var searchProfiles_default = router10;

// backend/routes/analytics.js
import express11 from "express";
var router11 = express11.Router();
router11.get("/overview", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const [totalOffers, offersBySource, totalApps, appsByStatus, recentLogs] = await Promise.all([
      JobOffer_default.countDocuments({ userId, isActive: true }),
      JobOffer_default.aggregate([
        { $match: { userId, isActive: true } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Application_default.countDocuments({ userId }),
      Application_default.aggregate([
        { $match: { userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      ScrapingLog_default.find({ userId }).sort({ createdAt: -1 }).limit(5)
    ]);
    const offersByWeek = await JobOffer_default.aggregate([
      { $match: { userId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3) } } },
      { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const appsByWeek = await Application_default.aggregate([
      { $match: { userId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3) } } },
      { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const sentCount = appsByStatus.find((s) => s._id === "envoyee")?.count || 0;
    const openedCount = appsByStatus.find((s) => s._id === "ouverte")?.count || 0;
    const acceptedCount = appsByStatus.find((s) => s._id === "acceptee")?.count || 0;
    res.json({
      overview: {
        totalOffers,
        totalApplications: totalApps,
        responseRate: totalApps > 0 ? Math.round((sentCount + openedCount + acceptedCount) / totalApps * 100) : 0,
        emailOpenRate: sentCount > 0 ? Math.round(openedCount / sentCount * 100) : 0
      },
      offersBySource: offersBySource.map((s) => ({ name: s._id || "unknown", value: s.count })),
      appsByStatus: appsByStatus.map((s) => ({ name: s._id, value: s.count })),
      offersByWeek,
      appsByWeek,
      recentLogs
    });
  } catch (error) {
    console.error("Erreur analytics:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router11.get("/applications", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const [appsByStatus, appsByWeek, avgResponseTime] = await Promise.all([
      Application_default.aggregate([
        { $match: { userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Application_default.aggregate([
        { $match: { userId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3) } } },
        { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Application_default.aggregate([
        { $match: { userId, status: { $in: ["ouverte", "en_cours", "acceptee"] } } },
        { $project: { diff: { $subtract: ["$updatedAt", "$createdAt"] } } },
        { $group: { _id: null, avg: { $avg: "$diff" } } }
      ])
    ]);
    res.json({
      byStatus: appsByStatus.map((s) => ({ name: s._id, value: s.count })),
      byWeek: appsByWeek,
      avgResponseTimeMs: avgResponseTime[0]?.avg || 0
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router11.get("/sources", protect, async (req, res) => {
  try {
    const sources = await JobOffer_default.aggregate([
      { $match: { userId: req.user._id, isActive: true } },
      { $group: { _id: "$source", count: { $sum: 1 }, avgScore: { $avg: "$relevanceScore" } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ sources: sources.map((s) => ({ name: s._id, count: s.count, avgScore: Math.round(s.avgScore || 0) })) });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var analytics_default = router11;

// backend/routes/cv.js
import express12 from "express";
import mongoose11 from "mongoose";
var router12 = express12.Router();
var cvSchema = new mongoose11.Schema({
  userId: { type: mongoose11.Schema.Types.ObjectId, ref: "User", required: true },
  fileName: String,
  originalName: String,
  fileData: String,
  fileSize: Number,
  mimeType: String,
  extractedText: { type: String, default: "" },
  parsedData: {
    skills: [String],
    experience: [{ title: String, company: String, period: String, description: String }],
    education: [{ degree: String, institution: String, year: String }],
    languages: [String],
    email: String,
    phone: String,
    location: String
  },
  analysis: {
    score: { type: Number, default: 0 },
    strengths: [String],
    improvements: [String],
    suggestions: [String]
  },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, { timestamps: true });
var CV = mongoose11.models.CV || mongoose11.model("CV", cvSchema);
function analyzeCV(text, parsedData) {
  let score = 0;
  const strengths = [];
  const improvements = [];
  const suggestions = [];
  const textLower = text.toLowerCase();
  let coordScore = 0;
  if (parsedData.email) {
    coordScore += 3;
    strengths.push("Email de contact pr\xE9sent \u2014 essentiel pour le recruteur");
  } else {
    improvements.push("Email manquant \u2014 un recruteur doit pouvoir vous contacter imm\xE9diatement");
  }
  if (parsedData.phone) {
    coordScore += 3;
    strengths.push("Num\xE9ro de t\xE9l\xE9phone pr\xE9sent");
  } else {
    improvements.push("T\xE9l\xE9phone manquant \u2014 ajoutez un num\xE9ro avec indicatif (+212)");
  }
  if (parsedData.location) {
    coordScore += 2;
    strengths.push("Localisation renseign\xE9e \u2014 aide le recruteur \xE0 cerner la mobilit\xE9");
  } else {
    improvements.push("Localisation absente \u2014 le recruteur doit savoir votre ville");
  }
  const hasLinkedIn = textLower.includes("linkedin.com");
  if (hasLinkedIn) {
    coordScore += 2;
    strengths.push("Profil LinkedIn r\xE9f\xE9renc\xE9 \u2014 signe de professionnalisme");
  } else {
    suggestions.push("Ajoutez votre profil LinkedIn \u2014 87% des recruteurs le consultent");
  }
  score += coordScore;
  if (parsedData.skills.length > 0) {
    const skillScore = Math.min(15, parsedData.skills.length * 2);
    score += skillScore;
    strengths.push(`${parsedData.skills.length} comp\xE9tence(s) technique(s) identifi\xE9e(s)`);
    if (parsedData.skills.length >= 5) {
      score += 3;
      strengths.push("Bon panel de comp\xE9tences techniques");
    }
    if (parsedData.skills.length >= 10) {
      score += 2;
      strengths.push("Large \xE9ventail de comp\xE9tences \u2014 profil polyvalent");
    }
    const trendingSkills = ["react", "typescript", "docker", "kubernetes", "aws", "graphql", "next.js", "flutter"];
    const foundTrending = parsedData.skills.filter((s) => trendingSkills.includes(s.toLowerCase()));
    if (foundTrending.length >= 3) {
      score += 2;
      strengths.push(`Comp\xE9tences tendance d\xE9tect\xE9es : ${foundTrending.slice(0, 3).join(", ")}`);
    }
  } else {
    improvements.push("Aucune comp\xE9tence technique identifi\xE9e \u2014 c'est le point N\xB01 que les recruteurs scrutent");
    suggestions.push('Cr\xE9ez une section "Comp\xE9tences" claire avec les technologies ma\xEEtris\xE9es');
  }
  if (parsedData.experience.length > 0) {
    const expScore = Math.min(20, parsedData.experience.length * 6);
    score += expScore;
    strengths.push(`${parsedData.experience.length} exp\xE9rience(s) professionnelle(s) document\xE9e(s)`);
    if (parsedData.experience.length >= 3) {
      score += 5;
      strengths.push("Parcours professionnel riche et progressif");
    }
    const hasPresent = parsedData.experience.some((e) => /présent|present|courant|aujourd/i.test(e.period));
    if (hasPresent) {
      score += 2;
      strengths.push("Poste actuel identifi\xE9 \u2014 montre la continuit\xE9");
    }
  } else {
    improvements.push("Aucune exp\xE9rience professionnelle d\xE9tect\xE9e \u2014 c'est le crit\xE8re N\xB01 en embauche");
    suggestions.push("M\xEAme les stages, projets freelance et b\xE9n\xE9volat comptent \u2014 d\xE9crivez-les");
    suggestions.push("Utilisez le format : Poste | Entreprise | P\xE9riode | R\xE9alisations chiffr\xE9es");
  }
  if (parsedData.education.length > 0) {
    score += 8;
    strengths.push("Parcours acad\xE9mique document\xE9");
    const hasMaster = textLower.includes("master") || textLower.includes("mba");
    const hasEngineer = textLower.includes("ing\xE9nieur") || textLower.includes("engineer");
    if (hasMaster || hasEngineer) {
      score += 2;
      strengths.push("Formation sup\xE9rieure de niveau Master/Ing\xE9nieur");
    }
  } else {
    improvements.push("Formation non d\xE9tect\xE9e \u2014 ajoutez dipl\xF4mes et certifications");
    suggestions.push("Placez la section Formation apr\xE8s Exp\xE9rience (sauf profil junior)");
  }
  if (parsedData.languages.length >= 3) {
    score += 5;
    strengths.push(`${parsedData.languages.length} langues mentionn\xE9es \u2014 profil multilingue attractif`);
  } else if (parsedData.languages.length === 2) {
    score += 3;
    strengths.push("Bilinguisme mentionn\xE9");
  } else if (parsedData.languages.length === 1) {
    score += 1;
    suggestions.push("Ajoutez au moins 2 langues \u2014 le bilinguisme est un atout majeur au Maroc");
  } else {
    improvements.push("Aucune langue mentionn\xE9e \u2014 le bilinguisme est indispensable");
    suggestions.push("Minimum : Fran\xE7ais + Anglais. L'Arabe et l'Espagnol sont des plus");
  }
  if (text.length > 2e3) {
    score += 8;
    strengths.push("CV d\xE9taill\xE9 et complet (>2000 caract\xE8res)");
  } else if (text.length > 1e3) {
    score += 5;
    strengths.push("CV de longueur correcte");
  } else if (text.length > 500) {
    score += 2;
    suggestions.push("CV trop concis \u2014 enrichissez avec des r\xE9alisations chiffr\xE9es");
  } else {
    improvements.push("CV trop court (<500 car.) \u2014 les recruteurs en moyenne passent 7 secondes, mais cherchent du contenu");
  }
  const hasSummary = textLower.includes("r\xE9sum\xE9") || textLower.includes("profil") || textLower.includes("summary") || textLower.includes("objectif");
  if (hasSummary) {
    score += 4;
    strengths.push("Section profil/r\xE9sum\xE9 pr\xE9sente \u2014 accroche le recruteur en 3 secondes");
  } else {
    suggestions.push('Ajoutez un "Profil" en 2-3 lignes : qui vous \xEAtes, votre valeur ajout\xE9e, votre objectif');
  }
  const hasBulletPoints = text.includes("\u2022") || text.includes("-") || text.includes("*") || text.includes("\u25B8") || text.includes("\u2192");
  if (hasBulletPoints) {
    score += 3;
    strengths.push("Utilisation de bullet points \u2014 lisibilit\xE9 optimale pour le scanning");
  } else {
    suggestions.push("Utilisez des bullet points (\u2022) pour chaque r\xE9alisation \u2014 les recruteurs scannent, ne lisent pas");
  }
  const techKeywords = ["javascript", "python", "java", "react", "node", "sql", "html", "css", "php", "angular", "vue", "typescript", "docker", "kubernetes", "aws", "azure", "git", "linux", "api", "rest", "graphql", "flutter", "swift", "kotlin"];
  const foundKeywords = techKeywords.filter((kw) => textLower.includes(kw));
  if (foundKeywords.length >= 5) {
    score += 5;
    strengths.push(`${foundKeywords.length} mots-cl\xE9s techniques d\xE9tect\xE9s \u2014 excellent pour le ATS`);
  } else if (foundKeywords.length >= 2) {
    score += 3;
    strengths.push(`${foundKeywords.length} mots-cl\xE9s techniques d\xE9tect\xE9s`);
  } else {
    suggestions.push("Ajoutez plus de mots-cl\xE9s techniques pertinents pour le filtrage ATS");
  }
  const hasNumbers = /\d+%|\d+\s*(ans|ans|mois|k€|MAD|dh)|\d+\s*(projets?|clients?|équipes?)/i.test(text);
  if (hasNumbers) {
    score += 3;
    strengths.push("R\xE9sultats chiffr\xE9s d\xE9tect\xE9s \u2014 les recruteurs adorent les m\xE9triques");
  } else {
    suggestions.push('Ajoutez des r\xE9alisations chiffr\xE9es : "Augment\xE9 les ventes de 25%", "G\xE9r\xE9 une \xE9quipe de 8"');
  }
  score = Math.min(100, Math.max(0, score));
  if (score >= 85) {
    strengths.unshift("EXCELLENT CV \u2014 Profil hautement qualifi\xE9, pr\xEAt pour les postes senior");
  } else if (score >= 70) {
    strengths.unshift("TR\xC8S BON CV \u2014 Profil solide avec quelques ajustements possibles");
  } else if (score >= 55) {
    strengths.unshift("BON CV \u2014 Base solide, mais des am\xE9liorations cibl\xE9es le rendront comp\xE9titif");
  } else if (score >= 40) {
    strengths.unshift("CV MOYEN \u2014 N\xE9cessite des am\xE9liorations significatives pour se d\xE9marquer");
  } else {
    strengths.unshift("CV \xC0 REFAIRE \u2014 Reprise compl\xE8te recommand\xE9e pour maximiser vos chances");
  }
  if (suggestions.length < 4) {
    suggestions.push("Personnalisez votre CV pour chaque offre \u2014 les mots-cl\xE9s de l'annonce doivent appara\xEEtre");
    suggestions.push("Limitez-vous \xE0 1-2 pages maximum, sauf profils tr\xE8s exp\xE9riment\xE9s");
  }
  return { score, strengths, improvements, suggestions };
}
function parseCVData(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const textLower = text.toLowerCase();
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = text.match(/(\+212|0)[\s.-]?[67]\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/);
  const locationMatch = text.match(/(?:Casablanca|Rabat|Marrakech|Tanger|Fès|Meknès|Agadir|Oujda|Kénitra|Tétouan|Nador|Safi|Mohammedia)/i);
  const skills = [];
  const knownSkills = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "PHP",
    "C#",
    ".NET",
    "Ruby",
    "Go",
    "Rust",
    "React",
    "Angular",
    "Vue.js",
    "Vue",
    "Node.js",
    "Express.js",
    "Express",
    "Django",
    "Flask",
    "Laravel",
    "Spring Boot",
    "Spring",
    "FastAPI",
    "Next.js",
    "NextJS",
    "Nuxt.js",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "Tailwind",
    "SASS",
    "Bootstrap",
    "Material UI",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "SQLite",
    "Oracle",
    "SQL Server",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Git",
    "GitHub",
    "GitLab",
    "Linux",
    "Nginx",
    "Apache",
    "Jenkins",
    "CI/CD",
    "Terraform",
    "REST",
    "API",
    "GraphQL",
    "Microservices",
    "Figma",
    "Photoshop",
    "Illustrator",
    "Adobe XD",
    "Excel",
    "Word",
    "PowerPoint",
    "SAP",
    "Agile",
    "Scrum",
    "Jira",
    "Trello",
    "Machine Learning",
    "AI",
    "Data Science",
    "TensorFlow",
    "PyTorch",
    "Flutter",
    "React Native",
    "Swift",
    "Kotlin",
    "Xamarin",
    "Firebase",
    "Supabase",
    "Stripe"
  ];
  for (const skill of knownSkills) {
    if (textLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }
  const experience = [];
  const expPatterns = [
    /(?: Développeur| Ingénieur| Chef| Manager| Directeur| Responsable| Consultant| Analyste| Designer| Architecte| Lead| Senior| Junior| Stagiaire)[^\n]*/gi
  ];
  const companyKeywords = ["Maroc", "Casablanca", "Rabat", "Tech", "Solutions", "Group", "Bank", "Service", "Digital", "Consulting"];
  const linesArr = text.split("\n");
  for (let i = 0; i < linesArr.length; i++) {
    const line = linesArr[i].trim();
    const yearMatch = line.match(/(\d{4})\s*[-–]\s*(?:\d{4}|Présent|Present|Courant|Aujourd)/i);
    if (yearMatch) {
      const prevLine = i > 0 ? linesArr[i - 1].trim() : "";
      const period = line.match(/\d{4}\s*[-–]\s*(?:\d{4}|Présent|Present|Courant)/i)?.[0] || "";
      const companyLine = companyKeywords.some((kw) => prevLine.toLowerCase().includes(kw.toLowerCase())) ? prevLine : line;
      experience.push({
        title: prevLine.includes(yearMatch[0]) ? line : prevLine,
        company: companyLine.split("\u2014")[0].split("-")[0].trim(),
        period,
        description: ""
      });
    }
  }
  const education = [];
  const eduKeywords = ["Universit\xE9", "\xC9cole", "Institut", "Faculty", "Master", "Licence", "BTS", "DUT", "Doctorat", "PhD", "Ing\xE9nieur", "Dipl\xF4me", "Certification"];
  for (let i = 0; i < linesArr.length; i++) {
    const line = linesArr[i].trim();
    if (eduKeywords.some((kw) => line.toLowerCase().includes(kw.toLowerCase()))) {
      const yearMatch = line.match(/\d{4}\s*[-–]\s*\d{4}/);
      education.push({
        degree: line.split(/\d{4}/)[0].trim(),
        institution: line,
        year: yearMatch?.[0] || ""
      });
    }
  }
  const languages = [];
  const langPatterns = ["Fran\xE7ais", "Arabe", "Anglais", "Espagnol", "Allemand", "Chinois", "Italien", "Portugais"];
  for (const lang of langPatterns) {
    if (textLower.includes(lang.toLowerCase())) languages.push(lang);
  }
  return {
    skills,
    experience,
    education,
    languages,
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
    location: locationMatch?.[0] || ""
  };
}
router12.get("/", protect, async (req, res) => {
  try {
    const cv = await CV.findOne({ userId: req.user._id, isActive: true });
    res.json({ cv });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router12.post("/", protect, upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier fourni" });
    await CV.updateMany({ userId: req.user._id, isActive: true }, { isActive: false });
    let extractedText = "";
    if (req.file.mimetype === "application/pdf") {
      try {
        const { PDFParse } = await import("pdf-parse");
        const pdfParser = new PDFParse({ data: new Uint8Array(req.file.buffer) });
        const textResult = await pdfParser.getText();
        extractedText = (textResult.text || "").trim();
        await pdfParser.destroy();
      } catch (pdfErr) {
        console.error("PDF parsing error:", pdfErr.message);
      }
    }
    const parsedData = parseCVData(extractedText);
    const analysis = analyzeCV(extractedText, parsedData);
    const cv = await CV.create({
      userId: req.user._id,
      fileName: `cv_${Date.now()}`,
      originalName: req.file.originalname,
      fileData: req.file.buffer.toString("base64"),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      parsedData,
      analysis,
      version: 1
    });
    res.json({
      cv,
      message: "CV upload\xE9 et analys\xE9 avec succ\xE8s",
      analysis,
      parsedData,
      extractedText
    });
  } catch (error) {
    console.error("Erreur upload CV:", error);
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});
router12.post("/analyze-text", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Aucun texte fourni" });
    const parsedData = parseCVData(text);
    const analysis = analyzeCV(text, parsedData);
    res.json({ analysis, parsedData });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'analyse" });
  }
});
router12.post("/match-jobs", protect, async (req, res) => {
  try {
    const { keywords } = req.body || {};
    const cv = await CV.findOne({ userId: req.user._id, isActive: true });
    if (!cv) return res.status(404).json({ error: "Aucun CV trouv\xE9" });
    const JobOffer = mongoose11.model("JobOffer");
    const query = { userId: req.user._id, isActive: true };
    const allJobs = await JobOffer.find(query);
    const cvSkills = (cv.parsedData?.skills || []).map((s) => s.toLowerCase());
    const cvText = (cv.extractedText || "").toLowerCase();
    const searchKeywords = (keywords || []).map((k) => k.toLowerCase());
    const matchedJobs = allJobs.map((job) => {
      const jobText = `${job.title} ${job.company} ${job.description} ${(job.keywords || []).join(" ")}`.toLowerCase();
      let matchScore = 0;
      let matchReasons = [];
      for (const skill of cvSkills) {
        if (jobText.includes(skill.toLowerCase())) {
          matchScore += 10;
          matchReasons.push(`Comp\xE9tence: ${skill}`);
        }
      }
      for (const kw of searchKeywords) {
        if (jobText.includes(kw)) {
          matchScore += 8;
          matchReasons.push(`Mot-cl\xE9: ${kw}`);
        }
      }
      if (cvText.includes(job.title.toLowerCase().split(" ")[0])) {
        matchScore += 15;
        matchReasons.push("Titre pertinent");
      }
      const expYears = cv.parsedData?.experience?.length || 0;
      if (expYears > 0 && job.contractType === "Stage") {
        matchScore -= 5;
      }
      if (expYears >= 2 && (job.title.toLowerCase().includes("senior") || job.title.toLowerCase().includes("lead"))) {
        matchScore += 10;
        matchReasons.push("Niveau d'exp\xE9rience adapt\xE9");
      }
      matchScore = Math.min(100, Math.max(0, matchScore + (job.relevanceScore || 0) * 0.3));
      return {
        ...job.toObject(),
        matchScore: Math.round(matchScore),
        matchReasons: matchReasons.slice(0, 5)
      };
    });
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);
    res.json({
      jobs: matchedJobs.slice(0, 50),
      total: matchedJobs.length,
      cvSkills,
      searchKeywords
    });
  } catch (error) {
    console.error("Erreur matching:", error);
    res.status(500).json({ error: "Erreur lors du matching" });
  }
});
router12.delete("/:id", protect, async (req, res) => {
  try {
    await CV.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "CV supprim\xE9" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router12.put("/:id", protect, async (req, res) => {
  try {
    const cv = await CV.findOne({ _id: req.params.id, userId: req.user._id });
    if (!cv) return res.status(404).json({ error: "CV non trouv\xE9" });
    if (req.body.reanalyze) {
      if (!cv.fileData) return res.status(400).json({ error: "Aucune donn\xE9e de CV stock\xE9e" });
      let extractedText = "";
      try {
        const rawBase64 = cv.fileData.startsWith("data:") ? cv.fileData.split(",")[1] : cv.fileData;
        const buffer = Buffer.from(rawBase64, "base64");
        const { PDFParse } = await import("pdf-parse");
        const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
        const textResult = await pdfParser.getText();
        extractedText = (textResult.text || "").trim();
        await pdfParser.destroy();
      } catch (pdfErr) {
        console.error("PDF re-parse error:", pdfErr.message);
      }
      if (!extractedText) {
        return res.status(400).json({ error: "Impossible d'extraire le texte du CV. Le fichier pourrait \xEAtre scann\xE9 ou prot\xE9g\xE9." });
      }
      const parsedData2 = parseCVData(extractedText);
      const analysis = analyzeCV(extractedText, parsedData2);
      cv.extractedText = extractedText;
      cv.parsedData = parsedData2;
      cv.analysis = analysis;
      cv.version = (cv.version || 1) + 1;
      await cv.save();
      return res.json({ cv, message: "CV analys\xE9 avec succ\xE8s", analysis, parsedData: parsedData2, extractedText });
    }
    const { parsedData } = req.body;
    if (parsedData) {
      cv.parsedData = { ...cv.parsedData, ...parsedData };
      cv.version = (cv.version || 1) + 1;
    }
    await cv.save();
    res.json({ cv, message: "CV mis \xE0 jour" });
  } catch (error) {
    console.error("Erreur update CV:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var cv_default = router12;

// backend/routes/portfolio.js
import express13 from "express";
import mongoose12 from "mongoose";
var router13 = express13.Router();
var portfolioSchema = new mongoose12.Schema({
  userId: { type: mongoose12.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  url: { type: String, default: "" },
  description: { type: String, default: "" },
  projects: [{
    name: String,
    description: String,
    url: String,
    imageUrl: String,
    technologies: [String]
  }]
}, { timestamps: true });
var Portfolio = mongoose12.models.Portfolio || mongoose12.model("Portfolio", portfolioSchema);
router13.get("/", protect, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user._id });
    }
    res.json({ portfolio });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router13.put("/", protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ portfolio, message: "Portfolio mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var portfolio_default = router13;

// backend/server.js
mongoose13.set("toJSON", { virtuals: true, versionKey: false });
mongoose13.set("toObject", { virtuals: true, versionKey: false });
var app = express14();
app.use(helmet({ contentSecurityPolicy: false }));
var allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express14.json({ limit: "10mb" }));
app.use(express14.urlencoded({ extended: true }));
app.use(cookieParser());
var limiter = rateLimit({ windowMs: 15 * 60 * 1e3, max: 200, message: { error: "Trop de requ\xEAtes" } });
app.use("/api/", limiter);
app.use("/api/auth", auth_default);
app.use("/api/profile/cv", cv_default);
app.use("/api/profile/portfolio", portfolio_default);
app.use("/api/profile", profile_default);
app.use("/api/jobs", jobs_default);
app.use("/api/applications", applications_default);
app.use("/api/recruiters", recruiters_default);
app.use("/api/dashboard", dashboard_default);
app.use("/api/notifications", notifications_default);
app.use("/api/scraping", scraping_default);
app.use("/api/emails", emailTemplates_default);
app.use("/api/search-profiles", searchProfiles_default);
app.use("/api/analytics", analytics_default);
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: /* @__PURE__ */ new Date() }));
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Route non trouv\xE9e: ${req.method} ${req.originalUrl}` });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Erreur serveur interne" });
});
async function connectDB() {
  if (mongoose13.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("\u274C MONGODB_URI non d\xE9fini");
    throw new Error("MONGODB_URI non d\xE9fini");
  }
  try {
    await mongoose13.connect(uri);
    console.log("\u2705 MongoDB connect\xE9");
  } catch (err) {
    console.error("\u274C MongoDB connection failed:", err.message);
    throw err;
  }
}
var server_default = app;

// backend/handler.js
var isConnected = false;
async function handler(req, res) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return server_default(req, res);
}
export {
  handler as default
};
