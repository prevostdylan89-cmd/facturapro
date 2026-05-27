import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Receipt, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cguAccepted, setCguAccepted] = useState(false)

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = "L'email est requis"
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide'
    if (!form.password) errs.password = 'Le mot de passe est requis'
    else if (form.password.length < 6) errs.password = '6 caractères minimum'
    if (mode === 'signup' && form.password !== form.confirmPassword)
      errs.confirmPassword = 'Les mots de passe ne correspondent pas'
    if (mode === 'signup' && !cguAccepted)
      errs.cgu = 'Vous devez accepter les CGU pour créer un compte'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccessMsg('')
    if (!validate()) return

    setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password)
      if (error) setServerError(error.message)
      else navigate('/dashboard')
    } else {
      const { error } = await signUp(form.email, form.password, new Date().toISOString())
      if (error) setServerError(error.message)
      else {
        setSuccessMsg('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Receipt size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FacturaPro</h1>
          <p className="text-gray-500 text-sm mt-1">Votre facturation simplifiée</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setMode('login'); setErrors({}); setServerError('') }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode('signup'); setErrors({}); setServerError('') }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3">
                {successMsg}
              </div>
            )}
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {serverError}
              </div>
            )}

            <Input
              label="Adresse email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="vous@example.com"
              error={errors.email}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={`w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>

            {mode === 'signup' && (
              <Input
                label="Confirmer le mot de passe"
                type="password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="••••••••"
                error={errors.confirmPassword}
                required
              />
            )}

            {mode === 'signup' && (
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={cguAccepted}
                    onChange={(e) => setCguAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-gray-600 leading-snug">
                    J'ai lu et j'accepte les{' '}
                    <Link
                      to="/cgu"
                      target="_blank"
                      className="text-indigo-600 underline hover:text-indigo-800"
                    >
                      Conditions Générales d'Utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link
                      to="/cgu#art7"
                      target="_blank"
                      className="text-indigo-600 underline hover:text-indigo-800"
                    >
                      Politique de confidentialité
                    </Link>
                  </span>
                </label>
                {errors.cgu && (
                  <p className="text-red-600 text-xs mt-1.5">{errors.cgu}</p>
                )}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 FacturaPro — Tous droits réservés
        </p>
      </div>
    </div>
  )
}
