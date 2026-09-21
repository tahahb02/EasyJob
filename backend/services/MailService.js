import Email from '../models/Email.js'

// Enregistre un email dans la boîte mail du destinataire local puis du sender.
// `recipientUser` peut être null (destinataire externe : seule une copie `sent` est créée).
export async function recordExchange({ senderUser, recipientUser, subject, body, fromName, toName, toEmail, companyName, campaignType = '', applicationId = null, jobOfferId = null, messageId = '' }) {
  const fromUser = senderUser?._id || senderUser?.id || null
  const fromNameValue = fromName || (senderUser ? `${senderUser.firstName || ''} ${senderUser.lastName || ''}`.trim() : '')

  const base = {
    fromUser,
    toUser: recipientUser?._id || recipientUser?.id || null,
    fromName: fromNameValue,
    toName: toName || (recipientUser ? `${recipientUser.firstName || ''} ${recipientUser.lastName || ''}`.trim() : ''),
    toEmail: toEmail || recipientUser?.email || '',
    subject: subject || '',
    body: body || '',
    companyName: companyName || '',
    campaignType,
    applicationId,
    jobOfferId,
    messageId: messageId || '',
  }

  const docs = []

  if (recipientUser) {
    docs.push({
      userId: recipientUser._id || recipientUser.id,
      direction: 'received',
      fromEmail: senderUser?.email || '',
      ...base,
    })
  }

  if (senderUser) {
    docs.push({
      userId: senderUser._id || senderUser.id,
      direction: 'sent',
      fromEmail: senderUser.email || '',
      ...base,
    })
  }

  if (docs.length === 0) return null
  return Email.create(docs)
}

// Email envoyé par un candidat dans le cadre d'une candidature.
export async function recordCandidateEmail({ candidate, recruiterUser = null, application, jobOffer = null, to, subject, body, messageId = '' }) {
  return recordExchange({
    senderUser: candidate,
    recipientUser: recruiterUser,
    subject,
    body,
    toName: jobOffer?.recruiterName || (recruiterUser ? `${recruiterUser.firstName || ''} ${recruiterUser.lastName || ''}`.trim() : 'Recruteur'),
    toEmail: to,
    companyName: jobOffer?.company || '',
    campaignType: 'candidature',
    applicationId: application?._id || application?.id || null,
    jobOfferId: jobOffer?._id || jobOffer?.id || null,
    messageId,
  })
}

// Email envoyé par un recruteur à un candidat.
export async function recordRecruiterEmail({ recruiterUser, candidateUser, subject, body, companyName = '', messageId = '' }) {
  return recordExchange({
    senderUser: recruiterUser,
    recipientUser: candidateUser,
    subject,
    body,
    toName: candidateUser ? `${candidateUser.firstName || ''} ${candidateUser.lastName || ''}`.trim() : 'Candidat',
    companyName,
    campaignType: 'recruteur',
    messageId,
  })
}

export default {
  recordExchange,
  recordCandidateEmail,
  recordRecruiterEmail,
}