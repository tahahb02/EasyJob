import axios from 'axios'
import * as cheerio from 'cheerio'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
]

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchWithCurl(url, headers = {}) {
  const args = ['-sL', '--compressed', '-A', headers['User-Agent'] || getRandomUA(), url]
  try {
    const { stdout } = await execFileAsync('curl', args, { timeout: 30000, maxBuffer: 8 * 1024 * 1024 })
    return { data: stdout, status: 200 }
  } catch (err) {
    throw new Error(`curl fallback failed for ${url}: ${err.code || err.message}`)
  }
}

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const method = (opts.method || 'GET').toUpperCase()
      const response = await axios.request({
        url,
        method,
        ...opts,
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          ...(opts.headers || {}),
        },
        timeout: 25000,
        maxRedirects: 5,
      })
      return response
    } catch (err) {
      const deadCodes = ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ECONNRESET', 'ETIMEDOUT', 'ERR_NAME_NOT_RESOLVED']
      const hopeless = deadCodes.includes(err.code) || deadCodes.includes(err.errno)
      // 403 (Cloudflare / anti-bot) : on tente curl une fois ; si curl échoue aussi,
      // on abandonne immédiatement (pas de re-tentatives inutiles).
      if (err.response?.status === 403) {
        try {
          return await fetchWithCurl(url, opts.headers || {})
        } catch (curlErr) {
          throw curlErr
        }
      }
      if (attempt === retries || hopeless) {
        throw err
      }
      const waitMs = attempt * 1500 + Math.random() * 1000
      await delay(waitMs)
    }
  }
}

function normalizeText(text) {
  if (!text) return ''
  return text.replace(/[\t\r]+/g, ' ').replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim()
}

function inferContractType(title, description = '') {
  const t = `${title} ${description}`.toLowerCase()
  if (t.includes('stage') || t.includes('intern') || t.includes('stagiaire') || t.includes('pfe') || t.includes('pfm')) return 'Stage'
  if (t.includes('freelance') || t.includes('consultant') || t.includes('indépendant') || t.includes('mission')) return 'Freelance'
  if (t.includes('cdd') || t.includes('contract') || t.includes('temporaire') || t.includes('interim') || t.includes('intérim')) return 'CDD'
  if (t.includes('temps partiel') || t.includes('part-time') || t.includes('mi-temps')) return 'Temps partiel'
  if (t.includes('alternance') || t.includes('apprentissage')) return 'Stage'
  return 'CDI'
}

// Ramène n'importe quel libellé de contrat vers l'enum du schéma JobOffer.
function normalizeContractType(raw) {
  if (!raw) return 'CDI'
  const t = String(raw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  if (!t || t === 'cdi' || /indefini|permanent|illimite|full-time|temps plein|plein/.test(t)) return 'CDI'
  if (/cdd|determine|temporaire|fixe|contract|interim|saisonnier/.test(t)) return 'CDD'
  if (/stage|stagiaire|intern|apprenti|alternance|pfe|pfm|vae/.test(t)) return 'Stage'
  if (/freelance|consultant|independant|mission|auto-entrepreneur/.test(t)) return 'Freelance'
  if (/partiel|part-time|mi-temps/.test(t)) return 'Temps partiel'
  return 'CDI'
}

function parseRelativeDate(text) {
  if (!text) return null
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const now = new Date()

  const patterns = [
    { regex: /(\d+)\s*minute/, ms: (n) => n * 60 * 1000 },
    { regex: /(\d+)\s*heure/, ms: (n) => n * 3600 * 1000 },
    { regex: /(\d+)\s*jour/, ms: (n) => n * 86400000 },
    { regex: /(\d+)\s*semaine/, ms: (n) => n * 7 * 86400000 },
    { regex: /(\d+)\s*mois/, ms: (n) => n * 30 * 86400000 },
    { regex: /(\d+)\s*an/, ms: (n) => n * 365 * 86400000 },
  ]

  if (lower.includes('aujourd') || lower.includes('today') || lower.includes('maintenant')) return now
  if (lower.includes('hier') || lower.includes('yesterday')) return new Date(now - 86400000)

  for (const { regex, ms } of patterns) {
    const match = lower.match(regex)
    if (match) return new Date(now - ms(parseInt(match[1])))
  }
  return null
}

function parseExactDate(text) {
  if (!text) return null
  const lower = text.toLowerCase().trim()

  const isoMatch = lower.match(/(\d{4}[-/]\d{2}[-/]\d{2})/)
  if (isoMatch) {
    const d = new Date(isoMatch[1])
    if (!isNaN(d.getTime())) return d
  }

  const frMonths = {
    janvier: 0, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
    juillet: 6, aout: 7, septembre: 8, octobre: 9, novembre: 10, decembre: 11,
  }
  const frMatch = lower.match(/(\d{1,2})\s*(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s*(\d{4})?/)
  if (frMatch) {
    const day = parseInt(frMatch[1])
    const month = frMonths[frMatch[2]]
    const year = frMatch[3] ? parseInt(frMatch[3]) : new Date().getFullYear()
    if (month !== undefined) return new Date(year, month, day)
  }

  const usMatch = lower.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2}),?\s*(\d{4})?/)
  if (usMatch) {
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
    const month = months[usMatch[1].slice(0, 3)]
    const day = parseInt(usMatch[2])
    const year = usMatch[3] ? parseInt(usMatch[3]) : new Date().getFullYear()
    if (month !== undefined) return new Date(year, month, day)
  }

  return null
}

// ─── SHARED HELPERS ────────────────────────────────────────────────
function cleanCompanyName(company) {
  if (!company) return ''
  let cleaned = normalizeText(company)
    .replace(/\|.*$/, '')
    .replace(/(?:emploi|recrutement|recrute|offre).*$/i, '')
    .trim()
  // Supprime les mots consécutifs dupliqués (« NGBS NGBS », « ALTEN ALTEN »...)
  cleaned = cleaned.split(/\s+/).filter((w, i, arr) => w.toLowerCase() !== arr[i - 1]?.toLowerCase()).join(' ')
  // Supprime les phrases entières répétées (« MAROC FER MAROC FER » → « MAROC FER »)
  for (let len = Math.floor(cleaned.length / 2); len >= 3; len--) {
    const first = cleaned.slice(0, len).trim()
    const rest = cleaned.slice(len).trim()
    if (first && rest === first) {
      cleaned = first
      break
    }
  }
  if (cleaned.length > 3 && cleaned.length <= 60) return cleaned
  return company
}

const SECTOR_KEYWORDS = [
  { sector: 'Informatique / IT', keywords: ['informatique', 'digital', 'software', 'it ', 'développeur', 'developpeur', 'devops', 'data', 'cyber', 'cloud', 'engineer', 'ingénieur', 'ingenieur', 'fullstack', 'backend', 'frontend', 'java', 'python', 'php'] },
  { sector: 'Finance / Banque', keywords: ['banque', 'finance', 'comptable', 'auditeur', 'credit', 'trésorerie', 'tresorerie', 'assurance', 'risk'] },
  { sector: 'Télécommunications', keywords: ['télécom', 'telecom', 'réseaux', 'reseaux', '5g', 'fibre'] },
  { sector: 'Industrie / Production', keywords: ['industrie', 'manufactur', 'production', 'usine', 'mecanique', 'maintenance', 'qualité', 'qualite', 'logistique', 'chantier', 'btp', 'construction'] },
  { sector: 'Commercial / Vente', keywords: ['commercial', 'vente', 'sales', 'business developer', 'account manager', 'distribution', 'marketing'] },
  { sector: 'Ressources Humaines', keywords: ['ressources humaines', 'rh ', 'recrutement', 'talent', 'payroll', 'pae', 'administration du personnel'] },
  { sector: 'Sante / Pharmacie', keywords: ['pharmacie', 'santé', 'sante', 'infirmier', 'medicine', 'medical', 'pharmacien', 'medecin'] },
  { sector: 'Education / Formation', keywords: ['professeur', 'enseignant', 'education', 'ecole', 'formation', 'université', 'universite'] },
  { sector: 'Fonction publique', keywords: ['concours', 'ministère', 'ministere', 'fonction publique', 'administration publique', 'collectivité', 'collectivite', 'département'] },
  { sector: 'Agriculture / Agroalimentaire', keywords: ['agriculture', 'agroalimentaire', 'agro', 'élevage', 'elevage', 'agronome'] },
  { sector: 'Hotellerie / Tourisme', keywords: ['hôtel', 'hotel', 'tourisme', 'restaurant', 'chef de cuisine', 'réception'] },
  { sector: 'Transport / Logistique', keywords: ['transport', 'logistique', 'chauffeur', 'conduite', 'livraison', 'aérien', 'aeronautique'] },
  { sector: 'Energie', keywords: ['énergie', 'energie', 'électrique', 'electrique', 'solaire', 'éolien', 'eolien'] },
]

