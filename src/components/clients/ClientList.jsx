import ClientCard from './ClientCard'
import { Users } from 'lucide-react'

export default function ClientList({ clients, invoices, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!clients?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Users size={40} strokeWidth={1} className="mb-3" />
        <p className="text-sm font-medium">Aucun client pour l'instant</p>
        <p className="text-xs mt-1">Ajoutez votre premier client pour commencer</p>
      </div>
    )
  }

  const getClientStats = (clientId) => {
    const clientInvoices = invoices?.filter((inv) => inv.client_id === clientId) || []
    const totalBilled = clientInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    return { invoiceCount: clientInvoices.length, totalBilled }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => {
        const { invoiceCount, totalBilled } = getClientStats(client.id)
        return (
          <ClientCard
            key={client.id}
            client={client}
            invoiceCount={invoiceCount}
            totalBilled={totalBilled}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      })}
    </div>
  )
}
