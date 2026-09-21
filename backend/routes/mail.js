import express from 'express'
import Email from '../models/Email.js'
import User from '../models/User.js'
import { protect } from '../middlewares/auth.js'
import { sendEmail, escapeHtml, brandLayout } from '../utils/sendEmail.js'
import { recordExchange } from '../services/MailService.js'
import { notifyEmailReceived } from '../services/NotificationService.js'

const router = express.Router()

const MAIL_SUBJECT_PREFIX = '[EasyJob] '

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function emailBaseSubject(subject) {
  return String(subject || '')
    .replace(/^(Re|RE|Re:\s?)+:/g, '')
    .replace(/^\s*Re:\s*/i, '')
    .trim()
}

async function resolveRecipientUser(to) {
  const email = normalizeEmail(to)
  if (!email) return null
  try {
    return await User.findOne({ email })
  } catch {
    return null
  }
}

// GET /api/mail?type=inbox|sent&search=...&conversation=<email>&page=1&limit=30
router.get('/', protect, async (req, res) => {
  try {
    const { type = 'inbox', search, conversation, page = 1, limit = 30 } = req.query
    const query = { userId: req.user._id }

    const orClauses = []
    if (conversation && conversation.trim()) {
      const other = normalizeEmail(conversation)
      orClauses.push({ fromEmail: other }, { toEmail: other })
    } else {
      query.direction = type === 'sent' ? 'sent' : 'received'
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i')
      orClauses.push({ subject: regex }, { body: regex }, { fromName: regex }, { toName: regex }, { companyName: regex })
    }

    if (orClauses.length > 0) {
      query.$or = orClauses
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [emails, total, unreadCount] = await Promise.all([
      Email.find(query)
        .populate('fromUser', 'firstName lastName email avatar role')
        .populate('toUser', 'firstName lastName email avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Email.countDocuments(query),
      Email.countDocuments({ userId: req.user._id, direction: 'received', isRead: false }),
    ])

    res.json({ emails, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (error) {
    console.error('Mailbox error:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des emails' })
  }
})

// GET /api/mail/conversations — threads groupés par correspondant (Messages)
router.get('/conversations', protect, async (req, res) => {
  try {
    const emails = await Email.find({ userId: req.user._id })
      .populate('fromUser', 'firstName lastName email avatar role')
      .populate('toUser', 'firstName lastName email avatar role')
      .sort({ createdAt: -1 })
      .limit(500)

    const groups = new Map()

    for (const email of emails) {
      const received = email.direction === 'received'
      const participant = received
        ? (email.fromUser || { email: email.fromEmail })
        : (email.toUser || { email: email.toEmail })
      const key = normalizeEmail(participant.email || (received ? email.fromEmail : email.toEmail)) || 'inconnu'

      let group = groups.get(key)
      if (!group) {
        const participantName = received
          ? (email.fromName || (email.fromUser ? `${email.fromUser.firstName || ''} ${email.fromUser.lastName || ''}`.trim() : email.fromEmail) || 'Inconnu')
          : (email.toName || (email.toUser ? `${email.toUser.firstName || ''} ${email.toUser.lastName || ''}`.trim() : email.toEmail) || 'Destinataire')

        group = {
          key,
          participant: {
            userId: participant._id || null,
            email: participant.email || (received ? email.fromEmail : email.toEmail) || '',
            name: participantName,
            role: received ? email.fromUser?.role : email.toUser?.role,
          },
          companyName: email.companyName || '',
          lastMessage: '',
          lastSender: '',
          time: email.createdAt,
          unreadCount: 0,
          messageCount: 0,
        }
        groups.set(key, group)
      }

      group.messageCount += 1
      if (received && !email.isRead) group.unreadCount += 1
    }

    // Recompute lastMessage from the freshest email of each group
    for (const email of emails) {
      const received = email.direction === 'received'
      const participant = received
        ? (email.fromUser || { email: email.fromEmail })
        : (email.toUser || { email: email.toEmail })
      const key = normalizeEmail(participant.email || (received ? email.fromEmail : email.toEmail)) || 'inconnu'
      const group = groups.get(key)
      if (!group) continue
      if (!group.lastMessage) {
        const senderName = received
          ? (email.fromName || (email.fromUser ? `${email.fromUser.firstName || ''} ${email.fromUser.lastName || ''}`.trim() : '') || 'Quelqu\'un')
          : 'Vous'
        group.lastMessage = email.body || email.subject || ''
        group.lastSender = senderName
        group.time = email.createdAt
        group.lastSubject = email.subject || ''
        group.threadId = email._id
      }
    }

    const conversations = Array.from(groups.values()).sort((a, b) => new Date(b.time) - new Date(a.time))

    res.json({ conversations, total: conversations.length })
  } catch (error) {
    console.error('Conversations error:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' })
  }
})

// POST /api/mail/send — nouvel email (interne ou externe)
router.post('/send', protect, async (req, res) => {
  try {
    const { to, subject, body, companyName = '', applicationId = null, jobOfferId = null } = req.body
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Destinataire, objet et contenu requis' })
    }

    const toEmail = String(to).trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide' })
    }

    const recipientUser = await resolveRecipientUser(toEmail)
    const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Utilisateur EasyJob'
    const recipientName = recipientUser
      ? `${recipientUser.firstName || ''} ${recipientUser.lastName || ''}`.trim()
      : (req.body.toName || '')

    const content = `
      <p style="margin:0 0 8px 0; font-size:14px; color:#334155; line-height:1.6;">Bonjour <strong>${escapeHtml(recipientName || '')}</strong>,</p>
      <div style="background:#eff6ff; border-left:4px solid #2563eb; border-radius:12px; padding:18px 20px; margin:0 0 6px 0; white-space:pre-wrap; color:#334155; font-size:14px; line-height:1.7;">${escapeHtml(body)}</div>
      <p style="margin:14px 0 0 0; font-size:13px; color:#94a3b8; line-height:1.6;">Envoyé par <strong>${escapeHtml(senderName)}</strong> via EasyJob</p>
    `
    const html = brandLayout({
      title: subject,
      content,
      footerText: 'Message envoyé via EasyJob — Votre carrière au Maroc',
    })

    const emailResult = await sendEmail({ to: toEmail, subject: `${MAIL_SUBJECT_PREFIX}${subject}`, html })

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email', details: emailResult.error })
    }

    const recorded = await recordExchange({
      senderUser: req.user,
      recipientUser,
      subject,
      body,
      fromName: senderName,
      toName: recipientName,
      toEmail,
      companyName: companyName || '',
      campaignType: 'direct',
      applicationId,
      jobOfferId,
      messageId: emailResult.messageId,
    })

    const sentCopy = Array.isArray(recorded) ? recorded.find(d => d.userId?.toString() === req.user._id.toString()) : null

    if (recipientUser) {
      const receivedCopy = Array.isArray(recorded) ? recorded.find(d => d.userId?.toString() === recipientUser._id.toString()) : null
      notifyEmailReceived({
        userId: recipientUser._id,
        fromName: senderName,
        companyName,
        subject,
        emailId: receivedCopy?._id?.toString() || null,
      })
    }

    res.status(201).json({ email: sentCopy || recorded, message: 'Email envoyé avec succès !', messageId: emailResult.messageId })
  } catch (error) {
    console.error('Mail send error:', error)
    res.status(500).json({ error: 'Erreur lors de l\'envoi' })
  }
})

