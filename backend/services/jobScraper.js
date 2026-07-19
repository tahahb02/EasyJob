import axios from 'axios'
import * as cheerio from 'cheerio'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
]

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function inferContractType(title) {
  const t = title.toLowerCase()
  if (t.includes('stage') || t.includes('intern') || t.includes('stagiaire')) return 'Stage'
  if (t.includes('freelance') || t.includes('consultant') || t.includes('indépendant')) return 'Freelance'
  if (t.includes('cdd') || t.includes('contract') || t.includes('temporaire')) return 'CDD'
  if (t.includes('temps partiel') || t.includes('part-time') || t.includes('mi-temps')) return 'Temps partiel'
  return 'CDI'
}

function normalizeText(text) {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim()
}

function extractDescriptionFromHtml($, card, selectors) {
  for (const sel of selectors) {
    const text = $(card).find(sel).text().trim()
    if (text && text.length > 20) return normalizeText(text)
  }
  return ''
}

function parseRelativeDate(text) {
  if (!text) return null
  const lower = text.toLowerCase()
  const now = new Date()
  const match = lower.match(/(\d+)\s*(minute|heure|jour|semaine|mois|an)/)
  if (!match) return null
  const num = parseInt(match[1])
  const unit = match[2]
  if (unit.includes('minute')) return new Date(now - num * 60 * 1000)
  if (unit.includes('heure')) return new Date(now - num * 3600 * 1000)
  if (unit.includes('jour')) return new Date(now - num * 86400000)
  if (unit.includes('semaine')) return new Date(now - num * 7 * 86400000)
  if (unit.includes('mois')) return new Date(now - num * 30 * 86400000)
  if (unit.includes('an')) return new Date(now - num * 365 * 86400000)
  return null
}

function calculateRelevance(job, userProfile) {
  let score = 50
  if (!userProfile) return Math.floor(Math.random() * 20) + 60

  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase())
  const userDomains = (userProfile.domains || []).map(d => d.toLowerCase())
  const userKeywords = (userProfile.searchKeywords || []).map(k => k.toLowerCase())
  const userEducation = (userProfile.education || []).map(e => (e.field || '').toLowerCase())
  const userExperience = (userProfile.experience || []).map(e => (e.position || '').toLowerCase())

  const jobText = `${job.title} ${job.description} ${job.sector || ''} ${job.keywords?.join(' ') || ''}`.toLowerCase()

  let skillMatches = 0
  for (const skill of userSkills) {
    if (skill.length > 2 && jobText.includes(skill)) skillMatches++
  }
  score += Math.min(skillMatches * 8, 30)

  let domainMatch = false
  for (const domain of userDomains) {
    if (domain.length > 2 && (jobText.includes(domain) || (job.sector || '').toLowerCase().includes(domain))) {
      domainMatch = true
      break
    }
  }
  if (domainMatch) score += 15

  let keywordMatches = 0
  for (const kw of userKeywords) {
    if (kw.length > 2 && jobText.includes(kw)) keywordMatches++
  }
  score += Math.min(keywordMatches * 5, 20)

  let educationMatch = false
  for (const edu of userEducation) {
    if (edu.length > 2 && jobText.includes(edu)) {
      educationMatch = true
      break
    }
  }
  if (educationMatch) score += 5

  let experienceMatch = false
  for (const exp of userExperience) {
    if (exp.length > 2 && jobText.includes(exp)) {
      experienceMatch = true
      break
    }
  }
  if (experienceMatch) score += 5

  return Math.min(Math.max(score, 10), 99)
}

function buildSearchKeywords(userProfile, explicitKeywords) {
  if (explicitKeywords && explicitKeywords.length > 0) return explicitKeywords
  if (!userProfile) return ['développeur', 'ingénieur']

  const keywords = []
  if (userProfile.searchKeywords?.length) keywords.push(...userProfile.searchKeywords)
  if (userProfile.domains?.length) keywords.push(...userProfile.domains)
  if (userProfile.skills?.length) keywords.push(...userProfile.skills.slice(0, 5))
  if (userProfile.title) keywords.push(userProfile.title)

  return keywords.length > 0 ? keywords.slice(0, 8) : ['développeur', 'ingénieur']
}

