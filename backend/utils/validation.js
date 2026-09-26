import mongoose from 'mongoose'

/**
 * Helpers de validation partagés.
 *
 * Contexte : l'API ne valide pas ses entrées de façon systématique. Une
 * requête malformée (ObjectId non valide, chaîne à la place d'un tableau,
 * opérateur de regex non échappé) remontait jusqu'à Mongoose et revenait en
 * 500 « Erreur serveur », sans indication exploitable.
 */

export function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)
}

export function asString(value, { max = 2000 } = {}) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export function asBool(value) {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return undefined
}

export function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** Pagination bornée : `?limit=999999` ne doit pas permettre un DOS via .limit(). */
export function clampInt(value, { min = 1, max = 100, fallback = null } = {}) {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value
  if (!Number.isInteger(parsed)) return fallback
  if (parsed < min) return min
  if (parsed > max) return max
  return parsed
}

/**
 * Échappe une chaîne destinée à `$regex` / `new RegExp()`.
 * Sans cela, un utilisateur peut provoquer un ReDoS catastrophique
 * (`(a+)+$`) ou un 500 sur un motif invalide (`[`).
 */
export function escapeRegExp(value) {
  return asString(value, { max: 200 }).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function isValidEmail(value) {
  const email = asString(value, { max: 320 }).toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Ne conserve que les champs explicitement autorisés.
 * Utilisé partout où un `req.body` complet était appliqué en `$set` :
 * sans allowlist, `userId` / `_id` / `role` étaient modifiables par l'appelant.
 */
export function pick(source, allowedKeys) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {}
  const result = {}
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) result[key] = source[key]
  }
  return result
}

const isPlainObject = value => !!value && typeof value === 'object' && !Array.isArray(value)

/** Tableau de chaînes : renvoie `undefined` si la valeur n'a pas le bon type. */
function asStringArray(value, { max = 50, itemMax = 500 } = {}) {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return undefined
  return value.slice(0, max).map(v => asString(v, { max: itemMax }))
}

function asObjectArray(value, allowedKeys, { max = 30 } = {}) {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return undefined
  return value.slice(0, max).map(entry => pick(isPlainObject(entry) ? entry : {}, allowedKeys))
}

function asStringMap(value, allowedKeys, { max = 20 } = {}) {
  if (value === undefined) return undefined
  if (!isPlainObject(value)) return undefined
  return pick(value, allowedKeys)
}

const PROFILE_STRING_FIELDS = ['title', 'summary', 'presentation']
const EDUCATION_KEYS = ['institution', 'degree', 'field', 'startDate', 'endDate', 'description']
const EXPERIENCE_KEYS = ['company', 'position', 'startDate', 'endDate', 'isCurrent', 'description', 'skills']
const LANGUAGE_KEYS = ['language', 'level']
const CERTIFICATION_KEYS = ['name', 'issuer', 'date', 'url']
const SOCIAL_KEYS = ['linkedin', 'github', 'portfolio', 'website']
const LOCATION_KEYS = ['city', 'country', 'isRemoteOpen']
const SALARY_KEYS = ['min', 'max', 'currency']

/**
 * Valide et nettoie les mises à jour de `UserProfile`.
 * Renvoie `{ updates, invalid }` : `updates` ne contient que des champs au bon
 * type, `invalid` liste les champs rejetés (la route répond alors 400).
 */
