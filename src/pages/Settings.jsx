import { useState, useEffect } from 'react'
import { Building2, FileText, Upload, Check, AlertCircle, Hash } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Icon size={18} />
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    company_name: '',
    address: '',
    phone: '',
    email: '',
    siret: '',
    tva_number: '',
    iban: '',
  })

  const [settingsForm, setSettingsForm] = useState({
    prefix: 'FAC',
    next_invoice_number: 1,
    quote_prefix: 'DEV',
    next_quote_number: 1,
    credit_note_prefix: 'AV',
    next_credit_note_number: 1,
    payment_terms: '30 jours net',
    late_fees:
      "En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal seront appliquées.",
    bank_details: '',
    footer_text: 'Merci pour votre confiance.',
  })

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || user?.email || '',
        siret: profile.siret || '',
        tva_number: profile.tva_number || '',
        iban: profile.iban || '',
      })
      if (profile.logo_url) setLogoPreview(profile.logo_url)
    }
  }, [profile])

  useEffect(() => {
    supabase
      .from('invoice_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSettingsForm({
            prefix: data.prefix || 'FAC',
            next_invoice_number: data.next_invoice_number ?? 1,
            quote_prefix: data.quote_prefix || 'DEV',
            next_quote_number: data.next_quote_number ?? 1,
            credit_note_prefix: data.credit_note_prefix || 'AV',
            next_credit_note_number: data.next_credit_note_number ?? 1,
            payment_terms: data.payment_terms || '30 jours net',
            late_fees: data.late_fees || '',
            bank_details: data.bank_details || '',
            footer_text: data.footer_text || 'Merci pour votre confiance.',
          })
        }
      })
  }, [user])

  const setP = (field) => (e) => setProfileForm((prev) => ({ ...prev, [field]: e.target.value }))
  const setS = (field) => (e) => setSettingsForm((prev) => ({ ...prev, [field]: e.target.value }))
  const setSNum = (field) => (e) => setSettingsForm((prev) => ({ ...prev, [field]: parseInt(e.target.value, 10) || 1 }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showMsg('error', 'Le logo ne doit pas dépasser 2 Mo')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const uploadLogo = async () => {
    if (!logoFile) return null
    setUploadingLogo(true)
    const ext = logoFile.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
    setUploadingLogo(false)
    if (error) {
      showMsg('error', 'Erreur upload logo : ' + error.message)
      return null
    }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    let logo_url = profile?.logo_url || null
    if (logoFile) {
      const url = await uploadLogo()
      if (url) logo_url = url
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profileForm, logo_url })

    setSaving(false)
    if (error) showMsg('error', 'Erreur : ' + error.message)
    else {
      refreshProfile()
      showMsg('success', 'Profil enregistré avec succès !')
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)

    const { error } = await supabase
      .from('invoice_settings')
      .upsert({ ...settingsForm, user_id: user.id }, { onConflict: 'user_id' })

    setSavingSettings(false)
    if (error) showMsg('error', 'Erreur : ' + error.message)
    else showMsg('success', 'Paramètres de facturation enregistrés !')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500">Gérez votre profil et vos préférences de facturation</p>
      </div>

      {msg.text && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm border ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {msg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Company profile */}
      <Section title="Mon entreprise" icon={Building2}>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload size={20} className="text-gray-400" />
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload size={14} />
                  {uploadingLogo ? 'Envoi…' : 'Choisir un logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG · 2 Mo max</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom / Nom" value={profileForm.full_name} onChange={setP('full_name')} placeholder="Jean Dupont" />
            <Input label="Raison sociale" value={profileForm.company_name} onChange={setP('company_name')} placeholder="Mon Entreprise SARL" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <textarea
              value={profileForm.address}
              onChange={setP('address')}
              rows={3}
              placeholder="12 rue de la Paix&#10;75001 Paris"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Téléphone" value={profileForm.phone} onChange={setP('phone')} placeholder="+33 6 00 00 00 00" />
            <Input label="Email professionnel" type="email" value={profileForm.email} onChange={setP('email')} placeholder="contact@example.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="SIRET" value={profileForm.siret} onChange={setP('siret')} placeholder="123 456 789 00012" />
            <Input label="N° TVA intracommunautaire" value={profileForm.tva_number} onChange={setP('tva_number')} placeholder="FR 00 123456789" />
          </div>

          <Input label="IBAN" value={profileForm.iban} onChange={setP('iban')} placeholder="FR76 3000 6000 0112 3456 7890 189" />

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving}>
              Enregistrer le profil
            </Button>
          </div>
        </form>
      </Section>

      {/* Invoice settings */}
      <Section title="Paramètres de facturation" icon={FileText}>
        <form onSubmit={handleSaveSettings} className="space-y-4">

          {/* Numérotation factures */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Factures</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Préfixe"
                value={settingsForm.prefix}
                onChange={setS('prefix')}
                placeholder="FAC"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prochain numéro</label>
                <input
                  type="number"
                  min="1"
                  value={settingsForm.next_invoice_number}
                  onChange={setSNum('next_invoice_number')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Exemple : {settingsForm.prefix || 'FAC'}-{new Date().getFullYear()}-{String(settingsForm.next_invoice_number || 1).padStart(3, '0')}
            </p>
          </div>

          {/* Numérotation devis */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Devis</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Préfixe"
                value={settingsForm.quote_prefix}
                onChange={setS('quote_prefix')}
                placeholder="DEV"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prochain numéro</label>
                <input
                  type="number"
                  min="1"
                  value={settingsForm.next_quote_number}
                  onChange={setSNum('next_quote_number')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Exemple : {settingsForm.quote_prefix || 'DEV'}-{new Date().getFullYear()}-{String(settingsForm.next_quote_number || 1).padStart(3, '0')}
            </p>
          </div>

          {/* Numérotation avoirs */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Avoirs</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Préfixe"
                value={settingsForm.credit_note_prefix}
                onChange={setS('credit_note_prefix')}
                placeholder="AV"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prochain numéro</label>
                <input
                  type="number"
                  min="1"
                  value={settingsForm.next_credit_note_number}
                  onChange={setSNum('next_credit_note_number')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Délai de paiement par défaut"
                value={settingsForm.payment_terms}
                onChange={setS('payment_terms')}
                placeholder="30 jours net"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coordonnées bancaires (sur facture)
            </label>
            <textarea
              value={settingsForm.bank_details}
              onChange={setS('bank_details')}
              rows={2}
              placeholder="BIC : BNPAFRPP — Banque : BNP Paribas"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clause pénalités de retard
            </label>
            <textarea
              value={settingsForm.late_fees}
              onChange={setS('late_fees')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pied de page personnalisé
            </label>
            <textarea
              value={settingsForm.footer_text}
              onChange={setS('footer_text')}
              rows={2}
              placeholder="Merci pour votre confiance."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={savingSettings}>
              Enregistrer les paramètres
            </Button>
          </div>
        </form>
      </Section>
    </div>
  )
}