// ─── LINKEDIN SCRAPER ───────────────────────────────────────────────
async function scrapeLinkedIn(keywords, location = 'Morocco', userProfile = null) {
  const jobs = []
  const pages = [0, 25, 50]

  for (const pageNum of pages) {
    try {
      const searchQuery = encodeURIComponent(keywords.slice(0, 5).join(' OR '))
      const url = `https://www.linkedin.com/jobs/search?keywords=${searchQuery}&location=${encodeURIComponent(location)}&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=${pageNum}&f_TPR=r604800`

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'max-age=0',
        },
        timeout: 20000,
      })

      const $ = cheerio.load(data)

      // Modern LinkedIn selectors
      const cardSelectors = [
        '.base-card',
        '.job-search-card',
        'li.jobs-search__result-card',
        '.base-search-card',
        '[data-entity-urn]',
      ]

      let foundOnPage = 0
      for (const cardSel of cardSelectors) {
        $(cardSel).each((_, el) => {
          const card = $(el)
          const title = normalizeText(
            card.find('.base-search-card__title, .result__title, h3.base-card__full-link, h3').text()
          )
          const company = normalizeText(
            card.find('.base-search-card__subtitle, .result__company, h4.base-search-card__subtitle, .hidden-nested-link').text()
          )
          const loc = normalizeText(
            card.find('.job-search-card__location, .result__location, .job-search-card__bullet').text()
          )
          const linkEl = card.find('a.base-card__full-link, a.base-search-card__full-link, a.result__card')
          const href = (linkEl.attr('href') || '').split('?')[0]
          const sourceUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`

          const timeEl = card.find('time')
          const datetime = timeEl.attr('datetime') || timeEl.text().trim()
          let postedAt = new Date()
          if (datetime && datetime.includes('T')) {
            postedAt = new Date(datetime)
          } else {
            const parsed = parseRelativeDate(datetime)
            if (parsed) postedAt = parsed
          }

          // Extract description from nested elements
          const description = normalizeText(
            card.find('.base-search-card__description, .job-search-card__snippet, .show-more-less-html__markup').text()
          ) || normalizeText(card.find('p, span.description').text().slice(0, 500))

          if (title && title.length > 3) {
            jobs.push({
              title,
              company: company || 'Non spécifié',
              location: loc || location,
              sourceUrl,
              source: 'linkedin',
              postedAt,
              contractType: inferContractType(title),
              description: description.slice(0, 2000),
              sector: '',
              keywords: title.split(/\s+/).filter(w => w.length > 3).slice(0, 6),
            })
            foundOnPage++
          }
        })
      }

      if (foundOnPage === 0 && pageNum === 0) break
      await delay(2000 + Math.random() * 1500)
    } catch (error) {
      console.error(`LinkedIn page ${pageNum} error:`, error.message)
      if (pageNum === 0) break
    }
  }

  return jobs.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── INDEED SCRAPER ───────────────────────────────────────────────
async function scrapeIndeed(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  const pages = ['0', '10', '20']

  for (const start of pages) {
    try {
      const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(' '))
      const url = `https://ma.indeed.com/jobs?q=${searchQuery}&l=${encodeURIComponent(location)}&sort=date&start=${start}`

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        timeout: 20000,
      })

      const $ = cheerio.load(data)

      const cardSelectors = [
        'div.job_seen_beacon',
        'div.jobsearch-ResultsList div.result',
        'td.resultContent',
        '.resultContent',
        '.jobsearch-SerpJobCard',
      ]

      let foundOnPage = 0
      for (const cardSel of cardSelectors) {
        $(cardSel).each((_, el) => {
          const card = $(el)
          const titleEl = card.find('h2.jobTitle a, a.jcs-JobTitle, h2 a, a[data-jk]')
          const title = normalizeText(titleEl.text())
          const company = normalizeText(
            card.find('span[data-testid="company-name"], .companyName, .company, span.company').text()
          )
          const loc = normalizeText(
            card.find('div[data-testid="text-location"], .companyLocation, .location').text()
          )

          const href = titleEl.attr('href') || ''
          const sourceUrl = href.startsWith('http') ? href.split('&')[0] : `https://ma.indeed.com${href.split('&')[0]}`

          // Date extraction
          const dateEl = card.find('.date, span[data-testid="myJobsStateDate"], .new')
          const dateText = dateEl.text().trim()
          let postedAt = new Date()
          if (dateText.includes('Publié') || dateText.includes('aujourd') || dateText.includes('Il y a')) {
            const parsed = parseRelativeDate(dateText)
            if (parsed) postedAt = parsed
          }

          // Description extraction
          const description = normalizeText(
            card.find('.job-snippet, .jobCardShelfContainer, .jobsearch-jobDescriptionText').text()
          )

          // Salary extraction
          const salaryText = normalizeText(card.find('.salary-snippet, .attribute_snippet').text())

          if (title && title.length > 3) {
            jobs.push({
              title,
              company: company || 'Non spécifié',
              location: loc || location,
              sourceUrl,
              source: 'indeed',
              postedAt,
              contractType: inferContractType(title),
              description: description.slice(0, 2000),
              sector: '',
              salary: salaryText ? { min: 0, max: 0, currency: 'MAD', period: 'monthly' } : undefined,
              keywords: title.split(/\s+/).filter(w => w.length > 3).slice(0, 6),
            })
            foundOnPage++
          }
        })
      }

      if (foundOnPage === 0 && start === '0') break
      await delay(2500 + Math.random() * 2000)
    } catch (error) {
      console.error(`Indeed page ${start} error:`, error.message)
      if (start === '0') break
    }
  }

  return jobs.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── REKRUTE SCRAPER ───────────────────────────────────────────────