// POST /api/mail/:id/reply — réponse à un email reçu/envoyé
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { body } = req.body
    if (!body || !String(body).trim()) {
      return res.status(400).json({ error: 'Le contenu de la réponse est requis' })
    }

    const email = await Email.findOne({ _id: req.params.id, userId: req.user._id })
    if (!email) return res.status(404).json({ error: 'Email non trouvé' })

    const received = email.direction === 'received'
    const toEmail = received ? (email.fromEmail || email.fromUser?.email) : (email.toEmail || email.toUser?.email)
    if (!toEmail) return res.status(400).json({ error: 'Impossible de déterminer le destinataire' })

    const recipientUser = await resolveRecipientUser(toEmail)

    const subject = email.subject && /^\s*re:/i.test(email.subject)
      ? email.subject
      : `Re: ${emailBaseSubject(email.subject) || 'Échange EasyJob'}`

    const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Utilisateur EasyJob'
    const recipientName = (received ? email.fromName : email.toName) || (recipientUser ? `${recipientUser.firstName || ''} ${recipientUser.lastName || ''}`.trim() : '')

    const content = `
      <p style="margin:0 0 8px 0; font-size:14px; color:#334155; line-height:1.6;">Bonjour <strong>${escapeHtml(recipientName || '')}</strong>,</p>
      <div style="background:#eff6ff; border-left:4px solid #2563eb; border-radius:12px; padding:18px 20px; margin:0 0 16px 0; white-space:pre-wrap; color:#334155; font-size:14px; line-height:1.7;">${escapeHtml(body)}</div>
      <div style="border-left:3px solid #e2e8f0; padding:10px 14px; font-size:12px; color:#94a3b8; line-height:1.6;">
        <strong style="color:#64748b;">De : ${escapeHtml(email.fromName || '')}</strong><br />
        <strong style="color:#64748b;">Objet : ${escapeHtml(email.subject || '')}</strong><br />
        ${escapeHtml(email.body || '')}
      </div>
      <p style="margin:14px 0 0 0; font-size:13px; color:#94a3b8; line-height:1.6;">Réponse envoyée par <strong>${escapeHtml(senderName)}</strong> via EasyJob</p>
    `
    const html = brandLayout({
      title: subject,
      content,
      footerText: 'Message envoyé via EasyJob — Votre carrière au Maroc',
    })

    const emailResult = await sendEmail({ to: toEmail, subject: `${MAIL_SUBJECT_PREFIX}${subject}`, html })

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de la réponse', details: emailResult.error })
    }

    const recorded = await recordExchange({
      senderUser: req.user,
      recipientUser,
      subject,
      body,
      fromName: senderName,
      toName: recipientName,
      toEmail,
      companyName: email.companyName || '',
      campaignType: email.campaignType || 'direct',
      applicationId: email.applicationId || null,
      jobOfferId: email.jobOfferId || null,
      messageId: emailResult.messageId,
    })

    const sentCopy = Array.isArray(recorded) ? recorded.find(d => d.userId?.toString() === req.user._id.toString()) : null

    if (recipientUser && recipientUser._id?.toString() !== req.user._id.toString()) {
      const receivedCopy = Array.isArray(recorded) ? recorded.find(d => d.userId?.toString() === recipientUser._id.toString()) : null
      notifyEmailReceived({
        userId: recipientUser._id,
        fromName: senderName,
        companyName: email.companyName || '',
        subject,
        emailId: receivedCopy?._id?.toString() || null,
      })
    }

    res.status(201).json({ email: sentCopy || recorded, message: 'Réponse envoyée avec succès !', messageId: emailResult.messageId })
  } catch (error) {
    console.error('Mail reply error:', error)
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la réponse' })
  }
})

// GET /api/mail/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('fromUser', 'firstName lastName email avatar role')
      .populate('toUser', 'firstName lastName email avatar role')
    if (!email) return res.status(404).json({ error: 'Email non trouvé' })
    res.json({ email })
  } catch (error) {
    console.error('Mail get error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/mail/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, direction: 'received' },
      { isRead: true, readAt: new Date() },
      { new: true }
    )
    if (!email) return res.status(404).json({ error: 'Email non trouvé' })
    res.json({ email })
  } catch (error) {
    console.error('Mail read error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router