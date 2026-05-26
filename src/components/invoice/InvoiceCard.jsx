import { useNavigate } from 'react-router-dom'
import { Edit, Copy, Trash2, Download, MoreVertical, CheckCircle, Send, Mail, FileX, ArrowRightCircle, RotateCcw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Badge from '../ui/Badge'
import EmailModal from './EmailModal'
import {
  formatCurrency,
  formatDate,
  STATUS_LABELS,
  STATUS_COLORS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  DOC_TYPE_LABELS,
  getEffectiveStatus,
} from '../../lib/invoiceHelpers'

export default function InvoiceCard({
  invoice,
  client,
  onDelete,
  onDuplicate,
  onStatusChange,
  onDownload,
  onCreateCreditNote,
  onConvertToInvoice,
}) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const menuRef = useRef(null)

  const isQuote = invoice.type === 'quote'
  const isCreditNote = invoice.type === 'credit_note'

  const status = getEffectiveStatus(invoice)
  const statusLabels = isQuote ? QUOTE_STATUS_LABELS : STATUS_LABELS
  const statusColors = isQuote ? QUOTE_STATUS_COLORS : STATUS_COLORS

  const editPath = isQuote
    ? `/quotes/${invoice.id}/edit`
    : `/invoices/${invoice.id}/edit`

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const clientName = invoice.clients?.name || invoice.client_name || '—'

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 text-sm">{invoice.invoice_number}</span>
              <Badge color={statusColors[status] || 'gray'}>{statusLabels[status] || status}</Badge>
              {isCreditNote && (
                <Badge color="purple">Avoir</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{clientName}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>Émis le {formatDate(invoice.issue_date)}</span>
              {invoice.due_date && !isQuote && <span>Échéance {formatDate(invoice.due_date)}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-base font-bold whitespace-nowrap ${isCreditNote ? 'text-red-600' : 'text-gray-900'}`}>
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
                <div className="absolute right-0 top-8 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => { navigate(editPath); setMenuOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit size={15} /> Modifier
                  </button>

                  {/* Statuts facture */}
                  {!isQuote && !isCreditNote && status === 'draft' && (
                    <button
                      onClick={() => { onStatusChange?.(invoice.id, 'sent'); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Send size={15} /> Marquer envoyée
                    </button>
                  )}
                  {!isQuote && !isCreditNote && (status === 'sent' || status === 'overdue') && (
                    <button
                      onClick={() => { onStatusChange?.(invoice.id, 'paid'); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <CheckCircle size={15} /> Marquer payée
                    </button>
                  )}

                  {/* Statuts devis */}
                  {isQuote && status === 'draft' && (
                    <button
                      onClick={() => { onStatusChange?.(invoice.id, 'sent'); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Send size={15} /> Marquer envoyé
                    </button>
                  )}
                  {isQuote && status === 'sent' && (
                    <>
                      <button
                        onClick={() => { onStatusChange?.(invoice.id, 'accepted'); setMenuOpen(false) }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle size={15} /> Marquer accepté
                      </button>
                      <button
                        onClick={() => { onStatusChange?.(invoice.id, 'refused'); setMenuOpen(false) }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FileX size={15} /> Marquer refusé
                      </button>
                    </>
                  )}
                  {isQuote && (status === 'sent' || status === 'accepted') && (
                    <button
                      onClick={() => { onConvertToInvoice?.(invoice.id); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <ArrowRightCircle size={15} /> Convertir en facture
                    </button>
                  )}

                  {/* Avoir sur facture payée */}
                  {!isQuote && !isCreditNote && status === 'paid' && (
                    <button
                      onClick={() => { onCreateCreditNote?.(invoice.id); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <RotateCcw size={15} /> Créer un avoir
                    </button>
                  )}

                  {/* Email */}
                  <button
                    onClick={() => { setEmailOpen(true); setMenuOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Mail size={15} /> Envoyer par email
                  </button>

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

      {emailOpen && (
        <EmailModal
          invoice={invoice}
          client={client || invoice.clients}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </>
  )
}
