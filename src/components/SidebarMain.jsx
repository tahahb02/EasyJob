import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { useTheme } from '@/context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, Send, FileText, Users, Network,
  Bookmark, Search, Settings, BarChart3, Bell, MessageSquare,
  LogOut, ChevronLeft, ChevronRight, Sun, Moon, X, User,
  Building2, ClipboardList, UserCheck
} from 'lucide-react'

const candidateNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Briefcase, label: "Offres d'emploi", path: '/jobs' },
  { icon: Send, label: 'Candidatures', path: '/applications' },
  { icon: FileText, label: 'Templates Emails', path: '/applications/templates' },
  { icon: Users, label: 'Explorateur Recruteurs', path: '/recruiters' },
  { icon: Network, label: 'Réseau', path: '/network' },
  { icon: Bookmark, label: 'Offres Sauvegardées', path: '/jobs/saved' },
  { icon: Search, label: 'Profils de Recherche', path: '/profile/search-preferences' },
  { icon: Settings, label: 'Profil & CV', path: '/profile' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
]

const recruiterNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/recruiter-space/dashboard' },
  { icon: Briefcase, label: 'Mes Offres', path: '/recruiter-space/jobs' },
  { icon: UserCheck, label: 'Candidats', path: '/recruiter-space/candidates' },
  { icon: ClipboardList, label: 'Candidatures', path: '/recruiter-space/applications' },
  { icon: Building2, label: 'Profil Entreprise', path: '/recruiter-space/profile' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
]

export default function SidebarMain() {
  const { user, logout } = useAuth()
  const { collapsed, toggleCollapse, mobileOpen, closeMobile } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const isRecruiter = user?.role === 'recruiter'
  const navItems = isRecruiter ? recruiterNavItems : candidateNavItems

  const handleLogout = () => { logout(); navigate('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b border-surface-200 dark:border-surface-700 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isRecruiter ? 'bg-secondary-500' : 'bg-primary-500'}`}>
          {isRecruiter ? <Building2 className="w-5 h-5 text-white" /> : <Briefcase className="w-5 h-5 text-white" />}
        </div>
        {!collapsed && (
          <div>
            <span className="text-xl font-bold text-surface-800 dark:text-white">EasyJob</span>
            {isRecruiter && <span className="block text-xs text-secondary-500 font-medium -mt-1">Espace Recruteur</span>}
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? isRecruiter
                    ? 'bg-secondary-500 text-white shadow-lg shadow-secondary-500/25'
                    : 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-800 dark:hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-200 dark:border-surface-700 space-y-2">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition ${collapsed ? 'justify-center' : ''}`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {!collapsed && <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>}
        </button>

        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRecruiter ? 'bg-secondary-100 dark:bg-secondary-900' : 'bg-primary-100 dark:bg-primary-900'}`}>
              <User className={`w-4 h-4 ${isRecruiter ? 'text-secondary-500' : 'text-primary-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 dark:text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-surface-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Déconnexion</span>}
        </button>

        <button
          onClick={toggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className={`hidden lg:flex fixed top-0 left-0 h-screen bg-white dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800 flex-col transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800 z-50 lg:hidden"
            >
              <button onClick={closeMobile} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                <X className="w-5 h-5 text-surface-500" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
