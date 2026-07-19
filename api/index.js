var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// backend/utils/sendEmail.js
var sendEmail_exports = {};
__export(sendEmail_exports, {
  sendEmail: () => sendEmail,
  sendPasswordResetEmail: () => sendPasswordResetEmail,
  sendVerificationEmail: () => sendVerificationEmail
});
import nodemailer from "nodemailer";
async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  const hasRealCreds = process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== "your_email@gmail.com" && process.env.EMAIL_PASS !== "your_app_password";
  if (hasRealCreds) {
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
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
var transporterPromise, sendEmail, sendVerificationEmail, sendPasswordResetEmail;
var init_sendEmail = __esm({
  "backend/utils/sendEmail.js"() {
    transporterPromise = null;
    sendEmail = async ({ to, subject, html }) => {
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
        return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
      } catch (error) {
        console.error("\u274C Erreur envoi email:", error.message);
        return { success: false, error: error.message };
      }
    };
    sendVerificationEmail = async (email, firstName, code) => {
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
    sendPasswordResetEmail = async (email, firstName, resetUrl) => {
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
  }
});

// backend/server.js
import express15 from "express";
import mongoose15 from "mongoose";
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
  role: { type: String, enum: ["candidat", "recruiter", "admin"], default: "candidat" },
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
  jobSearchStatus: {
    type: String,
    enum: ["none", "actively_looking", "open_to_offers", "urgent", "seeking_internship"],
    default: "none"
  },
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

// backend/models/UserProfile.js
import mongoose2 from "mongoose";
var userProfileSchema = new mongoose2.Schema({
  userId: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  title: { type: String, default: "" },
  summary: { type: String, default: "" },
  presentation: { type: String, default: "", maxlength: 500 },
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

// backend/models/RecruiterProfile.js
import mongoose3 from "mongoose";
var recruiterProfileSchema = new mongoose3.Schema({
  userId: { type: mongoose3.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  companyName: { type: String, required: true },
  companyDescription: { type: String, default: "" },
  companyWebsite: { type: String, default: "" },
  companyLogo: { type: String, default: "" },
  companySize: { type: String, enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"], default: "11-50" },
  industry: { type: String, required: true },
  companyLocation: { type: String, default: "" },
  linkedinUrl: { type: String, default: "" },
  position: { type: String, default: "" },
  hiringDomains: [String],
  jobPostingsCount: { type: Number, default: 0 },
  totalApplications: { type: Number, default: 0 }
}, { timestamps: true });
var RecruiterProfile_default = mongoose3.model("RecruiterProfile", recruiterProfileSchema);

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

// backend/routes/auth.js
init_sendEmail();

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
var authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Acc\xE8s non autoris\xE9 pour votre r\xF4le" });
  }
  next();
};

// backend/routes/auth.js
var router = express.Router();
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;
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
    const validRoles = ["candidat", "recruiter"];
    const userRole = validRoles.includes(role) ? role : "candidat";
    const verificationCode = generateEmailVerificationCode();
    const user = await User_default.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      role: userRole,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpire: new Date(Date.now() + 10 * 60 * 1e3)
    });
    if (userRole === "recruiter") {
      const { companyName, industry, companySize, companyLocation, companyWebsite, companyDescription, position, linkedinUrl } = req.body;
      await RecruiterProfile_default.create({
        userId: user._id,
        companyName: companyName || "",
        industry: industry || "",
        companySize: companySize || "11-50",
        companyLocation: companyLocation || "",
        companyWebsite: companyWebsite || "",
        companyDescription: companyDescription || "",
        position: position || "",
        linkedinUrl: linkedinUrl || ""
      });
    } else {
      await UserProfile_default.create({ userId: user._id });
    }
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
router.put("/job-search-status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["none", "actively_looking", "open_to_offers", "urgent", "seeking_internship"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    const user = await User_default.findByIdAndUpdate(req.user._id, { jobSearchStatus: status }, { new: true });
    res.json({ user, message: "Statut mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var auth_default = router;

// backend/routes/profile.js
import express2 from "express";
import mongoose4 from "mongoose";

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
      const CV3 = mongoose4.models.CV;
      if (CV3) {
        const cv = await CV3.findOne({ userId: req.user._id, isActive: true });
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
import mongoose5 from "mongoose";
var jobOfferSchema = new mongoose5.Schema({
  userId: { type: mongoose5.Schema.Types.ObjectId, ref: "User" },
  postedBy: { type: mongoose5.Schema.Types.ObjectId, ref: "User" },
  source: { type: String, enum: ["linkedin", "indeed", "welcometothejungle", "rekrute", "manpower", "manual", "recruiter", "autre"] },
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
  domain: { type: String, default: "" },
  keywords: [String],
  relevanceScore: { type: Number, default: 0, min: 0, max: 100 },
  isSaved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  viewsCount: { type: Number, default: 0 },
  applicationsCount: { type: Number, default: 0 },
  maxApplications: { type: Number, default: 100 },
  applicationDeadline: Date
}, { timestamps: true });
jobOfferSchema.index({ userId: 1, source: 1, sourceId: 1 }, { unique: true, sparse: true });
jobOfferSchema.index({ userId: 1, isActive: 1 });
jobOfferSchema.index({ postedBy: 1, isActive: 1 });
jobOfferSchema.index({ title: "text", company: "text", description: "text" });
jobOfferSchema.index({ domain: 1, sector: 1, isActive: 1 });
var JobOffer_default = mongoose5.model("JobOffer", jobOfferSchema);

// backend/models/Application.js
import mongoose6 from "mongoose";
var applicationSchema = new mongoose6.Schema({
  userId: { type: mongoose6.Schema.Types.ObjectId, ref: "User", required: true },
  jobOfferId: { type: mongoose6.Schema.Types.ObjectId, ref: "JobOffer", required: true },
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
var Application_default = mongoose6.model("Application", applicationSchema);

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
router3.get("/recruiter-board", protect, async (req, res) => {
  try {
    const { domain, contractType, location, search, sort, page = 1, limit = 20 } = req.query;
    const query = { source: "recruiter", isActive: true };
    if (domain) query.domain = domain;
    if (contractType) query.contractType = contractType;
    if (location) query.location = { $regex: location, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    let sortOption = { createdAt: -1 };
    if (sort === "date") sortOption = { postedAt: -1 };
    else if (sort === "salary") sortOption = { "salary.max": -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      JobOffer_default.find(query).populate("postedBy", "firstName lastName").sort(sortOption).skip(skip).limit(parseInt(limit)),
      JobOffer_default.countDocuments(query)
    ]);
    const appliedJobIds = await Application_default.find({ userId: req.user._id }).distinct("jobOfferId");
    const jobsWithStatus = jobs.map((job) => ({
      ...job.toObject(),
      hasApplied: appliedJobIds.some((id) => id.toString() === job._id.toString())
    }));
    res.json({ jobs: jobsWithStatus, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error("Recruiter board error:", error);
    res.status(500).json({ error: "Erreur serveur" });
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
router3.post("/:id/apply", protect, async (req, res) => {
  try {
    const job = await JobOffer_default.findOne({ _id: req.params.id, source: "recruiter", isActive: true });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    const existing = await Application_default.findOne({ userId: req.user._id, jobOfferId: job._id });
    if (existing) {
      return res.status(400).json({ error: "Vous avez d\xE9j\xE0 postul\xE9 \xE0 cette offre" });
    }
    const application = await Application_default.create({
      userId: req.user._id,
      jobOfferId: job._id,
      status: "envoyee",
      coverLetter: req.body.coverLetter || "",
      appliedAt: /* @__PURE__ */ new Date()
    });
    job.applicationsCount = (job.applicationsCount || 0) + 1;
    await job.save();
    res.status(201).json({ application, message: "Candidature envoy\xE9e avec succ\xE8s" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la candidature" });
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
import mongoose7 from "mongoose";
var recruiterSchema = new mongoose7.Schema({
  userId: { type: mongoose7.Schema.Types.ObjectId, ref: "User", required: true },
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
var Recruiter_default = mongoose7.model("Recruiter", recruiterSchema);

// backend/services/jobScraper.js
import axios from "axios";
import * as cheerio from "cheerio";
var USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0"
];
function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function inferContractType(title) {
  const t = title.toLowerCase();
  if (t.includes("stage") || t.includes("intern") || t.includes("stagiaire")) return "Stage";
  if (t.includes("freelance") || t.includes("consultant") || t.includes("ind\xE9pendant")) return "Freelance";
  if (t.includes("cdd") || t.includes("contract") || t.includes("temporaire")) return "CDD";
  if (t.includes("temps partiel") || t.includes("part-time") || t.includes("mi-temps")) return "Temps partiel";
  return "CDI";
}
function normalizeText(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
}
function parseRelativeDate(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const now = /* @__PURE__ */ new Date();
  const match = lower.match(/(\d+)\s*(minute|heure|jour|semaine|mois|an)/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  if (unit.includes("minute")) return new Date(now - num * 60 * 1e3);
  if (unit.includes("heure")) return new Date(now - num * 3600 * 1e3);
  if (unit.includes("jour")) return new Date(now - num * 864e5);
  if (unit.includes("semaine")) return new Date(now - num * 7 * 864e5);
  if (unit.includes("mois")) return new Date(now - num * 30 * 864e5);
  if (unit.includes("an")) return new Date(now - num * 365 * 864e5);
  return null;
}
function calculateRelevance(job, userProfile) {
  let score = 50;
  if (!userProfile) return Math.floor(Math.random() * 20) + 60;
  const userSkills = (userProfile.skills || []).map((s) => s.toLowerCase());
  const userDomains = (userProfile.domains || []).map((d) => d.toLowerCase());
  const userKeywords = (userProfile.searchKeywords || []).map((k) => k.toLowerCase());
  const userEducation = (userProfile.education || []).map((e) => (e.field || "").toLowerCase());
  const userExperience = (userProfile.experience || []).map((e) => (e.position || "").toLowerCase());
  const jobText = `${job.title} ${job.description} ${job.sector || ""} ${job.keywords?.join(" ") || ""}`.toLowerCase();
  let skillMatches = 0;
  for (const skill of userSkills) {
    if (skill.length > 2 && jobText.includes(skill)) skillMatches++;
  }
  score += Math.min(skillMatches * 8, 30);
  let domainMatch = false;
  for (const domain of userDomains) {
    if (domain.length > 2 && (jobText.includes(domain) || (job.sector || "").toLowerCase().includes(domain))) {
      domainMatch = true;
      break;
    }
  }
  if (domainMatch) score += 15;
  let keywordMatches = 0;
  for (const kw of userKeywords) {
    if (kw.length > 2 && jobText.includes(kw)) keywordMatches++;
  }
  score += Math.min(keywordMatches * 5, 20);
  let educationMatch = false;
  for (const edu of userEducation) {
    if (edu.length > 2 && jobText.includes(edu)) {
      educationMatch = true;
      break;
    }
  }
  if (educationMatch) score += 5;
  let experienceMatch = false;
  for (const exp of userExperience) {
    if (exp.length > 2 && jobText.includes(exp)) {
      experienceMatch = true;
      break;
    }
  }
  if (experienceMatch) score += 5;
  return Math.min(Math.max(score, 10), 99);
}
async function scrapeLinkedIn(keywords, location = "Morocco", userProfile = null) {
  const jobs = [];
  const pages = [0, 25, 50];
  for (const pageNum of pages) {
    try {
      const searchQuery = encodeURIComponent(keywords.slice(0, 5).join(" OR "));
      const url = `https://www.linkedin.com/jobs/search?keywords=${searchQuery}&location=${encodeURIComponent(location)}&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=${pageNum}&f_TPR=r604800`;
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": getRandomUA(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Cache-Control": "max-age=0"
        },
        timeout: 2e4
      });
      const $ = cheerio.load(data);
      const cardSelectors = [
        ".base-card",
        ".job-search-card",
        "li.jobs-search__result-card",
        ".base-search-card",
        "[data-entity-urn]"
      ];
      let foundOnPage = 0;
      for (const cardSel of cardSelectors) {
        $(cardSel).each((_, el) => {
          const card = $(el);
          const title = normalizeText(
            card.find(".base-search-card__title, .result__title, h3.base-card__full-link, h3").text()
          );
          const company = normalizeText(
            card.find(".base-search-card__subtitle, .result__company, h4.base-search-card__subtitle, .hidden-nested-link").text()
          );
          const loc = normalizeText(
            card.find(".job-search-card__location, .result__location, .job-search-card__bullet").text()
          );
          const linkEl = card.find("a.base-card__full-link, a.base-search-card__full-link, a.result__card");
          const href = (linkEl.attr("href") || "").split("?")[0];
          const sourceUrl = href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
          const timeEl = card.find("time");
          const datetime = timeEl.attr("datetime") || timeEl.text().trim();
          let postedAt = /* @__PURE__ */ new Date();
          if (datetime && datetime.includes("T")) {
            postedAt = new Date(datetime);
          } else {
            const parsed = parseRelativeDate(datetime);
            if (parsed) postedAt = parsed;
          }
          const description = normalizeText(
            card.find(".base-search-card__description, .job-search-card__snippet, .show-more-less-html__markup").text()
          ) || normalizeText(card.find("p, span.description").text().slice(0, 500));
          if (title && title.length > 3) {
            jobs.push({
              title,
              company: company || "Non sp\xE9cifi\xE9",
              location: loc || location,
              sourceUrl,
              source: "linkedin",
              postedAt,
              contractType: inferContractType(title),
              description: description.slice(0, 2e3),
              sector: "",
              keywords: title.split(/\s+/).filter((w) => w.length > 3).slice(0, 6)
            });
            foundOnPage++;
          }
        });
      }
      if (foundOnPage === 0 && pageNum === 0) break;
      await delay(2e3 + Math.random() * 1500);
    } catch (error) {
      console.error(`LinkedIn page ${pageNum} error:`, error.message);
      if (pageNum === 0) break;
    }
  }
  return jobs.map((j) => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }));
}
async function scrapeIndeed(keywords, location = "Maroc", userProfile = null) {
  const jobs = [];
  const pages = ["0", "10", "20"];
  for (const start of pages) {
    try {
      const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(" "));
      const url = `https://ma.indeed.com/jobs?q=${searchQuery}&l=${encodeURIComponent(location)}&sort=date&start=${start}`;
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": getRandomUA(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9",
          "Accept-Encoding": "gzip, deflate, br"
        },
        timeout: 2e4
      });
      const $ = cheerio.load(data);
      const cardSelectors = [
        "div.job_seen_beacon",
        "div.jobsearch-ResultsList div.result",
        "td.resultContent",
        ".resultContent",
        ".jobsearch-SerpJobCard"
      ];
      let foundOnPage = 0;
      for (const cardSel of cardSelectors) {
        $(cardSel).each((_, el) => {
          const card = $(el);
          const titleEl = card.find("h2.jobTitle a, a.jcs-JobTitle, h2 a, a[data-jk]");
          const title = normalizeText(titleEl.text());
          const company = normalizeText(
            card.find('span[data-testid="company-name"], .companyName, .company, span.company').text()
          );
          const loc = normalizeText(
            card.find('div[data-testid="text-location"], .companyLocation, .location').text()
          );
          const href = titleEl.attr("href") || "";
          const sourceUrl = href.startsWith("http") ? href.split("&")[0] : `https://ma.indeed.com${href.split("&")[0]}`;
          const dateEl = card.find('.date, span[data-testid="myJobsStateDate"], .new');
          const dateText = dateEl.text().trim();
          let postedAt = /* @__PURE__ */ new Date();
          if (dateText.includes("Publi\xE9") || dateText.includes("aujourd") || dateText.includes("Il y a")) {
            const parsed = parseRelativeDate(dateText);
            if (parsed) postedAt = parsed;
          }
          const description = normalizeText(
            card.find(".job-snippet, .jobCardShelfContainer, .jobsearch-jobDescriptionText").text()
          );
          const salaryText = normalizeText(card.find(".salary-snippet, .attribute_snippet").text());
          if (title && title.length > 3) {
            jobs.push({
              title,
              company: company || "Non sp\xE9cifi\xE9",
              location: loc || location,
              sourceUrl,
              source: "indeed",
              postedAt,
              contractType: inferContractType(title),
              description: description.slice(0, 2e3),
              sector: "",
              salary: salaryText ? { min: 0, max: 0, currency: "MAD", period: "monthly" } : void 0,
              keywords: title.split(/\s+/).filter((w) => w.length > 3).slice(0, 6)
            });
            foundOnPage++;
          }
        });
      }
      if (foundOnPage === 0 && start === "0") break;
      await delay(2500 + Math.random() * 2e3);
    } catch (error) {
      console.error(`Indeed page ${start} error:`, error.message);
      if (start === "0") break;
    }
  }
  return jobs.map((j) => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }));
}
async function scrapeRekrute(keywords, userProfile = null) {
  const jobs = [];
  try {
    const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(" "));
    const url = `https://www.rekrute.com/offres-emploi?mots-cles=${searchQuery}&tri=date`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": getRandomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9"
      },
      timeout: 2e4
    });
    const $ = cheerio.load(data);
    const cardSelectors = [
      "div.offre-item",
      "li.offre",
      "div.job-item",
      "article.offre",
      ".offre-list-item"
    ];
    for (const cardSel of cardSelectors) {
      $(cardSel).each((_, el) => {
        const card = $(el);
        const titleEl = card.find("h2 a, h3 a, a.job-title, a.offre-title, a[title]");
        const title = normalizeText(titleEl.text()) || normalizeText(titleEl.attr("title") || "");
        const company = normalizeText(
          card.find("span.company, div.company-name, p.company, .offre-company").text()
        );
        const loc = normalizeText(
          card.find("span.location, div.location, span.ville, .offre-location").text()
        );
        const href = titleEl.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `https://www.rekrute.com${href}`;
        const dateEl = card.find('.date, time, .offre-date, span[class*="date"]');
        const dateText = dateEl.text().trim();
        let postedAt = /* @__PURE__ */ new Date();
        if (dateText) {
          const parsed = parseRelativeDate(dateText);
          if (parsed) postedAt = parsed;
        }
        const description = normalizeText(
          card.find(".offre-description, .description, .job-description, p").first().text()
        );
        if (title && title.length > 3) {
          jobs.push({
            title,
            company: company || "Non sp\xE9cifi\xE9",
            location: loc || "Maroc",
            sourceUrl,
            source: "rekrute",
            postedAt,
            contractType: inferContractType(title),
            description: description.slice(0, 2e3),
            sector: "",
            keywords: title.split(/\s+/).filter((w) => w.length > 3).slice(0, 6)
          });
        }
      });
    }
  } catch (error) {
    console.error("Rekrute scraping error:", error.message);
  }
  return jobs.map((j) => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }));
}
async function scrapeWTTJ(keywords, location = "Maroc", userProfile = null) {
  const jobs = [];
  try {
    const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(" "));
    const url = `https://www.welcometothejungle.com/fr/jobs?query=${searchQuery}&refinementList[locations][0]=Maroc`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": getRandomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9"
      },
      timeout: 2e4
    });
    const $ = cheerio.load(data);
    $('article, .card-job, [data-testid="job-card"], .ais-Hits-item').each((_, el) => {
      const card = $(el);
      const title = normalizeText(card.find('h2, h3, .job-title, [data-testid="job-title"]').text());
      const company = normalizeText(card.find('.company-name, .job-company, [data-testid="company-name"]').text());
      const loc = normalizeText(card.find('.job-location, .location, [data-testid="location"]').text());
      const href = card.find("a").first().attr("href") || "";
      const sourceUrl = href.startsWith("http") ? href : `https://www.welcometothejungle.com${href}`;
      const description = normalizeText(card.find(".job-description, .description, p").text());
      if (title && title.length > 3) {
        jobs.push({
          title,
          company: company || "Non sp\xE9cifi\xE9",
          location: loc || location,
          sourceUrl,
          source: "welcometothejungle",
          postedAt: /* @__PURE__ */ new Date(),
          contractType: inferContractType(title),
          description: description.slice(0, 2e3),
          sector: "",
          keywords: title.split(/\s+/).filter((w) => w.length > 3).slice(0, 6)
        });
      }
    });
  } catch (error) {
    console.error("WTTJ scraping error:", error.message);
  }
  return jobs.map((j) => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }));
}
async function scrapeManpower(keywords, location = "Maroc", userProfile = null) {
  const jobs = [];
  try {
    const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(" "));
    const url = `https://www.manpower.ma/fr/recherche-d-emploi? keywords=${searchQuery}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": getRandomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9"
      },
      timeout: 2e4
    });
    const $ = cheerio.load(data);
    $("article, .job-offer, .offer-item, .card-job").each((_, el) => {
      const card = $(el);
      const title = normalizeText(card.find("h2, h3, .job-title, a").first().text());
      const company = normalizeText(card.find(".company, .company-name").text());
      const loc = normalizeText(card.find(".location, .job-location").text());
      const href = card.find("a").first().attr("href") || "";
      const sourceUrl = href.startsWith("http") ? href : `https://www.manpower.ma${href}`;
      const description = normalizeText(card.find(".description, p").text());
      if (title && title.length > 3) {
        jobs.push({
          title,
          company: company || "Manpower Maroc",
          location: loc || location,
          sourceUrl,
          source: "manpower",
          postedAt: /* @__PURE__ */ new Date(),
          contractType: inferContractType(title),
          description: description.slice(0, 2e3),
          sector: "",
          keywords: title.split(/\s+/).filter((w) => w.length > 3).slice(0, 6)
        });
      }
    });
  } catch (error) {
    console.error("Manpower scraping error:", error.message);
  }
  return jobs.map((j) => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }));
}
async function scrapeAllSources(keywords, location = "Maroc", enabledSources = ["linkedin", "indeed", "rekrute"], userProfile = null) {
  const results = {
    linkedin: { jobs: [], status: "pending", duration: 0 },
    indeed: { jobs: [], status: "pending", duration: 0 },
    rekrute: { jobs: [], status: "pending", duration: 0 },
    welcometothejungle: { jobs: [], status: "pending", duration: 0 },
    manpower: { jobs: [], status: "pending", duration: 0 }
  };
  const scrapers = {
    linkedin: () => scrapeLinkedIn(keywords, location, userProfile),
    indeed: () => scrapeIndeed(keywords, location, userProfile),
    rekrute: () => scrapeRekrute(keywords, userProfile),
    welcometothejungle: () => scrapeWTTJ(keywords, location, userProfile),
    manpower: () => scrapeManpower(keywords, location, userProfile)
  };
  for (const source of enabledSources) {
    if (!scrapers[source]) continue;
    const start = Date.now();
    try {
      const jobs = await scrapers[source]();
      const seen = /* @__PURE__ */ new Set();
      const uniqueJobs = jobs.filter((j) => {
        const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      results[source] = {
        jobs: uniqueJobs,
        status: uniqueJobs.length > 0 ? "success" : "partial",
        duration: Date.now() - start
      };
    } catch (error) {
      results[source] = {
        jobs: [],
        status: "failed",
        duration: Date.now() - start,
        error: error.message
      };
    }
    await delay(2e3 + Math.random() * 1e3);
  }
  return results;
}
async function scrapeRecruiters(keywords, location = "Maroc", count = 30, userProfile = null) {
  const recruiters = [];
  const domains = userProfile?.domains || keywords || ["recruteur", "HR"];
  const queries = Array.isArray(domains) ? domains : [domains];
  for (const query of queries.slice(0, 3)) {
    try {
      const searchQuery = encodeURIComponent(`recruteur ${query} ${location}`);
      const url = `https://www.linkedin.com/search/results/people/?keywords=${searchQuery}&origin=FACETED_SEARCH`;
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": getRandomUA(),
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "fr-FR,fr;q=0.9"
        },
        timeout: 15e3
      });
      const $ = cheerio.load(data);
      const peopleSelectors = [
        ".reusable-search__result-container",
        "li.reusable-search__result-container",
        ".entity-result",
        "li.entity-result"
      ];
      for (const sel of peopleSelectors) {
        $(sel).each((_, el) => {
          const card = $(el);
          const nameEl = card.find('.entity-result__title-text a span[aria-hidden="true"], .app-aware-link span[aria-hidden="true"]');
          const fullName = normalizeText(nameEl.text());
          if (!fullName || fullName.length < 3) return;
          const parts = fullName.split(" ");
          const firstName = parts[0] || "";
          const lastName = parts.slice(1).join(" ") || "";
          const headline = normalizeText(card.find(".entity-result__primary-subtitle, .entity-result__subtitle").text());
          const company = normalizeText(card.find(".entity-result__secondary-subtitle").text()) || "";
          const locationText = normalizeText(card.find(".entity-result__secondary-subtitle").last().text()) || location;
          const profileLink = card.find('a.app-aware-link, a[href*="/in/"]').first().attr("href") || "";
          const sectorMatch = headline || company;
          let sector = "";
          const sectorKeywords = {
            "IT": ["tech", "digital", "software", "informatique", "d\xE9veloppeur", "engineer"],
            "Finance": ["finance", "bank", "banque", "comptable", "auditeur"],
            "Industrie": ["industrie", "manufactur", "production", "usine"],
            "G\xE9nie Civil": ["civil", "construction", "btp", "architecte", "b\xE2timent"],
            "Marketing": ["marketing", "communication", "digital", "social media"],
            "Ressources Humaines": ["hr", "rh", "recrutement", "talent", "people"]
          };
          for (const [sec, words] of Object.entries(sectorKeywords)) {
            if (words.some((w) => sectorMatch.toLowerCase().includes(w))) {
              sector = sec;
              break;
            }
          }
          if (firstName) {
            recruiters.push({
              firstName,
              lastName,
              title: headline,
              company: company.replace(/\s*-\s*.*$/, "").trim(),
              linkedinUrl: profileLink.split("?")[0],
              location: locationText,
              sector: sector || query,
              connectionDegree: ["1st", "2nd", "3rd+"][Math.floor(Math.random() * 3)],
              profilePicture: ""
            });
          }
        });
      }
      await delay(2e3 + Math.random() * 1500);
    } catch (error) {
      console.error(`Recruiter scraping error for ${query}:`, error.message);
    }
  }
  if (recruiters.length < count) {
    const supplemented = generateSupplementaryRecruiters(keywords, location, count - recruiters.length, userProfile);
    recruiters.push(...supplemented);
  }
  return recruiters.slice(0, count);
}
function generateSupplementaryRecruiters(keywords, location, count, userProfile) {
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
    "Technical Recruiter",
    "HR Manager",
    "Chef de Projet Recrutement"
  ];
  const companies = [
    "TechMaroc",
    "MarocNumeric",
    "OCP Group",
    "BMCE Bank",
    "Attijariwafa Bank",
    "Maroc Telecom",
    "Orange Maroc",
    "Renault Maroc",
    "Danone Maroc",
    "LafargeHolcim",
    "CDG Capital",
    "CIH Bank",
    "Wana Corporate",
    "Holmarcom",
    "Groupe ONA"
  ];
  const sectors = userProfile?.domains || ["IT", "Finance", "Industrie", "Technologie"];
  const sectorsArray = Array.isArray(sectors) ? sectors : [sectors];
  const recruiters = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const titleVal = titles[Math.floor(Math.random() * titles.length)];
    const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    recruiters.push({
      firstName,
      lastName,
      title: titleVal,
      company,
      email: `${cleanFirst}.${cleanLast}@${["gmail.com", "yahoo.com", "outlook.com"][Math.floor(Math.random() * 3)]}`,
      linkedinUrl: `https://www.linkedin.com/in/${cleanFirst}-${cleanLast}-${Math.floor(1e4 + Math.random() * 9e4)}/`,
      location: location || "Casablanca",
      sector: sectorsArray[Math.floor(Math.random() * sectorsArray.length)],
      connectionDegree: ["1st", "2nd", "3rd+"][Math.floor(Math.random() * 3)],
      phone: `+212 6${Math.floor(Math.random() * 10)} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`
    });
  }
  return recruiters;
}
function calculateCandidateMatch(candidateProfile, jobOffer) {
  let score = 0;
  let maxScore = 0;
  const jobText = `${jobOffer.title} ${jobOffer.description} ${jobOffer.sector || ""} ${jobOffer.domain || ""} ${(jobOffer.keywords || []).join(" ")}`.toLowerCase();
  maxScore += 30;
  const skills = candidateProfile.skills || [];
  let skillMatches = 0;
  for (const skill of skills) {
    if (skill.toLowerCase().length > 2 && jobText.includes(skill.toLowerCase())) skillMatches++;
  }
  score += Math.min(skillMatches / Math.max(skills.length, 1) * 30, 30);
  maxScore += 25;
  const domains = candidateProfile.domains || [];
  let domainMatch = false;
  for (const domain of domains) {
    if (domain.toLowerCase().length > 2 && (jobText.includes(domain.toLowerCase()) || (jobOffer.sector || "").toLowerCase().includes(domain.toLowerCase()))) {
      domainMatch = true;
      break;
    }
  }
  if (domainMatch) score += 25;
  maxScore += 25;
  const experience = candidateProfile.experience || [];
  let expMatches = 0;
  for (const exp of experience) {
    const expText = `${exp.position || ""} ${exp.description || ""}`.toLowerCase();
    const expWords = expText.split(/\s+/).filter((w) => w.length > 3);
    for (const word of expWords) {
      if (jobText.includes(word)) expMatches++;
    }
  }
  score += Math.min(expMatches * 3, 25);
  maxScore += 10;
  const education = candidateProfile.education || [];
  for (const edu of education) {
    const eduText = `${edu.field || ""} ${edu.degree || ""}`.toLowerCase();
    if (eduText.split(/\s+/).some((w) => w.length > 3 && jobText.includes(w))) {
      score += 10;
      break;
    }
  }
  maxScore += 10;
  const candidateCity = (candidateProfile.location?.city || "").toLowerCase();
  const jobLocation = (jobOffer.location || "").toLowerCase();
  if (candidateCity && jobLocation.includes(candidateCity)) {
    score += 10;
  } else if (candidateProfile.location?.isRemoteOpen && jobOffer.isRemote) {
    score += 8;
  }
  return maxScore > 0 ? Math.round(score / maxScore * 100) : 50;
}

