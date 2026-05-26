import { useState } from 'react'
import { X, Mail, Send } from 'lucide-react'
import Button from '../ui/Button'

export default function EmailModal({ invoice, client, onClose }) {
  const clientEmail = client?.email || ''
  const invoiceNumber = invoice?.invoice_number || ''

  const [to, setTo] = useState(clientEmail)
  const [subject, setSubject] = useState(`Facture ${invoiceNumber}`)
  const [body, setBody] = useState(
    `Bonjour,\n\nVeuillez trouver ci-joint votre facture ${invoiceNumber}.\n\nN'hésitez pas à me contacter pour toute question.\n\nCordialement`
  )

  const handleSend = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Mail size={16} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Envoyer par email</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

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
              rows={6}
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
          <Button onClick={handleSend} disabled={!to}>
            <Send size={14} className="mr-1.5" />
            Ouvrir dans l'email
          </Button>
        </div>
      </div>
    </div>
  )
}
