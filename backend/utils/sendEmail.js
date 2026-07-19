import nodemailer from 'nodemailer'

let transporterPromise = null

async function getTransporter() {
  if (transporterPromise) return transporterPromise

  const hasRealCreds = process.env.EMAIL_USER && process.env.EMAIL_PASS
    && process.env.EMAIL_USER !== 'your_email@gmail.com'
    && process.env.EMAIL_PASS !== 'your_app_password'

  if (hasRealCreds) {
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }))
  } else {
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
  }
  return transporterPromise
}

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter()
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'EasyJob <noreply@easyjob.ma>',
      to,
      subject,
      html,
    })
    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log('📧 Email envoyé:', info.messageId)
    if (previewUrl) {
      console.log('🔗 Voir l\'email:', previewUrl)
    }
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null }
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message)
    return { success: false, error: error.message }
  }
}

export const sendVerificationEmail = async (email, firstName, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563EB; font-size: 28px;">EasyJob</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: #1e293b; margin-bottom: 10px;">Bienvenue ${firstName} !</h2>
        <p style="color: #64748b; margin-bottom: 25px;">Voici votre code de vérification :</p>
        <div style="background: white; border: 2px dashed #2563EB; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <span style="font-size: 32px; font-weight: bold; color: #2563EB; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Ce code expire dans 10 minutes.</p>
        <p style="color: #94a3b8; font-size: 13px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: 'EasyJob — Vérification de votre email', html })
}

export const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563EB; font-size: 28px;">EasyJob</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 30px;">
        <h2 style="color: #1e293b;">Réinitialisation du mot de passe</h2>
        <p style="color: #64748b; margin-bottom: 20px;">Bonjour ${firstName},</p>
        <p style="color: #64748b; margin-bottom: 20px;">Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 20px;">Réinitialiser</a>
        <p style="color: #94a3b8; font-size: 13px;">Ce lien expire dans 1 heure.</p>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: 'EasyJob — Réinitialisation du mot de passe', html })
}
