import { scrapeAllSources, scrapePublicSector } from '../backend/services/jobScraper.js'

const sources = (process.argv[2] || 'linkedin,indeed,welcometothejungle,rekrute,dreamjob,onejob').split(',')
const keywords = (process.argv[3] || 'développeur,react').split(',')

for (const source of sources) {
  const startedAt = Date.now()
  const results = await scrapeAllSources(keywords, 'Maroc', [source], null)
  const result = results[source] || {}
  console.log(`${source}: status=${result.status} jobs=${result.jobs?.length ?? 0} ${Math.round((Date.now() - startedAt) / 1000)}s err=${result.error || '-'}`)
  for (const job of (result.jobs || []).slice(0, 2)) {
    console.log(`   - ${job.title} | ${job.company} | ${job.contractType} | ${job.sourceId}`)
  }
}

if (process.argv.includes('public')) {
  const startedAt = Date.now()
  const result = await scrapePublicSector(null, ['concours', 'emploi-public'])
  console.log(`public: jobs=${result.jobs.length} news=${result.news.length} ${Math.round((Date.now() - startedAt) / 1000)}s`)
  for (const job of result.jobs.slice(0, 3)) console.log(`   - [${job.source}] ${job.title}`)
}
