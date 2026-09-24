import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './axios'

// Auth hooks are in AuthContext

// SOURCES DE SCRAPING (constantes déplacées plus bas – supprimés ce bloc dupliqué)

// Profile hooks
export const useProfile = () => useQuery({
  queryKey: ['profile'],
  queryFn: async () => { const { data } = await api.get('/profile'); return data },
})

export const useUpdateProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates) => { const { data } = await api.put('/profile', updates); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

// Jobs hooks
export const useJobs = (filters = {}, options = {}) => useQuery({
  queryKey: ['jobs', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/jobs?${params}`)
    return data
  },
  ...options,
})

export const usePublicBoard = (filters = {}, options = {}) => useQuery({
  queryKey: ['public-board', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/jobs/public-sector?${params}`)
    return data
  },
  ...options,
})

export const useJob = (id) => useQuery({
  queryKey: ['job', id],
  queryFn: async () => { const { data } = await api.get(`/jobs/${id}`); return data },
  enabled: !!id,
})

export const useSavedJobs = () => useQuery({
  queryKey: ['jobs', 'saved'],
  queryFn: async () => { const { data } = await api.get('/jobs/saved'); return data },
})

export const useToggleSaveJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (jobId) => { const { data } = await api.post(`/jobs/${jobId}/save`); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['jobs', 'saved'] })
    },
  })
}

// Applications hooks
export const useApplications = (filters = {}) => useQuery({
  queryKey: ['applications', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/applications?${params}`)
    return data
  },
})

export const useMarkApplied = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (jobOfferId) => { const { data } = await api.post('/applications/mark-applied', { jobOfferId }); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export const useApplication = (id) => useQuery({
  queryKey: ['application', id],
  queryFn: async () => { const { data } = await api.get(`/applications/${id}`); return data },
  enabled: !!id,
})

export const useCreateApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (appData) => { const { data } = await api.post('/applications', appData); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export const useSendApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, emailData }) => { const { data } = await api.post(`/applications/${id}/send`, { email: emailData }); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => { const { data } = await api.put(`/applications/${id}/status`, { status }); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export const useDeleteApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/applications/${id}`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

// Dashboard hooks
export const useDashboardStats = () => useQuery({
  queryKey: ['dashboard', 'stats'],
  queryFn: async () => { const { data } = await api.get('/dashboard/stats'); return data },
})

export const useDashboardActivity = () => useQuery({
  queryKey: ['dashboard', 'activity'],
  queryFn: async () => { const { data } = await api.get('/dashboard/activity'); return data },
})

// Notifications hooks
export const useNotifications = (filters = {}) => useQuery({
  queryKey: ['notifications', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/notifications?${params}`)
    return data
  },
})

export const useUnreadNotificationCount = () => useQuery({
  queryKey: ['notifications', 'unreadCount'],
  queryFn: async () => {
    const { data } = await api.get('/notifications')
    return data.unreadCount ?? 0
  },
  refetchInterval: 30000,
})

export const useNotification = (id) => useQuery({
  queryKey: ['notification', id],
  queryFn: async () => { const { data } = await api.get(`/notifications/${id}`); return data },
  enabled: !!id,
})

export const useMarkNotificationRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.put(`/notifications/${id}/read`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { const { data } = await api.put('/notifications/read-all'); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

// Recruiters hooks
export const useRecruiters = (filters = {}) => useQuery({
  queryKey: ['recruiters', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/recruiters?${params}`)
    return data
  },
})

export const useRecruiter = (id) => useQuery({
  queryKey: ['recruiter', id],
  queryFn: async () => { const { data } = await api.get(`/recruiters/${id}`); return data },
  enabled: !!id,
})

export const useCreateRecruiter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recruiterData) => { const { data } = await api.post('/recruiters', recruiterData); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters'] }),
  })
}

export const useDeleteRecruiter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/recruiters/${id}`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters'] }),
  })
}

export const useScrapeRecruiters = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params) => { const { data } = await api.post('/recruiters/scrape', params || {}); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters'] }),
  })
}

// CV hooks
export const useUploadCV = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/profile/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cv'] }),
  })
}

export const useCV = () => useQuery({
  queryKey: ['cv'],
  queryFn: async () => { const { data } = await api.get('/profile/cv'); return data },
})

export const useDeleteCV = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/profile/cv/${id}`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cv'] }),
  })
}

export const useMatchJobs = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params) => { const { data } = await api.post('/profile/cv/match-jobs', params || {}); return data },
  })
}