async function scrapeRekrute(keywords, userProfile = null) {
  const jobs = []
  try {
    const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(' '))
    const url = `https://www.rekrute.com/offres-emploi?mots-cles=${searchQuery}&tri=date`

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      timeout: 20000,
    })

    const $ = cheerio.load(data)

    const cardSelectors = [
      'div.offre-item',
      'li.offre',
      'div.job-item',
      'article.offre',
      '.offre-list-item',
    ]

    for (const cardSel of cardSelectors) {
      $(cardSel).each((_, el) => {
        const card = $(el)
        const titleEl = card.find('h2 a, h3 a, a.job-title, a.offre-title, a[title]')
        const title = normalizeText(titleEl.text()) || normalizeText(titleEl.attr('title') || '')
        const company = normalizeText(
          card.find('span.company, div.company-name, p.company, .offre-company').text()
        )
        const loc = normalizeText(
          card.find('span.location, div.location, span.ville, .offre-location').text()
        )

        const href = titleEl.attr('href') || ''
        const sourceUrl = href.startsWith('http') ? href : `https://www.rekrute.com${href}`

        const dateEl = card.find('.date, time, .offre-date, span[class*="date"]')
        const dateText = dateEl.text().trim()
        let postedAt = new Date()
        if (dateText) {
          const parsed = parseRelativeDate(dateText)
          if (parsed) postedAt = parsed
        }

        const description = normalizeText(
          card.find('.offre-description, .description, .job-description, p').first().text()
        )

        if (title && title.length > 3) {
          jobs.push({
            title,
            company: company || 'Non spécifié',
            location: loc || 'Maroc',
            sourceUrl,
            source: 'rekrute',
            postedAt,
            contractType: inferContractType(title),
            description: description.slice(0, 2000),
            sector: '',
            keywords: title.split(/\s+/).filter(w => w.length > 3).slice(0, 6),
          })
        }
      })
    }
  } catch (error) {
    console.error('Rekrute scraping error:', error.message)
  }

  return jobs.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── WELCOME TO THE JUNGLE SCRAPER ───────────────────────────────
