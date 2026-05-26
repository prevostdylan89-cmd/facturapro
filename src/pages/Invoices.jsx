import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { useAuth } from '../hooks/useAuth'
import InvoiceList from '../components/invoice/InvoiceList'
import Button from '../components/ui/Button'
import { generateInvoicePDF, downloadPDF } from '../lib/pdfGenerator'
import { getEffectiveStatus, STATUS_LABELS } from '../lib/invoiceHelpers'
import { supabase } from '../lib/supabase'

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
]

export default function Invoices() {
  const navigate = useNavigate()
  const { invoices, loading, deleteInvoice, duplicateInvoice, updateStatus } = useInvoices()
  const { profile } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette facture ? Cette action est irréversible.')) return
    await deleteInvoice(id)
  }

  const handleDuplicate = async (id) => {
    setActionLoading(true)
    const { error } = await duplicateInvoice(id)
    if (error) alert(`Erreur : ${error.message || error}`)
    setActionLoading(false)
  }

  const handleStatusChange = async (id, status) => {
    await updateStatus(id, status)
  }

  const handleDownload = async (invoice) => {
    try {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      const { data: client } = invoice.client_id
        ? await supabase.from('clients').select('*').eq('id', invoice.client_id).single()
        : { data: null }

      const { data: settings } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('user_id', invoice.user_id)
        .single()

      const doc = generateInvoicePDF(invoice, items || [], client, profile, settings)
      downloadPDF(doc, invoice)
    } catch (e) {
      alert('Erreur lors de la génération du PDF')
    }
  }

  const filtered = invoices.filter((inv) => {
    const effectiveStatus = getEffectiveStatus(inv)
    const matchSearch =
      !search ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.clients?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || effectiveStatus === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500">{invoices.length} facture{invoices.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus size={16} className="mr-1.5" />
          Nouvelle facture
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <InvoiceList
        invoices={filtered}
        loading={loading || actionLoading}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onStatusChange={handleStatusChange}
        onDownload={handleDownload}
      />
    </div>
  )
}