export const useAnalyzeCV = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cvId) => { const { data } = await api.put(`/profile/cv/${cvId}`, { reanalyze: true }); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cv'] }),
  })
}

// ─── SCRAPING ─────────────────────────────────────────────────────
// Scraping hooks
export const SITE_SOURCES = ['linkedin', 'indeed', 'welcometothejungle', 'rekrute', 'manpower', 'dreamjob', 'onejob', 'marocemploi']
export const CONCOURS_SOURCE = 'concours'
export const PUBLIC_SOURCES = ['concours', 'emploi-public']
export const SOURCE_LABELS = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  welcometothejungle: 'Welcome to the Jungle',
  rekrute: 'Rekrute',
  manpower: 'Manpower',
  dreamjob: 'DreamJob.ma',
  onejob: 'OneJob.ma',
  marocemploi: 'MarocEmploi.net',
  concours: 'Concours publics',
  'emploi-public': 'Emploi public',
}

export const useRunScraping = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params) => { const { data } = await api.post('/scraping/run', params || {}); return data },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['public-board'] }); qc.invalidateQueries({ queryKey: ['scraping', 'logs'] }) },
  })
}

// Suivi en direct du scraping : renvoie une progression 0→100% utilisable
// par un bouton « remplissage d'eau ». Le backend répond immédiatement avec un
// runId puis fait tourner la collecte en arrière-plan ; on sonde /scraping/status
// (toutes les 4 s) et on calcule l'avancement à partir des sources terminées.
export const useScrapingProgress = () => {
  const qc = useQueryClient()
  const [runId, setRunId] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | running | done
  const [target, setTarget] = useState(0)
  const [progress, setProgress] = useState(0)
  const currentRunRef = useRef(null)
  const doneRunRef = useRef(null)

  const mutation = useMutation({
    mutationFn: async (params) => { const { data } = await api.post('/scraping/run', params || {}); return data },
  })

  const { data: status } = useScrapingStatus(runId)

  // Traduit l'état du log en cible de progression
  useEffect(() => {
    if (!runId || !status) return
    const log = status?.log
    if (!log) return

    // N'agit que sur le run réellement démarré par cet écran
    if (runId !== currentRunRef.current) return

    if (log.status && log.status !== 'running') {
      if (phase === 'done' && doneRunRef.current === runId) return
      doneRunRef.current = runId
      setTarget(100)
      setProgress(100)
      setPhase('done')
      const t = setTimeout(() => {
        setPhase('idle')
        setTarget(0)
        setProgress(0)
        setRunId(null)
        currentRunRef.current = null
        doneRunRef.current = null
      }, 1400)
      return () => clearTimeout(t)
    }

    const srcs = Array.isArray(log.sources) ? log.sources : []
    const total = srcs.length || 1
    const done = srcs.filter(s => s && s.status && s.status !== 'running').length
    setTarget(Math.min(92, 12 + Math.round((done / total) * 80)))
  }, [status, runId, phase])

  // Remplissage fluide vers la cible (effet « verre d'eau »)
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => {
      setProgress(prev => {
        const diff = target - prev
        if (Math.abs(diff) < 1) return target
        return prev + diff * 0.15
      })
    }, 130)
    return () => clearInterval(id)
  }, [phase, target])

  const start = (params, callbacks = {}) => {
    if (phase === 'running' || mutation.isPending) return
    currentRunRef.current = null
    doneRunRef.current = null
    setPhase('running')
    setTarget(12)
    mutation.mutate(params, {
      onSuccess: (data) => {
        if (data?.runId) {
          setRunId(data.runId)
          currentRunRef.current = data.runId
        }
        qc.invalidateQueries({ queryKey: ['jobs'] })
        qc.invalidateQueries({ queryKey: ['public-board'] })
        qc.invalidateQueries({ queryKey: ['scraping', 'logs'] })
        callbacks?.onSuccess?.(data)
      },
      onError: (err) => {
        setPhase('idle')
        setTarget(0)
        setProgress(0)
        setRunId(null)
        currentRunRef.current = null
        doneRunRef.current = null
        callbacks?.onError?.(err)
      },
    })
  }

  return {
    start,
    progress: Math.round(progress),
    phase,
    isRunning: phase === 'running' || phase === 'done' || mutation.isPending,
    isPending: mutation.isPending,
    runId,
    reset: () => { setPhase('idle'); setTarget(0); setProgress(0); setRunId(null) },
  }
}

