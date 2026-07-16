import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, LineChart, PieChart, AreaChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell, Bar, Line, Area, Pie
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

import { useDashboardStats } from '@/api/hooks';

const dateRanges = ['Cette semaine', 'Ce mois', 'Ce trimestre'];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-3">
      <p className="font-medium text-surface-900 dark:text-white text-sm">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm">
      <div className="h-5 w-48 animate-pulse rounded bg-surface-200 dark:bg-surface-700 mb-4" />
      <div className="h-[300px] animate-pulse rounded-xl bg-surface-100 dark:bg-surface-700/50" />
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm">
      <div className="h-4 w-28 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      <div className="h-7 w-16 animate-pulse rounded bg-surface-200 dark:bg-surface-700 mt-2" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState('Ce mois');
  const { data, isLoading, error, refetch } = useDashboardStats();

  const stats = data?.stats ?? {};
  const sourcePerformance = data?.sourcePerformance ?? [];
  const candidaturesEvolution = data?.candidaturesEvolution ?? [];
  const repartitionSecteur = data?.repartitionSecteur ?? [];
  const conversionRates = data?.conversionRates ?? [];
  const insights = data?.insights ?? [];

  const kpis = [
    { label: "Total offres", value: stats.totalJobs, color: "primary" },
    { label: "Total candidatures", value: stats.totalApplications, color: "secondary" },
    { label: "Taux de réponse", value: stats.responseRate, color: "accent", suffix: "%" },
    { label: "Taux d'ouverture", value: stats.emailOpenRate, color: "primary", suffix: "%" }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Analytics</h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger-300 bg-danger-50 py-12 dark:border-danger-500/30 dark:bg-danger-500/5">
          <AlertTriangle className="mb-3 h-10 w-10 text-danger-400" />
          <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-danger-500">{error?.message || 'Une erreur est survenue.'}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-xl bg-danger-500 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-600">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Analytics</h1>
        <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
          {dateRanges.map(range => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedRange === range
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm"
            >
              <p className="text-sm text-surface-500 dark:text-surface-400">{kpi.label}</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                {kpi.value != null ? (
                  <>
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString('fr-FR') : kpi.value}
                    {kpi.suffix ?? ''}
                  </>
                ) : '—'}
              </p>
            </div>
          ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Performance par source</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourcePerformance} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-surface-700" />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="offres" name="Offres" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="candidatures" name="Candidatures" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Évolution des candidatures</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={candidaturesEvolution}>
                  <defs>
                    <linearGradient id="gradCandidatures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-surface-700" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="candidatures"
                    name="Candidatures"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#gradCandidatures)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Répartition par secteur</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionSecteur}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {repartitionSecteur.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Taux de conversion</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionRates} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-surface-700" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" domain={[0, 100]} />
                  <YAxis type="category" dataKey="etape" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="taux" name="Taux %" radius={[0, 4, 4, 0]}>
                    {conversionRates.map((entry, index) => (
                      <Cell key={index} fill={index === 0 ? '#2563EB' : index < 3 ? '#F59E0B' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </motion.div>

      {/* Insights */}
      <motion.div variants={fadeIn}>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Insights</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                    <div className="h-5 w-16 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : insights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {insights.map((insight, i) => {
              const isUp = insight.trend === 'up';
              const Icon = isUp ? TrendingUp : TrendingDown;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      isUp
                        ? 'bg-secondary-500/10 text-secondary-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-surface-500 dark:text-surface-400">{insight.title}</p>
                      <p className="text-xl font-bold text-surface-900 dark:text-white">{insight.value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-2">{insight.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-surface-400 dark:text-surface-500">Aucun insight disponible.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
