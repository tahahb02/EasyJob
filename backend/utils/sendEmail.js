import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

let transporterPromise = null

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function brandButton({ href, label, bg = '#2563eb' }) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:12px; background-color:${bg};">
          <a href="${escapeHtml(href)}" style="display:inline-block; padding:13px 28px; font-family:Inter, Arial, sans-serif; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `
}

export function brandLayout({ accent = '#2563eb', title, content, footerText }) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding-bottom:20px;">
                <div style="font-family:Inter, Arial, sans-serif; font-size:20px; font-weight:800; color:#0f172a; letter-spacing:-0.5px; line-height:1;">
                  <span style="display:inline-block; background-color:${accent}; color:#ffffff; font-size:14px; font-weight:800; border-radius:8px; padding:6px 10px; margin-right:8px; vertical-align:middle;">E</span>
                  Easy<span style="color:${accent};">Job</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div style="background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:32px; box-shadow:0 6px 24px rgba(2,6,23,0.06); font-family:Inter, Arial, sans-serif;">
                  <h1 style="margin:0 0 10px 0; font-size:20px; font-weight:700; color:#0f172a; line-height:1.3;">${escapeHtml(title)}</h1>
                  <div style="width:48px; height:4px; border-radius:2px; background-color:${accent}; margin-bottom:22px;"></div>
                  ${content}
                </div>
                <div style="padding:24px 8px 8px 8px; text-align:center; font-family:Inter, Arial, sans-serif; font-size:12px; color:#94a3b8; line-height:1.7;">
                  ${footerText || 'EasyJob — Votre carrière au Maroc'}<br />
                  © ${new Date().getFullYear()} EasyJob. Tous droits réservés.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

function hasRealCreds() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS
    && process.env.EMAIL_USER !== 'your_email@gmail.com'
    && process.env.EMAIL_PASS !== 'your_app_password')
}

function getFromAddress() {
  const envFrom = process.env.EMAIL_FROM
  if (envFrom && !envFrom.includes('noreply@easyjob.ma') && !envFrom.includes('your_email@gmail.com')) {
    return envFrom
  }
  if (hasRealCreds()) {
    return `EasyJob <${process.env.EMAIL_USER}>`
  }
  return 'EasyJob <noreply@easyjob.ma>'
}

function mailPort() {
  return parseInt(process.env.EMAIL_PORT || '587', 10)
}

function buildSmtpTransport() {
  const port = mailPort()
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '12000', 10),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '8000', 10),
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '15000', 10),
    pool: false,
  })
}

async function getTransporter() {
  if (transporterPromise) return transporterPromise

  if (hasRealCreds()) {
    transporterPromise = Promise.resolve(buildSmtpTransport())
  } else if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount()
    console.log('📧 Ethereal test account:', testAccount.user)
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }))
  } else {
    throw new Error('Aucun service d\'envoi configuré en production. Ajoutez EMAIL_USER/EMAIL_PASS (SMTP) ou mieux : BREVO_API_KEY / RESEND_API_KEY (API HTTPS, recommandé sur Vercel).')
  }

  transporterPromise.then(async (transporter) => {
    try {
      await transporter.verify()
      console.log('✅ SMTP connecté et authentifié')
    } catch (err) {
      console.error('❌ Échec de la connexion SMTP:', err.message)
    }
  })

  return transporterPromise
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function isTransientError(error) {
  const message = String(error && error.message ? error.message : error).toLowerCase()
  const code = String(error && error.code ? error.code : '')
  const patterns = [
    'ebusy', 'enotfound', 'eai_again', 'etimedout', 'econnreset',
    'econnrefused', 'ehostunreach', 'enetunreach', 'epipe', 'esocket',
    'greeting never received', 'connection timeout', 'socket timeout',
    'connect timeout', 'getaddrinfo',
  ]
  return patterns.some((pattern) => code.includes(pattern) || message.includes(pattern))
}

async function withRetry(fn, attempts = 3, baseDelay = 400) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt >= attempts || !isTransientError(err)) break
      const delay = baseDelay * attempt
      console.warn(`⚠️ Erreur temporaire (${err.message}). Nouvelle tentative ${attempt}/${attempts} dans ${delay}ms...`)
      await wait(delay)
    }
  }
  throw lastError
}

function parseSender(value) {
  const match = String(value || '').match(/^(.*)\s*<([^>]+)>$/)
  if (!match) return { name: '', email: String(value || '').trim() }
  return { name: match[1].trim(), email: match[2].trim() }
}

async function resendFromAddress() {
  return process.env.RESEND_FROM || 'EasyJob <onboarding@resend.dev>'
}

async function sendViaBrevo({ to, subject, html, attachments }) {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY
  if (!apiKey) throw new Error('Brevo nécessite BREVO_API_KEY (ou EMAIL_PROVIDER=smtp)')

  const parsed = parseSender(process.env.EMAIL_FROM || process.env.EMAIL_USER)
  const sender = {
    name: process.env.BREVO_SENDER_NAME || parsed.name || 'EasyJob',
    email: process.env.BREVO_SENDER_EMAIL || parsed.email || process.env.EMAIL_USER,
  }
  if (!sender.email) {
    throw new Error('Envoyeur Brevo manquant : définissez BREVO_SENDER_EMAIL ou EMAIL_USER')
  }

  const payload = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html,
  }
  if (attachments && attachments.length) {
    payload.attachment = attachments
      .map((a) => ({
        name: String(a.filename || 'attachment'),
        content: a.content ? Buffer.from(a.content).toString('base64') : undefined,
      }))
      .filter((a) => a.content)
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.message || data.code || response.statusText
    throw new Error(`Brevo API ${response.status}: ${detail}`)
  }
  console.log('📧 Email envoyé via Brevo:', data.messageId)
  return { messageId: data.messageId, previewUrl: null }
}