export const useScrapingStatus = (runId, options = {}) => useQuery({
  queryKey: ['scraping', 'status', runId ?? 'latest'],
  queryFn: async () => { const { data } = await api.get(`/scraping/status${runId ? `?runId=${runId}` : ''}`); return data },
  enabled: !!runId,
  refetchInterval: (query) => (query.state.data?.isRunning ? 4000 : false),
  ...options,
})

export const useScrapingLogs = () => useQuery({
  queryKey: ['scraping', 'logs'],
  queryFn: async () => { const { data } = await api.get('/scraping/logs'); return data },
})

export const useScrapingRunner = () => {
  const qc = useQueryClient()
  const [runId, setRunId] = useState(null)
  const [doneEvent, setDoneEvent] = useState(null)

  const mutation = useMutation({
    mutationFn: async (params) => { const { data } = await api.post('/scraping/run', params || {}); return data },
    onSuccess: (res) => { if (res?.runId) setRunId(res.runId); qc.invalidateQueries({ queryKey: ['scraping'] }) },
  })

  const { data: status } = useScrapingStatus(runId)

  const isRunning = mutation.isPending || !!(runId && status?.isRunning)
  const justFinished = !!runId && !!status && !status.isRunning

  useEffect(() => {
    if (justFinished && status?.log) { setDoneEvent({ runId, log: status.log }); setRunId(null); qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['public-board'] }); qc.invalidateQueries({ queryKey: ['scraping'] }) }
  }, [justFinished, status, runId, qc])

  return {
    start: (params, callbacks) => mutation.mutate(params, callbacks),
    startAsync: (params, callbacks) => mutation.mutateAsync(params, callbacks),
    isPending: mutation.isPending,
    result: doneEvent,
    clearResult: () => setDoneEvent(null),
    refetchStatus: () => { if (runId) qc.invalidateQueries({ queryKey: ['scraping', 'status', runId] }) },
    isRunning, runId, status,
  }
}

export const useScrapeGroup = (group) => {
  const runner = useScrapingRunner()
  return {
    ...runner, start: (params, callbacks) => runner.start({ group, ...(params || {}) }, callbacks), isRunning: runner.isRunning, result: runner.result, clearResult: runner.clearResult,
  }
}
// Email templates hooks
export const useEmailTemplates = () => useQuery({
  queryKey: ['emailTemplates'],
  queryFn: async () => { const { data } = await api.get('/emails/templates'); return data },
})

export const useCreateEmailTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (templateData) => { const { data } = await api.post('/emails/templates', templateData); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailTemplates'] }),
  })
}

export const useUpdateEmailTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => { const { data } = await api.put(`/emails/templates/${id}`, updates); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailTemplates'] }),
  })
}

export const useDeleteEmailTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/emails/templates/${id}`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailTemplates'] }),
  })
}

// Search Profiles hooks
export const useSearchProfiles = () => useQuery({
  queryKey: ['searchProfiles'],
  queryFn: async () => { const { data } = await api.get('/search-profiles'); return data },
})

export const useCreateSearchProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (profileData) => { const { data } = await api.post('/search-profiles', profileData); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['searchProfiles'] }),
  })
}

export const useUpdateSearchProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => { const { data } = await api.put(`/search-profiles/${id}`, updates); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['searchProfiles'] }),
  })
}

export const useDeleteSearchProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/search-profiles/${id}`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['searchProfiles'] }),
  })
}

export const useToggleSearchProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.post(`/search-profiles/${id}/activate`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['searchProfiles'] }),
  })
}

// Analytics hooks
export const useAnalyticsOverview = () => useQuery({
  queryKey: ['analytics', 'overview'],
  queryFn: async () => { const { data } = await api.get('/analytics/overview'); return data },
})

export const useAnalyticsApplications = () => useQuery({
  queryKey: ['analytics', 'applications'],
  queryFn: async () => { const { data } = await api.get('/analytics/applications'); return data },
})

export const useAnalyticsSources = () => useQuery({
  queryKey: ['analytics', 'sources'],
  queryFn: async () => { const { data } = await api.get('/analytics/sources'); return data },
})

// Portfolio hooks
export const usePortfolio = () => useQuery({
  queryKey: ['portfolio'],
  queryFn: async () => { const { data } = await api.get('/profile/portfolio'); return data },
})

export const useUpdatePortfolio = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (portfolioData) => { const { data } = await api.put('/profile/portfolio', portfolioData); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  })
}

