import { Edit, Trash2, Mail, Phone, FileText } from 'lucide-react'
import { formatCurrency } from '../../lib/invoiceHelpers'

export default function ClientCard({ client, invoiceCount, totalBilled, onEdit, onDelete }) {
  const initials = (client.name || '?').slice(0, 2).toUpperCase()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
          {client.email && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <Mail size={12} />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <Phone size={12} />
              <span>{client.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <FileText size={12} />
              <span>{invoiceCount || 0} facture{invoiceCount !== 1 ? 's' : ''}</span>
            </div>
            {totalBilled > 0 && (
              <div className="text-xs font-semibold text-indigo-600">
                {formatCurrency(totalBilled)} facturé
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit?.(client)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => onDelete?.(client.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
