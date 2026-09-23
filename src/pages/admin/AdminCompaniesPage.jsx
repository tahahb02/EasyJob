import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Search, Globe, MapPin, Users2, RefreshCw,
  Briefcase, Phone, Mail,
} from 'lucide-react'
import { format, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import { useAdminCompanies } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (!isValid(d)) return '—'
  return format(d, 'dd MMM yyyy', { locale: fr })
}

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const { data, isLoading, isFetching, refetch } = useAdminCompanies({ search: debounced || undefined })

  const companies = data?.companies ?? []

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6 overflow-x-clip">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 text-[hsl(var(--chart-4))]">
            <Building2 className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Entreprises partenaires</h1>
            <p className="mt-1 text-muted-foreground">
              {companies.length} entreprise(s) — partenaires inscrites et annuaire
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
          Actualiser
        </Button>
      </motion.div>

      <motion.div variants={item} className="rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une entreprise, un secteur, un email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 max-w-md"
          />
        </div>
      </motion.div>

      <motion.div variants={item} className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Entreprise</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Taille</TableHead>
              <TableHead className="text-center">Offres créées</TableHead>
              <TableHead className="text-center">Candidatures</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right pr-4">Inscrit le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  Aucune entreprise trouvée.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      {c.companyLogo ? (
                        <img src={c.companyLogo} alt="" className="size-9 rounded-lg object-contain" />
                      ) : (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="size-4 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm font-medium">
                          {c.companyName}
                          {c.companyWebsite && (
                            <a
                              href={c.companyWebsite}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground transition-colors hover:text-primary"
                            >
                              <Globe className="size-3.5" />
                            </a>
                          )}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {c.companyLocation || '—'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 text-sm">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {c.contactEmail || '—'}
                    </p>
                    {c.contactName && <p className="mt-0.5 text-xs text-muted-foreground">{c.contactName}</p>}
                    {c.phone && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="size-3" />
                        {c.phone}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{c.industry || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.companySize || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-primary/10 text-primary">
                      {c.source === 'partenaire' ? (c.jobsCount ?? c.jobPostingsCount ?? 0) : (c.jobsCount ?? 0)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-chart-3/10 text-[hsl(var(--chart-3))]">
                      {c.totalApplications ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.source === 'partenaire' ? 'secondary' : 'outline'}>
                      {c.source === 'partenaire' ? (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="size-3" /> Partenaire
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Users2 className="size-3" /> Annuaire
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="text-muted-foreground">Entreprises partenaires</p>
          <p className="mt-1 text-2xl font-bold">
            {companies.filter((c) => c.source === 'partenaire').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="text-muted-foreground">Entreprises de l'annuaire</p>
          <p className="mt-1 text-2xl font-bold">
            {companies.filter((c) => c.source === 'annuaire').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="text-muted-foreground">Total offres associées</p>
          <p className="mt-1 text-2xl font-bold">
            {companies.reduce((s, c) => s + (c.jobsCount || 0), 0)}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}