// Application notes hook
export const useUpdateApplicationNotes = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes }) => { const { data } = await api.put(`/applications/${id}`, { notes }); return data },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['application', variables.id] })
    },
  })
}

// Recruiter update hook
export const useUpdateRecruiter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => { const { data } = await api.put(`/recruiters/${id}`, updates); return data },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['recruiters'] })
      qc.invalidateQueries({ queryKey: ['recruiter', variables.id] })
    },
  })
}

// â”€â”€â”€ RECRUITER SPACE HOOKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useRecruiterDashboard = () => useQuery({
  queryKey: ['recruiterSpace', 'dashboard'],
  queryFn: async () => { const { data } = await api.get('/recruiter-space/dashboard'); return data },
})

export const useRecruiterProfile = () => useQuery({
  queryKey: ['recruiterSpace', 'profile'],
  queryFn: async () => { const { data } = await api.get('/recruiter-space/profile'); return data },
})

export const useUpdateRecruiterProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates) => { const { data } = await api.put('/recruiter-space/profile', updates); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiterSpace', 'profile'] }),
  })
}

export const useRecruiterJobs = (filters = {}) => useQuery({
  queryKey: ['recruiterSpace', 'jobs', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/recruiter-space/jobs?${params}`)
    return data
  },
})

export const useRecruiterJob = (id) => useQuery({
  queryKey: ['recruiterSpace', 'job', id],
  queryFn: async () => { const { data } = await api.get(`/recruiter-space/jobs/${id}`); return data },
  enabled: !!id,
})

export const useCreateRecruiterJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (jobData) => { const { data } = await api.post('/recruiter-space/jobs', jobData); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'jobs'] })
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'dashboard'] })
    },
  })
}

export const useUpdateRecruiterJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => { const { data } = await api.put(`/recruiter-space/jobs/${id}`, updates); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'jobs'] })
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'dashboard'] })
    },
  })
}

export const useDeleteRecruiterJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/recruiter-space/jobs/${id}`); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'jobs'] })
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'dashboard'] })
    },
  })
}

export const useToggleRecruiterJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.put(`/recruiter-space/jobs/${id}/toggle`); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'jobs'] })
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'dashboard'] })
    },
  })
}

export const useRecruiterCandidates = (filters = {}) => useQuery({
  queryKey: ['recruiterSpace', 'candidates', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/recruiter-space/candidates?${params}`)
    return data
  },
})

export const useRecruiterCandidateDetail = (userId) => useQuery({
  queryKey: ['recruiterSpace', 'candidate', userId],
  queryFn: async () => { const { data } = await api.get(`/recruiter-space/candidates/${userId}`); return data },
  enabled: !!userId,
})

export const useMatchingCandidates = (jobId, filters = {}) => useQuery({
  queryKey: ['recruiterSpace', 'matching', jobId, filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/recruiter-space/jobs/${jobId}/matching-candidates?${params}`)
    return data
  },
  enabled: !!jobId,
})

export const useRecruiterApplications = (filters = {}) => useQuery({
  queryKey: ['recruiterSpace', 'applications', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/recruiter-space/applications?${params}`)
    return data
  },
})

export const useUpdateRecruiterApplicationStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => { const { data } = await api.put(`/recruiter-space/applications/${id}/status`, { status }); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'applications'] })
      qc.invalidateQueries({ queryKey: ['recruiterSpace', 'dashboard'] })
    },
  })
}

export const useRecruiterSendEmail = () => {
  return useMutation({
    mutationFn: async ({ userId, subject, message }) => {
      const { data } = await api.post(`/recruiter-space/candidates/${userId}/email`, { subject, message })
      return data
    },
  })
}

// â”€â”€â”€ RECRUITER JOB BOARD (for candidates) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useRecruiterJobBoard = (filters = {}, options = {}) => useQuery({
  queryKey: ['jobs', 'recruiterBoard', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/jobs/recruiter-board?${params}`)
    return data
  },
  ...options,
})

