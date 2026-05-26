import { useNavigate } from 'react-router-dom'
import { Edit, Copy, Trash2, Download, MoreVertical, CheckCircle, Send } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Badge from '../ui/Badge'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, getEffectiveStatus } from '../../lib/invoiceHelpers'

export default function InvoiceCard({ invoice, onDelete, onDuplicate, onStatusChange, onDownload }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const status = getEffectiveStatus(invoice)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const clientName = invoice.clients?.name || invoice.client_name || '—'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">{invoice.invoice_number}</span>
            <Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
          </div>
          <p className="text-sm text-gray-600 truncate">{clientName}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>Émise le {formatDate(invoice.issue_date)}</span>
            {invoice.due_date && <span>Échéance {formatDate(invoice.due_date)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900 whitespace-nowrap">
            {formatCurrency(invoice.total)}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { navigate(`/invoices/${invoice.id}/edit`); setMenuOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit size={15} /> Modifier
                </button>
                {status === 'draft' && (
                  <button
                    onClick={() => { onStatusChange?.(invoice.id, 'sent'); setMenuOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Send size={15} /> Marquer envoyée
                  </button>
                )}
                {(status === 'sent' || status === 'overdue') && (
                  <button
                    onClick={() => { onStatusChange?.(invoice.id, 'paid'); setMenuOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <CheckCircle size={15} /> Marquer payée
                  </button>
                )}
                <button
                  onClick={() => { onDownload?.(invoice); setMenuOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download size={15} /> Télécharger PDF
                </button>
                <button
                  onClick={() => { onDuplicate?.(invoice.id); setMenuOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy size={15} /> Dupliquer
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => { onDelete?.(invoice.id); setMenuOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
