import { createElement as el } from 'react'
import { renderToString as rts } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SitesPage from '@/pages/jobOffers/SitesPage'
const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
try {
  const html = rts(
    el(QueryClientProvider, { client: qc },
      el(MemoryRouter, { initialEntries: ['/jobs/sites'] },
        el(Routes, null, el(Route, { path: '/jobs/sites', element: el(SitesPage) }))
      )
    )
  )
  console.log('SSR_RENDER_OK len=' + html.length)
  console.log('contains_oups=' + html.includes('Oups') + ' contains_aucun=' + html.includes('Aucun'))
} catch (e) {
  console.log('SSR_RENDER_THROW name=' + (e && e.name))
  console.log('SSR_RENDER_THROW msg=' + (e && e.message))
  const st = ((e && e.stack) || '').toString().split('\n')
  st.slice(0, 14).forEach((l) => console.log('  ' + l))
}
