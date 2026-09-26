import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users, Search, UserPlus, MoreHorizontal, Trash2, ShieldCheck,
  UserCog, RefreshCw, Loader2, Clock, Mail, KeyRound,
} from 'lucide-react'
import { format, formatDistanceToNow, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import {
  useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser,
} from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import ConfirmDialog from '@/components/ui/confirm-dialog'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const roleMeta = {
  candidat: { label: 'Candidat', className: 'bg-primary/10 text-primary' },
  recruiter: { label: 'Recruteur', className: 'bg-accent/10 text-accent' },
  admin: { label: 'Admin', className: 'bg-chart-4/10 text-[hsl(var(--chart-4))]' },
}

function formatDateTime(value) {
  if (!value) return 'Jamais'
  const d = new Date(value)
  if (!isValid(d)) return 'Jamais'
  return format(d, 'dd MMM yyyy à HH:mm', { locale: fr })
}

function formatRelative(value) {
  if (!value) return 'Jamais'
  const d = new Date(value)
  if (!isValid(d)) return 'Jamais'
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'candidat',
  companyName: '',
  industry: '',
  companySize: '11-50',
  companyLocation: '',
  position: '',
}

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [role, setRole] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [page, setPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const createUser = useCreateAdminUser()
  const updateUser = useUpdateAdminUser()
  const deleteUser = useDeleteAdminUser()

  const pageSize = 20

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [role, debouncedSearch, isActive])

  const filters = useMemo(() => ({
    role,
    search: debouncedSearch || undefined,
    isActive: isActive === 'all' ? undefined : isActive,
    page,
    limit: pageSize,
  }), [role, debouncedSearch, isActive, page])

  const { data, isLoading, isFetching, refetch } = useAdminUsers(filters)
  const users = data?.users ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1
  const currentUserEmail = null

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(search)
      setPage(1)
    }
  }

  const openCreate = () => {
    setForm(emptyForm)
    setGeneratedPassword(null)
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('Prénom, nom et email sont obligatoires')
      return
    }
    if (form.role === 'recruiter' && !form.companyName.trim()) {
      toast.error('Le nom de l\'entreprise est obligatoire pour un recruteur')
      return
    }
    setSubmitting(true)
    try {
      const result = await createUser.mutateAsync(form)
      setSubmitting(false)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      if (result?.generatedPassword) {
        setGeneratedPassword(result.generatedPassword)
      } else {
        toast.success('Compte créé avec succès')
        setCreateOpen(false)
        setForm(emptyForm)
      }
    } catch (error) {
      setSubmitting(false)
      toast.error(error.message || 'Erreur lors de la création')
    }
  }

  const handleCloseCreate = () => {
    if (generatedPassword || submitting) return
    setCreateOpen(false)
  }

  const handleCreateAnother = () => {
    setForm(emptyForm)
    setGeneratedPassword(null)
  }

  const handleToggleActive = async (user) => {
    const result = await updateUser.mutateAsync({ id: user._id, isActive: !user.isActive })
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(user.isActive ? 'Compte désactivé' : 'Compte activé')
    }
  }

  const handleChangeRole = async (user, newRole) => {
    if (user.role === newRole) return
    const result = await updateUser.mutateAsync({ id: user._id, role: newRole })
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`Rôle changé : ${newRole}`)
    }
  }

  const handleResetPassword = async (user) => {
    const result = await updateUser.mutateAsync({ id: user._id, resetPassword: true })
    if (result?.error) {
      toast.error(result.error)
    } else if (result?.generatedPassword) {
      toast.success(`Nouveau mot de passe : ${result.generatedPassword}`)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteUser.mutateAsync(deleteTarget._id)
    setDeleting(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Utilisateur supprimé')
      setDeleteTarget(null)
      if (users.length === 1 && page > 1) setPage(page - 1)
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6 overflow-x-clip">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 text-[hsl(var(--chart-4))]">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Utilisateurs</h1>
            <p className="mt-1 text-muted-foreground">
              {total} compte(s) — gérez les candidats, recruteurs et administrateurs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Actualiser
          </Button>
          <Button size="sm" onClick={openCreate}>
            <UserPlus className="mr-2 size-4" />
            Créer un compte
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="candidat">Candidats</SelectItem>
                <SelectItem value="recruiter">Recruteurs</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="true">Actifs</SelectItem>
                <SelectItem value="false">Désactivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item} className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const meta = roleMeta[u.role] ?? roleMeta.candidat
                const initials = (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')
                const isMe = currentUserEmail && u.email === currentUserEmail
                return (
                  <TableRow key={u._id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="size-full rounded-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-medium">
                            {u.firstName} {u.lastName}
                            {isMe && <Badge variant="secondary">Vous</Badge>}
                            {!u.isEmailVerified && <Badge variant="outline">Non vérifié</Badge>}
                          </p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(meta.className)}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {u.lastLogin ? formatDateTime(u.lastLogin) : 'Jamais'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelative(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.isActive}
                          onCheckedChange={() => handleToggleActive(u)}
                          disabled={u.role === 'admin'}
                        />
                        <span className={cn('text-xs', u.isActive ? 'text-accent' : 'text-muted-foreground')}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="h-8 w-8" aria-label={`Actions pour ${u.email}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setForm(emptyForm); handleResetPassword(u) }}>
                            <KeyRound className="mr-2 size-4" />
                            Réinitialiser le mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                          {Object.entries(roleMeta).map(([key, metaEntry]) => (
                            <DropdownMenuItem
                              key={key}
                              disabled={u.role === key || (u.role === 'admin' && key !== 'admin')}
                              onClick={() => handleChangeRole(u, key)}
                            >
                              <UserCog className="mr-2 size-4" />
                              {metaEntry.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        {pages > 1 && (
          <div className="border-t border-border py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text="Précédent"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem className="px-3 text-sm text-muted-foreground">
                  Page {page} / {pages}
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    text="Suivant"
                    onClick={() => setPage((p) => Math.min(p + 1, pages))}
                    className={page >= pages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </motion.div>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (open) openCreate(); else handleCloseCreate() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              Créer un compte
            </DialogTitle>
            <DialogDescription>
              Créez un compte candidat, recruteur ou administrateur.
            </DialogDescription>
          </DialogHeader>

          {generatedPassword && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Mot de passe généré</p>
                <p className="mt-1 font-mono text-destructive">Le mot de passe par défaut est : <strong>{generatedPassword}</strong></p>
                <p className="mt-1 text-xs text-muted-foreground">Veuillez le communiquer à l'utilisateur. Notez-le avant de fermer.</p>
              </div>
            </div>
          )}

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input placeholder="Jean" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input placeholder="Dupont" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="jean.dupont@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input placeholder="+212 6 00 00 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe (optionnel)</Label>
                <Input placeholder="Laisser vide = généré" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidat">Candidat</SelectItem>
                  <SelectItem value="recruiter">Recruteur (entreprise)</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === 'recruiter' && (
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="flex items-center gap-1">
                    Nom de l'entreprise <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder="Ex : TechMaroc Solutions" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Secteur d'activité</Label>
                  <Input placeholder="Technologie / IT" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Taille de l'entreprise</Label>
                  <Select value={form.companySize} onValueChange={(v) => setForm({ ...form, companySize: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="501-1000">501-1000</SelectItem>
                      <SelectItem value="1000+">1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Localisation</Label>
                  <Input placeholder="Casablanca" value={form.companyLocation} onChange={(e) => setForm({ ...form, companyLocation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Poste du recruteur</Label>
                  <Input placeholder="Responsable RH" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {generatedPassword ? (
              <>
                <Button variant="outline" onClick={handleCloseCreate}>
                  Fermer
                </Button>
                <Button onClick={handleCreateAnother}>
                  <UserPlus className="mr-2 size-4" />
                  Créer un autre compte
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseCreate} disabled={submitting}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
                  Créer le compte
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Supprimer cet utilisateur ?"
        description={
          deleteTarget
            ? `Le compte de ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.email}) ainsi que ses offres et son profil seront définitivement supprimés.`
            : ''
        }
        confirmText="Supprimer"
        icon={Trash2}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </motion.div>
  )
}