import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Send,
  TrendingUp,
  Mail,
  Play,
  Eye,
  User,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { useAuth } from '@/context/AuthContext'
import { useDashboardStats, useDashboardActivity, useProfile } from '@/api/hooks'
import NotificationDropdown from '@/components/NotificationDropdown'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const statusColors = ['#F59E0B', '#10B981', '#EF4444', '#2563EB']

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-3 shadow-lg dark:border-surface-700 dark:bg-surface-800">
        <p className="mb-1 text-sm font-medium text-surface-900 dark:text-surface-100">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, name }) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="fill-surface-600 text-xs dark:fill-surface-400"
    >
      {name}
    </text>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-8 w-20 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        <div className="h-4 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      </div>
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="mb-6 h-5 w-48 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      <div className="h-[300px] animate-pulse rounded-xl bg-surface-100 dark:bg-surface-700/50" />
    </div>
  )
}

function SkeletonActivity() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl p-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-3 w-60 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger-300 bg-danger-50 py-12 dark:border-danger-500/30 dark:bg-danger-500/5">
      <AlertTriangle className="mb-3 h-10 w-10 text-danger-400" />
      <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400">
        Erreur de chargement
      </h3>
      <p className="mt-1 text-sm text-danger-500 dark:text-danger-400/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-danger-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-600"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}

const activityTypeConfig = {
  job_found: { icon: FileText, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' },
  application_sent: { icon: Send, color: 'text-secondary-500', bg: 'bg-secondary-50 dark:bg-secondary-500/10' },
  profile_updated: { icon: CheckCircle, color: 'text-secondary-500', bg: 'bg-secondary-50 dark:bg-secondary-500/10' },
  email_received: { icon: Bell, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-500/10' },
  interview: { icon: AlertCircle, color: 'text-danger-500', bg: 'bg-danger-50 dark:bg-danger-500/10' },
  default: { icon: FileText, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: profileData } = useProfile()
  const { data, isLoading, error, refetch } = useDashboardStats()
  const { data: activityData, isLoading: isLoadingActivity } = useDashboardActivity()

  const stats = data?.stats ?? {}
  const statusBreakdown = data?.statusBreakdown ?? []
  const recentJobs = data?.recentJobs ?? []
  const recentApplications = data?.recentApplications ?? []

  const applicationsByWeek = data?.applicationsByWeek ?? []
  const statusPieData = statusBreakdown.map((s) => ({
    name: s.label,
    value: s.count,
    color: s.color || statusColors[0],
  }))

  const activities = activityData?.activities ?? []

  const statCards = [
    {
      title: 'Offres trouvées',
      icon: Briefcase,
      value: stats.totalJobs ?? '—',
      iconBg: 'bg-primary-50 dark:bg-primary-500/10',
      iconColor: 'text-primary-500',
      valueColor: 'text-primary-600 dark:text-primary-400',
    },
    {
      title: 'Candidatures envoyées',
      icon: Send,
      value: stats.totalApplications ?? '—',
      iconBg: 'bg-secondary-50 dark:bg-secondary-500/10',
      iconColor: 'text-secondary-500',
      valueColor: 'text-secondary-600 dark:text-secondary-400',
    },
    {
      title: 'Taux de réponse',
      icon: TrendingUp,
      value: stats.responseRate != null ? `${stats.responseRate}%` : '—',
      iconBg: 'bg-accent-50 dark:bg-accent-500/10',
      iconColor: 'text-accent-500',
      valueColor: 'text-accent-600 dark:text-accent-400',
    },
    {
      title: 'Emails ouverts',
      icon: Mail,
      value: stats.emailOpenRate != null ? `${stats.emailOpenRate}%` : '—',
      iconBg: 'bg-purple-50 dark:bg-purple-500/10',
      iconColor: 'text-purple-500',
      valueColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  const quickActions = [
    {
      title: 'Lancer un scrapping',
      icon: Play,
      to: '/jobs/scraping-config',
      iconBg: 'bg-primary-50 dark:bg-primary-500/10',
      iconColor: 'text-primary-500',
      borderHover: 'hover:border-primary-500/50',
    },
    {
      title: 'Voir les offres',
      icon: Eye,
      to: '/jobs',
      iconBg: 'bg-secondary-50 dark:bg-secondary-500/10',
      iconColor: 'text-secondary-500',
      borderHover: 'hover:border-secondary-500/50',
    },
    {
      title: 'Gérer mon profil',
      icon: User,
      to: '/profile',
      iconBg: 'bg-accent-50 dark:bg-accent-500/10',
      iconColor: 'text-accent-500',
      borderHover: 'hover:border-accent-500/50',
    },
  ]

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error?.message || 'Impossible de charger le tableau de bord.'} onRetry={refetch} />
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            Bonjour {profileData?.profile?.title ? `${profileData.profile.title} ` : ''}{user?.firstName} {user?.lastName} 👋
          </h1>
          <p className="mt-1 text-lg text-surface-500 dark:text-surface-400">
            Voici un résumé de votre activité
          </p>
        </div>
        <NotificationDropdown />
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  variants={item}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
                >
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl p-3 ${stat.iconBg}`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">
                      {stat.title}
                    </p>
                  </div>
                </motion.div>
              )
            })}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            {/* Area Chart */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
              <h2 className="mb-6 text-lg font-semibold text-surface-900 dark:text-surface-50">
                Candidatures par semaine
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={applicationsByWeek}>
                  <defs>
                    <linearGradient id="gradCandidatures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOffres" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="candidatures"
                    name="Candidatures"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#gradCandidatures)"
                  />
                  <Area
                    type="monotone"
                    dataKey="offres"
                    name="Offres"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#gradOffres)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
              <h2 className="mb-6 text-lg font-semibold text-surface-900 dark:text-surface-50">
                Répartition par statut
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-surface-600 dark:text-surface-400">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-6 text-lg font-semibold text-surface-900 dark:text-surface-50">
            Activité récente
          </h2>
          {isLoadingActivity ? (
            <SkeletonActivity />
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                const config = activityTypeConfig[activity.type] || activityTypeConfig.default
                const Icon = config.icon
                return (
                  <motion.div
                    key={activity.id}
                    variants={item}
                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                    className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50"
                  >
                    <div className={`shrink-0 rounded-xl p-2.5 ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {activity.title}
                      </p>
                      <p className="truncate text-sm text-surface-500 dark:text-surface-400">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(activity.date), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-surface-400 dark:text-surface-500">
              Aucune activité récente.
            </p>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-50">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.title}
                variants={item}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  to={action.to}
                  className={`flex items-center gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 ${action.borderHover}`}
                >
                  <div className={`rounded-xl p-3 ${action.iconBg}`}>
                    <Icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <span className="font-medium text-surface-900 dark:text-surface-50">
                    {action.title}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