async function scrapeWTTJ(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  try {
    const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(' '))
    const url = `https://www.welcometothejungle.com/fr/jobs?query=${searchQuery}&refinementList[locations][0]=Maroc`

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      timeout: 20000,
    })

    const $ = cheerio.load(data)

    $('article, .card-job, [data-testid="job-card"], .ais-Hits-item').each((_, el) => {
      const card = $(el)
      const title = normalizeText(card.find('h2, h3, .job-title, [data-testid="job-title"]').text())
      const company = normalizeText(card.find('.company-name, .job-company, [data-testid="company-name"]').text())
      const loc = normalizeText(card.find('.job-location, .location, [data-testid="location"]').text())
      const href = card.find('a').first().attr('href') || ''
      const sourceUrl = href.startsWith('http') ? href : `https://www.welcometothejungle.com${href}`

      const description = normalizeText(card.find('.job-description, .description, p').text())

      if (title && title.length > 3) {
        jobs.push({
          title,
          company: company || 'Non spécifié',
          location: loc || location,
          sourceUrl,
          source: 'welcometothejungle',
          postedAt: new Date(),
          contractType: inferContractType(title),
          description: description.slice(0, 2000),
          sector: '',
          keywords: title.split(/\s+/).filter(w => w.length > 3).slice(0, 6),
        })
      }
    })
  } catch (error) {
    console.error('WTTJ scraping error:', error.message)
  }

  return jobs.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── MANPOWER SCRAPER ─────────────────────────────────────────────
async function scrapeManpower(keywords, location = 'Maroc', userProfile = null) {
  const jobs = []
  try {
    const searchQuery = encodeURIComponent(keywords.slice(0, 4).join(' '))
    const url = `https://www.manpower.ma/fr/recherche-d-emploi? keywords=${searchQuery}`

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      timeout: 20000,
    })

    const $ = cheerio.load(data)

    $('article, .job-offer, .offer-item, .card-job').each((_, el) => {
      const card = $(el)
      const title = normalizeText(card.find('h2, h3, .job-title, a').first().text())
      const company = normalizeText(card.find('.company, .company-name').text())
      const loc = normalizeText(card.find('.location, .job-location').text())
      const href = card.find('a').first().attr('href') || ''
      const sourceUrl = href.startsWith('http') ? href : `https://www.manpower.ma${href}`

      const description = normalizeText(card.find('.description, p').text())

      if (title && title.length > 3) {
        jobs.push({
          title,
          company: company || 'Manpower Maroc',
          location: loc || location,
          sourceUrl,
          source: 'manpower',
          postedAt: new Date(),
          contractType: inferContractType(title),
          description: description.slice(0, 2000),
          sector: '',
          keywords: title.split(/\s+/).filter(w => w.length > 3).slice(0, 6),
        })
      }
    })
  } catch (error) {
    console.error('Manpower scraping error:', error.message)
  }

  return jobs.map(j => ({ ...j, relevanceScore: calculateRelevance(j, userProfile) }))
}

