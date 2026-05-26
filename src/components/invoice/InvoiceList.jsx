import InvoiceCard from './InvoiceCard'
import { FileText } from 'lucide-react'

export default function InvoiceList({ invoices, onDelete, onDuplicate, onStatusChange, onDownload, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!invoices?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FileText size={40} strokeWidth={1} className="mb-3" />
        <p className="text-sm font-medium">Aucune facture pour l'instant</p>
        <p className="text-xs mt-1">Créez votre première facture pour commencer</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onStatusChange={onStatusChange}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}