export const useApplyToRecruiterJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, coverLetter }) => { const { data } = await api.post(`/jobs/${jobId}/apply`, { coverLetter }); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'recruiterBoard'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

// â”€â”€â”€ JOB SEARCH STATUS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useUpdateJobSearchStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (status) => { const { data } = await api.put('/auth/job-search-status', { status }); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

// â”€â”€â”€ COMPANY EMAILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useCompanyEmails = (filters = {}) => useQuery({
  queryKey: ['companyEmails', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/company-emails?${params}`)
    return data
  },
})

export const useCompanyEmailFilters = () => useQuery({
  queryKey: ['companyEmails', 'filters'],
  queryFn: async () => { const { data } = await api.get('/company-emails/filters'); return data },
})

export const useCompanyEmail = (id) => useQuery({
  queryKey: ['companyEmail', id],
  queryFn: async () => { const { data } = await api.get(`/company-emails/${id}`); return data },
  enabled: !!id,
})

export const useCreateCompanyEmail = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.post('/company-emails', data); return res },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companyEmails'] }),
  })
}

export const useUpdateCompanyEmail = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => { const { data } = await api.put(`/company-emails/${id}`, updates); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companyEmails'] }),
  })
}

export const useDeleteCompanyEmail = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/company-emails/${id}`); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companyEmails'] }),
  })
}

// â”€â”€â”€ MAILBOX (messages / emails) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useMailbox = (filters = {}, options = {}) => useQuery({
  queryKey: ['mailbox', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const { data } = await api.get(`/mail?${params}`)
    return data
  },
  ...options,
})

export const useMailConversations = () => useQuery({
  queryKey: ['mailbox', 'conversations'],
  queryFn: async () => { const { data } = await api.get('/mail/conversations'); return data },
})

export const useMail = (id) => useQuery({
  queryKey: ['mail', id],
  queryFn: async () => { const { data } = await api.get(`/mail/${id}`); return data },
  enabled: !!id,
})

export const useMarkMailRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.put(`/mail/${id}/read`); return data },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['mailbox'] })
      qc.invalidateQueries({ queryKey: ['mailbox', 'conversations'] })
      qc.invalidateQueries({ queryKey: ['mail', id] })
    },
  })
}

export const useSendMail = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mailData) => { const { data } = await api.post('/mail/send', mailData); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mailbox'] })
      qc.invalidateQueries({ queryKey: ['mailbox', 'conversations'] })
    },
  })
}

export const useReplyMail = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }) => { const { data } = await api.post(`/mail/${id}/reply`, { body }); return data },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['mailbox'] })
      qc.invalidateQueries({ queryKey: ['mailbox', 'conversations'] })
      qc.invalidateQueries({ queryKey: ['mail', id] })
    },
  })
}

// â”€â”€â”€ ADMIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useAdminOverview = () => useQuery({
  queryKey: ['admin', 'overview'],
  queryFn: async () => { const { data } = await api.get('/admin/overview'); return data },
})

export const useAdminTimeline = (days = 30) => useQuery({
  queryKey: ['admin', 'timeline', days],
  queryFn: async () => { const { data } = await api.get(`/admin/timeline?days=${days}`); return data },
  placeholderData: (prev) => prev,
})

export const useAdminMonthly = (months = 12) => useQuery({
  queryKey: ['admin', 'monthly', months],
  queryFn: async () => { const { data } = await api.get(`/admin/monthly?months=${months}`); return data },
  placeholderData: (prev) => prev,
})

export const useAdminUsers = (filters = {}) => useQuery({
  queryKey: ['admin', 'users', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') params.set(k, v) })
    const { data } = await api.get(`/admin/users?${params}`)
    return data
  },
})

export const useCreateAdminUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userData) => { const { data } = await api.post('/admin/users', userData); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
      qc.invalidateQueries({ queryKey: ['admin', 'timeline'] })
      qc.invalidateQueries({ queryKey: ['admin', 'monthly'] })
    },
  })
}

export const useUpdateAdminUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => { const { data } = await api.put(`/admin/users/${id}`, updates); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'recruiters'] })
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

export const useDeleteAdminUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/admin/users/${id}`); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
      qc.invalidateQueries({ queryKey: ['admin', 'recruiters'] })
      qc.invalidateQueries({ queryKey: ['admin', 'timeline'] })
      qc.invalidateQueries({ queryKey: ['admin', 'monthly'] })
    },
  })
}

export const useAdminRecruiters = (filters = {}) => useQuery({
  queryKey: ['admin', 'recruiters', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') params.set(k, v) })
    const { data } = await api.get(`/admin/recruiters?${params}`)
    return data
  },
})

export const useAdminCompanies = (filters = {}) => useQuery({
  queryKey: ['admin', 'companies', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') params.set(k, v) })
    const { data } = await api.get(`/admin/companies?${params}`)
    return data
  },
})

export const useAdminJobs = (filters = {}) => useQuery({
  queryKey: ['admin', 'jobs', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') params.set(k, v) })
    const { data } = await api.get(`/admin/jobs?${params}`)
    return data
  },
})
