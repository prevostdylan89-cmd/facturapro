import { useState } from 'react'
import { X, Mail, Send, Bell } from 'lucide-react'
import Button from '../ui/Button'
import { formatCurrency } from '../../lib/invoiceHelpers'

export default function EmailModal({ invoice, client, onClose, onSent, mode = 'default' }) {
  const isReminder = mode === 'reminder'
  const isQuote = invoice?.type === 'quote'
  const clientEmail = client?.email || ''
  const invoiceNumber = invoice?.invoice_number || ''
  const docLabel = isQuote ? 'devis' : 'facture'

  const defaultSubject = isReminder
    ? `Relance — Facture ${invoiceNumber} en attente de paiement`
    : `${isQuote ? 'Devis' : 'Facture'} ${invoiceNumber}`

  const defaultBody = isReminder
    ? `Bonjour${client?.name ? ` ${client.name}` : ''},\n\nSauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture ${invoiceNumber} d'un montant de ${formatCurrency(invoice?.total)}.\n\nNous vous serions reconnaissants de bien vouloir régulariser cette situation dans les meilleurs délais.\n\nN'hésitez pas à nous contacter si vous avez la moindre question.\n\nCordialement`
    : `Bonjour${client?.name ? ` ${client.name}` : ''},\n\nVeuillez trouver ci-joint votre ${docLabel} ${invoiceNumber}.\n\nN'hésitez pas à me contacter pour toute question.\n\nCordialement`

  const [to, setTo] = useState(clientEmail)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)

  const handleSend = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
    onSent?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isReminder ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {isReminder ? <Bell size={16} /> : <Mail size={16} />}
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {isReminder ? 'Envoyer une relance' : 'Envoyer par email'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isReminder && (
          <div className="mx-6 mt-4 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
            Relance n°{(invoice?.reminder_count || 0) + 1}
            {invoice?.last_reminder_at && (
              <span className="ml-2 text-orange-500">
                · Dernière relance : {new Date(invoice.last_reminder_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="client@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <p className="text-xs text-gray-400">
            Ouvre votre application email. Joignez le PDF manuellement.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button
            onClick={handleSend}
            disabled={!to}
            className={isReminder ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            <Send size={14} className="mr-1.5" />
            {isReminder ? 'Envoyer la relance' : "Ouvrir dans l'email"}
          </Button>
        </div>
      </div>
    </div>
  )
}
