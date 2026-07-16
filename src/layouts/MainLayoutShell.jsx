import { Outlet } from 'react-router-dom'
import SidebarMain from '@/components/SidebarMain'
import MobileHeader from '@/components/MobileHeader'
import { SidebarProvider } from '@/context/SidebarContext'

export default function MainLayoutShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
        <SidebarMain />
        <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
          <MobileHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
