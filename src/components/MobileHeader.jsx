import { Menu, Bell, Search } from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function MobileHeader() {
  const { toggleMobile } = useSidebar()
  const { user } = useAuth()

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 px-4 py-3 flex items-center justify-between">
      <button onClick={toggleMobile} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition">
        <Menu className="w-5 h-5 text-surface-600 dark:text-surface-400" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        <span className="font-bold text-surface-800 dark:text-white">EasyJob</span>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/notifications" className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition relative">
          <Bell className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </Link>
      </div>
    </header>
  )
}
