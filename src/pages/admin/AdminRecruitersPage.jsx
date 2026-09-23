import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Briefcase, Search, Building2, FileText, Users2, Clock, RefreshCw, ExternalLink,
} from 'lucide-react'
import { format, formatDistanceToNow, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import { useAdminRecruiters } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

function formatRelative(value) {
  if (!value) return 'Jamais'
  const d = new Date(value)
  if (!isValid(d)) return 'Jamais'
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (!isValid(d)) return '—'
  return format(d, 'dd MMM yyyy', { locale: fr })
}

export default function AdminRecruitersPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const { data, isLoading, isFetching, refetch } = useAdminRecruiters({ search: debounced || undefined })

  const recruiters = data?.recruiters ?? []
  const totalJobs = useMemo(() => recruiters.reduce((s, r) => s + (r.jobsCount || 0), 0), [recruiters])
  const totalApps = useMemo(() => recruiters.reduce((s, r) => s + (r.applicationsCount || 0), 0), [recruiters])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6 overflow-x-clip">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Briefcase className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Recruteurs</h1>
            <p className="mt-1 text-muted-foreground">
              {recruiters.length} recruteur(s) et leurs entreprises partenaires
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
            <FileText className="size-4 text-chart-2" />
            <span className="text-muted-foreground">Offres :</span>
            <span className="font-bold">{totalJobs}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
            <Users2 className="size-4 text-chart-3" />
            <span className="text-muted-foreground">Candidatures :</span>
            <span className="font-bold">{totalApps}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un recruteur, une entreprise, un email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </motion.div>

      <motion.div variants={item} className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Recruteur</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead className="text-center">Offres créées</TableHead>
              <TableHead className="text-center">Offres actives</TableHead>
              <TableHead className="text-center">Candidatures reçues</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right pr-4">Inscrit le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : recruiters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                  Aucun recruteur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              recruiters.map((r) => {
                const initials = (r.firstName?.[0] ?? '') + (r.lastName?.[0] ?? '')
                return (
                  <TableRow key={r._id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          {r.avatar ? (
                            <img src={r.avatar} alt="" className="size-full rounded-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-accent/10 text-xs font-semibold text-accent">{initials}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.firstName} {r.lastName}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.company?.companyLogo ? (
                          <img src={r.company.companyLogo} alt="" className="size-8 rounded-lg object-contain" />
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="size-4 text-primary" />
                          </div>
                        )}
                        <span className="truncate text-sm font-medium">{r.company?.companyName ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.company?.industry ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-primary/10 text-primary">{r.jobsCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{r.activeJobs}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-chart-3/10 text-[hsl(var(--chart-3))]">
                        {r.applicationsCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatRelative(r.lastLogin)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? 'secondary' : 'outline'}>
                        {r.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      {search && recruiters.length === 0 && !isLoading && (
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun recruteur ne correspond à « {search} ».
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/admin/companies"><ExternalLink className="mr-2 size-4" />Voir les entreprises partenaires</Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}