export function sanitizeUserProfileUpdates(body) {
  if (!isPlainObject(body)) return { updates: {}, invalid: ['corps de requête'] }

  const updates = {}
  const invalid = []

  for (const field of PROFILE_STRING_FIELDS) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string') {
      invalid.push(field)
      continue
    }
    updates[field] = body[field].slice(0, field === 'summary' ? 5000 : 2000)
  }

  const education = asObjectArray(body.education, EDUCATION_KEYS)
  if (body.education !== undefined) {
    if (!education) invalid.push('education')
    else updates.education = education.map(e => ({ ...e, description: e.description ? asString(e.description, { max: 2000 }) : e.description }))
  }

  const experience = asObjectArray(body.experience, EXPERIENCE_KEYS)
  if (body.experience !== undefined) {
    if (!experience) {
      invalid.push('experience')
    } else {
      updates.experience = experience.map(e => {
        const clean = { ...e }
        if (e.isCurrent !== undefined) clean.isCurrent = !!asBool(e.isCurrent)
        if (e.skills !== undefined) clean.skills = asStringArray(e.skills) || []
        if (e.description !== undefined) clean.description = asString(e.description, { max: 3000 })
        return clean
      })
    }
  }

  const languages = asObjectArray(body.languages, LANGUAGE_KEYS)
  if (body.languages !== undefined) {
    if (!languages) invalid.push('languages')
    else updates.languages = languages.map(l => ({ language: asString(l.language, { max: 80 }), level: l.level }))
  }

  const certifications = asObjectArray(body.certifications, CERTIFICATION_KEYS)
  if (body.certifications !== undefined) {
    if (!certifications) invalid.push('certifications')
    else updates.certifications = certifications.map(c => ({ name: asString(c.name, { max: 200 }), issuer: c.issuer ? asString(c.issuer, { max: 200 }) : c.issuer, date: c.date, url: c.url }))
  }

  for (const [field, keys] of [['skills', null], ['jobTypes', null], ['domains', null], ['searchKeywords', null], ['preferredLocations', null]]) {
    if (body[field] === undefined) continue
    const parsed = asStringArray(body[field], { max: 40, itemMax: 200 })
    if (!parsed) invalid.push(field)
    else updates[field] = parsed
  }

  const socialLinks = asStringMap(body.socialLinks, SOCIAL_KEYS)
  if (body.socialLinks !== undefined) {
    if (!socialLinks) invalid.push('socialLinks')
    else updates.socialLinks = socialLinks
  }

  const location = asStringMap(body.location, LOCATION_KEYS)
  if (body.location !== undefined) {
    if (!location) {
      invalid.push('location')
    } else {
      if (location.isRemoteOpen !== undefined) location.isRemoteOpen = !!asBool(location.isRemoteOpen)
      updates.location = location
    }
  }

  const expectedSalary = asStringMap(body.expectedSalary, SALARY_KEYS)
  if (body.expectedSalary !== undefined) {
    if (!expectedSalary) {
      invalid.push('expectedSalary')
    } else {
      for (const key of ['min', 'max']) {
        if (expectedSalary[key] === undefined) continue
        const num = asNumber(expectedSalary[key])
        if (num === undefined || num < 0) invalid.push(`expectedSalary.${key}`)
        else expectedSalary[key] = num
      }
      if (expectedSalary.currency !== undefined) expectedSalary.currency = asString(expectedSalary.currency, { max: 8 })
      updates.expectedSalary = expectedSalary
    }
  }

  return { updates, invalid: [...new Set(invalid)] }
}

export const APPLICATION_STATUSES = [
  'brouillon',
  'envoyee',
  'consulte',
  'valide_entretien',
  'appel_attente',
  'entretien_fait',
  'accepte_final',
  'refusee',
]

/** Champs qu'un candidat a le droit de modifier sur sa candidature. */
export const APPLICATION_EDITABLE_FIELDS = [
  'notes',
  'email',
  'status',
  'appliedAt',
  'statusHistory',
  'followUpDate',
]

export const RECRUITER_EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'title',
  'company',
  'linkedinUrl',
  'email',
  'phone',
  'location',
  'sector',
  'connectionDegree',
  'profilePicture',
  'notes',
  'tags',
  'isActive',
]

export const SEARCH_PROFILE_EDITABLE_FIELDS = [
  'title',
  'summary',
  'location',
  'jobTypes',
  'domains',
  'searchKeywords',
  'preferredLocations',
  'expectedSalary',
  'isActive',
]
