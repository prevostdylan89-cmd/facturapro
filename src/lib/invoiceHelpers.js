export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

// Version sans espaces insécables pour jsPDF (qui les rend en "/")
export function formatCurrencyPDF(amount) {
  const num = Number(amount || 0)
  const [int, dec] = num.toFixed(2).split('.')
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${intFormatted},${dec} EUR`
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString))
}

export function formatDateShort(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(dateString))
}

export function calculateTotals(items, tvaRate, remiseGlobale = 0) {
  const subtotalBrut = items.reduce((sum, item) => {
    const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
    const remiseLine = Number(item.remise || 0)
    return sum + lineTotal * (1 - remiseLine / 100)
  }, 0)

  const remiseGlobaleAmount = subtotalBrut * (Number(remiseGlobale || 0) / 100)
  const subtotal = subtotalBrut - remiseGlobaleAmount
  const tvaAmount = subtotal * (Number(tvaRate || 0) / 100)
  const total = subtotal + tvaAmount

  return { subtotalBrut, remiseGlobaleAmount, subtotal, tvaAmount, total }
}

export const STATUS_LABELS = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
}

export const STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
}

export const QUOTE_STATUS_LABELS = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  refused: 'Refusé',
}

export const QUOTE_STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  accepted: 'green',
  refused: 'red',
}

export const DOC_TYPE_LABELS = {
  invoice: 'Facture',
  quote: 'Devis',
  credit_note: 'Avoir',
}

export const PAYMENT_METHODS = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'especes', label: 'Espèces' },
  { value: 'prelevement', label: 'Prélèvement' },
]

export function getEffectiveStatus(invoice) {
  if (invoice.status === 'paid' || invoice.status === 'draft') return invoice.status
  if (invoice.status === 'accepted' || invoice.status === 'refused') return invoice.status
  if (invoice.status === 'sent' && invoice.due_date && invoice.type !== 'quote') {
    if (new Date(invoice.due_date) < new Date()) return 'overdue'
  }
  return invoice.status
}

export function getMonthLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date)
}

export function getLast6Months() {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: getMonthLabel(d),
    })
  }
  return months
}

export function exportToCSV(invoices, filename = 'factures.csv') {
  const headers = ['Numéro', 'Type', 'Client', 'Date émission', 'Échéance', 'Statut', 'HT', 'TVA', 'TTC']
  const rows = invoices.map((inv) => [
    inv.invoice_number || '',
    DOC_TYPE_LABELS[inv.type] || 'Facture',
    inv.clients?.name || inv.client_name || '',
    inv.issue_date || '',
    inv.due_date || '',
    STATUS_LABELS[getEffectiveStatus(inv)] || inv.status || '',
    Number(inv.subtotal || 0).toFixed(2),
    Number(inv.tva_amount || 0).toFixed(2),
    Number(inv.total || 0).toFixed(2),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
