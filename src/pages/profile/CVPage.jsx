import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Eye,
  Briefcase,
  GraduationCap,
  Sparkles,
  Loader2,
  Globe,
  MapPin,
  Mail,
  Phone,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import { useCV, useUploadCV, useDeleteCV, useMatchJobs, useAnalyzeCV } from "@/api/hooks";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / 1048576).toFixed(1) + " Mo";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function ScoreCircle({ score }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : score >= 40 ? "#F97316" : "#EF4444";

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="absolute h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-200 dark:text-surface-700" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="text-center">
        <span className="text-3xl font-bold text-surface-800 dark:text-surface-200">{score}</span>
        <span className="block text-xs font-medium text-surface-400 dark:text-surface-500">/100</span>
      </div>
    </div>
  );
}

const tips = [
  { icon: AlertCircle, title: "Format PDF", text: "Utilisez toujours le format PDF pour préserver la mise en page de votre CV." },
  { icon: Lightbulb, title: "Mots-clés pertinents", text: "Incluez les mots-clés des offres d'emploi pour améliorer la détection automatique." },
  { icon: FileText, title: "Clarté et concision", text: "L'idéal est un CV de 1 à 2 pages avec des bullet points clairs." },
  { icon: Sparkles, title: "Mise à jour régulière", text: "Mettez à jour votre CV régulièrement avec vos nouvelles compétences et expériences." },
];

