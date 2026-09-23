import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Briefcase,
  Send,
  Users,
  User,
  UserCheck,
  ClipboardList,
  Building2,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const candidateItems = [
  { icon: LayoutDashboard, label: 'Accueil', path: '/dashboard', end: true },
  { icon: Briefcase, label: 'Offres', path: '/jobs' },
  { icon: Send, label: 'Candidatures', path: '/applications' },
  { icon: Users, label: 'Recruteurs', path: '/recruiters' },
  { icon: User, label: 'Profil', path: '/profile' },
]

const recruiterItems = [
  { icon: LayoutDashboard, label: 'Accueil', path: '/recruiter-space/dashboard', end: true },
  { icon: Briefcase, label: 'Offres', path: '/recruiter-space/jobs' },
  { icon: UserCheck, label: 'Candidats', path: '/recruiter-space/candidates' },
  { icon: ClipboardList, label: 'Candidatures', path: '/recruiter-space/applications' },
  { icon: Building2, label: 'Profil', path: '/recruiter-space/profile' },
]

const adminItems = [
  { icon: LayoutDashboard, label: 'Accueil', path: '/admin', end: true },
  { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
  { icon: Building2, label: 'Recruteurs', path: '/admin/recruiters' },
  { icon: Briefcase, label: 'Offres', path: '/admin/jobs' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
]

export default function MobileBottomNav() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isRecruiter = !isAdmin && user?.role === 'recruiter'
  const items = isAdmin ? adminItems : isRecruiter ? recruiterItems : candidateItems

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-1.5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-primary/10'
                  )}
                >
                  <item.icon className="size-[18px]" />
                </span>
                <span className="truncate leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}