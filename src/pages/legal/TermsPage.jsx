import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Scale, FileText, Mail } from 'lucide-react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const sections = [
  {
    id: 'acceptation',
    title: '1. Acceptation des conditions',
    content: (
      <p>
        En accédant au site EasyJob et en utilisant ses services, vous acceptez sans
        réserve les présentes conditions d'utilisation. Si vous n'êtes pas d'accord
        avec l'un de ces termes, veuillez ne pas utiliser la plateforme. L'accès au
        service peut être subordonné à la création d'un compte et à la validation de
        votre adresse email.
      </p>
    ),
  },
  {
    id: 'services',
    title: '2. Description du service',
    content: (
      <p>
        EasyJob est une plateforme d'aide à la recherche d'emploi qui collecte,
        centralise et agrège des offres d'emploi publiques provenant de diverses
        sources. Le service inclut notamment la recherche d'offres, l'analyse
        automatique de CV, les suggestions de correspondance (matching) et le suivi
        des candidatures. Les offres référencées proviennent de tiers : leur contenu,
        leur disponibilité et leur exactitude ne sont pas garantis par EasyJob.
      </p>
    ),
  },
  {
    id: 'compte',
    title: '3. Comptes utilisateurs',
    content: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Vous devez fournir des informations exactes et à jour lors de la création
            de votre compte.
          </li>
          <li>
            Vous êtes seul responsable de la confidentialité de vos identifiants et de
            toute activité réalisée depuis votre compte.
          </li>
          <li>
            Tout comportement frauduleux, abusif ou contraire aux lois applicables peut
            entraîner la suspension ou la suppression immédiate de votre compte.
          </li>
        </ul>
        <p className="mt-3">
          EasyJob se réserve le droit de désactiver temporairement ou définitivement un
          compte en cas de violation des présentes conditions ou pour tout motif
          légitime, et de le notifier à l'utilisateur concerné.
        </p>
      </>
    ),
  },
  {
    id: 'obligations',
    title: "4. Obligations de l'utilisateur",
    content: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Utiliser la plateforme dans le respect des lois en vigueur et des droits des
            tiers.
          </li>
          <li>
            Ne pas tenter d'intercepter, de modifier ou d'endommager les données ou les
            systèmes d'EasyJob ou de ses partenaires.
          </li>
          <li>
            Ne pas utiliser le service pour envoyer des contenus illicites, trompeurs,
            diffamatoires ou portant atteinte à la vie privée.
          </li>
          <li>
            Respecter les conditions d'utilisation des plateformes sources lors de
            l'utilisation de la fonctionnalité de candidature automatisée.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'respect',
    title: "5. Respect des sources d'offres",
    content: (
      <p>
        EasyJob ne collecte que des offres d'emploi publiquement accessibles, dans le
        respect des conditions d'utilisation de chaque plateforme et des règles en
        vigueur (notamment le droit d'auteur et la protection des bases de données).
        En cas de demande légitime d'une source, EasyJob retirera sans délai les
        contenus concernés.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: '6. Données personnelles',
    content: (
      <p>
        Le traitement de vos données personnelles (profil, CV, candidatures,
        préférences) est réalisé conformément à notre politique de confidentialité et
        aux réglementations applicables. Vos données ne sont jamais revendues à des
        tiers. Vous disposez d'un droit d'accès, de rectification, d'opposition et
        d'effacement concernant vos données.
      </p>
    ),
  },
  {
    id: 'propriete',
    title: '7. Propriété intellectuelle',
    content: (
      <p>
        La plateforme EasyJob, ses textes, logos, interfaces, fonctionnalités et son
        code source sont la propriété exclusive d'EasyJob ou de ses concédants.
        Toute reproduction ou réutilisation sans autorisation écrite préalable est
        interdite. Les marques et logos des sources d'offres demeurent la propriété
        de leurs détenteurs respectifs.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: '8. Limitation de responsabilité',
    content: (
      <p>
        EasyJob met tout en œuvre pour assurer la disponibilité et la fiabilité du
        service, mais ne saurait être tenu responsable des interruptions, retards,
        erreurs ou pertes de données résultant de l'utilisation de la plateforme, des
        contenus de tiers, ou de toute décision (candidature, refus, embauche) prise
        par l'utilisateur sur la base des informations fournies.
      </p>
    ),
  },
  {
    id: 'resiliation',
    title: '9. Résiliation et durée',
    content: (
      <p>
        Chaque utilisateur peut fermer son compte à tout moment depuis son espace.
        EasyJob peut suspendre ou résilier l'accès au service en cas de manquement
        aux présentes conditions, sans préjudice des dommages et intérêts éventuels.
      </p>
    ),
  },
  {
    id: 'modifications',
    title: '10. Modification des conditions',
    content: (
      <p>
        EasyJob se réserve le droit de modifier les présentes conditions d'utilisation
        à tout moment. Les modifications prennent effet dès leur publication sur le
        site. L'utilisation continue du service après une modification vaut acceptation
        des nouvelles conditions.
      </p>
    ),
  },
  {
    id: 'droit',
    title: '11. Droit applicable et contact',
    content: (
      <p>
        Les présentes conditions sont régies par le droit en vigueur. Tout litige sera
        soumis aux juridictions compétentes. Pour toute question relative à ces
        conditions, vous pouvez nous contacter à l'adresse{' '}
        <a href="mailto:contact@easyjob.app" className="font-medium text-primary hover:underline">
          contact@easyjob.app
        </a>
        .
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Accueil" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Button asChild variant="ghost" className="h-9 px-4">
            <Link to="/login">Se connecter</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-8 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Retour à l'accueil
          </Link>
        </Button>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <FileText className="size-3.5 text-primary" />
          Document légal · Mis à jour le 23 septembre 2026
        </div>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          Conditions d'utilisation
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Les présentes conditions régissent l'utilisation de la plateforme EasyJob,
          son site internet et l'ensemble de ses services. Elles s'appliquent à tous
          les utilisateurs : candidats, recruteurs et administrateurs.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <ShieldCheck className="size-4 text-accent" />
            Protection des données garantie
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <Scale className="size-4 text-primary" />
            Respect des plateformes sources
          </div>
        </div>

        <Separator className="my-10" />

        <div className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <div className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <Separator className="my-12" />

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="size-5 text-primary" />
            Une question ? Contactez-nous
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Notre équipe est disponible pour répondre à vos questions relatives aux
            présentes conditions d'utilisation.
          </p>
          <Button asChild className="mt-4">
            <a href="mailto:contact@easyjob.app">Nous écrire</a>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} EasyJob. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground">Conditions</Link>
            <span className="text-border">·</span>
            <Link to="/" className="hover:text-foreground">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}