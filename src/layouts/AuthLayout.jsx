import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary-500" />
          </div>
          <span className="text-2xl font-bold text-white">EasyJob</span>
        </Link>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