function resolveProvider() {
  if (process.env.EMAIL_PROVIDER) return process.env.EMAIL_PROVIDER.toLowerCase()
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) return 'brevo'
  return 'smtp'
}

async function sendViaResend({ to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('EMAIL_PROVIDER=resend nécessite RESEND_API_KEY')

  const payload = {
    from: await resendFromAddress(),
    to: [to],
    subject,
    html,
  }
  if (attachments && attachments.length) {
    payload.attachments = attachments
      .map((a) => ({
        filename: String(a.filename || 'attachment'),
        content: a.content ? Buffer.from(a.content).toString('base64') : undefined,
      }))
      .filter((a) => a.content)
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message ? `Resend API ${response.status}: ${data.message}` : `Resend API ${response.status}`)
  }
  console.log('📧 Email envoyé via Resend:', data.id)
  return { messageId: data.id, previewUrl: null }
}

export const sendEmail = async ({ to, subject, html, attachments }) => {
  const provider = resolveProvider()
  try {
    if (provider === 'resend') {
      const result = await withRetry(() => sendViaResend({ to, subject, html, attachments }))
      return { success: true, messageId: result.messageId, previewUrl: result.previewUrl }
    }

    if (provider === 'brevo') {
      const result = await withRetry(() => sendViaBrevo({ to, subject, html, attachments }))
      return { success: true, messageId: result.messageId, previewUrl: result.previewUrl }
    }

    const info = await withRetry(async () => {
      const transporter = await getTransporter()
      return transporter.sendMail({
        from: getFromAddress(),
        to,
        subject,
        html,
        ...(attachments && attachments.length ? { attachments } : {}),
      })
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log('📧 Email envoyé:', info.messageId)
    if (previewUrl) {
      console.log('🔗 Voir l\'email:', previewUrl)
    }
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null }
  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('🤖 Environnement non production : l\'email n\'a pas pu être envoyé, voici son contenu :')
      console.warn(html)
    }
    const hint = process.env.NODE_ENV === 'production' && provider === 'smtp' && !process.env.BREVO_API_KEY && !process.env.RESEND_API_KEY
      ? ' → Gmail SMTP est bloqué depuis Vercel. Ajoutez BREVO_API_KEY (recommandé) ou RESEND_API_KEY dans Vercel → Settings → Environment Variables, puis redéployez.'
      : ''
    return { success: false, error: error.message + hint }
  }
}

export const sendVerificationEmail = async (email, firstName, code) => {
  const content = `
    <p style="margin:0 0 8px 0; font-size:14px; color:#334155; line-height:1.6;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 22px 0; font-size:14px; color:#334155; line-height:1.6;">Merci de vous être inscrit sur EasyJob. Pour activer votre compte, saisissez le code de vérification suivant :</p>
    <div style="background:#eff6ff; border:2px dashed #2563eb; border-radius:12px; padding:18px; text-align:center; margin:0 0 22px 0;">
      <div style="font-family:Inter, Arial, sans-serif; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin-bottom:6px;">Code de vérification</div>
      <span style="font-family:Inter, Arial, sans-serif; font-size:32px; font-weight:800; color:#2563eb; letter-spacing:8px;">${escapeHtml(code)}</span>
    </div>
    <p style="margin:0; font-size:13px; color:#94a3b8; line-height:1.6;">Ce code expire dans 10 minutes. Si vous n'avez pas créé de compte, ignorez cet email.</p>
  `
  return sendEmail({
    to: email,
    subject: 'EasyJob — Vérification de votre email',
    html: brandLayout({ title: 'Vérifiez votre adresse email', content }),
  })
}

export const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  const content = `
    <p style="margin:0 0 8px 0; font-size:14px; color:#334155; line-height:1.6;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 22px 0; font-size:14px; color:#334155; line-height:1.6;">Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau :</p>
    ${brandButton({ href: resetUrl, label: 'Réinitialiser mon mot de passe' })}
    <p style="margin:0 0 6px 0; font-size:13px; color:#94a3b8; line-height:1.6;">Ce lien est valable pendant 1 heure.</p>
    <p style="margin:0 0 16px 0; font-size:13px; color:#94a3b8; line-height:1.6;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Votre mot de passe ne sera pas modifié.</p>
    <p style="margin:16px 0 0 0; font-size:12px; color:#94a3b8; line-height:1.6; word-break:break-all;">Le bouton ne fonctionne pas ? Copiez ce lien : <a href="${escapeHtml(resetUrl)}" style="color:#2563eb;">${escapeHtml(resetUrl)}</a></p>
  `
  return sendEmail({
    to: email,
    subject: 'EasyJob — Réinitialisation de votre mot de passe',
    html: brandLayout({ title: 'Réinitialisation du mot de passe', content }),
  })
}