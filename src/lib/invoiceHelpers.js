export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString))
}

export function formatDateShort(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(dateString))
}

export function calculateTotals(items, tvaRate) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  )
  const tvaAmount = subtotal * (Number(tvaRate || 0) / 100)
  const total = subtotal + tvaAmount
  return { subtotal, tvaAmount, total }
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

export function getEffectiveStatus(invoice) {
  if (invoice.status === 'paid' || invoice.status === 'draft') return invoice.status
  if (invoice.status === 'sent' && invoice.due_date) {
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
