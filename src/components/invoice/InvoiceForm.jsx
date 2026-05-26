import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { formatCurrency, calculateTotals, PAYMENT_METHODS } from '../../lib/invoiceHelpers'

const TVA_RATES = [
  { value: 0, label: '0 % (Exonéré / Auto-entrepreneur)' },
  { value: 5.5, label: '5,5 %' },
  { value: 10, label: '10 %' },
  { value: 20, label: '20 % (Standard)' },
]

function newItem() {
  return { id: Date.now(), description: '', quantity: 1, unit_price: 0, remise: 0 }
}

export default function InvoiceForm({ initialData, initialItems, clients, onSubmit, saving, docType = 'invoice' }) {
  const isQuote = docType === 'quote'
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    client_id: '',
    issue_date: today,
    due_date: '',
    tva_rate: 20,
    notes: '',
    po_number: '',
    payment_method: 'virement',
    remise_globale: 0,
    ...initialData,
  })

  const [items, setItems] = useState(
    initialItems?.length > 0
      ? initialItems.map((it) => ({ ...it, id: it.id || Date.now() + Math.random(), remise: it.remise || 0 }))
      : [newItem()]
  )

  const [errors, setErrors] = useState({})
  const [showRemise, setShowRemise] = useState(false)

  useEffect(() => {
    if (initialData) setForm((prev) => ({ ...prev, ...initialData }))
  }, [initialData])

  useEffect(() => {
    if (initialItems?.length > 0) {
      const mapped = initialItems.map((it) => ({ ...it, id: it.id || Date.now() + Math.random(), remise: it.remise || 0 }))
      setItems(mapped)
      setShowRemise(mapped.some((i) => Number(i.remise || 0) > 0))
    }
  }, [initialItems])

  const { subtotalBrut, remiseGlobaleAmount, subtotal, tvaAmount, total } = calculateTotals(items, form.tva_rate, form.remise_globale)

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const addItem = () => setItems((prev) => [...prev, newItem()])

  const removeItem = (id) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const validate = () => {
    const errs = {}
    if (!form.client_id) errs.client_id = 'Sélectionnez un client'
    if (!form.issue_date) errs.issue_date = "Date d'émission requise"
    if (items.some((i) => !i.description?.trim())) errs.items = 'Chaque ligne doit avoir une description'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (status) => {
    if (!validate()) return
    onSubmit(
      {
        ...form,
        tva_rate: Number(form.tva_rate),
        remise_globale: Number(form.remise_globale || 0),
        status,
        subtotal_brut: subtotalBrut,
        subtotal,
        tva_amount: tvaAmount,
        total,
      },
      items
    )
  }

  return (
    <div className="space-y-6">
      {/* Client */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Client <span className="text-red-500">*</span>
        </label>
        <select
          value={form.client_id}
          onChange={set('client_id')}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.client_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        >
          <option value="">Sélectionner un client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.client_id && <p className="text-red-600 text-xs mt-1">{errors.client_id}</p>}
        {!clients.length && (
          <p className="text-amber-600 text-xs mt-1">
            Aucun client. <a href="/clients" className="underline">Créez-en un d'abord.</a>
          </p>
        )}
      </div>

      {/* Référence client (PO number) */}
      <Input
        label="Référence / N° bon de commande client"
        value={form.po_number}
        onChange={set('po_number')}
        placeholder="BC-2026-001 (optionnel)"
      />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date d'émission"
          type="date"
          value={form.issue_date}
          onChange={set('issue_date')}
          error={errors.issue_date}
          required
        />
        <Input
          label={isQuote ? 'Date de validité' : "Date d'échéance"}
          type="date"
          value={form.due_date}
          onChange={set('due_date')}
        />
      </div>

      {/* TVA + Mode de paiement */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA</label>
          <select
            value={form.tva_rate}
            onChange={(e) => setForm((prev) => ({ ...prev, tva_rate: Number(e.target.value) }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TVA_RATES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {!isQuote && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
            <select
              value={form.payment_method}
              onChange={set('payment_method')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Prestations / Articles <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowRemise(!showRemise)}
              className="text-xs text-gray-500 hover:text-indigo-600 font-medium"
            >
              {showRemise ? 'Masquer remises' : '+ Remises par ligne'}
            </button>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">Description</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-2.5 w-16">Qté</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2.5 w-24">P.U. HT (€)</th>
                {showRemise && (
                  <th className="text-center text-xs font-semibold text-gray-500 px-3 py-2.5 w-16">Remise %</th>
                )}
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2.5 w-24">Total HT</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
                const remisePct = Number(item.remise || 0)
                const lineTotalAfter = lineTotal * (1 - remisePct / 100)
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Description de la prestation…"
                        className="w-full text-sm focus:outline-none bg-transparent"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full text-sm text-center focus:outline-none bg-transparent"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full text-sm text-right focus:outline-none bg-transparent"
                      />
                    </td>
                    {showRemise && (
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.remise}
                          onChange={(e) => updateItem(item.id, 'remise', e.target.value)}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-full text-sm text-center focus:outline-none bg-transparent"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-700">
                      {formatCurrency(showRemise ? lineTotalAfter : lineTotal)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {errors.items && <p className="text-red-600 text-xs mt-1">{errors.items}</p>}
      </div>

      {/* Totals summary */}
      <div className="flex justify-end">
        <div className="w-72 bg-gray-50 rounded-xl p-4 space-y-2">
          {(showRemise || Number(form.remise_globale) > 0) && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total brut HT</span>
              <span className="font-medium text-gray-800">{formatCurrency(subtotalBrut)}</span>
            </div>
          )}

          {/* Remise globale */}
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-gray-500 whitespace-nowrap">Remise globale (%)</span>
            <input
              type="number"
              value={form.remise_globale}
              onChange={(e) => setForm((prev) => ({ ...prev, remise_globale: e.target.value }))}
              min="0"
              max="100"
              step="0.5"
              className="w-16 text-sm text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {Number(form.remise_globale) > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Remise</span>
              <span>- {formatCurrency(remiseGlobaleAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sous-total HT</span>
            <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">TVA ({form.tva_rate} %)</span>
            <span className="font-medium text-gray-800">{formatCurrency(tvaAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total TTC</span>
            <span className="text-indigo-600 text-base">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={3}
          placeholder="Notes ou conditions particulières…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={() => handleSubmit('draft')} loading={saving}>
          Enregistrer brouillon
        </Button>
        <Button onClick={() => handleSubmit('sent')} loading={saving}>
          {isQuote ? 'Marquer comme envoyé' : 'Marquer comme envoyée'}
        </Button>
      </div>
    </div>
  )
}