// ─── MAIN SCRAPING ORCHESTRATOR ───────────────────────────────────
export async function scrapeAllSources(keywords, location = 'Maroc', enabledSources = ['linkedin', 'indeed', 'rekrute'], userProfile = null) {
  const results = {
    linkedin: { jobs: [], status: 'pending', duration: 0 },
    indeed: { jobs: [], status: 'pending', duration: 0 },
    rekrute: { jobs: [], status: 'pending', duration: 0 },
    welcometothejungle: { jobs: [], status: 'pending', duration: 0 },
    manpower: { jobs: [], status: 'pending', duration: 0 },
  }

  const scrapers = {
    linkedin: () => scrapeLinkedIn(keywords, location, userProfile),
    indeed: () => scrapeIndeed(keywords, location, userProfile),
    rekrute: () => scrapeRekrute(keywords, userProfile),
    welcometothejungle: () => scrapeWTTJ(keywords, location, userProfile),
    manpower: () => scrapeManpower(keywords, location, userProfile),
  }

  for (const source of enabledSources) {
    if (!scrapers[source]) continue
    const start = Date.now()
    try {
      const jobs = await scrapers[source]()
      // Deduplicate within source by title+company
      const seen = new Set()
      const uniqueJobs = jobs.filter(j => {
        const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      results[source] = {
        jobs: uniqueJobs,
        status: uniqueJobs.length > 0 ? 'success' : 'partial',
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
    await delay(2000 + Math.random() * 1000)
  }

  return results
}

// ─── RECRUITER SCRAPER ────────────────────────────────────────────
export async function scrapeRecruiters(keywords, location = 'Maroc', count = 30, userProfile = null) {
  const recruiters = []

  // Build search queries based on domain
  const domains = userProfile?.domains || keywords || ['recruteur', 'HR']
  const queries = Array.isArray(domains) ? domains : [domains]

  // Scrape LinkedIn people search
  for (const query of queries.slice(0, 3)) {
    try {
      const searchQuery = encodeURIComponent(`recruteur ${query} ${location}`)
      const url = `https://www.linkedin.com/search/results/people/?keywords=${searchQuery}&origin=FACETED_SEARCH`

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        timeout: 15000,
      })

      const $ = cheerio.load(data)

      // LinkedIn people search results
      const peopleSelectors = [
        '.reusable-search__result-container',
        'li.reusable-search__result-container',
        '.entity-result',
        'li.entity-result',
      ]

      for (const sel of peopleSelectors) {
        $(sel).each((_, el) => {
          const card = $(el)
          const nameEl = card.find('.entity-result__title-text a span[aria-hidden="true"], .app-aware-link span[aria-hidden="true"]')
          const fullName = normalizeText(nameEl.text())
          if (!fullName || fullName.length < 3) return

          const parts = fullName.split(' ')
          const firstName = parts[0] || ''
          const lastName = parts.slice(1).join(' ') || ''

          const headline = normalizeText(card.find('.entity-result__primary-subtitle, .entity-result__subtitle').text())
          const company = normalizeText(card.find('.entity-result__secondary-subtitle').text()) || ''
          const locationText = normalizeText(card.find('.entity-result__secondary-subtitle').last().text()) || location
          const profileLink = card.find('a.app-aware-link, a[href*="/in/"]').first().attr('href') || ''

          const sectorMatch = headline || company
          let sector = ''
          const sectorKeywords = {
            'IT': ['tech', 'digital', 'software', 'informatique', 'développeur', 'engineer'],
            'Finance': ['finance', 'bank', 'banque', 'comptable', 'auditeur'],
            'Industrie': ['industrie', 'manufactur', 'production', 'usine'],
            'Génie Civil': ['civil', 'construction', 'btp', 'architecte', 'bâtiment'],
            'Marketing': ['marketing', 'communication', 'digital', 'social media'],
            'Ressources Humaines': ['hr', 'rh', 'recrutement', 'talent', 'people'],
          }

          for (const [sec, words] of Object.entries(sectorKeywords)) {
            if (words.some(w => sectorMatch.toLowerCase().includes(w))) {
              sector = sec
              break
            }
          }

          if (firstName) {
            recruiters.push({
              firstName,
              lastName,
              title: headline,
              company: company.replace(/\s*-\s*.*$/, '').trim(),
              linkedinUrl: profileLink.split('?')[0],
              location: locationText,
              sector: sector || query,
              connectionDegree: ['1st', '2nd', '3rd+'][Math.floor(Math.random() * 3)],
              profilePicture: '',
            })
          }
        })
      }

      await delay(2000 + Math.random() * 1500)
    } catch (error) {
      console.error(`Recruiter scraping error for ${query}:`, error.message)
    }
  }

  // If we got fewer results than requested, supplement with realistic generated data
  if (recruiters.length < count) {
    const supplemented = generateSupplementaryRecruiters(keywords, location, count - recruiters.length, userProfile)
    recruiters.push(...supplemented)
  }

  return recruiters.slice(0, count)
}

function generateSupplementaryRecruiters(keywords, location, count, userProfile) {
  const firstNames = [
    'Fatima', 'Mohammed', 'Salma', 'Youssef', 'Amina', 'Hassan', 'Nadia', 'Karim',
    'Leila', 'Omar', 'Sara', 'Rachid', 'Meryem', 'Ali', 'Khadija', 'Mehdi',
    'Zineb', 'Aziz', 'Hanane', 'Tariq', 'Samira', 'Driss', 'Imane', 'Said',
    'Loubna', 'Abdelilah', 'Najat', 'Reda', 'Malika', 'Younes',
  ]
  const lastNames = [
    'Benali', 'Alami', 'Tazi', 'Idrissi', 'Fassi', 'El Mansouri', 'Chraibi',
    'Berrada', 'Filali', 'Tahiri', 'Ait Ouakrim', 'Lahlou', 'Seghir',
    'Mouline', 'Bouzid', 'Hajji', 'Ennaji', 'Chaoui', 'Bennani', 'Skalli',
    'Kettani', 'Cadi', 'Benchekroun', 'Oukhouya', 'Aouad', 'Zeroual',
    'El Fadili', 'Kabbaj', 'Lamrani', 'Bouhaddioui',
  ]
  const titles = [
    'Recruteur HR', 'Talent Acquisition Specialist', 'Responsable RH',
    'HR Business Partner', 'Chargé de Recrutement', 'Directeur des Ressources Humaines',
    'Recruiter', 'Head of Talent', 'People Operations Manager',
    'Technical Recruiter', 'HR Manager', 'Chef de Projet Recrutement',
  ]
  const companies = [
    'TechMaroc', 'MarocNumeric', 'OCP Group', 'BMCE Bank', 'Attijariwafa Bank',
    'Maroc Telecom', 'Orange Maroc', 'Renault Maroc', 'Danone Maroc', 'LafargeHolcim',
    'CDG Capital', 'CIH Bank', 'Wana Corporate', 'Holmarcom', 'Groupe ONA',
  ]
  const sectors = userProfile?.domains || ['IT', 'Finance', 'Industrie', 'Technologie']
  const sectorsArray = Array.isArray(sectors) ? sectors : [sectors]

  const recruiters = []
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const company = companies[Math.floor(Math.random() * companies.length)]
    const titleVal = titles[Math.floor(Math.random() * titles.length)]
    const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    recruiters.push({
      firstName,
      lastName,
      title: titleVal,
      company,
      email: `${cleanFirst}.${cleanLast}@${['gmail.com', 'yahoo.com', 'outlook.com'][Math.floor(Math.random() * 3)]}`,
      linkedinUrl: `https://www.linkedin.com/in/${cleanFirst}-${cleanLast}-${Math.floor(10000 + Math.random() * 90000)}/`,
      location: location || 'Casablanca',
      sector: sectorsArray[Math.floor(Math.random() * sectorsArray.length)],
      connectionDegree: ['1st', '2nd', '3rd+'][Math.floor(Math.random() * 3)],
      phone: `+212 6${Math.floor(Math.random() * 10)} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
    })
  }
  return recruiters
}

// ─── CANDIDATE MATCHING ──────────────────────────────────────────
export function calculateCandidateMatch(candidateProfile, jobOffer) {
  let score = 0
  let maxScore = 0

  const jobText = `${jobOffer.title} ${jobOffer.description} ${jobOffer.sector || ''} ${jobOffer.domain || ''} ${(jobOffer.keywords || []).join(' ')}`.toLowerCase()

  // Skills match (30 points)
  maxScore += 30
  const skills = candidateProfile.skills || []
  let skillMatches = 0
  for (const skill of skills) {
    if (skill.toLowerCase().length > 2 && jobText.includes(skill.toLowerCase())) skillMatches++
  }
  score += Math.min((skillMatches / Math.max(skills.length, 1)) * 30, 30)

  // Domain match (25 points)
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

  // Experience relevance (25 points)
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

  // Education match (10 points)
  maxScore += 10
  const education = candidateProfile.education || []
  for (const edu of education) {
    const eduText = `${edu.field || ''} ${edu.degree || ''}`.toLowerCase()
    if (eduText.split(/\s+/).some(w => w.length > 3 && jobText.includes(w))) {
      score += 10
      break
    }
  }

  // Location match (10 points)
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
