import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function ClientForm({ initialData, onSubmit, saving }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    siret: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) setForm({ ...form, ...initialData })
  }, [initialData])

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Le nom est requis'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom / Raison sociale"
        value={form.name}
        onChange={set('name')}
        placeholder="Entreprise SARL"
        error={errors.name}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="contact@example.com"
          error={errors.email}
        />
        <Input
          label="Téléphone"
          value={form.phone}
          onChange={set('phone')}
          placeholder="+33 6 00 00 00 00"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <textarea
          value={form.address}
          onChange={set('address')}
          rows={3}
          placeholder="12 rue de la Paix&#10;75001 Paris"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <Input
        label="SIRET"
        value={form.siret}
        onChange={set('siret')}
        placeholder="123 456 789 00012"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={saving}>
          {initialData ? 'Enregistrer' : 'Créer le client'}
        </Button>
      </div>
    </form>
  )
}
