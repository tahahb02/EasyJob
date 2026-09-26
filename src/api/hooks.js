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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scraping', 'logs'] }) },
  })
}

/**
 * Pilotage du scrapping côté interface.
 *
 * Le pourcentage vient du serveur (`log.progress`) : plus de plafond à 92 % ni
 * de calcul local qui se figeait à 12 % quand une source ne rendait pas la main.
 * La collecte en cours est reprise automatiquement au montage (onglet fermé puis
 * rouvert), et le message de fin n'apparaît qu'une fois le statut réellement
 * terminé — donc forcément à 100 %.
 */
export const useScrapingProgress = () => {
  const qc = useQueryClient()
  const [runId, setRunId] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [target, setTarget] = useState(0)
  const [progress, setProgress] = useState(0)
  const currentRunRef = useRef(null)
  const terminalRunRef = useRef(null)
  const callbacksRef = useRef(null)
  const mutation = useMutation({
    mutationFn: async (params) => { const { data } = await api.post('/scraping/run', params || {}); return data },
  })

  // Sans runId en cours de notre côté, on interroge la dernière collecte connue
  // : c'est ce qui permet de reprendre le suivi après un rechargement de page.
  const { data: status } = useScrapingStatus(runId ?? 'latest')

  useEffect(() => {
    if (!status) return
    const log = status.log
    if (!log) return

    // Reprise d'une collecte déjà lancée (autre onglet / page rechargée).
    if (phase === 'idle' && log.status === 'running' && log._id !== runId) {
      currentRunRef.current = log._id
      setRunId(log._id)
      setPhase('running')
      setTarget(Number(log.progress) || 0)
      return
    }

    if (!runId || currentRunRef.current !== log._id) return

    if (log.status && log.status !== 'running') {
      if (terminalRunRef.current === log._id) return
      terminalRunRef.current = log._id
      setTarget(100)
      setProgress(100)
      setPhase('done')
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['public-board'] })
      qc.invalidateQueries({ queryKey: ['recruiter-jobs'] })
      qc.invalidateQueries({ queryKey: ['scraping', 'logs'] })
      callbacksRef.current?.onComplete?.(log)
      return
    }

    // Progression fournie par le serveur, jamais bornée avant 100 %.
    setTarget(Math.min(99, Math.max(0, Number(log.progress) || 0)))
  }, [status, runId, phase, qc])

  // Le serveur peut signaler une progression plus fine que le pas de 1,5 s du
  // polling ; SocketContext relaie `scraping:progress` vers cette requête.
  useEffect(() => {
    if (phase !== 'running') return
    const interval = setInterval(() => {
      setProgress(previous => {
        const difference = target - previous
        if (Math.abs(difference) < 1) return target
        return previous + difference * 0.2
      })
    }, 130)
    return () => clearInterval(interval)
  }, [phase, target])

  // Plus de remise à zéro automatique : sans elle, la barre retombait à 0 % et
  // les offresFraichement collectées disparaissaient de l'écran. L'état « terminé »
  // reste affiché jusqu'au prochain lancement.
  useEffect(() => {
    if (phase !== 'done') return
    qc.invalidateQueries({ queryKey: ['scraping', 'logs'] })
  }, [phase, qc])

  const start = (params, callbacks = {}) => {
    if (phase === 'running' || mutation.isPending) return
    callbacksRef.current = callbacks
    currentRunRef.current = null
    terminalRunRef.current = null
    setPhase('running')
    setTarget(0)
    setProgress(0)
    mutation.mutate(params, {
      onSuccess: (data) => {
        if (!data?.runId) {
          setPhase('idle')
          setTarget(0)
          setProgress(0)
          callbacksRef.current?.onError?.(new Error('La collecte n\'a pas été démarrée'))
          callbacksRef.current = null
          return
        }
        setRunId(data.runId)
        currentRunRef.current = data.runId
        setTarget(Math.min(99, Number(data.progress) || 0))
        qc.invalidateQueries({ queryKey: ['scraping', 'logs'] })
        callbacksRef.current?.onLaunch?.(data)
      },
      onError: (error) => {
        setPhase('idle')
        setTarget(0)
        setProgress(0)
        setRunId(null)
        currentRunRef.current = null
        terminalRunRef.current = null
        callbacksRef.current?.onError?.(error)
        callbacksRef.current = null
      },
    })
  }

  const reset = () => {
    setPhase('idle')
    setTarget(0)
    setProgress(0)
    setRunId(null)
    currentRunRef.current = null
    terminalRunRef.current = null
    callbacksRef.current = null
  }

  return {
    start,
    progress: Math.round(Math.min(100, Math.max(0, progress))),
    phase,
    // « done » est inclus pour que la barre reste remplie à 100 % avec le
    // libellé « Terminé ! » jusqu'au prochain lancement.
    isRunning: phase === 'running' || phase === 'done' || mutation.isPending,
    isScraping: phase === 'running' || mutation.isPending,
    isPending: mutation.isPending,
    runId,
    status,
    reset,
  }
}

export const useScrapingStatus = (runId, options = {}) => useQuery({
  queryKey: ['scraping', 'status', runId ?? 'latest'],
  queryFn: async () => {
    const params = new URLSearchParams()
    if (runId) params.set('runId', runId)
    const query = params.toString()
    // Une requête de statut peut bloquer le temps d'une collecte : on lui
    // laisse un budget large pour ne jamais se faire couper par le client.
    const { data } = await api.get(`/scraping/status${query ? `?${query}` : ''}`, { timeout: 60000 })
    return data
  },
  enabled: !!runId,
  // Tant qu'on ne sait pas que la collecte est finie, on continue d'interroger :
  // un échec réseau temporaire ne doit plus éteindre le suivi pour de bon.
  // Rythme rapide pendant la collecte, très lent sinon : inutile de marteler
  // le serveur quand plus rien ne bouge (et ça épuise le quota de requêtes).
  refetchInterval: query => (query.state.data?.isRunning === false ? false : 1500),
  // Le serveur pilote la collecte tout seul : inutile de continuer à interroger
  // quand l'onglet est masqué, la requête reprend au retour sur l'onglet.
  refetchIntervalInBackground: false,
  // Un 429 ne se relance pas en boucle : on respecte le délai serveur.
  retry: (failureCount, error) => {
    if (error?.response?.status === 429) return failureCount < 1
    return failureCount < 3
  },
  retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
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
  const handledRunRef = useRef(null)
  const mutation = useMutation({
    mutationFn: async (params) => { const { data } = await api.post('/scraping/run', params || {}); return data },
    onSuccess: (result) => { if (result?.runId) setRunId(result.runId) },
  })
  const { data: status } = useScrapingStatus(runId)
  const isRunning = mutation.isPending || !!(runId && status?.isRunning)
  const justFinished = !!runId && !!status && !status.isRunning

  useEffect(() => {
    if (!justFinished || !status?.log || handledRunRef.current === runId) return
    handledRunRef.current = runId
    setDoneEvent({ runId, log: status.log })
    setRunId(null)
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['public-board'] })
    qc.invalidateQueries({ queryKey: ['scraping'] })
  }, [justFinished, status, runId, qc])

  return {
    start: (params, callbacks) => mutation.mutate(params, callbacks),
    startAsync: (params, callbacks) => mutation.mutateAsync(params, callbacks),
    isPending: mutation.isPending,
    result: doneEvent,
    clearResult: () => setDoneEvent(null),
    refetchStatus: () => { if (runId) qc.invalidateQueries({ queryKey: ['scraping', 'status', runId] }) },
    isRunning,
    runId,
    status,
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
