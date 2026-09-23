import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Eye, Send, RefreshCw, MapPin, Briefcase, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import { useAdminJobs } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
  if (!value) return '—'
  const d = new Date(value)
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

const sourceMeta = {
  recruiter: { label: 'Recruteur', className: 'bg-accent/10 text-accent' },
  manual: { label: 'Manuelle', className: 'bg-primary/10 text-primary' },
  linkedin: { label: 'LinkedIn', className: 'bg-chart-4/10 text-[hsl(var(--chart-4))]' },
  indeed: { label: 'Indeed', className: 'bg-chart-3/10 text-[hsl(var(--chart-3))]' },
  welcometothejungle: { label: 'WTTJ', className: 'bg-chart-5/10 text-[hsl(var(--chart-5))]' },
  rekrute: { label: 'Rekrute', className: 'bg-chart-2/10 text-[hsl(var(--chart-2))]' },
  manpower: { label: 'Manpower', className: 'bg-destructive/10 text-destructive' },
  autre: { label: 'Autre', className: 'bg-muted text-muted-foreground' },
}

export default function AdminJobsPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [source, setSource] = useState('all')
  const [active, setActive] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const { data, isLoading, isFetching, refetch } = useAdminJobs({
    search: debounced || undefined,
    source,
    active: active === 'all' ? undefined : active,
    page,
    limit: pageSize,
  })

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debounced, source, active])

  const jobs = data?.jobs ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1
  const pageLabel = `Page ${page} / ${pages}`
  const totalViews = jobs.reduce((s, j) => s + (j.viewsCount || 0), 0)
  const totalApps = jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6 overflow-x-clip">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chart-2/10 text-[hsl(var(--chart-2))]">
            <Briefcase className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Offres d'emploi</h1>
            <p className="mt-1 text-muted-foreground">
              {total} offre(s) au total — chacune reliée à son recruteur / entreprise
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
            <Eye className="size-4 text-chart-4" />
            <span className="text-muted-foreground">Vues :</span>
            <span className="font-bold">{totalViews.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
            <Send className="size-4 text-chart-3" />
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un titre, une entreprise, une ville, un secteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="recruiter">Recruteurs</SelectItem>
                <SelectItem value="manual">Manuelles</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="welcometothejungle">WTTJ</SelectItem>
                <SelectItem value="rekrute">Rekrute</SelectItem>
                <SelectItem value="manpower">Manpower</SelectItem>
                <SelectItem value="autre">Autres</SelectItem>
              </SelectContent>
            </Select>
            <Select value={active} onValueChange={setActive}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="true">Actives</SelectItem>
                <SelectItem value="false">Inactives</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Offre</TableHead>
              <TableHead>Créé par</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-center">Vues</TableHead>
              <TableHead className="text-center">Candidatures</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right pr-4">Publiée le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                  Aucune offre trouvée.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((j) => {
                const meta = sourceMeta[j.source] ?? sourceMeta.autre
                return (
                  <TableRow key={j._id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {j.company?.charAt(0) ?? 'E'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{j.title}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {j.location || '—'}
                            {j.sector && <span>· {j.sector}</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {j.poster ? (
                        <span className="text-sm">{j.poster.firstName} {j.poster.lastName}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Système / Scraping</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{j.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{j.contractType || '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(meta.className)}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{j.viewsCount ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-chart-3/10 text-[hsl(var(--chart-3))]">
                        {j.applicationsCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={j.isActive ? 'secondary' : 'outline'}>
                        {j.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                      {formatRelative(j.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {total} résultat(s) · {pageLabel}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="size-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(p + 1, pages))}
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}