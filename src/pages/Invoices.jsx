import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { useAuth } from '../hooks/useAuth'
import InvoiceCard from '../components/invoice/InvoiceCard'
import Button from '../components/ui/Button'
import { generateInvoicePDF, downloadPDF } from '../lib/pdfGenerator'
import { getEffectiveStatus, exportToCSV } from '../lib/invoiceHelpers'
import { supabase } from '../lib/supabase'

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
]

const PAGE_SIZE = 10

export default function Invoices() {
  const navigate = useNavigate()
  const { invoices, loading, deleteInvoice, duplicateInvoice, updateStatus, createCreditNote } = useInvoices('invoice')
  const { profile } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [page, setPage] = useState(1)

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

  const handleCreditNote = async (id) => {
    if (!confirm('Créer un avoir pour cette facture ?')) return
    setActionLoading(true)
    const { error } = await createCreditNote(id)
    if (error) alert(`Erreur : ${error.message || error}`)
    setActionLoading(false)
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

      const doc = await generateInvoicePDF(invoice, items || [], client, profile, settings)
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleSearchChange = (v) => { setSearch(v); setPage(1) }
  const handleFilterChange = (v) => { setStatusFilter(v); setPage(1) }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500">{filtered.length} facture{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button
              onClick={() => exportToCSV(filtered, 'factures.csv')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> CSV
            </button>
          )}
          <Button onClick={() => navigate('/invoices/new')}>
            <Plus size={16} className="mr-1.5" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
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
      {loading || actionLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
          Aucune facture trouvée
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onStatusChange={handleStatusChange}
              onDownload={handleDownload}
              onCreateCreditNote={handleCreditNote}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Page {safePage} / {totalPages} — {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === safePage ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