export default function CVPage() {
  const { data: cvData, isLoading: cvLoading } = useCV();
  const uploadMutation = useUploadCV();
  const deleteMutation = useDeleteCV();
  const matchMutation = useMatchJobs();
  const analyzeMutation = useAnalyzeCV();

  const [cv, setCv] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showParsed, setShowParsed] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [searchKeywords, setSearchKeywords] = useState("");

  useEffect(() => {
    if (cvData?.cv) {
      setCv({
        id: cvData.cv._id,
        name: cvData.cv.originalName || cvData.cv.fileName,
        size: cvData.cv.fileSize,
        date: new Date(cvData.cv.createdAt),
        base64: cvData.cv.fileData,
      });
      if (cvData.cv.analysis) setAnalysis(cvData.cv.analysis);
      if (cvData.cv.parsedData) setParsedData(cvData.cv.parsedData);
      if (cvData.cv.extractedText) setExtractedText(cvData.cv.extractedText);
    }
  }, [cvData]);

  const handleFile = useCallback((file) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Veuillez sélectionner un fichier PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("cv", file);

    toast.loading("Upload et analyse du CV...", { id: "cv-upload" });

    uploadMutation.mutate(formData, {
      onSuccess: (data) => {
        toast.success("CV uploadé et analysé avec succès !", { id: "cv-upload" });
        setCv({
          id: data.cv._id,
          name: data.cv.originalName || data.cv.fileName,
          size: data.cv.fileSize,
          date: new Date(data.cv.createdAt),
          base64: data.cv.fileData,
        });
        if (data.analysis) setAnalysis(data.analysis);
        if (data.parsedData) setParsedData(data.parsedData);
        if (data.extractedText) setExtractedText(data.extractedText);
      },
      onError: (err) => {
        toast.error(err?.message || "Erreur lors de l'upload", { id: "cv-upload" });
      },
    });
  }, [uploadMutation]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleFileInput = (e) => {
    handleFile(e.target.files[0]);
  };

  const removeCv = () => {
    if (cv?.id) {
      deleteMutation.mutate(cv.id, {
        onSuccess: () => {
          setCv(null);
          setAnalysis(null);
          setParsedData(null);
          setExtractedText("");
          setShowText(false);
          setShowParsed(false);
          setShowAnalysis(false);
          setMatchedJobs([]);
          toast.success("CV supprimé.");
        },
      });
    } else {
      setCv(null);
      setAnalysis(null);
      setParsedData(null);
      setExtractedText("");
    }
  };

  const handleMatchJobs = () => {
    const keywords = searchKeywords.split(",").map(k => k.trim()).filter(Boolean);
    matchMutation.mutate({ keywords }, {
      onSuccess: (data) => {
        setMatchedJobs(data?.jobs || []);
        toast.success(`${data?.jobs?.length || 0} offres correspondantes trouvées`);
      },
      onError: () => toast.error("Erreur lors du matching"),
    });
  };

  const handleAnalyze = () => {
    if (!cv?.id) return;
    toast.loading("Analyse en cours...", { id: "cv-analyze" });
    analyzeMutation.mutate(cv.id, {
      onSuccess: (data) => {
        toast.success("CV analysé avec succès !", { id: "cv-analyze" });
        if (data.analysis) setAnalysis(data.analysis);
        if (data.parsedData) setParsedData(data.parsedData);
        if (data.extractedText) setExtractedText(data.extractedText);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error || "Erreur lors de l'analyse", { id: "cv-analyze" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Mon CV</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Uploadez, analysez et matchez votre CV avec les offres d'emploi
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Upload Zone */}
          {!cv && !cvLoading && (
            <motion.div
              variants={sectionVariants} initial="hidden" animate="visible"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                  : "border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500"
              }`}
              onClick={() => document.getElementById("cv-upload").click()}
            >
              <input id="cv-upload" type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? "bg-primary-500/20" : "bg-surface-200 dark:bg-surface-700"
                }`}>
                  <Upload className={`w-8 h-8 ${isDragging ? "text-primary-500" : "text-surface-400"}`} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-surface-900 dark:text-white">
                    {uploadMutation.isPending ? "Upload en cours..." : "Glissez votre CV ici"}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {uploadMutation.isPending ? "Analyse en cours..." : "ou cliquez pour sélectionner un fichier PDF"}
                  </p>
                  {uploadMutation.isPending && <Loader2 className="mx-auto mt-3 h-6 w-6 animate-spin text-primary-500" />}
                </div>
              </div>
            </motion.div>
          )}

          {cvLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <span className="ml-3 text-surface-500">Chargement du CV...</span>
            </div>
          )}

          {/* CV Preview */}
          {cv && (
            <motion.div variants={sectionVariants} initial="hidden" animate="visible"
              className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">{cv.name}</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {formatFileSize(cv.size)} · {formatDate(cv.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                    className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    title="Analyser le CV"
                  >
                    {analyzeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = cv.base64;
                      a.download = cv.name;
                      a.click();
                    }}
                    className="p-2.5 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={removeCv}
                    disabled={deleteMutation.isPending}
                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </motion.button>
                </div>
              </div>

              {analysis && (
                <div className="mt-5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary-500" />
                  <span className="text-sm text-secondary-600 dark:text-secondary-400 font-medium">
                    CV analysé et prêt — Score : {analysis.score}/100
                  </span>
                </div>
              )}

              {/* Extracted Text */}
              {extractedText && (
                <div className="mt-4">
                  <button type="button" onClick={() => setShowText(!showText)}
                    className="flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-primary-500 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Voir le texte extrait
                    {showText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {showText && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <pre className="mt-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                          {extractedText}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* Analysis Section */}
          {cv && analysis && (
            <motion.div variants={sectionVariants} initial="hidden" animate="visible"
              className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
            >
              <button type="button" onClick={() => setShowAnalysis(!showAnalysis)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Analyse du CV</h2>
                </div>
                {showAnalysis ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
              </button>

              <AnimatePresence>
                {showAnalysis && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-6 flex flex-col items-center sm:flex-row sm:items-start gap-8">
                      <ScoreCircle score={analysis.score} />
                      <div className="flex-1 space-y-4">
                        {/* Strengths */}
                        {analysis.strengths?.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 mb-2 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> Points forts
                            </h3>
                            <ul className="space-y-1.5">
                              {analysis.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-500" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Improvements */}
                        {analysis.improvements?.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" /> Points à améliorer
                            </h3>
                            <ul className="space-y-1.5">
                              {analysis.improvements.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggestions */}
                        {analysis.suggestions?.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-accent-600 dark:text-accent-400 mb-2 flex items-center gap-1.5">
                              <Lightbulb className="w-4 h-4" /> Suggestions
                            </h3>
                            <ul className="space-y-1.5">
                              {analysis.suggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Parsed Data */}
          {cv && parsedData && (
            <motion.div variants={sectionVariants} initial="hidden" animate="visible"
              className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
            >
              <button type="button" onClick={() => setShowParsed(!showParsed)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-500/10 dark:bg-secondary-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-secondary-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Données extraites</h2>
                </div>
                {showParsed ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
              </button>

              <AnimatePresence>
                {showParsed && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-5 space-y-5">
                      {/* Contact Info */}
                      {(parsedData.email || parsedData.phone || parsedData.location) && (
                        <div>
                          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Contact</h3>
                          <div className="flex flex-wrap gap-3">
                            {parsedData.email && <span className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400"><Mail className="w-3.5 h-3.5" />{parsedData.email}</span>}
                            {parsedData.phone && <span className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400"><Phone className="w-3.5 h-3.5" />{parsedData.phone}</span>}
                            {parsedData.location && <span className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400"><MapPin className="w-3.5 h-3.5" />{parsedData.location}</span>}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {parsedData.skills?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-primary-500" />
                            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Compétences ({parsedData.skills.length})</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.skills.map((skill) => (
                              <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {parsedData.experience?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Briefcase className="w-4 h-4 text-accent-500" />
                            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Expériences ({parsedData.experience.length})</h3>
                          </div>
                          <div className="space-y-2">
                            {parsedData.experience.map((exp, i) => (
                              <div key={i} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                                <p className="font-medium text-surface-900 dark:text-white text-sm">{exp.title}</p>
                                <p className="text-sm text-surface-500 dark:text-surface-400">{exp.company} · {exp.period}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {parsedData.education?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <GraduationCap className="w-4 h-4 text-secondary-500" />
                            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Formations ({parsedData.education.length})</h3>
                          </div>
                          <div className="space-y-2">
                            {parsedData.education.map((edu, i) => (
                              <div key={i} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                                <p className="font-medium text-surface-900 dark:text-white text-sm">{edu.degree}</p>
                                <p className="text-sm text-surface-500 dark:text-surface-400">{edu.institution} · {edu.year}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Languages */}
                      {parsedData.languages?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Langues ({parsedData.languages.length})</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.languages.map((lang) => (
                              <span key={lang} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Job Matching Section */}
          {cv && analysis && (
            <motion.div variants={sectionVariants} initial="hidden" animate="visible"
              className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Matching avec les offres</h2>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Trouvez les offres qui correspondent à votre profil</p>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text" value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  placeholder="Mots-clés (ex: React, Node.js, Full Stack) séparés par virgules"
                  className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-700 transition-colors placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700/50 dark:text-surface-200 dark:placeholder:text-surface-500"
                />
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleMatchJobs}
                  disabled={matchMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
                >
                  {matchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Matcher
                </motion.button>
              </div>

              {matchedJobs.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-surface-500">{matchedJobs.length} offres correspondantes</p>
                  {matchedJobs.slice(0, 10).map((job, i) => (
                    <div key={job._id || i} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:border-primary-300 transition-colors">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-surface-900 dark:text-white text-sm">{job.title}</h4>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{job.company} · {job.location}</p>
                        {job.matchReasons?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {job.matchReasons.slice(0, 3).map((r, ri) => (
                              <span key={ri} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 shrink-0">
                        <div className="relative flex h-12 w-12 items-center justify-center">
                          <svg className="absolute h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-200 dark:text-surface-700" />
                            <circle cx="24" cy="24" r="20" fill="none"
                              stroke={job.matchScore >= 80 ? "#10B981" : job.matchScore >= 50 ? "#F59E0B" : "#EF4444"}
                              strokeWidth="3" strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - job.matchScore / 100)}`}
                              strokeLinecap="round" />
                          </svg>
                          <span className="text-xs font-bold text-surface-700 dark:text-surface-300">{job.matchScore}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Tips */}
          <motion.div variants={sectionVariants} initial="hidden" animate="visible"
            className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-accent-500" />
              </div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Conseils pour un bon CV</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center gap-2 mb-2">
                    <tip.icon className="w-4 h-4 text-accent-500" />
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{tip.title}</h3>
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400">{tip.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