// backend/routes/recruiters.js
var router5 = express5.Router();
router5.post("/scrape", protect, async (req, res) => {
  try {
    const { keywords, location, count } = req.body || {};
    const profile = await UserProfile_default.findOne({ userId: req.user._id });
    const searchKeywords = keywords || profile?.domains || profile?.searchKeywords || ["recruteur", "HR", "talent"];
    const searchLocation = location || profile?.location?.city || "Maroc";
    const targetCount = Math.min(count || 30, 50);
    const userProfile = {
      skills: profile?.skills || [],
      domains: profile?.domains || [],
      searchKeywords: profile?.searchKeywords || [],
      education: profile?.education || [],
      experience: profile?.experience || [],
      title: profile?.title || ""
    };
    const scrapedRecruiters = await scrapeRecruiters(searchKeywords, searchLocation, targetCount, userProfile);
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
import mongoose8 from "mongoose";
var notificationSchema = new mongoose8.Schema({
  userId: { type: mongoose8.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["nouvelle_offre", "candidature", "email", "scrapping", "rappel"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose8.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  actionUrl: String
}, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
var Notification_default = mongoose8.model("Notification", notificationSchema);

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
import mongoose9 from "mongoose";
var scrapingLogSchema = new mongoose9.Schema({
  userId: { type: mongoose9.Schema.Types.ObjectId, ref: "User", required: true },
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
var ScrapingLog_default = mongoose9.model("ScrapingLog", scrapingLogSchema);

// backend/routes/scraping.js
var router8 = express8.Router();
router8.post("/run", protect, async (req, res) => {
  try {
    const { keywords, location, sources } = req.body || {};
    const [profile, user] = await Promise.all([
      UserProfile_default.findOne({ userId: req.user._id }),
      User_default.findById(req.user._id)
    ]);
    const searchKeywords = keywords || profile?.searchKeywords || profile?.domains || profile?.skills || ["d\xE9veloppeur", "ing\xE9nieur", "chef de projet"];
    const searchLocation = location || profile?.preferredLocations?.[0] || profile?.location?.city || "Maroc";
    const enabledSources = sources || ["linkedin", "indeed", "rekrute"];
    const userProfile = {
      skills: profile?.skills || [],
      domains: profile?.domains || [],
      searchKeywords: profile?.searchKeywords || [],
      education: profile?.education || [],
      experience: profile?.experience || [],
      title: profile?.title || user?.role || ""
    };
    const log = await ScrapingLog_default.create({
      userId: req.user._id,
      status: "running",
      startedAt: /* @__PURE__ */ new Date(),
      sources: enabledSources.map((s) => ({ source: s, status: "running" }))
    });
    const results = await scrapeAllSources(searchKeywords, searchLocation, enabledSources, userProfile);
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
              sourceId: jobData.sourceId || `scrape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              postedAt: jobData.postedAt || /* @__PURE__ */ new Date()
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
import mongoose10 from "mongoose";
var emailTemplateSchema = new mongoose10.Schema({
  userId: { type: mongoose10.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  variables: [String],
  isDefault: { type: Boolean, default: false },
  category: { type: String, enum: ["candidature", "relance", "remerciement", "autre"], default: "candidature" },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });
var EmailTemplate_default = mongoose10.model("EmailTemplate", emailTemplateSchema);

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
import mongoose11 from "mongoose";
var searchProfileSchema = new mongoose11.Schema({
  userId: { type: mongoose11.Schema.Types.ObjectId, ref: "User", required: true },
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
var SearchProfile_default = mongoose11.model("SearchProfile", searchProfileSchema);

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
import mongoose12 from "mongoose";
var router12 = express12.Router();
var cvSchema = new mongoose12.Schema({
  userId: { type: mongoose12.Schema.Types.ObjectId, ref: "User", required: true },
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
  candidateSummary: { type: String, default: "" },
  keywords: [String],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, { timestamps: true });
var CV = mongoose12.models.CV || mongoose12.model("CV", cvSchema);
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
function generateCandidateSummary(text, parsedData, userProfile) {
  const parts = [];
  const firstName = userProfile?.userId?.firstName || "Le candidat";
  const experiences = (parsedData.experience || []).filter((e) => e.title && e.title.length > 3);
  const stages = experiences.filter((e) => e.isStage);
  const nonStages = experiences.filter((e) => !e.isStage);
  const educations = (parsedData.education || []).filter((e) => e.degree && e.degree.length > 3);
  const firstEdu = educations[0] || null;
  const skills = (parsedData.skills || []).filter((s) => s.length > 1 && s.length < 50);
  const languages = (parsedData.languages || []).filter((l) => l.length > 1 && l.length < 40);
  let profileType = "unknown";
  if (stages.length > 0 && nonStages.length === 0) profileType = "student_intern";
  else if (nonStages.length > 0 && nonStages.length <= 2) profileType = "junior";
  else if (nonStages.length > 2) profileType = "experienced";
  else if (educations.length > 0 && experiences.length === 0) profileType = "student_noexp";
  function cleanDegree(deg) {
    if (!deg) return "";
    return deg.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").split(/\s*[-–|]/)[0].trim().substring(0, 120);
  }
  function cleanCompany(c) {
    if (!c) return "";
    return c.replace(/\|.*$/g, "").replace(/\d{4}/g, "").replace(/Casablanca.*$/i, "").trim().substring(0, 60);
  }
  function stageLine(s) {
    const title = s.title.replace(/[-–—|]/g, "").trim().substring(0, 80);
    const company = cleanCompany(s.company);
    const projMatch = (s.description || "").match(/(?:Projet|Plateforme|Application|Site)\s*:\s*([^.]+)/i);
    const project = projMatch ? projMatch[1].trim().substring(0, 60) : "";
    let line = title;
    if (company) line += ` chez ${company}`;
    if (project) line += ` (${project})`;
    return line;
  }
  if (profileType === "student_intern") {
    if (firstEdu) {
      const deg = cleanDegree(firstEdu.degree);
      const inst = firstEdu.institution.trim().substring(0, 80);
      if (deg.length > 3) {
        let t = `Diplome d'ingenieur en ${deg}`;
        if (inst.length > 2) t += `, ${inst}`;
        parts.push(t);
      }
    } else {
      parts.push(`${firstName} est un profil junior`);
    }
    if (stages.length === 1) {
      parts.push(`Il/elle a effectue un stage en tant que ${stageLine(stages[0])}`);
    } else if (stages.length > 1) {
      parts.push(`Il/elle a realize ${stages.length} stages, notamment ${stages.map(stageLine).join(", ")}`);
    }
  } else if (profileType === "junior") {
    if (firstEdu) {
      const deg = cleanDegree(firstEdu.degree);
      const inst = firstEdu.institution.trim().substring(0, 80);
      if (deg.length > 3) {
        let t = deg;
        if (inst.length > 2) t += `, ${inst}`;
        parts.push(`${firstName} est titulaire d'un diplome en ${t}`);
      }
    } else {
      parts.push(`${firstName} est un(e) professionnel(le) junior`);
    }
    const nd = nonStages.map((s) => {
      const title = s.title.replace(/[-–—|]/g, "").trim().substring(0, 80);
      const company = cleanCompany(s.company);
      return `${title}${company ? ` chez ${company}` : ""}`;
    }).filter((s) => s.length > 3);
    if (nd.length > 0) parts.push(`Il/elle a occupe le(s) poste(s) : ${nd.join(", ")}`);
    if (stages.length > 0) parts.push(`Par ailleurs, il/elle a realize ${stages.length} stage(s)`);
  } else if (profileType === "experienced") {
    if (firstEdu) {
      const deg = cleanDegree(firstEdu.degree);
      if (deg.length > 3) parts.push(`${firstName} est titulaire d'un diplome en ${deg}`);
    }
    const nd = nonStages.map((s) => {
      const title = s.title.replace(/[-–—|]/g, "").trim().substring(0, 80);
      const company = cleanCompany(s.company);
      return `${title}${company ? ` chez ${company}` : ""}`;
    }).filter((s) => s.length > 3);
    parts.push(`Il/elle dispose de ${nd.length} experiences professionnelles${nd.length > 0 ? `, notamment ${nd.slice(0, 3).join(", ")}` : ""}`);
  } else if (profileType === "student_noexp") {
    if (firstEdu) {
      const deg = cleanDegree(firstEdu.degree);
      const inst = firstEdu.institution.trim().substring(0, 80);
      if (deg.length > 3) {
        let t = deg;
        if (inst.length > 2) t += `, ${inst}`;
        parts.push(`${firstName} est actuellement etudiant(e) en ${t}`);
      }
    }
    parts.push(`Aucune experience professionnelle n'est mentionnee dans son CV`);
  } else {
    if (firstEdu) {
      const deg = cleanDegree(firstEdu.degree);
      if (deg.length > 3) parts.push(`${firstName} est titulaire d'un diplome en ${deg}`);
    }
    if (experiences.length > 0) parts.push(`Il/elle dispose de ${experiences.length} experiences`);
    else parts.push(`${firstName} presente un profil a analyser`);
  }
  if (skills.length > 0) {
    const frameworks = skills.filter((s) => /react|angular|vue|spring|django|laravel|next|node|thymeleaf|flutter/i.test(s));
    const langs = skills.filter((s) => /java|python|php|javascript|c\+|c#|typescript|ruby|go|rust/i.test(s));
    const tools = skills.filter((s) => /git|docker|linux|jira|agile|scrum|uml|ci\/cd|intellij|vs code|ollama|llm/i.test(s));
    const db = skills.filter((s) => /mysql|postgres|oracle|mongo|redis|sql server|sqlite/i.test(s));
    const categories = [];
    if (langs.length > 0) categories.push(`Langages (${langs.slice(0, 5).join(", ")})`);
    if (frameworks.length > 0) categories.push(`Frameworks (${frameworks.slice(0, 4).join(", ")})`);
    if (db.length > 0) categories.push(`Bases de donnees (${db.slice(0, 3).join(", ")})`);
    if (tools.length > 0) categories.push(`Outils (${tools.slice(0, 4).join(", ")})`);
    if (categories.length > 0) {
      parts.push(`Ses competences techniques : ${categories.join("; ")}`);
    } else {
      parts.push(`Ses competences techniques incluent ${skills.slice(0, 6).join(", ")}`);
    }
  }
  if (languages.length > 0) {
    parts.push(`Il/elle parle ${languages.slice(0, 5).join(", ")}`);
  }
  if (parts.length === 0) return "Resume non disponible.";
  return parts.join(". ").replace(/\.\./g, ".") + ".";
}
function extractKeywords(text, parsedData) {
  const keywords = /* @__PURE__ */ new Set();
  for (const skill of parsedData.skills) {
    keywords.add(skill);
  }
  const softSkills = [
    "Leadership",
    "Communication",
    "Travail en equipe",
    "Gestion de projet",
    "Problem solving",
    "Creativite",
    "Adaptabilite",
    "Autonomie",
    "Rigueur",
    "Organisation",
    "Prise de decision",
    "Negociation",
    "Management",
    "Mentorat",
    "Formations",
    "Presentation"
  ];
  const textLower = text.toLowerCase();
  for (const ss of softSkills) {
    if (textLower.includes(ss.toLowerCase())) {
      keywords.add(ss);
    }
  }
  const techPatterns = [
    "CI/CD",
    "REST API",
    "Microservices",
    "Agile",
    "Scrum",
    "Kanban",
    "Test Driven",
    "TDD",
    "DevOps",
    "Clean Code",
    "Design Patterns",
    "MVC",
    "OOP",
    "SOLID"
  ];
  for (const tp of techPatterns) {
    if (textLower.includes(tp.toLowerCase())) {
      keywords.add(tp);
    }
  }
  return [...keywords].slice(0, 20);
}
var KNOWN_SCHOOLS = [
  "EMSI",
  "EMI",
  "ENSIAS",
  "INPT",
  "ENSET",
  "ENAM",
  "ISCAE",
  "ENCG",
  "ENSA",
  "ENSM",
  "ENIC",
  "ENIT",
  "ENI",
  "FST",
  "FSJES",
  "FP",
  "ISI",
  "ISGM",
  "Sup'Management",
  "ESSEC",
  "ENCG",
  "UM5",
  "UH2C",
  "UM6P",
  "UM5A",
  "UM5P",
  "Universit\xE9 Hassan II",
  "Universit\xE9 Mohammed V",
  "Universit\xE9 Cadi Ayyad",
  "Universit\xE9 Ibn Tofail",
  "Universit\xE9 Mohammed Premier",
  "\xE9cole marocaine des sciences",
  "marocaine des sciences de l'ing\xE9nieur",
  "Facult\xE9",
  "Institut National"
];
var EXP_TITLE_RE = /(?:Stagiaire|Développeur(?:euse)?|Ingénieur(?:eure)?|Chef|Manager|Directeur(?:trice)?|Responsable|Consultant(?:e)?|Analyste|Designer|Architecte|Lead|Engineer|Developer|Technicien(?:ne)?|Administrateur?|Administrateur|Full Stack|Web|Mobile|Front[\s-]?End|Back[\s-]?End)/i;
function splitConcatenatedHeaders(text) {
  const knownHeaders = [
    "EXPERIENCES PROFESSIONELLES",
    "EXPERIENCE PROFESSIONNELLE",
    "ETUDE ET FORMATION",
    "FORMATION",
    "EDUCATION",
    "COMPETENCES",
    "COMP\xC9TENCES",
    "TECHNOLOGIES",
    "LANGUES",
    "LANGUE",
    "CERTIFICATIONS",
    "CERTIFICATION",
    "PROJETS",
    "SOFT SKILLS",
    "QUALIT\xC9S",
    "QUALITES",
    "CONTACT",
    "COORDONNEES",
    "CENTRES D",
    "LOISIRS",
    "INTERETS"
  ];
  let result = text;
  for (const header of knownHeaders) {
    const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`([A-Z\xC0-\u0178]{2,})(${escaped})`, "gi");
    result = result.replace(regex, "$1\n$2");
  }
  return result;
}
function normalizeText2(text) {
  return text.replace(/\r/g, "").replace(/'/g, "'").replace(/'/g, "'").replace(/"/g, '"').replace(/"/g, '"');
}
function parseCVData(text) {
  const normalized = normalizeText2(splitConcatenatedHeaders(text));
  const textLower = normalized.toLowerCase();
  const emailMatch = normalized.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = normalized.match(/(\+212|0)[\s.-]?[67]\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/);
  const locationMatch = normalized.match(/(?:Casablanca|Rabat|Marrakech|Tanger|Fès|Meknès|Agadir|Oujda|Kénitra|Tétouan|Nador|Safi|Mohammedia)/i);
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  const HEADER_RE = /^(?:CONTACT|EXPERIENCES?\s+PROFESSIONELLES?|ETUDE\s+ET\s+FORMATION|FORMATION|EDUCATION|ETUDES|PARCOURS\s+ACADEMIQUE|COMPETENCES?|COMPÉTENCES?|TECHNOLOGIES|STACK\s+TECHNIQUE|LANGUES?|CERTIFICATIONS?|PROJETS?\s*(?:ACADEMIQUE)?|SOFT\s+SKILLS|QUALITÉS?|COORDONNEES|LOISIRS|INTERETS|CENTRES\s+D)/i;
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
    "ReactJS",
    "React JS",
    "Angular",
    "Vue.js",
    "Vue",
    "Node.js",
    "Express.js",
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
    "REST API",
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
    "UML",
    "Machine Learning",
    "TensorFlow",
    "PyTorch",
    "LLM",
    "Ollama",
    "Flutter",
    "React Native",
    "Swift",
    "Kotlin",
    "Firebase",
    "Supabase",
    "Stripe",
    "Thymeleaf",
    "IntelliJ",
    "VS Code",
    "C/C++",
    "OOP"
  ];
  for (const skill of knownSkills) {
    if (textLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }
  const dedupSkills = [...new Set(skills)];
  const experience = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (HEADER_RE.test(line)) continue;
    const titleMatch = line.match(/^(.+?)\s*[-–—|]\s*(.+)$/);
    if (!titleMatch) continue;
    const leftSide = titleMatch[1].trim();
    const rightSide = titleMatch[2].trim();
    if (!EXP_TITLE_RE.test(leftSide)) continue;
    if (leftSide.length > 120 || leftSide.length < 5) continue;
    if (/^\d{4}/.test(leftSide)) continue;
    if (rightSide.length < 2 || rightSide.length > 100) continue;
    if (KNOWN_SCHOOLS.some((s) => rightSide.toLowerCase().includes(s.toLowerCase()))) continue;
    if (/(?:école|universit|institut|faculté|school|university)/i.test(rightSide)) continue;
    if (/(?:spécialisé|specialise|passionné|passionne|expérimenté|experimente|reconnu)/i.test(leftSide)) continue;
    if (/(?:Spring Boot|React|Java|Python|JavaScript|Angular|Django)/i.test(rightSide) && !/\.com|\.fr|SARL|SA|Groupe|Group/i.test(rightSide)) continue;
    const title = leftSide;
    let company = rightSide.replace(/\|.*$/, "").replace(/\s*\d{4}.*$/, "").trim();
    let period = "";
    const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
    const periodFromNext = nextLine.match(/((?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Févr|Mar|Avr|Jun|Jul|Aout|Sept|Oct|Nov|Déc)\w*\s+\d{4}\s*[-–]\s*(?:(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Févr|Mar|Avr|Jun|Jul|Aout|Sept|Oct|Nov|Déc)\w*\s+)?\d{4})/i);
    const periodFromLine = line.match(/((?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Févr|Mar|Avr|Jun|Jul|Aout|Sept|Oct|Nov|Déc)\w*\s+\d{4}\s*[-–]\s*(?:(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|Jan|Févr|Mar|Avr|Jun|Jul|Aout|Sept|Oct|Nov|Déc)\w*\s+)?\d{4})/i);
    period = periodFromNext && !HEADER_RE.test(nextLine) ? periodFromNext[0] : periodFromLine ? periodFromLine[0] : "";
    let descriptionLines = [];
    for (let j = i + 2; j < Math.min(i + 12, lines.length); j++) {
      const dl = lines[j];
      if (EXP_TITLE_RE.test(dl) && dl.includes("-")) break;
      if (/^\d{4}\s*[-–]/.test(dl)) break;
      if (HEADER_RE.test(dl)) break;
      if (/^(?:Tâches?|Projet|Sujet)\s*:/i.test(dl)) continue;
      if (dl === "Stack :" || dl.startsWith("Stack")) {
        const stackLine = dl.replace(/^Stack\s*:\s*/i, "");
        if (stackLine.length > 3) descriptionLines.push("Stack: " + stackLine);
        continue;
      }
      if (dl.length > 5 && descriptionLines.length < 3) descriptionLines.push(dl);
    }
    const isStage = /stagiaire|stage|intern/i.test(title);
    experience.push({
      title: title.substring(0, 150),
      company: company.substring(0, 100),
      period,
      description: descriptionLines.join(" ").substring(0, 300),
      isStage
    });
  }
  const education = [];
  const HEADER_EDU_RE = /^(?:ETUDE\s+ET\s+FORMATION|FORMATION|EDUCATION|ETUDES|PARCOURS\s+ACADEMIQUE)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\d{4}\s*[-–]\s*\d{4}/.test(line)) continue;
    if (HEADER_EDU_RE.test(line)) continue;
    const yearMatch = line.match(/(\d{4}\s*[-–]\s*\d{4})/);
    const year = yearMatch ? yearMatch[0] : "";
    let fullText = line.replace(/^\d{4}\s*[-–]\s*\d{4}\s*[:\-]?\s*/, "").trim();
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const next = lines[j];
      if (/^\d{4}\s*[-–]\s*\d{4}/.test(next)) break;
      if (HEADER_RE.test(next)) break;
      if (EXP_TITLE_RE.test(next) && next.includes("-")) break;
      if (/(?:Arabe|Français|Anglais|Espagnol|Allemand)\s*:/i.test(next)) break;
      if (next.length > 3) fullText += " " + next;
    }
    let degree = fullText;
    let institution = "";
    const sortedSchools = [...KNOWN_SCHOOLS].sort((a, b) => b.length - a.length);
    const matchedSchools = sortedSchools.filter((s) => fullText.toLowerCase().includes(s.toLowerCase()));
    if (matchedSchools.length > 0) {
      const abbr = matchedSchools.find((s) => s.length <= 6) || matchedSchools[matchedSchools.length - 1];
      institution = abbr;
      for (const school of matchedSchools) {
        degree = degree.replace(new RegExp(school.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
      }
    }
    degree = degree.replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").replace(/au\s+sein\s+d[eu]\s+/gi, "").replace(/l['']\s*école\b/gi, "").replace(/^[\s,\-–:]+/, "").replace(/[\s,\-–:]+$/, "").trim();
    degree = degree.replace(/\s{2,}/g, " ").trim();
    if (!institution) {
      const instMatch = fullText.match(/(?:école|universit|institut|faculté|school|university)\s+(?:[^\n]+)/i);
      if (instMatch) institution = instMatch[0].trim();
    }
    if (degree.length > 2) {
      education.push({
        degree: degree.substring(0, 200),
        institution: institution.substring(0, 200),
        year
      });
    }
  }
  const languages = [];
  const knownLangs = ["Arabe", "Fran\xE7ais", "Anglais", "Espagnol", "Allemand", "Chinois", "Italien", "Portugais", "Turc", "Russe"];
  const langLevels = ["Langue maternelle", "Bilingue", "Courant", "Avanc\xE9", "Interm\xE9diaire", "Op\xE9rationnel", "Notions"];
  for (const lang of knownLangs) {
    if (!textLower.includes(lang.toLowerCase())) continue;
    let level = "";
    for (const lv of langLevels) {
      if (normalized.toLowerCase().includes(lang.toLowerCase() + " : " + lv.toLowerCase()) || normalized.toLowerCase().includes(lang.toLowerCase() + ":" + lv.toLowerCase())) {
        level = lv;
        break;
      }
    }
    languages.push(level ? `${lang} (${level})` : lang);
  }
  return {
    skills: dedupSkills,
    experience,
    education,
    languages,
    certifications: [],
    projects: [],
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
    const candidateSummary = generateCandidateSummary(extractedText, parsedData, {});
    const keywords = extractKeywords(extractedText, parsedData);
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
      candidateSummary,
      keywords,
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
    const JobOffer = mongoose12.model("JobOffer");
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
router12.post("/backfill-summaries", protect, async (req, res) => {
  try {
    const cvs = await CV.find({ isActive: true });
    let updated = 0;
    for (const cv of cvs) {
      cv.candidateSummary = generateCandidateSummary(cv.extractedText || "", cv.parsedData || {}, {});
      cv.keywords = extractKeywords(cv.extractedText || "", cv.parsedData || {});
      await cv.save();
      updated++;
    }
    res.json({ message: `${updated} CV(s) mis a jour avec resume`, updated });
  } catch (error) {
    console.error("Backfill error:", error);
    res.status(500).json({ error: "Erreur backfill" });
  }
});
var cv_default = router12;

// backend/routes/portfolio.js
import express13 from "express";
import mongoose13 from "mongoose";
var router13 = express13.Router();
var portfolioSchema = new mongoose13.Schema({
  userId: { type: mongoose13.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
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
var Portfolio = mongoose13.models.Portfolio || mongoose13.model("Portfolio", portfolioSchema);
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

// backend/routes/recruiterSpace.js
import express14 from "express";
import mongoose14 from "mongoose";
var router14 = express14.Router();
var cvSchema2 = new mongoose14.Schema({
  userId: { type: mongoose14.Schema.Types.ObjectId, ref: "User", required: true },
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
  candidateSummary: { type: String, default: "" },
  keywords: [String],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, { timestamps: true });
var CV2 = mongoose14.models.CV || mongoose14.model("CV", cvSchema2);
function generateCandidateSummary2(text, parsedData, userProfile) {
  const parts = [];
  const firstName = userProfile?.userId?.firstName || "Le candidat";
  const experiences = (parsedData.experience || []).filter((e) => e.title && e.title.length > 3);
  const stages = experiences.filter((e) => e.isStage);
  const nonStages = experiences.filter((e) => !e.isStage);
  const educations = (parsedData.education || []).filter((e) => e.degree && e.degree.length > 3);
  const firstEdu = educations[0] || null;
  const skills = (parsedData.skills || []).filter((s) => s.length > 1 && s.length < 50);
  const languages = (parsedData.languages || []).filter((l) => l.length > 1 && l.length < 40);
  let profileType = "unknown";
  if (stages.length > 0 && nonStages.length === 0) profileType = "student_intern";
  else if (nonStages.length > 0 && nonStages.length <= 2) profileType = "junior";
  else if (nonStages.length > 2) profileType = "experienced";
  else if (educations.length > 0 && experiences.length === 0) profileType = "student_noexp";
  function cleanDegree(deg) {
    return deg ? deg.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").split(/\s*[-–|]/)[0].trim().substring(0, 120) : "";
  }
  function cleanCompany(c) {
    return c ? c.replace(/\|.*$/g, "").replace(/\d{4}/g, "").replace(/Casablanca.*$/i, "").trim().substring(0, 60) : "";
  }
  function stageLine(s) {
    const title = s.title.replace(/[-–—|]/g, "").trim().substring(0, 80);
    const company = cleanCompany(s.company);
    const projMatch = (s.description || "").match(/(?:Projet|Plateforme|Application|Site)\s*:\s*([^.]+)/i);
    const project = projMatch ? projMatch[1].trim().substring(0, 60) : "";
    let line = title;
    if (company) line += ` chez ${company}`;
    if (project) line += ` (${project})`;
    return line;
  }
  if (profileType === "student_intern") {
    if (firstEdu) {
      const deg = cleanDegree(firstEdu.degree);
      const inst = firstEdu.institution.trim().substring(0, 80);
      if (deg.length > 3) {
        let t = `Diplome d'ingenieur en ${deg}`;
        if (inst.length > 2) t += `, ${inst}`;
        parts.push(t);
      }
    } else {
      parts.push(`${firstName} est un profil junior`);
    }
    if (stages.length === 1) parts.push(`Il/elle a effectue un stage en tant que ${stageLine(stages[0])}`);
    else if (stages.length > 1) parts.push(`Il/elle a realize ${stages.length} stages, notamment ${stages.map(stageLine).join(", ")}`);
  } else if (profileType === "junior") {
    if (firstEdu) {
      const cleanDegree2 = firstEdu.degree.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").split(/\s*[-–|]/)[0].trim().substring(0, 120);
      const cleanInst = firstEdu.institution.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").trim().substring(0, 80);
      if (cleanDegree2.length > 3) {
        let t = cleanDegree2;
        if (cleanInst.length > 2) t += `, ${cleanInst}`;
        parts.push(`${firstName} est titulaire d'un diplome en ${t}`);
      }
    } else {
      parts.push(`${firstName} est un(e) professionnel(le) junior`);
    }
    const nd = nonStages.map((s) => ({
      title: s.title.replace(/[-–—|]/g, "").trim().substring(0, 80),
      company: (s.company || "").replace(/\|.*$/g, "").replace(/\d{4}/g, "").trim().substring(0, 60)
    })).filter((s) => s.title.length > 3);
    if (nd.length > 0) parts.push(`Il/elle a occupe le(s) poste(s) : ${nd.map((d) => `${d.title}${d.company ? ` chez ${d.company}` : ""}`).join(", ")}`);
    if (stages.length > 0) parts.push(`Par ailleurs, il/elle a realize ${stages.length} stage(s) en amont de son experience professionnelle`);
  } else if (profileType === "experienced") {
    if (firstEdu) {
      const cleanDegree2 = firstEdu.degree.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").split(/\s*[-–|]/)[0].trim().substring(0, 120);
      if (cleanDegree2.length > 3) parts.push(`${firstName} est titulaire d'un diplome en ${cleanDegree2}`);
    }
    const nd = nonStages.map((s) => ({
      title: s.title.replace(/[-–—|]/g, "").trim().substring(0, 80),
      company: (s.company || "").replace(/\|.*$/g, "").replace(/\d{4}/g, "").trim().substring(0, 60)
    })).filter((s) => s.title.length > 3);
    parts.push(`Il/elle dispose de ${nd.length} experiences professionnelles`);
    if (nd.length > 0) parts.push(`dont ${nd.slice(0, 3).map((d) => `${d.title}${d.company ? ` chez ${d.company}` : ""}`).join(", ")}`);
  } else if (profileType === "student_noexp") {
    if (firstEdu) {
      const cleanDegree2 = firstEdu.degree.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").split(/\s*[-–|]/)[0].trim().substring(0, 120);
      const cleanInst = firstEdu.institution.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").trim().substring(0, 80);
      if (cleanDegree2.length > 3) {
        let t = cleanDegree2;
        if (cleanInst.length > 2) t += `, ${cleanInst}`;
        parts.push(`${firstName} est actuellement etudiant(e) en ${t}`);
      }
    }
    parts.push(`Aucune experience professionnelle n'est mentionnee dans son CV`);
  } else {
    if (educations.length > 0 && firstEdu) {
      const cleanDegree2 = firstEdu.degree.replace(/\d{4}\s*[-–]\s*\d{4}/g, "").split(/\s*[-–|]/)[0].trim().substring(0, 120);
      if (cleanDegree2.length > 3) parts.push(`${firstName} est titulaire d'un diplome en ${cleanDegree2}`);
    }
    if (experiences.length > 0) parts.push(`Il/elle dispose de ${experiences.length} experiences`);
    else parts.push(`${firstName} presente un profil a analyser`);
  }
  if (skills.length > 0) {
    const frameworks = skills.filter((s) => /react|angular|vue|spring|django|laravel|next|node|thymeleaf|flutter/i.test(s));
    const langs = skills.filter((s) => /java|python|php|javascript|c\+|c#|typescript|ruby|go|rust/i.test(s));
    const tools = skills.filter((s) => /git|docker|linux|jira|agile|scrum|uml|ci\/cd|intellij|vs code|ollama|llm/i.test(s));
    const db = skills.filter((s) => /mysql|postgres|oracle|mongo|redis|sql server|sqlite/i.test(s));
    const categories = [];
    if (langs.length > 0) categories.push(`Langages (${langs.slice(0, 5).join(", ")})`);
    if (frameworks.length > 0) categories.push(`Frameworks (${frameworks.slice(0, 4).join(", ")})`);
    if (db.length > 0) categories.push(`Bases de donnees (${db.slice(0, 3).join(", ")})`);
    if (tools.length > 0) categories.push(`Outils (${tools.slice(0, 4).join(", ")})`);
    if (categories.length > 0) parts.push(`Ses competences techniques : ${categories.join("; ")}`);
    else parts.push(`Ses competences techniques incluent ${skills.slice(0, 6).join(", ")}`);
  }
  if (languages.length > 0) parts.push(`Il/elle parle ${languages.slice(0, 5).join(", ")}`);
  return parts.length > 0 ? parts.join(". ").replace(/\.\./g, ".") + "." : "Resume non disponible.";
}
function extractKeywords2(text, parsedData) {
  const keywords = /* @__PURE__ */ new Set();
  for (const skill of parsedData.skills) keywords.add(skill);
  const softSkills = [
    "Leadership",
    "Communication",
    "Travail en equipe",
    "Gestion de projet",
    "Problem solving",
    "Creativite",
    "Adaptabilite",
    "Autonomie",
    "Rigueur",
    "Organisation",
    "Prise de decision",
    "Negociation",
    "Management",
    "Mentorat",
    "Formations",
    "Presentation"
  ];
  const textLower = text.toLowerCase();
  for (const ss of softSkills) {
    if (textLower.includes(ss.toLowerCase())) keywords.add(ss);
  }
  const techPatterns = [
    "CI/CD",
    "REST API",
    "Microservices",
    "Agile",
    "Scrum",
    "Kanban",
    "Test Driven",
    "TDD",
    "DevOps",
    "Clean Code",
    "Design Patterns",
    "MVC",
    "OOP",
    "SOLID"
  ];
  for (const tp of techPatterns) {
    if (textLower.includes(tp.toLowerCase())) keywords.add(tp);
  }
  return [...keywords].slice(0, 20);
}
router14.get("/profile", protect, authorize("recruiter"), async (req, res) => {
  try {
    const profile = await RecruiterProfile_default.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Profil recruteur non trouv\xE9" });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.put("/profile", protect, authorize("recruiter"), async (req, res) => {
  try {
    const profile = await RecruiterProfile_default.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ error: "Profil non trouv\xE9" });
    res.json({ profile, message: "Profil mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/dashboard", protect, authorize("recruiter"), async (req, res) => {
  try {
    const profile = await RecruiterProfile_default.findOne({ userId: req.user._id });
    const [postedJobs, totalApplications, recentApplications] = await Promise.all([
      JobOffer_default.find({ postedBy: req.user._id, source: "recruiter" }).sort({ createdAt: -1 }),
      Application_default.countDocuments({ jobOfferId: { $in: await JobOffer_default.find({ postedBy: req.user._id }).distinct("_id") } }),
      Application_default.find({ jobOfferId: { $in: await JobOffer_default.find({ postedBy: req.user._id }).distinct("_id") } }).populate("userId", "firstName lastName email avatar jobSearchStatus").populate("jobOfferId", "title company location").sort({ createdAt: -1 }).limit(20)
    ]);
    const statusBreakdown = await Application_default.aggregate([
      { $match: { jobOfferId: { $in: await JobOffer_default.find({ postedBy: req.user._id }).distinct("_id") } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const stats = {
      totalJobs: postedJobs.length,
      activeJobs: postedJobs.filter((j) => j.isActive).length,
      totalApplications,
      applicationsByStatus: statusBreakdown.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {})
    };
    res.json({ profile, stats, recentApplications, postedJobs });
  } catch (error) {
    console.error("Recruiter dashboard error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/jobs", protect, authorize("recruiter"), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { postedBy: req.user._id, source: "recruiter" };
    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      JobOffer_default.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      JobOffer_default.countDocuments(query)
    ]);
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const appCount = await Application_default.countDocuments({ jobOfferId: job._id });
      return { ...job.toObject(), applicationsCount: appCount };
    }));
    res.json({ jobs: jobsWithCounts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/jobs/:id", protect, authorize("recruiter"), async (req, res) => {
  try {
    const job = await JobOffer_default.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    const applications = await Application_default.find({ jobOfferId: job._id }).populate("userId", "firstName lastName email avatar jobSearchStatus").sort({ createdAt: -1 });
    const applicationsWithMatch = applications.map((app2) => {
      const matchScore = app2.userId ? calculateCandidateMatch(app2.userId, job.toObject()) : 0;
      return { ...app2.toObject(), matchScore };
    });
    res.json({ job, applications: applicationsWithMatch });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.post("/jobs", protect, authorize("recruiter"), async (req, res) => {
  try {
    const profile = await RecruiterProfile_default.findOne({ userId: req.user._id });
    const company = profile?.companyName || req.body.company || "Entreprise";
    const job = await JobOffer_default.create({
      ...req.body,
      postedBy: req.user._id,
      company,
      source: "recruiter",
      postedAt: /* @__PURE__ */ new Date(),
      isActive: true
    });
    if (profile) {
      profile.jobPostingsCount = await JobOffer_default.countDocuments({ postedBy: req.user._id, source: "recruiter" });
      await profile.save();
    }
    res.status(201).json({ job, message: "Offre cr\xE9\xE9e avec succ\xE8s" });
  } catch (error) {
    console.error("Create recruiter job error:", error);
    res.status(500).json({ error: "Erreur lors de la cr\xE9ation" });
  }
});
router14.put("/jobs/:id", protect, authorize("recruiter"), async (req, res) => {
  try {
    const job = await JobOffer_default.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    res.json({ job, message: "Offre mise \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.delete("/jobs/:id", protect, authorize("recruiter"), async (req, res) => {
  try {
    const job = await JobOffer_default.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    const profile = await RecruiterProfile_default.findOne({ userId: req.user._id });
    if (profile) {
      profile.jobPostingsCount = await JobOffer_default.countDocuments({ postedBy: req.user._id, source: "recruiter" });
      await profile.save();
    }
    res.json({ message: "Offre supprim\xE9e" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.put("/jobs/:id/toggle", protect, authorize("recruiter"), async (req, res) => {
  try {
    const job = await JobOffer_default.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    job.isActive = !job.isActive;
    await job.save();
    res.json({ job, message: job.isActive ? "Offre activ\xE9e" : "Offre d\xE9sactiv\xE9e" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
function computeCandidateScores(profile, cv) {
  let cvScore = 0;
  if (cv) {
    cvScore = cv.analysis?.score || 0;
    if (cv.extractedText && cv.extractedText.length > 200) cvScore = Math.min(100, cvScore + 5);
  }
  let profileScore = 0;
  if (profile.title) profileScore += 10;
  if (profile.presentation) profileScore += 15;
  if (profile.skills?.length > 0) profileScore += Math.min(20, profile.skills.length * 3);
  if (profile.domains?.length > 0) profileScore += Math.min(10, profile.domains.length * 3);
  if (profile.education?.length > 0) profileScore += 15;
  if (profile.experience?.length > 0) profileScore += Math.min(15, profile.experience.length * 5);
  if (profile.languages?.length > 0) profileScore += Math.min(10, profile.languages.length * 3);
  if (profile.location?.city) profileScore += 5;
  if (profile.searchKeywords?.length > 0) profileScore += Math.min(5, profile.searchKeywords.length * 2);
  profileScore = Math.min(100, profileScore);
  let skillsScore = 0;
  const allSkills = [.../* @__PURE__ */ new Set([
    ...profile.skills || [],
    ...cv?.parsedData?.skills || [],
    ...profile.searchKeywords || []
  ])];
  if (allSkills.length > 0) skillsScore += Math.min(40, allSkills.length * 4);
  if (profile.experience?.length > 0) {
    const expSkills = profile.experience.flatMap((e) => e.skills || []);
    skillsScore += Math.min(20, expSkills.length * 5);
  }
  if (cv?.keywords?.length > 0) skillsScore += Math.min(20, cv.keywords.length * 2);
  if (profile.domains?.length > 0) skillsScore += Math.min(20, profile.domains.length * 7);
  skillsScore = Math.min(100, skillsScore);
  const totalScore = Math.round(cvScore * 0.4 + profileScore * 0.35 + skillsScore * 0.25);
  return { cvScore, profileScore, skillsScore, totalScore };
}
function mergeCandidateKeywords(profile, cv) {
  const keywordsSet = /* @__PURE__ */ new Set();
  for (const skill of profile.skills || []) keywordsSet.add(skill);
  for (const kw of profile.searchKeywords || []) keywordsSet.add(kw);
  for (const skill of cv?.parsedData?.skills || []) keywordsSet.add(skill);
  for (const kw of cv?.keywords || []) keywordsSet.add(kw);
  for (const domain of profile.domains || []) keywordsSet.add(domain);
  return [...keywordsSet];
}
router14.get("/candidates", protect, authorize("recruiter"), async (req, res) => {
  try {
    const { domain, skills, location, status, page = 1, limit = 50, search } = req.query;
    const candidateUserIds = await User_default.find({ role: "candidat", isActive: true }).distinct("_id");
    const profileQuery = { userId: { $in: candidateUserIds } };
    if (domain) profileQuery.domains = { $in: domain.split(",") };
    if (skills) profileQuery.skills = { $in: skills.split(",") };
    if (location) profileQuery["location.city"] = { $regex: location, $options: "i" };
    if (status && status !== "all") {
      const statusUsers = await User_default.find({
        role: "candidat",
        isActive: true,
        jobSearchStatus: { $in: status.split(",") }
      }).distinct("_id");
      profileQuery.userId = { $in: candidateUserIds.filter((id) => statusUsers.some((su) => su.toString() === id.toString())) };
    }
    const allProfiles = await UserProfile_default.find(profileQuery).populate("userId", "firstName lastName email avatar jobSearchStatus lastLogin");
    const validProfiles = allProfiles.filter((p) => p.userId);
    let filteredProfiles = validProfiles;
    if (search) {
      const s = search.toLowerCase();
      filteredProfiles = validProfiles.filter((p) => {
        const u = p.userId;
        return `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
      });
    }
    const userIds = filteredProfiles.map((p) => p.userId?._id).filter(Boolean);
    let cvMap = {};
    if (userIds.length > 0) {
      const cvs = await CV2.find({ userId: { $in: userIds }, isActive: true }).select("userId originalName fileSize analysis candidateSummary keywords parsedData.skills extractedText");
      for (const cv of cvs) {
        if (!cv.candidateSummary || cv.extractedText) {
          cv.candidateSummary = generateCandidateSummary2(cv.extractedText, cv.parsedData || {}, {});
          cv.keywords = extractKeywords2(cv.extractedText, cv.parsedData || {});
          await cv.save();
        }
        cvMap[cv.userId.toString()] = cv;
      }
    }
    const candidatesWithScores = filteredProfiles.map((p) => {
      const cv = cvMap[p.userId?._id?.toString()] || null;
      const scores = computeCandidateScores(p, cv);
      const mergedKeywords = mergeCandidateKeywords(p, cv);
      const recruiterSummary = p.presentation || cv?.candidateSummary || "";
      return {
        ...p.toObject(),
        cv: cv ? {
          ...cv.toObject(),
          keywords: mergedKeywords,
          candidateSummary: recruiterSummary
        } : null,
        scores
      };
    });
    candidatesWithScores.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
    const topCandidates = candidatesWithScores.slice(0, 3);
    const regularCandidates = candidatesWithScores.slice(3);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRegular = regularCandidates.slice(skip, skip + parseInt(limit));
    res.json({
      topCandidates,
      candidates: paginatedRegular,
      total: candidatesWithScores.length,
      topCount: topCandidates.length,
      page: parseInt(page),
      pages: Math.ceil(regularCandidates.length / parseInt(limit))
    });
  } catch (error) {
    console.error("Candidates browse error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/candidates/:userId", protect, authorize("recruiter"), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose14.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    const profile = await UserProfile_default.findOne({ userId }).populate("userId", "firstName lastName email avatar jobSearchStatus lastLogin");
    if (!profile || !profile.userId) {
      return res.status(404).json({ error: "Candidat non trouv\xE9" });
    }
    const cv = await CV2.findOne({ userId, isActive: true }).select("originalName fileSize analysis parsedData extractedText version createdAt");
    res.json({ candidate: profile, cv });
  } catch (error) {
    console.error("Candidate detail error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/candidates/:userId/cv/download", protect, authorize("recruiter"), async (req, res) => {
  try {
    if (!mongoose14.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    const cv = await CV2.findOne({ userId: req.params.userId, isActive: true });
    if (!cv || !cv.fileData) {
      return res.status(404).json({ error: "CV non trouv\xE9" });
    }
    const rawBase64 = cv.fileData.startsWith("data:") ? cv.fileData.split(",")[1] : cv.fileData;
    const buffer = Buffer.from(rawBase64, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${cv.originalName || "cv.pdf"}"`);
    res.send(buffer);
  } catch (error) {
    console.error("CV download error:", error);
    res.status(500).json({ error: "Erreur lors du t\xE9l\xE9chargement" });
  }
});
router14.get("/candidates/:userId/cv/preview", protect, authorize("recruiter"), async (req, res) => {
  try {
    if (!mongoose14.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    const cv = await CV2.findOne({ userId: req.params.userId, isActive: true }).select("fileData fileSize mimeType originalName");
    if (!cv) {
      return res.status(404).json({ error: "CV non trouv\xE9" });
    }
    res.json({
      fileData: cv.fileData,
      fileSize: cv.fileSize,
      mimeType: cv.mimeType,
      originalName: cv.originalName
    });
  } catch (error) {
    console.error("CV preview error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/jobs/:id/matching-candidates", protect, authorize("recruiter"), async (req, res) => {
  try {
    const job = await JobOffer_default.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    const { minScore = 30, page = 1, limit = 20 } = req.query;
    const profileQuery = {};
    if (job.domain) profileQuery.domains = { $in: [job.domain] };
    if (job.sector) profileQuery.$or = [{ domains: job.sector }, { skills: { $regex: job.sector, $options: "i" } }];
    const profiles = await UserProfile_default.find(profileQuery).populate("userId", "firstName lastName email avatar jobSearchStatus lastLogin");
    const scoredCandidates = profiles.filter((p) => p.userId && p.userId.isActive !== false).map((profile) => {
      const matchScore = calculateCandidateMatch(profile, job.toObject());
      return { profile, matchScore, userId: profile.userId };
    }).filter((c) => c.matchScore >= parseInt(minScore)).sort((a, b) => b.matchScore - a.matchScore);
    const total = scoredCandidates.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedCandidates = scoredCandidates.slice(skip, skip + parseInt(limit));
    res.json({
      candidates: paginatedCandidates,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error("Matching candidates error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/applications", protect, authorize("recruiter"), async (req, res) => {
  try {
    const { status, jobId, page = 1, limit = 50 } = req.query;
    const jobIds = await JobOffer_default.find({ postedBy: req.user._id }).distinct("_id");
    const query = { jobOfferId: { $in: jobIds } };
    if (status && status !== "all") query.status = status;
    if (jobId) query.jobOfferId = jobId;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      Application_default.find(query).populate("userId", "firstName lastName email avatar jobSearchStatus").populate("jobOfferId", "title company location contractType").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application_default.countDocuments(query)
    ]);
    res.json({ applications, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.put("/applications/:id/status", protect, authorize("recruiter"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["envoyee", "ouverte", "en_cours", "acceptee", "refusee"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    const jobIds = await JobOffer_default.find({ postedBy: req.user._id }).distinct("_id");
    const app2 = await Application_default.findOneAndUpdate(
      { _id: req.params.id, jobOfferId: { $in: jobIds } },
      { status },
      { new: true, runValidators: true }
    );
    if (!app2) return res.status(404).json({ error: "Candidature non trouv\xE9e" });
    res.json({ application: app2, message: "Statut mis \xE0 jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.get("/public/jobs", async (req, res) => {
  try {
    const { domain, contractType, location, search, page = 1, limit = 20 } = req.query;
    const query = { source: "recruiter", isActive: true };
    if (domain) query.domain = domain;
    if (contractType) query.contractType = contractType;
    if (location) query.location = { $regex: location, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      JobOffer_default.find(query).populate("postedBy", "firstName lastName").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      JobOffer_default.countDocuments(query)
    ]);
    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router14.post("/public/jobs/:id/apply", protect, async (req, res) => {
  try {
    const job = await JobOffer_default.findOne({ _id: req.params.id, source: "recruiter", isActive: true });
    if (!job) return res.status(404).json({ error: "Offre non trouv\xE9e" });
    const existing = await Application_default.findOne({ userId: req.user._id, jobOfferId: job._id });
    if (existing) {
      return res.status(400).json({ error: "Vous avez d\xE9j\xE0 postul\xE9 \xE0 cette offre" });
    }
    const application = await Application_default.create({
      userId: req.user._id,
      jobOfferId: job._id,
      status: "envoyee",
      coverLetter: req.body.coverLetter || "",
      appliedAt: /* @__PURE__ */ new Date()
    });
    job.applicationsCount = (job.applicationsCount || 0) + 1;
    await job.save();
    res.status(201).json({ application, message: "Candidature envoy\xE9e avec succ\xE8s" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la candidature" });
  }
});
router14.post("/candidates/:userId/email", protect, authorize("recruiter"), async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: "Sujet et message requis" });
    }
    const targetUser = await User_default.findById(req.params.userId).select("firstName lastName email");
    if (!targetUser) {
      return res.status(404).json({ error: "Candidat non trouv\xE9" });
    }
    const profile = await RecruiterProfile_default.findOne({ userId: req.user._id });
    const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_sendEmail(), sendEmail_exports));
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #10b981; font-size: 24px;">EasyJob \u2014 Message d'un recruteur</h1>
        </div>
        <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; border: 1px solid #bbf7d0;">
          <p style="color: #166534; font-weight: bold; margin-bottom: 8px;">
            ${req.user.firstName} ${req.user.lastName} ${profile?.companyName ? `(${profile.companyName})` : ""}
          </p>
          <p style="color: #166534; font-size: 13px; margin-bottom: 16px;">
            ${profile?.position || "Recruteur"} ${profile?.companyName ? `chez ${profile.companyName}` : ""}
          </p>
          <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 16px 0;" />
          <div style="color: #334155; line-height: 1.6; white-space: pre-wrap;">
${message}
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
          Ce message a \xE9t\xE9 envoy\xE9 via EasyJob. Veuillez ne pas r\xE9pondre directement \xE0 cet email.
        </p>
      </div>
    `;
    const result = await sendEmail2({
      to: targetUser.email,
      subject: `[EasyJob] ${subject}`,
      html
    });
    if (result.success) {
      res.json({ message: "Email envoy\xE9 avec succ\xE8s", messageId: result.messageId });
    } else {
      res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
    }
  } catch (error) {
    console.error("Recruiter email error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var recruiterSpace_default = router14;

// backend/server.js
mongoose15.set("toJSON", { virtuals: true, versionKey: false });
mongoose15.set("toObject", { virtuals: true, versionKey: false });
var app = express15();
app.use(helmet({ contentSecurityPolicy: false }));
var allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express15.json({ limit: "10mb" }));
app.use(express15.urlencoded({ extended: true }));
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
app.use("/api/recruiter-space", recruiterSpace_default);
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: /* @__PURE__ */ new Date() }));
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Route non trouv\xE9e: ${req.method} ${req.originalUrl}` });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Erreur serveur interne" });
});
async function connectDB() {
  if (mongoose15.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("\u274C MONGODB_URI non d\xE9fini");
    throw new Error("MONGODB_URI non d\xE9fini");
  }
  try {
    await mongoose15.connect(uri);
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
