import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle, RefreshCw, ExternalLink, Eye } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import AuthLayout from '@/layouts/AuthLayout'

export default function VerifyEmailPage() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const inputRefs = useRef([])
  const { user, verifyEmail, resendVerification } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (location.state?.previewUrl) {
      setPreviewUrl(location.state.previewUrl)
    }
  }, [location.state])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setCode(newCode)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) return toast.error('Veuillez entrer le code à 6 chiffres')

    setLoading(true)
    const result = await verifyEmail(user.email, fullCode)
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      toast.success('Email vérifié avec succès !')
      setTimeout(() => navigate('/dashboard'), 2000)
    } else {
      toast.error(result.error)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResend = async () => {
    setResending(true)
    const result = await resendVerification(user.email)
    setResending(false)
    if (result.success) {
      toast.success('Nouveau code envoyé !')
      if (result.previewUrl) {
        setPreviewUrl(result.previewUrl)
      }
    } else {
      toast.error(result.error)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-secondary-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-surface-800 dark:text-white mb-2">Email vérifié !</h1>
          <p className="text-surface-500">Redirection vers le tableau de bord...</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-500 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>
        <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Vérifiez votre email</h1>
        <p className="text-surface-500 mt-1">
          Un code à 6 chiffres a été envoyé à<br />
          <span className="font-medium text-surface-700 dark:text-surface-300">{user?.email}</span>
        </p>
      </div>

      {/* Dev mode: show preview URL */}
      {previewUrl && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-800 p-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                Mode développement — Email de test
              </p>
              <p className="text-xs text-primary-600/80 dark:text-primary-400/80 mt-1">
                Les emails sont envoyés via Ethereal. Cliquez ci-dessous pour voir l'email contenant votre code :
              </p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-surface-800 border border-primary-200 dark:border-primary-700 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors break-all"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">{previewUrl}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.join('').length !== 6}
          className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {loading ? 'Vérification...' : 'Vérifier'}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-surface-500">
          Vous n'avez pas reçu le code ?{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary-500 hover:text-primary-600 font-semibold inline-flex items-center gap-1"
          >
            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Renvoyer
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
