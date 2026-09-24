import { Link } from "react-router-dom"
import {
  ArrowRight,
  CalendarClock,
  Landmark,
  Megaphone,
  Newspaper,
  ScrollText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Reveal from "./Reveal"

const features = [
  {
    icon: Landmark,
    title: "Concours prochains",
    desc: "Les concours à venir sont mis en avant pour préparer vos candidatures à l'avance.",
  },
  {
    icon: ScrollText,
    title: "Emplois publics",
    desc: "Offres des administrations et collectivités issues d'emploi-public.ma.",
  },
  {
    icon: Megaphone,
    title: "Infos de l'État",
    desc: "Communications officielles des institutions publiques.",
  },
  {
    icon: Newspaper,
    title: "Actualités",
    desc: "Un fil continu d'actualités pour rester informé du secteur public.",
  },
]

const sampleRows = [
  {
    tag: "Concours",
    tagColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    title: "Recrutement de 120 cadres — Ministère de l'Économie",
    sub: "Concours prochain · 12 oct. 2026",
  },
  {
    tag: "Info",
    tagColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    title: "Circulaire relative aux congés administratifs",
    sub: "Info de l'État · il y a 2 jours",
  },
  {
    tag: "Actualité",
    tagColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    title: "Réforme de la fonction publique : ce qui change",
    sub: "Actualité · il y a 5 jours",
  },
]

export default function PublicSectorSection() {
  return (
    <section
      id="secteur-public"
      className="scroll-mt-20 border-y border-border bg-muted/40 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Secteur public
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Concours, emplois de l'État et actualités officielles
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                En plus des plateformes privées, EasyJob récupère les concours
                publics, les emplois de l'État et les communications
                officielles — regroupés dans l'onglet dédié « Emplois publics &
                Concours », avec les concours prochains mis en avant.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {features.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{f.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.26}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 gap-2">
                  <Link to="/register">
                    Explorer les offres publiques
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11">
                  <a href="#faq">Voir la FAQ</a>
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.14}>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-background/60 px-5 py-3.5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Landmark className="size-4 text-primary" />
                  Emplois publics & Concours
                </div>
                <Badge
                  variant="secondary"
                  className="bg-accent/10 text-accent"
                >
                  À consulter
                </Badge>
              </div>
              <ul className="divide-y divide-border">
                {sampleRows.map((row) => (
                  <li key={row.title} className="flex items-start gap-3 px-5 py-4">
                    <div
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${row.tagColor}`}
                    >
                      {row.tag}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-2 border-t border-border bg-background/60 px-5 py-3.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-primary" />
                  Concours prochains suivis chaque semaine
                </span>
                <span className="font-semibold text-foreground">61 offres</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}