import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, UserCheck, Briefcase, Building2, ShieldCheck, FileText,
  Activity, UserPlus, Clock, TrendingUp, ArrowRight, Zap, LayoutDashboard,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatDistanceToNow, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import { useAuth } from '@/context/AuthContext'
import { useAdminOverview, useAdminTimeline, useAdminMonthly } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

const roleMeta = {
  candidat: { label: 'Candidat', className: 'bg-primary/10 text-primary' },
  recruiter: { label: 'Recruteur', className: 'bg-accent/10 text-accent' },
  admin: { label: 'Admin', className: 'bg-chart-4/10 text-[hsl(var(--chart-4))]' },
}

const SECTOR_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#f43f5e',
  '#0ea5e9',
]

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    fontSize: '12px',
    boxShadow: '0 12px 24px rgb(0 0 0 / 0.08)',
  },
}

function formatRelative(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Skeleton className="mb-4 size-10 rounded-lg" />
      <Skeleton className="mb-2 h-8 w-20" />
      <Skeleton className="h-4 w-28" />
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [days, setDays] = useState('30')

  const { data, isLoading } = useAdminOverview()
  const { data: timelineData, isLoading: isLoadingTimeline } = useAdminTimeline(Number(days))
  const { data: monthlyData, isLoading: isLoadingMonthly } = useAdminMonthly(12)

  const overview = data?.overview ?? {}
  const registrations = data?.registrations ?? {}
  const recentUsers = data?.recentUsers ?? []
  const recentJobs = data?.recentJobs ?? []
  const jobsBySector = data?.jobsBySector ?? []

  const series = timelineData?.series ?? []
  const monthly = monthlyData?.series ?? []

  const kpiCards = [
    {
      label: 'Utilisateurs totaux',
      value: overview.totalUsers,
      icon: Users,
      color: 'bg-primary/10 text-primary',
      sub: `${(overview.verifiedAccounts ?? 0)} vérifiés`,
    },
    {
      label: 'Candidats inscrits',
      value: overview.totalCandidates,
      icon: UserCheck,
      color: 'bg-chart-4/10 text-[hsl(var(--chart-4))]',
      sub: `${registrations.candidats?.month ?? 0} ce mois`,
    },
    {
      label: 'Recruteurs',
      value: overview.totalRecruiters,
      icon: Briefcase,
      color: 'bg-accent/10 text-accent',
      sub: `${registrations.recruteurs?.month ?? 0} ce mois`,
    },
    {
      label: 'Comptes actifs',
      value: overview.activeAccounts,
      icon: Activity,
      color: 'bg-chart-3/10 text-[hsl(var(--chart-3))]',
      sub: `${Math.round(((overview.activeAccounts ?? 0) / Math.max((overview.totalUsers ?? 0), 1)) * 100)}% du total`,
    },
    {
      label: 'Entreprises partenaires',
      value: overview.partnerCompanies,
      icon: Building2,
      color: 'bg-surface-400/10 text-surface-500 dark:text-surface-300',
      sub: `${overview.totalCompanies ?? 0} profils recruteurs`,
    },
    {
      label: 'Offres d\'emploi créées',
      value: overview.totalJobs,
      icon: FileText,
      color: 'bg-chart-2/10 text-[hsl(var(--chart-2))]',
      sub: `${overview.activeJobs ?? 0} actives`,
    },
    {
      label: 'Candidatures reçues',
      value: overview.totalApplications,
      icon: Zap,
      color: 'bg-chart-5/10 text-[hsl(var(--chart-5))]',
      sub: 'Toutes offres confondues',
    },
    {
      label: 'Administrateurs',
      value: overview.totalAdmins,
      icon: ShieldCheck,
      color: 'bg-destructive/10 text-destructive',
      sub: 'Accès complet',
    },
  ]

  const regCards = [
    { label: 'Aujourd\'hui', value: registrations.today, candidats: registrations.candidats?.today, recruteurs: registrations.recruteurs?.today },
    { label: 'Cette semaine', value: registrations.week, candidats: registrations.candidats?.week, recruteurs: registrations.recruteurs?.week },
    { label: 'Ce mois', value: registrations.month, candidats: registrations.candidats?.month, recruteurs: registrations.recruteurs?.month },
    { label: 'Cette année', value: registrations.year, candidats: registrations.candidats?.year, recruteurs: registrations.recruteurs?.year },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-8 overflow-x-clip"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord administrateur</h1>
            <p className="mt-1 text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>Bienvenue {user?.firstName} {user?.lastName} 👋</span>
              <span className="hidden sm:inline text-border">•</span>
              <span>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/users?action=create">
            <UserPlus className="mr-2 size-4" />
            Créer un compte
          </Link>
        </Button>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : kpiCards.map((stat) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  variants={item}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="group relative flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={cn('flex size-10 items-center justify-center rounded-lg', stat.color)}>
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="secondary" className="font-normal">
                      {stat.sub}
                    </Badge>
                  </div>
                  <div className="mt-auto">
                    <p className="text-3xl font-bold tracking-tight">{stat.value ?? '—'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              )
            })}
      </motion.div>

      {/* Registrations per period */}
      <motion.div variants={item}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Inscriptions par période</h2>
            <p className="text-sm text-muted-foreground">Recruteurs et candidats ayant rejoint la plateforme</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : regCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 flex items-baseline gap-1 text-3xl font-bold tracking-tight">
                    {card.value ?? 0}
                    <span className="text-sm font-normal text-muted-foreground">nouveaux</span>
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="size-2 rounded-full bg-[hsl(var(--chart-4))]" />
                      {card.candidats ?? 0} candidats
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="size-2 rounded-full bg-accent" />
                      {card.recruteurs ?? 0} recruteurs
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inscriptions trend */}
        <motion.div variants={item} className="min-w-0 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Croissance des inscriptions</h2>
              <p className="text-sm text-muted-foreground">Nouveaux comptes par jour par rôle</p>
            </div>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="14">14 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="60">60 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoadingTimeline ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={series} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="candidats" name="Candidats" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#gradUsers)" />
                <Area type="monotone" dataKey="recruteurs" name="Recruteurs" stroke="hsl(var(--chart-4))" strokeWidth={2} fill="url(#gradRec)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Jobs & applications */}
        <motion.div variants={item} className="min-w-0 rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Offres & candidatures créées</h2>
            <p className="text-sm text-muted-foreground">Activité quotidienne ({days} derniers jours)</p>
          </div>
          {isLoadingTimeline ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={series} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'color-mix(in srgb, var(--muted) 40%, transparent)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="offres" name="Offres" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Bar dataKey="candidatures" name="Candidatures" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Répartition par secteur */}
        <motion.div variants={item} className="min-w-0 rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Offres par secteur</h2>
            <p className="text-sm text-muted-foreground">Répartition des offres postées par les recruteurs</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : jobsBySector.length > 0 ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={jobsBySector}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {jobsBySector.map((_, i) => (
                      <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 self-center">
                {jobsBySector.slice(0, 7).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="size-2.5 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                      {s.name}
                    </span>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>
          )}
        </motion.div>

        {/* Monthly growth */}
        <motion.div variants={item} className="min-w-0 rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Inscriptions mensuelles</h2>
            <p className="text-sm text-muted-foreground">Croissance sur les 12 derniers mois</p>
          </div>
          {isLoadingMonthly ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="candidats" name="Candidats" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#gradUsers)" />
                <Area type="monotone" dataKey="recruteurs" name="Recruteurs" stroke="hsl(var(--chart-4))" strokeWidth={2} fill="url(#gradRec)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Registrations summary strip */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Synthèse de la croissance
            </CardTitle>
            <CardDescription>Vue d'ensemble de l'activité par période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Total inscrits</TableHead>
                    <TableHead className="text-right">Candidats</TableHead>
                    <TableHead className="text-right">Recruteurs</TableHead>
                    <TableHead className="text-right">Taux recruteurs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regCards.map((card) => {
                    const total = card.value ?? 0
                    const recruiterRate = total > 0 ? Math.round(((card.recruteurs ?? 0) / total) * 100) : 0
                    return (
                      <TableRow key={card.label}>
                        <TableCell className="font-medium">{card.label}</TableCell>
                        <TableCell className="text-right font-semibold">{total}</TableCell>
                        <TableCell className="text-right">{card.candidats ?? 0}</TableCell>
                        <TableCell className="text-right">{card.recruteurs ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={recruiterRate >= 40 ? 'destructive' : 'secondary'}>{recruiterRate}%</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tables usuers / jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item} className="min-w-0 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dernières connexions</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/users">Tout voir<ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : recentUsers.length > 0 ? (
            <div className="space-y-2">
              {recentUsers.map((u) => {
                const meta = roleMeta[u.role] ?? roleMeta.candidat
                const initials = (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')
                return (
                  <div key={u._id} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/60">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {u.firstName} {u.lastName}
                        {!u.isActive && <span className="ml-2 text-xs text-destructive">(inactif)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className={cn(roleMeta[u.role]?.className)}>{meta.label}</Badge>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {u.lastLogin ? formatRelative(u.lastLogin) : 'Jamais'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
          )}
        </motion.div>

        <motion.div variants={item} className="min-w-0 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dernières offres publiées</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/jobs">Tout voir<ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div key={job._id} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/60">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {job.company?.charAt(0) ?? 'E'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{job.company} — {job.location}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={job.isActive ? 'secondary' : 'outline'}>
                      {job.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatRelative(job.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune offre récente.</p>
          )}
        </motion.div>
      </div>

      {/* badges fast links */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <Link to="/admin/recruiters" className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Briefcase className="size-5" />
          </div>
          <p className="font-semibold">Recruteurs & entreprises</p>
          <p className="mt-1 text-sm text-muted-foreground">Voir les offres créées par chaque recruteur et entreprise.</p>
        </Link>
        <Link to="/admin/companies" className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-chart-4/10 text-[hsl(var(--chart-4))]">
            <Building2 className="size-5" />
          </div>
          <p className="font-semibold">Entreprises partenaires</p>
          <p className="mt-1 text-sm text-muted-foreground">Annuaire des entreprises et profils partenaires.</p>
        </Link>
        <Link to="/admin/jobs" className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-chart-2/10 text-[hsl(var(--chart-2))]">
            <FileText className="size-5" />
          </div>
          <p className="font-semibold">Offres d'emploi</p>
          <p className="mt-1 text-sm text-muted-foreground">Toutes les offres créées sur la plateforme.</p>
        </Link>
      </motion.div>
    </motion.div>
  )
}