import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Globe,
  Send,
  Sparkles,
  Users,
  UserPlus,
  Search,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Zap,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Reusable animated wrapper                                          */
/* ------------------------------------------------------------------ */
function FadeIn({ children, delay = 0, direction = "up", className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const dirs = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dirs[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Comment ça marche", href: "#how-it-works" },
    { label: "Sources", href: "#sources" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl shadow-lg shadow-surface-900/5 dark:shadow-surface-950/30 border-b border-surface-200/50 dark:border-surface-800/50"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/30 transition-transform group-hover:scale-105">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-white">
              Easy<span className="text-primary-500">Job</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-surface-300 dark:border-surface-700 px-5 py-2.5 text-sm font-semibold text-surface-700 transition-all hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5"
            >
              Commencer
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-surface-700 transition-colors hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-surface-200 bg-white/95 backdrop-blur-xl dark:border-surface-800 dark:bg-surface-900/95 lg:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-surface-200 dark:border-surface-800 mt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-surface-300 dark:border-surface-700 px-5 py-2.5 text-center text-sm font-semibold text-surface-700 dark:text-surface-300"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-primary-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-primary-500/30"
                >
                  Commencer
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  const stats = [
    { value: "500+", label: "Offres scrapées" },
    { value: "5", label: "Plateformes" },
    { value: "100%", label: "Automatisé" },
    { value: "Gratuit", label: "Pour commencer" },
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36 dark:bg-surface-950">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary-500/20 via-secondary-500/10 to-accent-500/20 blur-3xl dark:from-primary-500/10 dark:via-secondary-500/5 dark:to-accent-500/10" />
      <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-secondary-500/10 blur-3xl dark:bg-secondary-500/5" />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-[300px] w-[300px] rounded-full bg-accent-500/10 blur-3xl dark:bg-accent-500/5" />

      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_40%,transparent_100%)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <FadeIn>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300">
              <Zap className="h-3.5 w-3.5" />
              Plateforme n°1 au Maroc
            </div>
          </FadeIn>

          {/* Heading */}
          <FadeIn delay={0.1}>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl dark:text-white">
              Trouvez votre{" "}
              <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-500 bg-clip-text text-transparent">
                emploi idéal
              </span>{" "}
              au Maroc
            </h1>
          </FadeIn>

          {/* Subheading */}
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-600 dark:text-surface-400 sm:text-xl">
              EasyJob automatise votre recherche d'emploi en scrapant les meilleures
              plateformes marocaines. Candidatures personnalisées, suivi intelligent,
              et bien plus.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-primary-500 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-primary-500/30 transition-all hover:bg-primary-600 hover:shadow-primary-500/40 hover:-translate-y-0.5"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-surface-300 px-8 py-4 text-base font-semibold text-surface-700 transition-all hover:border-surface-400 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:border-surface-600 dark:hover:bg-surface-900"
              >
                Voir la démo
              </a>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={0.4}>
            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="group">
                  <div className="rounded-2xl border border-surface-200 bg-white/60 px-4 py-5 backdrop-blur-sm transition-all group-hover:border-primary-300 group-hover:shadow-lg group-hover:shadow-primary-500/10 dark:border-surface-800 dark:bg-surface-900/60 dark:group-hover:border-primary-700">
                    <div className="text-2xl font-bold text-surface-900 dark:text-white sm:text-3xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */
function Features() {
  const features = [
    {
      icon: Globe,
      title: "Scrapping Multi-Sources",
      description:
        "LinkedIn, Indeed, Welcome to the Jungle, Rekrute, Manpower — toutes les sources en un clic.",
      gradient: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-500/20",
      iconBg: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-500",
    },
    {
      icon: Send,
      title: "Candidatures Automatisées",
      description:
        "Emails personnalisés avec CV et portfolio en pièce jointe.",
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-500/20",
      iconBg: "bg-emerald-50 dark:bg-emerald-950",
      iconColor: "text-emerald-500",
    },
    {
      icon: Sparkles,
      title: "Score de Pertinence AI",
      description:
        "Chaque offre est analysée et notée selon votre profil.",
      gradient: "from-amber-500 to-orange-400",
      shadow: "shadow-amber-500/20",
      iconBg: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-amber-500",
    },
    {
      icon: Users,
      title: "Explorateur de Recruteurs",
      description:
        "Identifiez et contactez les responsables RH ciblés.",
      gradient: "from-violet-500 to-purple-400",
      shadow: "shadow-violet-500/20",
      iconBg: "bg-violet-50 dark:bg-violet-950",
      iconColor: "text-violet-500",
    },
  ];

  return (
    <section
      id="features"
      className="relative bg-surface-50 py-20 sm:py-28 dark:bg-surface-900"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-500">
              Fonctionnalités
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl lg:text-5xl dark:text-white">
              Tout ce dont vous avez besoin
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-600 dark:text-surface-400">
              Un écosystème complet pour automatiser et optimiser votre recherche
              d'emploi au Maroc.
            </p>
          </FadeIn>
        </div>

        {/* Cards grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={feature.title} delay={0.1 * i}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative h-full cursor-default overflow-hidden rounded-3xl border border-surface-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-2xl dark:border-surface-800 dark:bg-surface-800/50"
                >
                  {/* Hover gradient border */}
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.03]`}
                  />

                  <div
                    className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconBg}`}
                  >
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>

                  <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                    {feature.description}
                  </p>

                  <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary-500 opacity-0 transition-opacity group-hover:opacity-100">
                    En savoir plus
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: "Créez votre profil",
      description:
        "Inscrivez-vous en quelques secondes et renseignez votre domaine, vos compétences et vos préférences.",
      gradient: "from-primary-500 to-primary-600",
    },
    {
      icon: Search,
      title: "Lancez le scrapping",
      description:
        "Notre moteur explore 5+ plateformes marocaines et collecte les offres correspondant à votre profil.",
      gradient: "from-secondary-500 to-secondary-600",
    },
    {
      icon: Send,
      title: "Postulez en un clic",
      description:
        "Recevez un score de pertinence pour chaque offre et postulez automatiquement avec un email personnalisé.",
      gradient: "from-accent-500 to-amber-600",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative bg-white py-20 sm:py-28 dark:bg-surface-950"
    >
      {/* Subtle gradient */}
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary-500/5 blur-3xl dark:bg-primary-500/[0.02]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-500">
              Comment ça marche
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl lg:text-5xl dark:text-white">
              Simple, rapide, efficace
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-600 dark:text-surface-400">
              Trois étapes pour transformer votre recherche d'emploi.
            </p>
          </FadeIn>
        </div>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Desktop connector line */}
          <div className="absolute top-24 left-[20%] right-[20%] hidden border-t-2 border-dashed border-surface-300 dark:border-surface-700 lg:block" />

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={step.title} delay={0.15 * i}>
                  <div className="relative text-center">
                    {/* Step number + icon */}
                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                      {/* Pulse ring */}
                      <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} opacity-20 blur-xl`}
                      />
                      <div
                        className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} text-white shadow-xl`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      {/* Step badge */}
                      <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-900 text-xs font-bold text-white dark:bg-white dark:text-surface-900">
                        {i + 1}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                      {step.description}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Sources                                                            */
/* ------------------------------------------------------------------ */
function Sources() {
  const platforms = [
    {
      name: "LinkedIn",
      color: "bg-[#0A66C2] text-white",
      shadow: "shadow-[#0A66C2]/20",
    },
    {
      name: "Indeed",
      color: "bg-[#2164F3] text-white",
      shadow: "shadow-[#2164F3]/20",
    },
    {
      name: "Welcome to the Jungle",
      color: "bg-[#2D2D2D] text-white dark:bg-[#F5F0EB] dark:text-[#2D2D2D]",
      shadow: "shadow-[#2D2D2D]/20",
    },
    {
      name: "Rekrute",
      color: "bg-[#E11D48] text-white",
      shadow: "shadow-[#E11D48]/20",
    },
    {
      name: "Manpower",
      color: "bg-[#005DAA] text-white",
      shadow: "shadow-[#005DAA]/20",
    },
  ];

  return (
    <section
      id="sources"
      className="relative bg-surface-50 py-20 sm:py-28 dark:bg-surface-900"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-500">
              Sources
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl lg:text-5xl dark:text-white">
              Toutes les plateformes marocaines
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-600 dark:text-surface-400">
              Nous scrapons les meilleures sources d'offres d'emploi au Maroc pour
              vous offrir un accès complet.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
            {platforms.map((p) => (
              <motion.div
                key={p.name}
                whileHover={{ scale: 1.07, y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`rounded-2xl px-8 py-4 text-base font-bold shadow-lg ${p.color} ${p.shadow} cursor-default select-none`}
              >
                {p.name}
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */
function CTA() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28 dark:bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 px-6 py-16 sm:px-12 sm:py-20 lg:px-20">
            {/* Decorative shapes */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-secondary-500/30 blur-2xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

            {/* Grid overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />

            <div className="relative text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                Prêt à révolutionner votre recherche d'emploi ?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
                Rejoignez des milliers de candidats au Maroc qui font déjà confiance
                à EasyJob pour décrocher leur prochain poste.
              </p>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-primary-600 shadow-2xl transition-all hover:bg-surface-50 hover:shadow-white/20 hover:-translate-y-0.5"
                >
                  Démarrer maintenant
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="h-4 w-4" />
                Aucune carte bancaire requise
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        { label: "Fonctionnalités", href: "#features" },
        { label: "Comment ça marche", href: "#how-it-works" },
        { label: "Sources", href: "#sources" },
        { label: "Tarifs", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "À propos", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Carrières", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Confidentialité", href: "#" },
        { label: "Conditions", href: "#" },
        { label: "Cookies", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 sm:py-16 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/30">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-surface-900 dark:text-white">
                Easy<span className="text-primary-500">Job</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-surface-500 dark:text-surface-400">
              La plateforme intelligente qui automatise votre recherche d'emploi au
              Maroc. Scrap, candidature, suivi — tout est géré.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-surface-900 dark:text-white">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-surface-500 transition-colors hover:text-primary-500 dark:text-surface-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-200 py-6 sm:flex-row dark:border-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            &copy; {new Date().getFullYear()} EasyJob. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400">
            Fait avec
            <span className="text-red-500">&hearts;</span>
            au Maroc
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page (default export)                                      */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Sources />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
