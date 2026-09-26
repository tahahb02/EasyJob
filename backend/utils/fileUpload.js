import multer from 'multer'

const storage = multer.memoryStorage()

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

// Signatures binaires réelles. Le `mimetype` envoyé par le client est
// déclaré, donc falsifiable : sans vérification des « magic bytes », un
// exécutable ou un script était accepté puis stocké en base (et renvoyé
// tel quel au navigateur).
const MAGIC_BYTES = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
]

function detectMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  for (const { mime, bytes } of MAGIC_BYTES) {
    if (bytes.every((byte, index) => buffer[index] === byte)) return mime
  }
  // WebP : « RIFF » suivi de la taille puis « WEBP ».
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  return null
}

function buildFileFilter(allowedTypes) {
  return (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non supporté. Utilisez PDF, JPG, PNG ou WebP.'))
    }
    cb(null, true)
  }
}

export const MAX_CV_BYTES = 5 * 1024 * 1024
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

/**
 * Limites revues : MongoDB refuse tout document > 16 Mo. Le fichier était
 * conservé en base64 (+33 % de volume) dans le même document que `extractedText`
 * et les analyses. À 10 Mo, l'upload passait le filtre multer puis faisait
 * échouer l'`insert` : l'ancien CV avait déjà été désactivé, donc
 * l'utilisateur se retrouvait sans CV actif.
 */
const baseLimits = { files: 1, fields: 20 }

export const upload = multer({
  storage,
  fileFilter: buildFileFilter(ALLOWED_TYPES),
  limits: { ...baseLimits, fileSize: MAX_CV_BYTES },
})

export const uploadAvatar = multer({
  storage,
  fileFilter: buildFileFilter(['image/jpeg', 'image/png', 'image/webp']),
  limits: { ...baseLimits, fileSize: MAX_AVATAR_BYTES },
})

/**
 * À appeler après le middleware multer : compare le type réel du buffer au
 * type déclaré. Refuse le fichier si le contenu ne correspond pas.
 */
export function assertFileSignature(req, res, field = 'file') {
  const file = req.file
  if (!file) return true
  const actual = detectMime(file.buffer)
  if (!actual || actual !== file.mimetype) {
    res.status(400).json({
      error: 'Le contenu du fichier ne correspond pas à son type. Vérifiez votre fichier.',
    })
    return false
  }
  return true
}

export { detectMime }