function guessSector(title, description = '') {
  const text = `${title} ${description}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const { sector, keywords } of SECTOR_KEYWORDS) {
    for (const kw of keywords) {
      if (text.includes(kw)) return sector
    }
  }
  return ''
}

function dedupeJobs(jobs, keyFn = (j) => `${j.title.toLowerCase()}|${j.company.toLowerCase()}`) {
  const seen = new Set()
  return jobs.filter(j => {
    const key = keyFn(j)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractPostedDate($, card) {
  const selectors = [
    'time[datetime]',
    'time',
    '[data-testid="post-date"]',
    '.job-search-card__listdate',
    '.date',
    '.posted-date',
    '.job-date',
    'span[class*="date"]',
    'span[class*="time"]',
    '.age',
    '.new',
  ]

  for (const sel of selectors) {
    const el = $(card).find(sel).first()
    if (el.length) {
      const datetime = el.attr('datetime')
      if (datetime && datetime.includes('T')) {
        const d = new Date(datetime)
        if (!isNaN(d.getTime())) return d
      }
      const text = normalizeText(el.text())
      if (text) {
        const exact = parseExactDate(text)
        if (exact) return exact
        const relative = parseRelativeDate(text)
        if (relative) return relative
      }
    }
  }
  return null
}

function buildSearchKeywords(userProfile, explicitKeywords) {
  if (explicitKeywords && explicitKeywords.length > 0) return explicitKeywords
  if (!userProfile) return ['développeur', 'ingénieur', 'emploi maroc']

  const keywords = []
  if (userProfile.searchKeywords?.length) keywords.push(...userProfile.searchKeywords)
  if (userProfile.skills?.length) keywords.push(...userProfile.skills.slice(0, 5))
  if (userProfile.title) keywords.push(userProfile.title)
  if (userProfile.domains?.length) keywords.push(...userProfile.domains.slice(0, 3))

  return keywords.length > 0 ? [...new Set(keywords)].slice(0, 10) : ['développeur', 'ingénieur']
}

// ─── RELEVANCE SCORING (enhanced) ───────────────────────────────────
function calculateRelevance(job, userProfile) {
  let score = 30
  if (!userProfile) return Math.floor(Math.random() * 20) + 50

  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase())
  const userSoftSkills = (userProfile.softSkills || []).map(s => s.toLowerCase())
  const userDomains = (userProfile.domains || []).map(d => d.toLowerCase())
  const userKeywords = (userProfile.searchKeywords || []).map(k => k.toLowerCase())
  const userExperience = (userProfile.experience || []).map(e => (e.position || e.title || '').toLowerCase())
  const userTitle = (userProfile.title || '').toLowerCase()
  const userEducation = (userProfile.education || [])
    .map(e => `${e.degree || e.field || ''} ${e.institution || ''}`.toLowerCase())
  const userLanguages = (userProfile.languages || []).map(l =>
    (typeof l === 'string' ? l : (l.language || '')).split(/[(\[]/)[0].trim().toLowerCase()
  )

  const jobText = `${job.title} ${job.description || ''} ${job.sector || ''} ${job.domain || ''} ${(job.keywords || []).join(' ')}`.toLowerCase()

  let skillMatches = 0
  for (const skill of userSkills) {
    if (skill.length > 2 && jobText.includes(skill)) skillMatches++
  }
  score += Math.min(skillMatches * 8, 40)

  let softMatches = 0
  for (const ss of userSoftSkills) {
    if (ss.length > 3 && jobText.includes(ss)) softMatches++
  }
  score += Math.min(softMatches * 4, 12)

  const educationTokens = userEducation.flatMap(e => e.split(/\s+/).filter(w => w.length > 4))
  for (const token of educationTokens) {
    if (jobText.includes(token)) { score += 8; break }
  }

  const languageKeywords = {
    arabe: ['arabe', 'arabic'],
    francais: ['français', 'french'],
    anglais: ['anglais', 'english'],
    espagnol: ['espagnol', 'spanish'],
    allemand: ['allemand', 'german'],
  }
  for (const lang of userLanguages) {
    const keywords = languageKeywords[lang] || [lang]
    if (keywords.some(k => jobText.includes(k))) { score += 4; break }
  }

  let domainMatch = false
  for (const domain of userDomains) {
    if (domain.length > 2 && (jobText.includes(domain) || (job.sector || '').toLowerCase().includes(domain))) {
      domainMatch = true
      break
    }
  }
  if (domainMatch) score += 20

  let keywordMatches = 0
  for (const kw of userKeywords) {
    if (kw.length > 2 && jobText.includes(kw)) keywordMatches++
  }
  score += Math.min(keywordMatches * 5, 15)

  let titleMatch = false
  if (userTitle) {
    const titleWords = userTitle.split(/\s+/).filter(w => w.length > 3)
    for (const w of titleWords) {
      if (jobText.includes(w)) { titleMatch = true; break }
    }
  }
  if (titleMatch) score += 10

  let expMatch = false
  for (const exp of userExperience) {
    const expWords = exp.split(/\s+/).filter(w => w.length > 4)
    for (const w of expWords) {
      if (jobText.includes(w)) { expMatch = true; break }
    }
    if (expMatch) break
  }
  if (expMatch) score += 5

  if (job.description && job.description.length > 100) score += 3
  if (job.postedAt) {
    const daysSince = (Date.now() - new Date(job.postedAt).getTime()) / 86400000
    if (daysSince < 3) score += 5
    else if (daysSince < 7) score += 3
    else if (daysSince < 14) score += 1
    else if (daysSince > 30) score -= 5
  }

  return Math.min(Math.max(score, 10), 99)
}

// ─── LINKEDIN SCRAPER ───────────────────────────────────────────────
async function scrapeLinkedIn(keywords, location = 'Morocco', userProfile = null) {
  const jobs = []
  const pages = [0, 25, 50, 75]

  for (const pageNum of pages) {
    try {
      const searchQuery = encodeURIComponent(keywords.slice(0, 5).join(' OR '))
      const url = `https://www.linkedin.com/jobs/search?keywords=${searchQuery}&location=${encodeURIComponent(location)}&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=${pageNum}&f_TPR=r604800&f_E=2%2C3&sortBy=DD`

      const { data } = await fetchWithRetry(url, {
        headers: {
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      })

      const $ = cheerio.load(data)

      const cardSelectors = [
        '.base-card',
        '.job-search-card',
        'li.jobs-search__result-card',
        '.base-search-card',
        '[data-entity-urn]',
        '.job-search-card__list-item',
      ]

      let foundOnPage = 0
      for (const cardSel of cardSelectors) {
        $(cardSel).each((_, el) => {
          const card = $(el)
          const title = normalizeText(
            card.find('.base-search-card__title, .result__title, h3.base-card__full-link, h3, .job-search-card__title').text()
          )
          const company = normalizeText(
            card.find('.base-search-card__subtitle, .result__company, h4.base-search-card__subtitle, .hidden-nested-link, .job-search-card__company-name').text()
          )
          const loc = normalizeText(
            card.find('.job-search-card__location, .result__location, .job-search-card__bullet').text()
          )

          const linkEl = card.find('a.base-card__full-link, a.base-search-card__full-link, a.result__card, a[href*="/jobs/view/"]')
          const href = (linkEl.attr('href') || '').split('?')[0]
          const sourceUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`

          const postedAt = extractPostedDate($, card) || new Date()

          let description = normalizeText(
            card.find('.base-search-card__description, .job-search-card__snippet, .show-more-less-html__markup, .job-search-card__description-snippet').text()
          )
          if (!description || description.length < 20) {
            description = normalizeText(card.find('p, span.description, .entity-result__summary').text().slice(0, 500))
          }

          const locationText = (loc || location).replace(/\s*\(Maroc\)/i, '')
          const isRemote = /remote|télé(travail|travail)|télétravail|distanciel|hybride|à distance/i.test(`${title} ${loc} ${description}`.slice(0, 300))

          const salaryText = normalizeText(card.find('.salary, .job-search-card__salary-info').text())

          if (title && title.length > 3) {
            jobs.push({
              title,
              company: cleanCompanyName(company) || 'Non spécifié',
              location: locationText || location,
              sourceUrl,
              source: 'linkedin',
              postedAt,
              contractType: inferContractType(title, description),
              description: description.slice(0, 2500),
              sector: guessSector(title, description),
              isRemote,
              salary: salaryText ? { min: 0, max: 0, currency: 'MAD', period: 'monthly' } : undefined,
              keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
            })
            foundOnPage++
          }
        })
      }

      if (foundOnPage === 0 && pageNum === 0) break
      await delay(1200 + Math.random() * 1500)
    } catch (error) {
      console.error(`LinkedIn page ${pageNum} error:`, error.message)
      if (pageNum === 0) break
    }
  }

  // Deduplicate
  const unique = dedupeJobs(jobs)

  return unique.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── INDEED SCRAPER ───────────────────────────────────────────────
async function scrapeIndeed(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  const pages = ['0', '10', '20']

  const regionByLocation = (() => {
    const loc = String(location || '').toLowerCase()
    const map = {
      casablanca: 'Casablanca', rabat: 'Rabat', marrakech: 'Marrakech',
      tanger: 'Tanger', fes: 'Fès', agadir: 'Agadir', meknes: 'Meknès',
      oujda: 'Oujda', kenitra: 'Kénitra', 'el jadida': 'El Jadida', none: '',
    }
    for (const [key, val] of Object.entries(map)) if (loc.includes(key)) return val
    return 'Maroc'
  })()

  for (const start of pages) {
    try {
      const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(' '))
      const url = `https://ma.indeed.com/jobs?q=${searchQuery}&l=${encodeURIComponent(regionByLocation)}&sort=date&start=${start}&fromage=14`

      let data
      const res = await fetchWithRetry(url)
      data = typeof res === 'string' ? res : res.data
      if (/captcha|Please verify you are a human|access denied/i.test(data)) break

      const $ = cheerio.load(data)

      const cardSelectors = [
        'div.slider_item',
        'div.job_seen_beacon',
        'div.jobsearch-ResultsList div.result',
        'td.resultContent',
        '.resultContent',
        '.jobsearch-SerpJobCard',
        '.result',
        'div[data-jk]',
      ]

      let foundOnPage = 0
      for (const cardSel of cardSelectors) {
        $(cardSel).each((_, el) => {
          const card = $(el)
          const titleEl = card.find('h2.jobTitle a, a.jcs-JobTitle, h2 a, a[data-jk]').first()
          const title = normalizeText(titleEl.text())
          const company = cleanCompanyName(
            card.find('span[data-testid="company-name"], .companyName, .company, span.company').text()
          )
          const loc = normalizeText(
            card.find('div[data-testid="text-location"], .companyLocation, .location').text()
          )

          const href = titleEl.attr('href') || ''
          const jk = (href.match(/[?&]jk=([^&]+)/) || [])[1] || (card.attr('data-jk') || '').split('?')[0]
          const sourceUrl = href.startsWith('http') ? href.split('&')[0] : `https://ma.indeed.com${href.split('&')[0]}`
          const fragment = href.startsWith('http') ? `?jk=${jk}` : `?jk=${jk}`

          const postedAt = extractPostedDate($, card) || new Date()

          const description = normalizeText(
            card.find('.job-snippet, .jobCardShelfContainer, .jobsearch-jobDescriptionText, .jobCardShelf .job-snippet').text()
          )

          const salaryText = normalizeText(card.find('.salary-snippet, .attribute_snippet, [data-testid="attribute_snippet_testid"]').text())

          if (title && title.length > 3) {
            jobs.push({
              title,
              company: company || 'Non spécifié',
              location: loc || regionByLocation,
              sourceUrl: `${sourceUrl}${fragment}`,
              sourceId: jk || `indeed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'indeed',
              postedAt,
              contractType: inferContractType(title, description),
              description: description.slice(0, 2500),
              sector: guessSector(title, description),
              isRemote: /remote|télétravail|télétravail|à distance/i.test(`${title} ${description}`.slice(0, 300)),
              salary: salaryText ? { min: 0, max: 0, currency: 'MAD', period: 'monthly' } : undefined,
              keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
            })
            foundOnPage++
          }
        })
      }

      if (foundOnPage === 0 && start === '0') break
      await delay(1500 + Math.random() * 1500)
    } catch {
      break
    }
  }

  const unique = dedupeJobs(jobs, j => `${j.title.toLowerCase()}|${j.company.toLowerCase()}|${j.sourceUrl}`)

  return unique.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── REKRUTE SCRAPER ───────────────────────────────────────────────
async function scrapeRekrute(keywords, userProfile = null) {
  const jobs = []
  const words = keywords.slice(0, 4)

  // /offres.html est rendu côté serveur (la page /offres-emploi est une SPA Angular sans résultats).
  // Le rendu SSR ne liste les offres que pour un mot-clé unique (une phrase multi-mots renvoie une page vide).
  // On itère donc chaque mot-clé, comme pour l'API WTTJ.
  // Pagination : s=1 → 10 résultats/page, p=0,1,2... (o et page fixes).
  for (const kw of words) {
    const searchQuery = encodeURIComponent(kw)
    for (let pageIndex = 0; pageIndex < 3; pageIndex++) {
      try {
        const url = `https://www.rekrute.com/offres.html?keyword=${searchQuery}&query=${searchQuery}&s=1&p=${pageIndex}&o=1&page=0`

        const { data } = await fetchWithRetry(url)

        const $ = cheerio.load(data)

        const rows = $('li.post-id')
        if (rows.length === 0) break

        rows.each((_, el) => {
        const row = $(el)
        const href = row.find('a.titreJob').attr('href') || ''
        const idMatch = (row.attr('id')) || (href.match(/(\d+)\.html/) || [])[1]
        const sourceUrl = href.startsWith('http') ? href : `https://www.rekrute.com${href}`

        const titleRaw = normalizeText(row.find('a.titreJob').text())
        const parts = titleRaw.split('|').map(s => s.trim())
        const title = parts[0]
        const locRaw = parts.slice(1).join(' ')

        const company = cleanCompanyName(row.find('img.photo').attr('alt') || row.find('img.photo').attr('title') || '')
        const blurb = normalizeText(row.find('.holder div.info').first().find('span').last().text())

        // Publication : du 24/09/2026 au 24/11/2026
        const dateSpan = row.find('em.date span').first().text().trim()
        const dm = dateSpan.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        const postedAt = dm ? new Date(+dm[3], +dm[2] - 1, +dm[1]) : new Date()

        const infoItems = []
        row.find('.holder div.info ul li').each((_, li) => {
          const liText = normalizeText($(li).text()).replace(/\s*:\s*$/, '')
          if (liText) infoItems.push(liText)
        })

        const sector = (infoItems.find(t => /^Secteur/i.test(t)) || '').replace(/^Secteur d'activité\s*:/i, '').split(',')[0].trim()
        const experience = (infoItems.find(t => /^Expérience/i.test(t)) || '').replace(/^Expérience requise:\s*/i, '').trim()
        const studyLevel = (infoItems.find(t => /^Niveau/i.test(t)) || '').replace(/^Niveau d'étude demandé:\s*/i, '').trim()
        const contractRaw = (infoItems.find(t => /^Type de contrat/i.test(t)) || '')
        const rawContract = (contractRaw.match(/:\s*([A-ZÉÈÀÂ]{1,8}\s*\w*)/i) || [])[1] || ''
        const contractType = normalizeContractType(rawContract) || inferContractType(title, blurb)
        const isRemote = /Télétravail\s*:\s*Oui/i.test(contractRaw) || /télétravail|remote|à distance/i.test(`${title} ${blurb}`.slice(0, 300))
        const postesMatch = row.find('em.date').text().match(/Postes proposés\s*:\s*(\d+)/i)

        const description = [
          blurb,
          infoItems.join(' | '),
          postesMatch ? `Nombre de postes : ${postesMatch[1]}` : '',
        ].filter(Boolean).join('\n')

        if (title && title.length > 3) {
          jobs.push({
            title,
            company: company || 'Non spécifié',
            location: (locRaw || 'Maroc').replace(/\s*\(Maroc\)/i, ''),
            sourceUrl,
            sourceId: idMatch || `rekrute-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            source: 'rekrute',
            postedAt,
            contractType,
            description: description.slice(0, 2500),
            sector,
            isRemote,
            city: (locRaw || '').replace(/\s*\(Maroc\)/i, ''),
            experience: experience || undefined,
            requirements: [experience, studyLevel].filter(Boolean),
            keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
          })
        }
      })

      if (pageIndex < 2) await delay(1000 + Math.random() * 1200)
      } catch (error) {
        console.error(`Rekrute page ${pageIndex} error:`, error.message)
        break
      }
    }
    await delay(800 + Math.random() * 1200)
  }

  const unique = dedupeJobs(jobs, j => j.sourceUrl || `${j.title.toLowerCase()}|${j.company.toLowerCase()}`)

  return unique.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── WELCOME TO THE JUNGLE SCRAPER ───────────────────────────────
async function scrapeWTTJ(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  // Le site est 100% rendu en JS. Utilisation de l'API Algolia publique
  // (même backend que welcometothejungle.com) filtrée sur le Maroc.
  const index = 'wk_cms_jobs_production_published_at_desc'
  const appId = 'CSEKHVMS53'
  const apiKey = '4bd8f6215d0cc52b26430765769e65a0'
  const filter = encodeURIComponent('office.country_code:"MA"')

  for (const kw of keywords.slice(0, 4)) {
    try {
      const requests = [{
        indexName: index,
        params: `query=${encodeURIComponent(kw)}&filters=${filter}&hitsPerPage=100&page=0`,
      }]
      const res = await fetchWithRetry('https://csekhvms53-dsn.algolia.net/1/indexes/*/queries', {
        method: 'POST',
        headers: {
          'x-algolia-application-id': appId,
          'x-algolia-api-key': apiKey,
          'content-type': 'application/json',
          'Referer': 'https://www.welcometothejungle.com/',
          'Origin': 'https://www.welcometothejungle.com',
        },
        data: JSON.stringify({ requests }),
      })

      const payload = typeof res === 'string' ? JSON.parse(res) : res.data
      const hits = (payload.results?.[0]?.hits) || []

      for (const hit of hits) {
        const title = normalizeText(hit.name || '')
        if (!title || title.length < 3) continue
        const orgSlug = hit.organization?.slug
        const jobSlug = hit.slug
        const company = cleanCompanyName(hit.organization?.name || '')
        const city = hit.office?.city || ''
        const state = hit.office?.state || ''
        const country = hit.office?.country === 'Morocco' ? 'Maroc' : (hit.office?.country || '')
        const jobLocation = `${city}${state && state !== city ? `, ${state}` : ''}${country ? `, ${country}` : ''}`.replace(/^,\s*/, '') || location
        const sourceUrl = orgSlug && jobSlug
          ? `https://www.welcometothejungle.com/fr/companies/${orgSlug}/jobs/${jobSlug}`
          : `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(kw)}`

        // Description : le champ « profile » contient le texte de l'offre.
        const profile = hit.profile ? normalizeText(String(hit.profile)).replace(/\\-/g, '-') : ''
        const sector = hit.sectors?.[0]?.name?.fr || (Array.isArray(hit.sectors_name?.fr) ? Object.values(hit.sectors_name.fr[0] || {})[0] : '') || ''

        const remoteRaw = String(hit.remote || '')
        const isRemote = /full|partial|always|hybrid|remote/i.test(remoteRaw)
        const remoteLabels = { full: 'complet', always: 'complet', partial: 'partiel', punctual: 'ponctuel', hybrid: 'hybride', remote: 'à distance' }
        const remoteLabel = remoteLabels[remoteRaw] || remoteRaw

        let salary
        if (hit.salary_minimum || hit.salary_maximum) {
          salary = {
            min: hit.salary_minimum || hit.salary_maximum || 0,
            max: hit.salary_maximum || hit.salary_minimum || 0,
            currency: hit.salary_currency || 'MAD',
            period: hit.salary_period === 'yearly' ? 'yearly' : 'monthly',
          }
        }

        const experience = hit.has_experience_level_minimum ? `${hit.experience_level_minimum}+ ans` : ''
        const education = hit.education_level ? (hit.education_level === 'BAC_5' ? 'Bac +5' : `Bac +${hit.education_level.replace(/\D/g, '')}`) : ''
        const contractType = normalizeContractType(hit.contract_type_names?.fr || hit.contract_type || inferContractType(title, profile)) || 'CDI'

        const description = [
          profile,
          contractType ? `Contrat : ${contractType}` : '',
          remoteLabel ? `Télétravail : ${remoteLabel}` : '',
        ].filter(Boolean).join('\n')

        jobs.push({
          title,
          company: company || 'Non spécifié',
          companyLogo: hit.organization?.logo?.url || '',
          location: jobLocation,
          sourceUrl,
          sourceId: hit.objectID || hit.reference || jobSlug || `wttj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: 'welcometothejungle',
          postedAt: hit.published_at ? new Date(hit.published_at) : new Date(),
          contractType,
          description: description.slice(0, 2500),
          sector,
          isRemote,
          salary,
          requirements: [education, experience].filter(Boolean),
          keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
        })
      }
    } catch (error) {
      console.error(`WTTJ Algolia query "${kw}" error:`, error.message)
    }
  }

  // Les objectIDs Algolia diffèrent parfois pour un même poste
  // (doublons sur le site) : on déduppe par contenu titre+entreprise+ville.
  const unique = dedupeJobs(jobs, j => `${j.title.toLowerCase()}|${j.company.toLowerCase()}|${j.location.toLowerCase()}`)

  return unique.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── MANPOWER SCRAPER ─────────────────────────────────────────────
// Manpower Maroc a déménagé : www.manpower.ma (domaine mort, NXDOMAIN) → www.manpower-maroc.com.
// Page ATS « Nos offres emploie » rendue côté serveur : ul.jobslist > li, pagination ?page=N (10/p).
async function scrapeManpower(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  const listUrl = 'https://www.manpower-maroc.com/ats/offres'
  const maxPages = 6

  for (let page = 1; page <= maxPages; page++) {
    let data = ''
    try {
      const { data: d } = await fetchWithRetry(`${listUrl}?page=${page}&cle=&domaine=&ville=`)
      data = d
    } catch (error) {
      console.error(`Manpower page ${page} error:`, error.message)
      break
    }

    const $ = cheerio.load(data)
    const rows = $('ul.jobslist li:has(.jobint)')
    if (rows.length === 0) break

    rows.each((_, el) => {
      const row = $(el)
      const link = row.find('h4 a').first()
      const title = normalizeText(link.text())
      const href = link.attr('href') || ''
      if (!title || title.length <= 3 || !href) return
      const sourceUrl = href.startsWith('http') ? href : `https://www.manpower-maroc.com${href}`
      const idMatch = sourceUrl.match(/\/(\d+)\/?$/) || []
      const sector = normalizeText(row.find('.company a').first().text())
      const loc = normalizeText(row.find('.jobloc span').first().text()) || location

      jobs.push({
        title,
        company: 'Manpower Maroc',
        location: loc,
        sourceUrl,
        sourceId: idMatch[1] || sourceUrl.split('/').filter(Boolean).slice(-2, -1)[0] || sourceUrl,
        source: 'manpower',
        postedAt: new Date(),
        contractType: '',
        description: '',
        sector,
        keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
        _detailUrl: sourceUrl,
      })
    })

    if (page < maxPages) await delay(900 + Math.random() * 900)
  }

  const seen = new Set()
  const unique = jobs.filter(j => {
    const key = j.sourceUrl.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Enrichissement : description, type de contrat, date d'annonce... depuis la page détail.
  const toEnrich = unique.slice(0, 30)
  for (const job of toEnrich) {
    try {
      const { data } = await fetchWithRetry(job._detailUrl)
      const $ = cheerio.load(data)
      const description = normalizeText($('.contentbox').first().text())
        .replace(/^Offre d'emploi\s*:/i, '')
        .slice(0, 2500)
      job.description = description
      job.contractType = inferContractType(job.title, description)

      const dateTxt = normalizeText($('.ptext').first().text())
      job.postedAt = parseExactDate(dateTxt) || job.postedAt

      const detail = {}
      $('.jobdetail ul.jbdetail li').each((_, li) => {
        const $li = $(li)
        const key = normalizeText($li.find('.text-left').first().text()).replace(/[:\s]*$/, '').toLowerCase()
        const val = normalizeText($li.find('span').first().text())
        if (key && val) detail[key] = val
      })
      if (detail.type) {
        // Le « Type » explicite de la fiche prime sur l'inférence (qui peut sur-se maîtriser « Missions » → Freelance).
        const contract = normalizeContractType(detail.type) || job.contractType
        if (contract) job.contractType = contract
      }
      if (detail['domaine'] && !job.sector) job.sector = detail['domaine']
      if (detail['lieu']) job.location = detail['lieu']
      if (detail['référence']) job.reference = detail['référence']
      const studyLevel = detail["niveau d'étude"]
      const experience = detail["niveau d'expérience"]
      job.requirements = [experience, studyLevel].filter(Boolean)
      if (experience) job.experience = experience
      delete job._detailUrl
    } catch (error) {
      delete job._detailUrl
      console.error('Manpower detail error:', error.message)
    }
    await delay(600 + Math.random() * 700)
  }

  const clean = unique.map(j => {
    const { _detailUrl, ...rest } = j
    return rest
  })

  return clean.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── DREAMJOB SCRAPER (WordPress / JNews theme) ────────────────
async function scrapeDreamjob(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  const pages = ['', '/page/2/']

  // Posts de dreamjob qui ne sont pas des offres d'emploi à proprement parler.
  const NON_JOB_PATTERN = /^(?:résultats?|resultats?|convocations?|listes? (?:des )?(?:admis|retenus)|avis|programme(?:s)?|communiqu[ée]s?|report|journ[ée]e(?:s)? (?:de recru|portes|d'information)?|planning|réunion)\b/i

  for (const pagePath of pages) {
    try {
      const url = `https://www.dreamjob.ma/emploi${pagePath}`
      const { data } = await fetchWithRetry(url)

      const $ = cheerio.load(data)

      let foundOnPage = 0
      $('article.jeg_post, div.jeg_post, article.post').each((_, el) => {
        const card = $(el)
        const titleEl = card.find('h3.jeg_post_title a, h2.jeg_post_title a, .jeg_post_title a, a[href*="dreamjob.ma/"]').first()
        const title = normalizeText(titleEl.text())
        const href = titleEl.attr('href') || ''
        if (!title || title.length <= 3 || !href) return
        if (NON_JOB_PATTERN.test(title)) return

        const dateText = normalizeText(card.find('.jeg_meta_date, .jeg_meta_date a, time, span.date, .published').first().text())
        let postedAt = null
        const dmy = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        if (dmy) postedAt = new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]))
        if (!postedAt || isNaN(postedAt.getTime())) postedAt = parseExactDate(dateText)
        if (!postedAt) postedAt = new Date()

        const description = normalizeText(card.find('.jeg_post_excerpt, .jeg_post_excerpt p, .entry-content p').first().text())

        // Nom de l'organisation : déduit du titre (« ... chez <org> à <ville> »)
        // ou de l'image mise en avant (alt), ou d'un « Ministère ... ».
        let company = 'DreamJob Maroc'
        const chezIdx = title.search(/chez\s+/i)
        if (chezIdx >= 0) {
          const after = title.slice(chezIdx).replace(/^chez\s+/i, '')
          company = after.split(/\s+(?:à|a|at)\s+/i)[0]
            .split(/\s*[|–\-()]\s*/)[0]
            .trim()
        }
        const ministryMatch = title.match(/^(?:Concours\s+de\s+)?Recrutement\s+(?:(?:du|de|d['’])\s+)?(Minist[èe]re[^(\d]*)/i)
        if (ministryMatch) company = ministryMatch[1].trim()
        if (company === 'DreamJob Maroc') {
          const imgAlt = card.find('img.jeg_logo_img, img.wp-post-image').attr('alt')
          const cleaned = cleanCompanyName(imgAlt || '')
          if (cleaned && !/dcouverture|premium|publireportage/i.test(cleaned)) company = cleaned
        }
        if (company.length > 60) company = company.substring(0, 60)

        foundOnPage++
        jobs.push({
          title,
          company,
          location,
          sourceUrl: href,
          source: 'dreamjob',
          sourceId: href.split('/').filter(Boolean).pop() || '',
          postedAt,
          contractType: inferContractType(title, description),
          description: description ? description.slice(0, 1500) : '',
          sector: guessSector(title, description),
          isRemote: /télétravail|remote|télé-travail|à distance/i.test(`${title} ${description}`.slice(0, 300)),
          keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
        })
      })

      if (foundOnPage === 0 && pagePath === '') break
      await delay(1500 + Math.random() * 1000)
    } catch (error) {
      console.error('DreamJob page', pagePath, 'error:', error.message)
      if (pagePath === '') break
    }
  }

  return dedupeJobs(jobs, j => j.sourceUrl).map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── ONEJOB.MA SCRAPER (Drupal; cartes schema.org server-rendered) ─
// Remplace l'ancien Emploi.ma (bloqué par Cloudflare). Recherche : /recherche?query=%2A&q=...&page=N.
async function scrapeOneJob(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  const words = keywords.slice(0, 4)

  for (const kw of words) {
    let got = 0
    for (let page = 1; page <= 3; page++) {
      try {
        const url = `https://www.onejob.ma/recherche?query=%2A&q=${encodeURIComponent(kw)}&page=${page}`
        const { data } = await fetchWithRetry(url)
        const $ = cheerio.load(data)

        const cards = $('article.oj-job-card')
        if (cards.length === 0) break

        let newOnPage = 0
        cards.each((_, el) => {
          const card = $(el)
          const link = card.find('.oj-job-title a').first()
          const title = normalizeText(link.text())
          const href = link.attr('href') || ''
          if (!title || title.length <= 3 || !href) return

          const sourceUrl = href.startsWith('http') ? href : `https://www.onejob.ma${href}`
          const company = normalizeText(card.find('.oj-company-name span').first().text()) || 'Non spécifié'
          const city = normalizeText(card.find('[itemprop="jobLocation"] [itemprop="address"]').first().text())
          const sector = normalizeText(card.find('.oj-job-meta span').filter((_, s) => $(s).find('i.la-briefcase').length).first().text())
          const typeRaw = normalizeText(card.find('.oj-job-type').first().text())
          const excerpt = normalizeText(card.find('.oj-job-excerpt').first().text())
          const salaryText = normalizeText(card.find('.oj-job-meta span').filter((_, s) => $(s).find('i.la-credit-card').length).first().text())
          const datePosted = card.find('meta[itemprop="datePosted"]').attr('content')
          let postedAt = new Date()
          if (datePosted) {
            const d = new Date(datePosted)
            if (!isNaN(d.getTime())) postedAt = d
          }
          const idMatch = sourceUrl.match(/\/(\d+)\//)

          jobs.push({
            title,
            company,
            location: city || location,
            sourceUrl,
            sourceId: (idMatch || [])[1] || `onejob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            source: 'onejob',
            postedAt,
            contractType: (typeRaw && normalizeContractType(typeRaw)) || inferContractType(title, excerpt),
            description: excerpt.slice(0, 1200),
            sector,
            isRemote: /télétravail|remote|à distance|hybride/i.test(`${title} ${excerpt}`.slice(0, 300)),
            city: city || undefined,
            salary: salaryText && !/^1\s?dhs\s*[-–]\s*1\s?dhs/i.test(salaryText) ? salaryText.slice(0, 60) : undefined,
            keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
          })
          newOnPage++
        })

        if (newOnPage === 0) break
        got += newOnPage
      } catch (error) {
        console.error(`OneJob page ${page} error:`, error.message)
        break
      }
      if (page < 3) await delay(900 + Math.random() * 900)
    }
    if (got === 0) continue
  }

  const seen = new Set()
  const unique = jobs.filter(j => {
    const key = j.sourceUrl.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── MAROCEMPLOI.NET SCRAPER (WordPress/jobsearch; cards .me-job-card) ─
// Listes : /offre/ (offres actives, rendues côté serveur, pas de pagination exploitable).
// La description est enrichie depuis la fiche détail (description JSON-LD / .me-job-description__content).
async function scrapeMarocEmploi(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  const seenCards = new Set()
  const listUrl = 'https://marocemploi.net/offre/'

  try {
    const { data } = await fetchWithRetry(listUrl)
    const $ = cheerio.load(data)
    const cards = $('article.me-job-card')
    if (cards.length === 0) return jobs

    cards.each((_, el) => {
      const card = $(el)
      const link = card.find('.me-job-card__title-row h3 a').first()
      const title = normalizeText(link.text())
      const href = link.attr('href') || ''
      if (!title || title.length <= 3 || !href) return

      const sourceUrl = href.startsWith('http') ? href : `https://marocemploi.net${href}`
      if (seenCards.has(sourceUrl)) return
      seenCards.add(sourceUrl)

      const company = normalizeText(card.find('.me-job-card__company').first().text()) || 'Non spécifié'
      const city = normalizeText(card.find('.me-meta li').not('.me-job-card__company').first().text())
      const sector = normalizeText(card.find('.me-job-card__secondary').first().text())
      const contractRaw = normalizeText(card.find('.me-job-card__action .me-badge').first().text())
      const datetime = card.find('time').attr('datetime')
      let postedAt = new Date()
      if (datetime) {
        const d = new Date(datetime)
        if (!isNaN(d.getTime())) postedAt = d
      }

      jobs.push({
        title,
        company,
        location: city || location,
        sourceUrl,
        sourceId: sourceUrl.split('/').filter(Boolean).pop() || sourceUrl,
        source: 'marocemploi',
        postedAt,
        contractType: (contractRaw && normalizeContractType(contractRaw)) || inferContractType(title, sector),
        description: '',
        sector,
        isRemote: /télétravail|remote|à distance|hybride/i.test(`${title} ${sector}`.slice(0, 300)),
        city: city || undefined,
        keywords: title.split(/[\s(]/).filter(w => w.length > 3).slice(0, 8),
        _detailUrl: sourceUrl,
      })
    })
  } catch (error) {
    console.error('MarocEmploi list error:', error.message)
  }

  const toEnrich = jobs.slice(0, 20)
  for (const job of toEnrich) {
    try {
      const { data } = await fetchWithRetry(job._detailUrl)
      const $ = cheerio.load(data)
      const ldText = $('script[type="application/ld+json"]').first().text()
      const ld = ldText ? (JSON.parse(ldText) || null) : null

      let desc = normalizeText($('.me-job-description__content').first().text())
      if (!desc && ld) desc = normalizeText(String(ld.description || ''))
      if (!desc) desc = normalizeText($('meta[name="description"]').attr('content') || '')
      job.description = desc.slice(0, 2500)

      if (ld) {
        if (!job.city && ld.jobLocation?.address?.addressLocality) {
          const c = normalizeText(String(ld.jobLocation.address.addressLocality))
          if (c) { job.city = c; job.location = c }
        }
        if (!job.company && ld.hiringOrganization?.name) {
          const n = normalizeText(String(ld.hiringOrganization.name))
          if (n) job.company = n
        }
        if (ld.datePosted) {
          const d = new Date(ld.datePosted)
          if (!isNaN(d.getTime())) job.postedAt = d
        }
        if (ld.employmentType) {
          const et = Array.isArray(ld.employmentType) ? ld.employmentType.join(' ') : ld.employmentType
          const ct = normalizeContractType(et)
          if (ct && String(ct) !== 'CDI') job.contractType = ct
        }
      }
      delete job._detailUrl
    } catch (error) {
      delete job._detailUrl
      console.error('MarocEmploi detail error:', error.message)
    }
    await delay(700 + Math.random() * 600)
  }

  const clean = jobs.map(j => {
    const { _detailUrl, ...rest } = j
    return rest
  })

  return clean.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── SOURCES DISPONIBLES ─────────────────────────────────────────
// Sources des sites externes alimentant les offres externes (tout sauf secteur public).
// Emploi.ma (bloqué Cloudflare) remplacé par OneJob.ma et MarocEmploi.net.
export const SITE_SOURCES = ['linkedin', 'indeed', 'welcometothejungle', 'rekrute', 'manpower', 'dreamjob', 'onejob', 'marocemploi']

// Source des concours publics marocains.
export const CONCOURS_SOURCE = 'concours'

// Sources du secteur public (concours + emplois publics), isolées des sites externes :
// elles ne sont lancées que lorsqu'elles sont explicitement demandées (onglet
// « Emplois publics & Concours ») et récupèrent aussi les news / infos de l'État.
export const PUBLIC_SOURCES = ['concours', 'emploi-public']

// ─── EMPLOIS PUBLICS MAROCAINS (emploi-public.ma) ─────────────
const CONCOURS_BASE = 'https://www.emploi-public.ma'

// Sections du portail emploi-public.ma : les concours, les emplois supérieurs,
// les postes de responsabilités et le recrutement des experts partagent le même
// gabarit de cartes (#listing-switcher .s-item a.card). Seuls le chemin des
// détails et le domaine changent.
const PUBLIC_LIST_CATEGORIES = [
  { key: 'concours', label: 'Concours de recrutement', path: 'concours-liste', detailsPath: '/concours/details/', source: CONCOURS_SOURCE, domain: 'Concours public', pages: 3 },
  { key: 'emploi-sup', label: 'Emplois supérieurs', path: 'emploi-sup-liste', detailsPath: '/emploi-sup/details/', source: 'emploi-public', domain: 'Emplois supérieurs', pages: 1 },
  { key: 'postes-respo', label: 'Postes de responsabilités', path: 'postes-respo-liste', detailsPath: '/postes-respo/details/', source: 'emploi-public', domain: 'Postes de responsabilités', pages: 1 },
  { key: 'experts', label: 'Recrutement des experts', path: 'experts-liste', detailsPath: '/experts/details/', source: 'emploi-public', domain: 'Recrutement des experts', pages: 1 },
]

async function scrapePublicList({ onlyConcours = false, userProfile = null } = {}) {
  const jobs = []
  const categories = PUBLIC_LIST_CATEGORIES.filter(c => !onlyConcours || c.source === CONCOURS_SOURCE)

  for (const cat of categories) {
    for (let pageNum = 1; pageNum <= cat.pages; pageNum++) {
      try {
        const url = pageNum === 1
          ? `${CONCOURS_BASE}/fr/${cat.path}`
          : `${CONCOURS_BASE}/fr/${cat.path}?page=${pageNum}`

        const { data } = await fetchWithRetry(url)
        if (/Just a moment|challenge-platform|cf-chl/i.test(data)) break

        const $ = cheerio.load(data)

        // Les cartes de la Une (« dernières chances », à la une) utilisent h3.card-title
        // et ne sont pas dans des .s-item ; on ne les reprend que sur la page 1.
        const mainSelector = `#listing-switcher .s-item a.card[href*="${cat.detailsPath}"]`
        const selectors = pageNum === 1
          ? [mainSelector, `.c-wrapper a.card[href*="${cat.detailsPath}"]`]
          : [mainSelector]

        let found = 0
        for (const selector of selectors) {
          $(selector).each((_, el) => {
            const card = $(el)
            const href = $(card).attr('href') || ''
            const uuidMatch = href.match(/details\/([a-f0-9-]{8,})/i)
            if (!href || !href.includes(cat.detailsPath)) return

            const title = normalizeText($(card).find('h2.card-title, h3.card-title').first().text())
            if (!title || title.length <= 5) return

            const org = normalizeText($(card).find('.card-text').text()).replace(/^Ministère/i, 'Ministère')

            // « 12 jours restants » → échéance approximative (seuls les encarts urgents l'affichent)
            const msgText = normalizeText($(card).find('.card-msg').text())
            let daysLeft = 0
            const daysMatch = msgText.match(/(\d+)\s+jours?\s+restants?/i)
            if (daysMatch) daysLeft = parseInt(daysMatch[1])

            const footerTexts = $(card).find('.card-footer div').map((_, d) => normalizeText($(d).text())).get()

            let nbPostes = ''
            const postesMatch = footerTexts.find(t => /(\d+)\s*postes?\s*$/i.test(t))
            if (postesMatch) {
              const m = postesMatch.match(/(\d+)\s*postes?/i)
              nbPostes = m ? m[1] : ''
            }

            let depositDeadline = ''
            const limText = footerTexts.find(t => /Limite de d/i.test(t))
            if (limText) depositDeadline = limText.replace(/Limite de d[^:]*:\s*/i, '').replace(/-\s*\d{2}:\d{2}$/, '').trim()

            let examDateRaw = ''
            const examText = footerTexts.find(t => /Date du concours/i.test(t))
            if (examText) examDateRaw = examText.replace(/Date du concours\s*:\s*/i, '').trim()

            let deadlineDate = null
            if (depositDeadline) {
              const parsed = parseExactDate(depositDeadline)
              if (parsed && !isNaN(parsed.getTime())) deadlineDate = parsed
            } else if (daysLeft > 0) {
              deadlineDate = new Date(Date.now() + daysLeft * 86400000)
            }

            let examDate = null
            if (examDateRaw) {
              const parsed = parseExactDate(examDateRaw)
              if (parsed && !isNaN(parsed.getTime())) examDate = parsed
            }

            const online = $(card).find('.card--btn .btn-danger').length > 0
            const avancement = normalizeText($(card).find('.card--btn .card-type').text())

            const descriptionParts = [
              org,
              nbPostes ? `Nombre de postes : ${nbPostes}` : '',
              depositDeadline ? `Limite de dépôt : ${depositDeadline}` : (daysLeft ? `Limite de dépôt : ${daysLeft} jours restants` : ''),
              examDateRaw ? `Date du concours : ${examDateRaw}` : '',
              avancement ? `Avancement : ${avancement}` : '',
              online ? 'Dépôt en ligne : Oui' : 'Dépôt du dossier de candidature : voir l\'avis officiel',
            ].filter(Boolean)

            found++
            jobs.push({
              source: cat.source,
              title,
              company: org || 'Administration publique marocaine',
              location: 'Maroc',
              sourceUrl: `${CONCOURS_BASE}${href}`,
              sourceId: uuidMatch ? uuidMatch[1] : `${cat.key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              postedAt: new Date(),
              contractType: 'CDI',
              description: descriptionParts.join(' | ').slice(0, 1200),
              sector: 'Fonction publique',
              domain: cat.domain,
              applicationDeadline: deadlineDate || undefined,
              nbPostes: nbPostes ? parseInt(nbPostes) : undefined,
              keywords: title.split(/\s+/).filter(w => w.length > 4).slice(0, 10),
              examDate: examDate || undefined,
              depositDeadlineText: depositDeadline || undefined,
              examDateText: examDateRaw || undefined,
            })
          })
        }

        if (found === 0 && pageNum === 1) break
        await delay(1200 + Math.random() * 800)
      } catch (error) {
        console.error(`${cat.key} page`, pageNum, 'error:', error.message)
        if (pageNum === 1) break
      }
    }
  }

  return dedupeJobs(jobs, j => j.sourceId)
    .slice(0, 150)
    .map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

async function scrapeConcoursMaroc(userProfile = null) {
  return scrapePublicList({ onlyConcours: true, userProfile })
}

// Secteur public complet : offres (concours + emplois publics) ET actualités /
// infos de l'État + concours prochains. Les news reprennent :
//  - la Une d'emploi-public.ma (« concours à la une ») → actualité,
//  - la section « Dernière chance pour postuler » → infos urgentes,
//  - les concours dont la date d'examen est à venir → « concours prochains ».
// L'ensemble est retourné séparément { jobs, news } pour un affichage trié.
export async function scrapePublicSector(userProfile = null) {
  const jobs = await scrapePublicList({ userProfile })
  const news = []

  try {
    const { data } = await fetchWithRetry(`${CONCOURS_BASE}/fr/`)
    if (!/Just a moment|challenge-platform|cf-chl/i.test(data)) {
      const $ = cheerio.load(data)

      $('.container.c-wrapper a.card[href*="/concours/details/"]').slice(0, 8).each((_, el) => {
        const card = $(el)
        const href = $(card).attr('href') || ''
        const m = href.match(/details\/([a-f0-9-]{8,})/i)
        const title = normalizeText($(card).find('h2.card-title, h3.card-title').first().text())
        if (!title || title.length <= 5) return
        const org = normalizeText($(card).find('.card-text').text())
        const img = $(card).find('img').attr('src') || ''
        news.push({
          category: 'actualite',
          title,
          org: org || 'Administration publique marocaine',
          excerpt: 'Annonce publiée sur le portail de l\'emploi public marocain',
          sourceUrl: `${CONCOURS_BASE}${href}`,
          sourceId: m ? `act-${m[1]}` : `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          imageUrl: img ? `${CONCOURS_BASE}${img.startsWith('/') ? img : `/${img}`}` : '',
          postedAt: new Date(),
          tags: ['actualite', 'etat'],
        })
      })

      // « Dernière chance pour postuler » → échéances imminentes
      $('.c-wrapper.bg-blue a.card[href*="/concours/details/"]').slice(0, 6).each((_, el) => {
        const card = $(el)
        const href = $(card).attr('href') || ''
        const m = href.match(/details\/([a-f0-9-]{8,})/i)
        const title = normalizeText($(card).find('h2.card-title, h3.card-title').first().text())
        if (!title || title.length <= 5) return
        const org = normalizeText($(card).find('.card-text').text())
        const msg = normalizeText($(card).find('.card-msg').text())
        news.push({
          category: 'info',
          title,
          org: org || 'Administration publique marocaine',
          excerpt: msg || 'Dernière chance pour postuler',
          sourceUrl: `${CONCOURS_BASE}${href}`,
          sourceId: m ? `urg-${m[1]}` : `urg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          postedAt: new Date(),
          tags: ['information', 'etat', 'urgent'],
        })
      })
    }
  } catch (error) {
    console.error('News emploi-public (accueil) error:', error.message)
  }

  // Concours prochains : date d'examen dans le futur, triés par date croissante
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = jobs
    .filter(j => j.source === CONCOURS_SOURCE && j.examDate && new Date(j.examDate) >= today)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
    .slice(0, 8)
    .map(j => ({
      category: 'concours-prochain',
      title: j.title.replace(/^Avis de concours de recrutement de\s*/i, ''),
      org: j.company || 'Administration publique marocaine',
      excerpt: [
        j.examDateText ? `Date du concours : ${j.examDateText}` : '',
        j.depositDeadlineText ? `Limite de dépôt : ${j.depositDeadlineText}` : '',
      ].filter(Boolean).join(' — ') || 'Concours dont la date d\'examen est à venir',
      sourceUrl: j.sourceUrl,
      sourceId: `up-${j.sourceId}`,
      eventDate: new Date(j.examDate),
      postedAt: new Date(),
      tags: ['concours prochain'],
    }))

  news.push(...upcoming)

  return {
    jobs,
    news: dedupeJobs(news, n => n.sourceId),
  }
}

// ─── MAIN SCRAPING ORCHESTRATOR ───────────────────────────────────
export async function scrapeAllSources(keywords, location = 'Maroc', enabledSources = ['linkedin', 'indeed', 'welcometothejungle', 'rekrute', 'dreamjob'], userProfile = null, onProgress = null) {
  const results = {}

  const scrapers = {
    linkedin: () => scrapeLinkedIn(keywords, location, userProfile),
    indeed: () => scrapeIndeed(keywords, location, userProfile),
    rekrute: () => scrapeRekrute(keywords, userProfile),
    welcometothejungle: () => scrapeWTTJ(keywords, location, userProfile),
    manpower: () => scrapeManpower(keywords, location, userProfile),
    dreamjob: () => scrapeDreamjob(keywords, location, userProfile),
    onejob: () => scrapeOneJob(keywords, location, userProfile),
    marocemploi: () => scrapeMarocEmploi(keywords, location, userProfile),
    concours: () => scrapeConcoursMaroc(userProfile),
  }

  for (const source of enabledSources) {
    const scraper = scrapers[source]
    if (!scraper) continue

    results[source] = { jobs: [], status: 'pending', duration: 0 }
    const start = Date.now()
    try {
      const jobs = await scraper()
      results[source] = {
        jobs,
        status: jobs.length > 0 ? 'success' : 'partial',
        duration: Date.now() - start,
      }
    } catch (error) {
      results[source] = {
        jobs: [],
        status: 'failed',
        duration: Date.now() - start,
        error: error.message,
      }
    }
    if (typeof onProgress === 'function') {
      onProgress(source, results[source])
    }
    await delay(2000 + Math.random() * 1500)
  }

  return results
}

// ─── RECRUITER SCRAPER (enhanced with real public data) ──────────
const MOROCCAN_COMPANIES = [
  { name: 'TechMaroc Solutions', domain: 'tech', size: '201-500', city: 'Casablanca', website: 'https://techmaroc.ma', industry: 'Technologie / IT' },
  { name: 'CloudAfrica', domain: 'tech', size: '51-200', city: 'Rabat', website: 'https://cloudafrica.com', industry: 'Cloud / DevOps' },
  { name: 'DigitalCraft', domain: 'digital', size: '51-200', city: 'Marrakech', website: 'https://digitalcraft.ma', industry: 'Marketing / Digital' },
  { name: 'AppWorks', domain: 'mobile', size: '11-50', city: 'Tanger', website: 'https://appworks.ma', industry: 'Mobile / Tech' },
  { name: 'SecuNet', domain: 'cybersecurity', size: '11-50', city: 'Rabat', website: 'https://secunet.ma', industry: 'Cybersécurité' },
  { name: 'OCP Digital', domain: 'tech', size: '501-1000', city: 'Casablanca', website: 'https://ocp.ma', industry: 'Industrie / Tech' },
  { name: 'Involys', domain: 'tech', size: '201-500', city: 'Casablanca', website: 'https://involys.com', industry: 'Technologie / IT' },
  { name: 'Telnet', domain: 'tech', size: '201-500', city: 'Tanger', website: 'https://telnet.ma', industry: 'Technologie / IT' },
  { name: 'Vermeg', domain: 'fintech', size: '201-500', city: 'Casablanca', website: 'https://vermeg.com', industry: 'Finance / Tech' },
  { name: 'Sofrecom', domain: 'telecom', size: '201-500', city: 'Casablanca', website: 'https://sofrecom.ma', industry: 'Télécoms' },
  { name: 'MarocTelecom', domain: 'telecom', size: '1000+', city: 'Casablanca', website: 'https://maroctelecom.ma', industry: 'Télécoms' },
  { name: 'Orange Maroc', domain: 'telecom', size: '1000+', city: 'Casablanca', website: 'https://orange.ma', industry: 'Télécoms' },
  { name: 'BMCE Bank', domain: 'finance', size: '1000+', city: 'Casablanca', website: 'https://bmcebank.ma', industry: 'Finance / Banque' },
  { name: 'Attijariwafa Bank', domain: 'finance', size: '1000+', city: 'Casablanca', website: 'https://attijariwafabank.com', industry: 'Finance / Banque' },
  { name: 'CIH Bank', domain: 'finance', size: '501-1000', city: 'Casablanca', website: 'https://cihbank.ma', industry: 'Finance / Banque' },
  { name: 'CDG Capital', domain: 'finance', size: '501-1000', city: 'Casablanca', website: 'https://cdgcapital.ma', industry: 'Finance' },
  { name: 'Renault Maroc', domain: 'automobile', size: '1000+', city: 'Casablanca', website: 'https://group.renault.com', industry: 'Automobile' },
  { name: 'Danone Maroc', domain: 'agroalimentaire', size: '501-1000', city: 'Casablanca', website: 'https://danone.com', industry: 'Agroalimentaire' },
  { name: 'LafargeHolcim', domain: 'industrie', size: '1000+', city: 'Casablanca', website: 'https://lafargeholcim.com', industry: 'Construction / Industrie' },
  { name: 'ONCF', domain: 'transport', size: '1000+', city: 'Rabat', website: 'https://oncf.ma', industry: 'Transport / Public' },
  { name: 'ONEE', domain: 'energie', size: '1000+', city: 'Rabat', website: 'https://onee.ma', industry: 'Énergie / Public' },
  { name: 'Holmarcom', domain: 'diversifie', size: '1000+', city: 'Casablanca', website: 'https://holmarcom.com', industry: 'Diversifié' },
  { name: 'AXA Assurance', domain: 'assurance', size: '501-1000', city: 'Casablanca', website: 'https://axa.ma', industry: 'Assurance' },
  { name: 'Wana Corporate', domain: 'telecom', size: '1000+', city: 'Casablanca', website: 'https://wanamaroc.com', industry: 'Télécoms' },
  { name: 'Procter & Gamble', domain: 'fmcg', size: '501-1000', city: 'Casablanca', website: 'https://pg.com', industry: 'FMCG' },
  { name: 'Unilever Maroc', domain: 'fmcg', size: '501-1000', city: 'Casablanca', website: 'https://unilever.com', industry: 'FMCG' },
  { name: 'IBM Maroc', domain: 'tech', size: '201-500', city: 'Casablanca', website: 'https://ibm.com', industry: 'Technologie / IT' },
  { name: 'CGI Maroc', domain: 'tech', size: '201-500', city: 'Casablanca', website: 'https://cgi.com', industry: 'Technologie / IT' },
  { name: 'Accenture Maroc', domain: 'consulting', size: '201-500', city: 'Casablanca', website: 'https://accenture.com', industry: 'Conseil / IT' },
  { name: 'Sopriam', domain: 'automobile', size: '201-500', city: 'Casablanca', website: 'https://sopriam.com', industry: 'Automobile' },
]

const RECRUITER_TITLES = [
  'Recruteur / Talent Acquisition Specialist',
  'Responsable des Ressources Humaines',
  'HR Business Partner',
  'Directeur des Ressources Humaines',
  'Chargé de Recrutement',
  'Head of Talent Acquisition',
  'People Operations Manager',
  'Technical Recruiter',
  'DRH',
  'Chef de Projet Recrutement',
  'Talent Manager',
  'Recruitment Specialist',
]

function extractLinkedInUrl(href) {
  if (!href) return ''
  let url = href
  if (url.includes('/url?q=')) {
    url = decodeURIComponent(url.split('/url?q=')[1].split('&')[0])
  }
  url = url.split('?')[0].split('#')[0]
  if (url.match(/linkedin\.com\/in\/[a-z0-9-%]+(-[a-z0-9-%]+)*\/?$/i)) {
    if (!url.startsWith('http')) url = 'https://www.' + url
    return url
  }
  return ''
}

export async function scrapeRecruiters(keywords, location = 'Maroc', count = 30, userProfile = null) {
  const recruiters = []
  const seenUrls = new Set()

  const domains = userProfile?.domains || keywords || ['tech', 'finance', 'RH']
  const queries = Array.isArray(domains) ? domains : [domains]

  // Search Google for LinkedIn profiles by keyword
  for (const query of queries.slice(0, 3)) {
    try {
      const searchQuery = encodeURIComponent(`site:linkedin.com/in "recruteur" OR "talent acquisition" OR "HR" "${query}" "Maroc" OR "Casablanca" OR "Rabat"`)
      const url = `https://www.google.com/search?q=${searchQuery}&num=20&hl=fr`

      const { data } = await fetchWithRetry(url, {
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
      })

      const $ = cheerio.load(data)

      $('div.g, div[data-sokoban-container]').each((_, el) => {
        const card = $(el)
        const linkEl = card.find('a[href*="linkedin.com/in/"]').first()
        const href = linkEl.attr('href') || ''
        const linkedinUrl = extractLinkedInUrl(href)
        if (!linkedinUrl || seenUrls.has(linkedinUrl)) return

        const titleText = normalizeText(card.find('h3').text())
        const snippetText = normalizeText(card.find('.VwiC3b, .IsZvec, .st').text())

        const nameMatch = titleText.match(/^([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)*)\s*[-–|]\s*/i)
        let firstName = '', lastName = '', headline = ''
        if (nameMatch) {
          const parts = nameMatch[1].trim().split(' ')
          firstName = parts[0] || ''
          lastName = parts.slice(1).join(' ') || ''
          headline = titleText.replace(nameMatch[0], '').trim()
        } else {
          const parts = titleText.split(' ').filter(Boolean)
          firstName = parts[0] || ''
          lastName = parts.slice(1).join(' ') || ''
          headline = snippetText.slice(0, 120)
        }

        const companyMatch = headline.match(/(?:at|chez|@)\s*(.+?)(?:\s*[-–|]|$)/i)
        const company = companyMatch ? companyMatch[1].trim() : (MOROCCAN_COMPANIES.find(c => headline.toLowerCase().includes(c.name.toLowerCase()))?.name || '')

        let sector = ''
        const sectorKeywords = {
          'Technologie / IT': ['tech', 'digital', 'software', 'informatique', 'developer', 'engineer', 'devops'],
          'Finance / Banque': ['finance', 'bank', 'banque', 'comptable', 'auditeur', 'crédit'],
          'Industrie': ['industrie', 'manufactur', 'production', 'usine', 'ingénieur'],
          'Marketing / Digital': ['marketing', 'communication', 'digital', 'social media', 'growth'],
          'Ressources Humaines': ['hr', 'rh', 'recrutement', 'talent', 'people', 'recruiter'],
        }
        const headlineLower = headline.toLowerCase()
        for (const [sec, words] of Object.entries(sectorKeywords)) {
          if (words.some(w => headlineLower.includes(w))) { sector = sec; break }
        }

        if (firstName && firstName.length > 1) {
          seenUrls.add(linkedinUrl)
          recruiters.push({
            firstName, lastName,
            title: headline || 'Recruteur',
            company: company || 'Non spécifié',
            linkedinUrl,
            location: location || 'Casablanca',
            sector: sector || query,
            connectionDegree: ['1st', '2nd', '3rd+'][Math.floor(Math.random() * 3)],
            profilePicture: '',
          })
        }
      })

      await delay(2500 + Math.random() * 2000)
    } catch (error) {
      console.error(`Recruiter Google scraping error for ${query}:`, error.message)
    }
  }

  // Search Google per company for real LinkedIn recruiter profiles
  if (recruiters.length < count) {
    const filteredCompanies = userProfile?.domains?.length
      ? MOROCCAN_COMPANIES.filter(c => {
          const domainLower = c.domain.toLowerCase()
          return userProfile.domains.some(d => d.toLowerCase().includes(domainLower) || domainLower.includes(d.toLowerCase().split(' ')[0]))
        })
      : MOROCCAN_COMPANIES

    const companies = filteredCompanies.length > 0 ? filteredCompanies : MOROCCAN_COMPANIES

    for (const company of companies) {
      if (recruiters.length >= count) break

      try {
        const q = encodeURIComponent(`site:linkedin.com/in "recruteur" OR "RH" OR "talent" "${company.name}" Maroc`)
        const url = `https://www.google.com/search?q=${q}&num=10&hl=fr`

        const { data } = await fetchWithRetry(url, {
          headers: { 'Accept': 'text/html,application/xhtml+xml' },
        })

        const $ = cheerio.load(data)

        $('div.g, div[data-sokoban-container]').each((_, el) => {
          if (recruiters.length >= count) return
          const card = $(el)
          const linkEl = card.find('a[href*="linkedin.com/in/"]').first()
          const href = linkEl.attr('href') || ''
          const linkedinUrl = extractLinkedInUrl(href)
          if (!linkedinUrl || seenUrls.has(linkedinUrl)) return

          const titleText = normalizeText(card.find('h3').text())
          const snippetText = normalizeText(card.find('.VwiC3b, .IsZvec, .st').text())

          const nameMatch = titleText.match(/^([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)*)\s*[-–|]\s*/i)
          let firstName = '', lastName = '', headline = ''
          if (nameMatch) {
            const parts = nameMatch[1].trim().split(' ')
            firstName = parts[0] || ''
            lastName = parts.slice(1).join(' ') || ''
            headline = titleText.replace(nameMatch[0], '').trim()
          } else {
            const parts = titleText.split(' ').filter(Boolean)
            firstName = parts[0] || ''
            lastName = parts.slice(1).join(' ') || ''
            headline = snippetText.slice(0, 120)
          }

          if (firstName && firstName.length > 1) {
            seenUrls.add(linkedinUrl)
            recruiters.push({
              firstName, lastName,
              title: headline || 'Recruteur',
              company: company.name,
              linkedinUrl,
              location: company.city || location || 'Casablanca',
              sector: company.industry || 'Général',
              connectionDegree: ['1st', '2nd', '3rd+'][Math.floor(Math.random() * 3)],
              profilePicture: '',
            })
          }
        })

        await delay(2000 + Math.random() * 2000)
      } catch (error) {
        console.error(`Company LinkedIn search error for ${company.name}:`, error.message)
      }
    }
  }

  return recruiters.slice(0, count)
}

// ─── CANDIDATE MATCHING ──────────────────────────────────────────
export function calculateCandidateMatch(candidateProfile, jobOffer) {
  let score = 0
  let maxScore = 0

  const jobText = `${jobOffer.title} ${jobOffer.description || ''} ${jobOffer.sector || ''} ${jobOffer.domain || ''} ${(jobOffer.keywords || []).join(' ')}`.toLowerCase()

  maxScore += 30
  const skills = candidateProfile.skills || []
  let skillMatches = 0
  for (const skill of skills) {
    if (skill.toLowerCase().length > 2 && jobText.includes(skill.toLowerCase())) skillMatches++
  }
  score += Math.min((skillMatches / Math.max(skills.length, 1)) * 30, 30)

  maxScore += 25
  const domains = candidateProfile.domains || []
  let domainMatch = false
  for (const domain of domains) {
    if (domain.toLowerCase().length > 2 && (jobText.includes(domain.toLowerCase()) || (jobOffer.sector || '').toLowerCase().includes(domain.toLowerCase()))) {
      domainMatch = true
      break
    }
  }
  if (domainMatch) score += 25

  maxScore += 25
  const experience = candidateProfile.experience || []
  let expMatches = 0
  for (const exp of experience) {
    const expText = `${exp.position || ''} ${exp.description || ''}`.toLowerCase()
    const expWords = expText.split(/\s+/).filter(w => w.length > 3)
    for (const word of expWords) {
      if (jobText.includes(word)) expMatches++
    }
  }
  score += Math.min(expMatches * 3, 25)

  maxScore += 10
  const education = candidateProfile.education || []
  for (const edu of education) {
    const eduText = `${edu.field || ''} ${edu.degree || ''}`.toLowerCase()
    if (eduText.split(/\s+/).some(w => w.length > 3 && jobText.includes(w))) {
      score += 10
      break
    }
  }

  maxScore += 8
  const softSkills = candidateProfile.softSkills || []
  let softMatches = 0
  for (const ss of softSkills) {
    if (ss.toLowerCase().length > 3 && jobText.includes(ss.toLowerCase())) softMatches++
  }
  score += Math.min(softMatches * 2, 8)

  maxScore += 6
  const languages = candidateProfile.languages || []
  const langAliases = ['arabe', 'français', 'francais', 'anglais', 'espagnol', 'allemand', 'french', 'english', 'arabic', 'spanish', 'german']
  let langMatch = false
  for (const lgRaw of languages) {
    const lg = (typeof lgRaw === 'string' ? lgRaw : (lgRaw.language || '')).toLowerCase()
    if (jobText.includes(lg.split(/[(\[]/)[0].trim())) {
      langMatch = true
      break
    }
    if (langAliases.some(w => lg.includes(w) && jobText.includes(w))) {
      langMatch = true
      break
    }
  }
  if (langMatch) score += 6

  maxScore += 10
  const candidateCity = (candidateProfile.location?.city || '').toLowerCase()
  const jobLocation = (jobOffer.location || '').toLowerCase()
  if (candidateCity && jobLocation.includes(candidateCity)) {
    score += 10
  } else if (candidateProfile.location?.isRemoteOpen && jobOffer.isRemote) {
    score += 8
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50
}
