import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  MapPin,
  Plus,
  Trash2,
  Save,
  GraduationCap,
  Briefcase,
  Globe,
  Link as LinkIcon,
  Camera,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Upload,
  BriefcaseBusiness,
  Target,
  Building2,
  Mail,
  ExternalLink,
  Eye,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Download,
  MessageSquareQuote,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfile, useUpdateProfile, useUploadCV, useCV, useDeleteCV, useAnalyzeCV } from "@/api/hooks";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const cities = [
  "Casablanca", "Rabat", "Marrakech", "Tanger", "Fès",
  "Meknès", "Agadir", "Oujda", "Kénitra", "Remote",
];

const languageLevels = ["Débutant", "Intermédiaire", "Avancé", "Natif"];

const allDomains = [
  "Technologie / IT", "Finance / Banque", "Marketing / Communication",
  "Ressources Humaines", "Ingénierie", "Santé", "Éducation",
  "Commerce / Vente", "Design / Créatif", "Logistique / Transport",
  "Juridique", "Agriculture", "BTP / Construction", "Tourisme / Hôtellerie",
  "Média / Audiovisuel", "Environnement", "Recherche / Science",
];

const allJobTypes = ["CDI", "CDD", "Stage", "Freelance", "Temps partiel"];

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function Section({ title, icon: Icon, children, onRemove, removable, badge }) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                {badge}
              </span>
            )}
          </div>
        </div>
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function Input({ label, error, icon: Icon, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          {...props}
          className={`w-full px-4 py-2.5 rounded-xl border bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm ${
            Icon ? "pl-10" : ""
          } ${
            error
              ? "border-red-400 focus:ring-red-500/40"
              : "border-surface-300 dark:border-surface-600"
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

function Select({ label, error, options, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          className={`w-full px-4 py-2.5 rounded-xl border bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm appearance-none ${
            error
              ? "border-red-400 focus:ring-red-500/40"
              : "border-surface-300 dark:border-surface-600"
          }`}
        >
          <option value="">Sélectionner...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onAdd(trimmed);
        setValue("");
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm"
      />
    </div>
  );
}

function ChipSelect({ options, selected, onToggle, columns = 3 }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${columns} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border text-left ${
            selected.includes(opt)
              ? "bg-primary-500 text-white border-primary-500 shadow-sm"
              : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:border-primary-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div className={`animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700 ${className}`} />
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <SkeletonBlock className="h-9 w-48" />
          <SkeletonBlock className="h-5 w-72" />
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row items-center gap-6">
            <SkeletonBlock className="w-24 h-24 rounded-full shrink-0" />
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-36" />
              <SkeletonBlock className="h-4 w-52" />
              <SkeletonBlock className="h-9 w-36 rounded-xl" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 space-y-4">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="w-10 h-10 rounded-xl" />
                <SkeletonBlock className="h-6 w-44" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonBlock className="h-11 w-full" />
                <SkeletonBlock className="h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildFormValues(profile, user) {
  return {
    firstName: user?.firstName || profile?.firstName || "",
    lastName: user?.lastName || profile?.lastName || "",
    email: user?.email || profile?.email || "",
    phone: user?.phone || profile?.phone || "",
    city: profile?.location?.city || profile?.city || "",
    title: profile?.title || "",
    presentation: profile?.presentation || "",
    domains: profile?.domains || [],
    searchKeywords: profile?.searchKeywords || [],
    jobTypes: profile?.jobTypes || [],
    preferredLocations: profile?.preferredLocations || [],
    education:
      profile?.education?.length > 0
        ? profile.education.map((e) => ({
            institution: e.institution || "",
            degree: e.degree || "",
            field: e.field || "",
            startDate: e.startDate ? String(e.startDate).slice(0, 10) : "",
            endDate: e.endDate ? String(e.endDate).slice(0, 10) : "",
            description: e.description || "",
          }))
        : [],
    experience:
      profile?.experience?.length > 0
        ? profile.experience.map((e) => ({
            company: e.company || "",
            position: e.position || "",
            startDate: e.startDate ? String(e.startDate).slice(0, 10) : "",
            endDate: e.endDate ? String(e.endDate).slice(0, 10) : "",
            isCurrent: e.isCurrent || false,
            description: e.description || "",
            skills: Array.isArray(e.skills) ? e.skills : [],
          }))
        : [],
    skills: profile?.skills || [],
    languages:
      profile?.languages?.length > 0
        ? profile.languages.map((l) => ({
            language: l.language || "",
            level: l.level || "",
          }))
        : [],
    socialLinks: {
      linkedin: profile?.socialLinks?.linkedin || "",
      github: profile?.socialLinks?.github || "",
      portfolio: profile?.socialLinks?.portfolio || "",
      website: profile?.socialLinks?.website || "",
    },
  };
}

export default function ProfilePage() {
  const { data: profileData, isLoading, isError, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadCV = useUploadCV();
  const { data: cvData } = useCV();
  const deleteCV = useDeleteCV();
  const analyzeCV = useAnalyzeCV();
  const { user } = useAuth();

  const profile = profileData?.profile;
  const hasCV = profileData?.hasCV || false;
  const mergedUser = profileData?.user || user;

  const [showCVModal, setShowCVModal] = useState(false);
  const [showCVPreview, setShowCVPreview] = useState(false);
  const [cvAnalysisExpanded, setCvAnalysisExpanded] = useState(true);
  const [cvEditing, setCvEditing] = useState(false);
  const [cvEditData, setCvEditData] = useState({});

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      title: "",
      presentation: "",
      domains: [],
      searchKeywords: [],
      jobTypes: [],
      preferredLocations: [],
      education: [],
      experience: [],
      skills: [],
      languages: [],
      socialLinks: { linkedin: "", github: "", portfolio: "", website: "" },
    },
  });

  useEffect(() => {
    if (profile || mergedUser) {
      reset(buildFormValues(profile, mergedUser));
    }
  }, [profile, mergedUser, reset]);

  useEffect(() => {
    if (cvData?.cv?.parsedData) {
      setCvEditData(cvData.cv.parsedData);
    }
  }, [cvData]);

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({ control, name: "education" });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({ control, name: "experience" });

  const skills = watch("skills") || [];
  const languages = watch("languages") || [];
  const domains = watch("domains") || [];
  const searchKeywords = watch("searchKeywords") || [];
  const jobTypes = watch("jobTypes") || [];
  const preferredLocations = watch("preferredLocations") || [];

  const onSubmit = async (data) => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        title: data.title,
        city: data.city,
        presentation: data.presentation,
        domains: data.domains,
        searchKeywords: data.searchKeywords,
        jobTypes: data.jobTypes,
        preferredLocations: data.preferredLocations,
        skills: data.skills,
        languages: data.languages,
        socialLinks: data.socialLinks,
        education: data.education.map((e) => ({
          ...e,
          startDate: e.startDate || undefined,
          endDate: e.endDate || undefined,
        })),
        experience: data.experience.map((e) => ({
          ...e,
          startDate: e.startDate || undefined,
          endDate: e.endDate || undefined,
        })),
      };
      await updateProfile.mutateAsync(payload);
      toast.success("Profil mis à jour avec succès !");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Erreur lors de la mise à jour du profil");
    }
  };

  const handleCVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast.error("Veuillez sélectionner un fichier PDF.");
      return;
    }
    const formData = new FormData();
    formData.append("cv", file);
    toast.loading("Upload et analyse du CV...", { id: "cv-upload" });
    uploadCV.mutate(formData, {
      onSuccess: () => {
        toast.success("CV uploadé et analysé avec succès !", { id: "cv-upload" });
      },
      onError: (err) => {
        toast.error(err?.message || "Erreur lors de l'upload", { id: "cv-upload" });
      },
    });
  };

  const handleCVDelete = () => {
    if (!cvData?.cv?._id) return;
    if (!window.confirm("Supprimer votre CV ? Cette action est irréversible.")) return;
    toast.loading("Suppression du CV...", { id: "cv-delete" });
    deleteCV.mutate(cvData.cv._id, {
      onSuccess: () => {
        toast.success("CV supprimé.", { id: "cv-delete" });
        setCvEditData({});
        setCvEditing(false);
      },
      onError: () => toast.error("Erreur lors de la suppression", { id: "cv-delete" }),
    });
  };

  const handleCVAnalyze = () => {
    if (!cvData?.cv?._id) return;
    toast.loading("Analyse en cours...", { id: "cv-analyze" });
    analyzeCV.mutate(cvData.cv._id, {
      onSuccess: () => {
        toast.success("CV analysé avec succès !", { id: "cv-analyze" });
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error || "Erreur lors de l'analyse", { id: "cv-analyze" });
      },
    });
  };

  const handleCVEditSave = async () => {
    try {
      const cv = cvData?.cv;
      if (!cv?._id) return;
      await api.put(`/profile/cv/${cv._id}`, { parsedData: cvEditData });
      toast.success("CV mis à jour !");
      setCvEditing(false);
    } catch {
      toast.error("Erreur lors de la mise à jour du CV");
    }
  };

  const analysis = cvData?.cv?.analysis;

  if (isLoading) return <ProfileSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-medium">
            {error?.response?.data?.error || "Erreur lors du chargement du profil"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            Mon Profil
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Gérez vos informations personnelles et professionnelles
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar + Basic Info Card */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row items-center gap-6"
          >
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center overflow-hidden">
                {mergedUser?.avatar ? (
                  <img src={mergedUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-surface-400" />
                )}
              </div>
              <button
                type="button"
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-surface-900 dark:text-white">
                {mergedUser?.firstName} {mergedUser?.lastName}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {mergedUser?.email}
              </p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                {hasCV && (
                  <Link
                    to="/profile/cv"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-600 dark:text-secondary-400 bg-secondary-500/10 dark:bg-secondary-500/20 rounded-full hover:bg-secondary-500/20 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    CV ajouté
                  </Link>
                )}
                {mergedUser?.onboardingCompleted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-500/10 dark:bg-primary-500/20 rounded-full">
                    <Target className="w-3.5 h-3.5" />
                    Profil configuré
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* CV Section */}
          <Section title="Mon CV" icon={FileText} badge={hasCV ? "Ajouté" : "Optionnel"}>
            {hasCV ? (
              <div className="space-y-4">
                {/* CV Info + Actions Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-secondary-500/10 border border-secondary-200 dark:border-secondary-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-secondary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{cvData?.cv?.originalName || "CV.pdf"}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {cvData?.cv?.fileSize ? `${(cvData.cv.fileSize / 1024).toFixed(0)} KB` : ""}
                        {cvData?.cv?.version ? ` · Version ${cvData.cv.version}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCVPreview(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl hover:bg-primary-500/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Visualiser
                    </button>
                    <button
                      type="button"
                      onClick={handleCVAnalyze}
                      disabled={analyzeCV.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    >
                      {analyzeCV.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Analyser
                    </button>
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-700 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Remplacer
                      <input type="file" accept=".pdf" onChange={handleCVUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleCVDelete}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Parsed Data Preview */}
                {cvData?.cv?.parsedData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        Données extraites
                      </h4>
                      <button
                        type="button"
                        onClick={() => setCvEditing(!cvEditing)}
                        className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        {cvEditing ? "Annuler" : "Modifier"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Skills */}
                      <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600">
                        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Compétences</p>
                        {cvEditing ? (
                          <textarea
                            value={(cvEditData.skills || []).join(", ")}
                            onChange={(e) => setCvEditData({ ...cvEditData, skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                            className="w-full text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg p-2 text-surface-900 dark:text-white resize-none"
                            rows={3}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(cvData.cv.parsedData.skills || []).length > 0 ? (
                              cvData.cv.parsedData.skills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full">{s}</span>
                              ))
                            ) : (
                              <span className="text-xs text-surface-400">Aucune compétence détectée</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Experience */}
                      <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600">
                        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Expérience</p>
                        {cvEditing ? (
                          <textarea
                            value={(cvEditData.experience || []).map(e => `${e.title || ""} @ ${e.company || ""} (${e.period || ""})`).join("\n")}
                            onChange={(e) => {
                              const lines = e.target.value.split("\n").filter(Boolean);
                              setCvEditData({
                                ...cvEditData,
                                experience: lines.map(line => {
                                  const parts = line.split("@");
                                  const title = parts[0]?.trim() || "";
                                  const rest = parts[1]?.trim() || "";
                                  const periodMatch = rest.match(/\((.+)\)/);
                                  return { title, company: rest.replace(/\(.+\)/, "").trim(), period: periodMatch?.[1] || "", description: "" };
                                }),
                              });
                            }}
                            className="w-full text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg p-2 text-surface-900 dark:text-white resize-none"
                            rows={3}
                          />
                        ) : (
                          <div className="space-y-1">
                            {(cvData.cv.parsedData.experience || []).length > 0 ? (
                              cvData.cv.parsedData.experience.map((e, i) => (
                                <p key={i} className="text-xs text-surface-700 dark:text-surface-300">
                                  <span className="font-medium">{e.title}</span>
                                  {e.company ? ` @ ${e.company}` : ""}
                                  {e.period ? <span className="text-surface-400"> ({e.period})</span> : ""}
                                </p>
                              ))
                            ) : (
                              <span className="text-xs text-surface-400">Aucune expérience détectée</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Education */}
                      <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600">
                        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Formation</p>
                        {cvEditing ? (
                          <textarea
                            value={(cvEditData.education || []).map(e => `${e.degree || ""} - ${e.institution || ""} (${e.year || ""})`).join("\n")}
                            onChange={(e) => {
                              const lines = e.target.value.split("\n").filter(Boolean);
                              setCvEditData({
                                ...cvEditData,
                                education: lines.map(line => {
                                  const parts = line.split(" - ");
                                  return { degree: parts[0]?.trim() || "", institution: parts[1]?.replace(/\(.+\)/, "").trim() || "", year: (parts[1]?.match(/\((.+)\)/)?.[1]) || "" };
                                }),
                              });
                            }}
                            className="w-full text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg p-2 text-surface-900 dark:text-white resize-none"
                            rows={3}
                          />
                        ) : (
                          <div className="space-y-1">
                            {(cvData.cv.parsedData.education || []).length > 0 ? (
                              cvData.cv.parsedData.education.map((e, i) => (
                                <p key={i} className="text-xs text-surface-700 dark:text-surface-300">
                                  <span className="font-medium">{e.degree}</span>
                                  {e.institution ? ` — ${e.institution}` : ""}
                                  {e.year ? <span className="text-surface-400"> ({e.year})</span> : ""}
                                </p>
                              ))
                            ) : (
                              <span className="text-xs text-surface-400">Aucune formation détectée</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Languages + Contact */}
                      <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600">
                        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Langues & Contact</p>
                        {cvEditing ? (
                          <div className="space-y-2">
                            <input
                              value={(cvEditData.languages || []).join(", ")}
                              onChange={(e) => setCvEditData({ ...cvEditData, languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                              placeholder="Langues (séparées par virgule)"
                              className="w-full text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg p-2 text-surface-900 dark:text-white"
                            />
                            <input
                              value={cvEditData.email || ""}
                              onChange={(e) => setCvEditData({ ...cvEditData, email: e.target.value })}
                              placeholder="Email"
                              className="w-full text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg p-2 text-surface-900 dark:text-white"
                            />
                            <input
                              value={cvEditData.phone || ""}
                              onChange={(e) => setCvEditData({ ...cvEditData, phone: e.target.value })}
                              placeholder="Téléphone"
                              className="w-full text-sm bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg p-2 text-surface-900 dark:text-white"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {(cvData.cv.parsedData.languages || []).map((l, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 rounded-full">{l}</span>
                              ))}
                            </div>
                            {cvData.cv.parsedData.email && (
                              <p className="text-xs text-surface-500 dark:text-surface-400">{cvData.cv.parsedData.email}</p>
                            )}
                            {cvData.cv.parsedData.phone && (
                              <p className="text-xs text-surface-500 dark:text-surface-400">{cvData.cv.parsedData.phone}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {cvEditing && (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setCvEditing(false); setCvEditData(cvData?.cv?.parsedData || {}); }}
                          className="px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-700 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={handleCVEditSave}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Enregistrer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Analysis */}
                {analysis && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setCvAnalysisExpanded(!cvAnalysisExpanded)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Analyse Expert RH
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                          analysis.score >= 80 ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                          analysis.score >= 50 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                          "bg-red-500/10 text-red-500 dark:text-red-400"
                        }`}>
                          {analysis.score}/100
                        </span>
                      </h4>
                      {cvAnalysisExpanded ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                    </button>

                    <AnimatePresence>
                      {cvAnalysisExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {/* Score Bar */}
                          <div className="mb-3">
                            <div className="w-full h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.score}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  analysis.score >= 80 ? "bg-green-500" :
                                  analysis.score >= 50 ? "bg-amber-500" : "bg-red-500"
                                }`}
                              />
                            </div>
                          </div>

                          {/* Strengths */}
                          {analysis.strengths?.length > 0 && (
                            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Points forts
                              </p>
                              <ul className="space-y-1">
                                {analysis.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-green-600 dark:text-green-400/80 flex items-start gap-1.5">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvements */}
                          {analysis.improvements?.length > 0 && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 mt-2">
                              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Points à améliorer
                              </p>
                              <ul className="space-y-1">
                                {analysis.improvements.map((s, i) => (
                                  <li key={i} className="text-xs text-red-600 dark:text-red-400/80 flex items-start gap-1.5">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Suggestions */}
                          {analysis.suggestions?.length > 0 && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 mt-2">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5" />
                                Suggestions d'expert
                              </p>
                              <ul className="space-y-1">
                                {analysis.suggestions.map((s, i) => (
                                  <li key={i} className="text-xs text-amber-600 dark:text-amber-400/80 flex items-start gap-1.5">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                  <Upload className="w-6 h-6 text-surface-400" />
                  <div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {uploadCV.isPending ? "Upload en cours..." : "Uploadez votre CV (PDF)"}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">Analyse automatique par notre expert RH IA</p>
                  </div>
                  <input type="file" accept=".pdf" onChange={handleCVUpload} className="hidden" disabled={uploadCV.isPending} />
                </label>
                <Link
                  to="/profile/cv"
                  className="mt-3 flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Aller à la page CV avancée
                </Link>
              </div>
            )}
          </Section>

          {/* CV Preview Modal */}
          <AnimatePresence>
            {showCVPreview && cvData?.cv && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setShowCVPreview(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200 dark:border-surface-700">
                    <h3 className="font-semibold text-surface-900 dark:text-white">{cvData.cv.originalName || "CV"}</h3>
                    <button onClick={() => setShowCVPreview(false)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                      <X className="w-5 h-5 text-surface-500" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-5">
                    {cvData.cv.fileData ? (
                      <iframe
                        src={cvData.cv.fileData.startsWith('data:') ? cvData.cv.fileData : `data:application/pdf;base64,${cvData.cv.fileData}`}
                        className="w-full h-[70vh] rounded-lg border border-surface-200 dark:border-surface-600"
                        title="CV Preview"
                      />
                    ) : (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-surface-900 dark:text-white">Texte extrait du CV</h4>
                        <pre className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-700/50 p-4 rounded-xl border border-surface-200 dark:border-surface-600 max-h-[60vh] overflow-auto font-mono">
                          {cvData.cv.extractedText || "Aucun texte extrait"}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Personal Info */}
          <Section title="Informations personnelles" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Jean"
                {...register("firstName", {
                  required: "Le prénom est requis",
                })}
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                {...register("lastName", {
                  required: "Le nom est requis",
                })}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  readOnly
                  value={watch("email") || ""}
                  className="w-full pl-10 px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 cursor-not-allowed text-sm"
                />
              </div>
              <p className="text-xs text-surface-400 mt-1.5 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                L'email ne peut pas être modifié directement.
                <button type="button" onClick={() => toast("Contactez le support pour changer votre email.", { icon: "📧" })} className="text-primary-500 hover:text-primary-600 font-medium ml-1">
                  Demander un changement
                </button>
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Téléphone"
                placeholder="+212 6 00 00 00 00"
                {...register("phone")}
              />
              <Select
                label="Ville de résidence"
                options={cities}
                {...register("city")}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Titre professionnel"
                placeholder="Développeur Full Stack, Chef de projet..."
                {...register("title")}
              />
            </div>
          </Section>

          {/* Présentation - first impression for recruiters */}
          <Section title="Ma Présentation" icon={MessageSquareQuote} badge="Première impression">
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
              Ce paragraphe sera affiché aux recruteurs comme première impression. Écrivez-le en 2-4 phrases pour vous décrire, vos atouts et votre ambition professionnelle.
            </p>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Ex: Développeur Full Stack passionné par les technologies web modernes, je recherche un poste stimulant où je pourrai contribuer à des projets innovants tout en développant mes compétences en architecture logicielle..."
              {...register("presentation")}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm resize-none leading-relaxed"
            />
            <p className="text-xs text-surface-400 mt-1.5">
              {(watch("presentation") || "").length}/500 caractères
            </p>
          </Section>

          {/* Domains - from onboarding */}
          <Section title="Domaines d'intérêt" icon={BriefcaseBusiness} badge="Depuis l'onboarding">
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
              Les domaines sélectionnés lors de l'onboarding. Vous pouvez les modifier.
            </p>
            <ChipSelect
              options={allDomains}
              selected={domains}
              onToggle={(d) => {
                setValue("domains", domains.includes(d)
                  ? domains.filter((x) => x !== d)
                  : [...domains, d]);
              }}
              columns={3}
            />
            <p className="text-xs text-surface-400 mt-2">{domains.length} domaine(s) sélectionné(s)</p>
          </Section>

          {/* Search Keywords - from onboarding */}
          <Section title="Mots-clés de recherche" icon={Target} badge="Depuis l'onboarding">
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
              Compétences et technologies recherchées.
            </p>
            <TagInput
              tags={searchKeywords}
              onAdd={(tag) => setValue("searchKeywords", [...searchKeywords, tag])}
              onRemove={(tag) => setValue("searchKeywords", searchKeywords.filter((s) => s !== tag))}
              placeholder="Ajouter un mot-clé..."
            />
          </Section>

          {/* Job Types - from onboarding */}
          <Section title="Types de contrat souhaités" icon={Building2} badge="Depuis l'onboarding">
            <ChipSelect
              options={allJobTypes}
              selected={jobTypes}
              onToggle={(t) => {
                setValue("jobTypes", jobTypes.includes(t)
                  ? jobTypes.filter((x) => x !== t)
                  : [...jobTypes, t]);
              }}
              columns={3}
            />
          </Section>

          {/* Preferred Locations - from onboarding */}
          <Section title="Localisations préférées" icon={MapPin} badge="Depuis l'onboarding">
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
              Villes où vous souhaitez travailler.
            </p>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setValue("preferredLocations", preferredLocations.includes(c)
                      ? preferredLocations.filter((x) => x !== c)
                      : [...preferredLocations, c]);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    preferredLocations.includes(c)
                      ? "bg-secondary-500 text-white border-secondary-500"
                      : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:border-secondary-300"
                  }`}
                >
                  {c === "Remote" ? "🌍 " : ""}{c}
                </button>
              ))}
            </div>
          </Section>

          {/* Skills */}
          <Section title="Compétences" icon={Globe}>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
              Ajoutez vos compétences techniques. Elles seront utilisées pour le matching avec les offres.
            </p>
            <TagInput
              tags={skills}
              onAdd={(tag) => setValue("skills", [...skills, tag])}
              onRemove={(tag) => setValue("skills", skills.filter((s) => s !== tag))}
              placeholder="Ajouter une compétence (React, Python, SQL...)"
            />
          </Section>

          {/* Education */}
          <div className="space-y-4">
            <AnimatePresence>
              {eduFields.map((field, index) => (
                <Section
                  key={field.id}
                  title={`Formation ${index + 1}`}
                  icon={GraduationCap}
                  removable={eduFields.length > 0}
                  onRemove={() => removeEdu(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Institution"
                      placeholder="Université..."
                      {...register(`education.${index}.institution`)}
                    />
                    <Input
                      label="Diplôme"
                      placeholder="Master, Licence..."
                      {...register(`education.${index}.degree`)}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Domaine"
                      placeholder="Génie Logiciel"
                      {...register(`education.${index}.field`)}
                    />
                    <Input
                      label="Année de début"
                      placeholder="2019"
                      type="date"
                      {...register(`education.${index}.startDate`)}
                    />
                    <Input
                      label="Année de fin"
                      placeholder="2021"
                      type="date"
                      {...register(`education.${index}.endDate`)}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Décrivez votre parcours..."
                      {...register(`education.${index}.description`)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm resize-none"
                    />
                  </div>
                </Section>
              ))}
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={() =>
                appendEdu({
                  institution: "",
                  degree: "",
                  field: "",
                  startDate: "",
                  endDate: "",
                  description: "",
                })
              }
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl text-sm font-medium text-surface-500 dark:text-surface-400 hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une formation
            </motion.button>
          </div>

          {/* Experiences */}
          <div className="space-y-4">
            <AnimatePresence>
              {expFields.map((field, index) => (
                <Section
                  key={field.id}
                  title={`Expérience ${index + 1}`}
                  icon={Briefcase}
                  removable={expFields.length > 0}
                  onRemove={() => removeExp(index)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Entreprise"
                      placeholder="TechMaroc"
                      {...register(`experience.${index}.company`)}
                    />
                    <Input
                      label="Poste"
                      placeholder="Développeur Full Stack"
                      {...register(`experience.${index}.position`)}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Date de début"
                      type="date"
                      {...register(`experience.${index}.startDate`)}
                    />
                    <Input
                      label="Date de fin"
                      type="date"
                      {...register(`experience.${index}.endDate`)}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Décrivez vos missions..."
                      {...register(`experience.${index}.description`)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm resize-none"
                    />
                  </div>
                </Section>
              ))}
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={() =>
                appendExp({
                  company: "",
                  position: "",
                  startDate: "",
                  endDate: "",
                  isCurrent: false,
                  description: "",
                  skills: [],
                })
              }
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl text-sm font-medium text-surface-500 dark:text-surface-400 hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une expérience
            </motion.button>
          </div>

          {/* Languages */}
          <Section title="Langues" icon={Globe}>
            <div className="space-y-3">
              {languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    {...register(`languages.${index}.language`)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm"
                    placeholder="Langue"
                  />
                  <div className="relative w-44">
                    <select
                      {...register(`languages.${index}.level`)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm appearance-none"
                    >
                      {languageLevels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setValue(
                        "languages",
                        languages.filter((_, i) => i !== index)
                      )
                    }
                    className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setValue("languages", [...languages, { language: "", level: "Intermédiaire" }])
              }
              className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl hover:bg-primary-500/20 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une langue
            </button>
          </Section>

          {/* Social Links */}
          <Section title="Liens sociaux" icon={LinkIcon}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="LinkedIn"
                placeholder="https://linkedin.com/in/..."
                {...register("socialLinks.linkedin")}
              />
              <Input
                label="GitHub"
                placeholder="https://github.com/..."
                {...register("socialLinks.github")}
              />
              <Input
                label="Portfolio"
                placeholder="https://..."
                {...register("socialLinks.portfolio")}
              />
              <Input
                label="Site web"
                placeholder="https://..."
                {...register("socialLinks.website")}
              />
            </div>
          </Section>

          {/* Save Button */}
          <div className="sticky bottom-0 py-4 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-xl -mx-4 px-4">
            <motion.button
              type="submit"
              disabled={updateProfile.isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {updateProfile.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
