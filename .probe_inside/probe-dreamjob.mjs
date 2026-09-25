import { readFileSync } from 'node:fs'
import * as cheerio from 'cheerio'

const html = readFileSync(`${process.env.TEMP}\\dj.html`, 'utf8')
const $ = cheerio.load(html)

const NON_JOB_PATTERN = /^(?:résultats?|resultats?|convocations?|listes? (?:des )?(?:admis|retenus)|avis|programme(?:s)?|communiqu[ée]s?|report|journ[ée]e(?:s)? (?:de recru|portes|d'information)?|planning|réunion)\b/i
const isJobUrl = href => /(?:emploi|offre|job|recrutement)/i.test(href) && !/(?:concours|resultat|formation|stage|actualite)/i.test(href)

let total = 0
let passed = 0
const rejects = { noTitle: 0, noHref: 0, notJobUrl: 0, nonJob: 0, ok: 0 }
const samples = []

$('article.jeg_post, div.jeg_post, article.post').each((_, el) => {
  total++
  const card = $(el)
  const titleEl = card.find('h3.jeg_post_title a, h2.jeg_post_title a, .jeg_post_title a, a[href*="dreamjob.ma/"]').first()
  const title = titleEl.text().replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
  const href = titleEl.attr('href') || ''
  if (!title || title.length <= 3) { rejects.noTitle++; return }
  if (!href) { rejects.noHref++; return }
  if (!isJobUrl(href)) { rejects.notJobUrl++; if (samples.length < 6) samples.push(`NOTJOB | ${href}`); return }
  if (NON_JOB_PATTERN.test(title)) { rejects.nonJob++; return }
  rejects.ok++
  passed++
})

console.log({ total, passed, rejects })
console.log(samples.join('\n'))
