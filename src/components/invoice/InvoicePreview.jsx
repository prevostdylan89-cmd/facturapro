import { formatCurrency, formatDate } from '../../lib/invoiceHelpers'

export default function InvoicePreview({ invoice, items = [], client, profile, settings }) {
  const subtotal = items.reduce(
    (s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0),
    0
  )
  const tvaAmount = subtotal * (Number(invoice?.tva_rate || 0) / 100)
  const total = subtotal + tvaAmount

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden text-xs font-sans">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-5 flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold">{profile?.company_name || 'Mon Entreprise'}</h2>
          {profile?.address && (
            <p className="opacity-80 text-xs mt-0.5">{profile.address.split('\n')[0]}</p>
          )}
          {profile?.email && <p className="opacity-70 text-xs">{profile.email}</p>}
        </div>
        <div className="text-right">
          <p className="opacity-70 text-xs uppercase tracking-wider">Facture</p>
          <p className="text-sm font-bold mt-0.5">{invoice?.invoice_number || 'FAC-2026-001'}</p>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Info row */}
        <div className="flex gap-4 mb-4">
          {/* Client */}
          <div className="flex-1 bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 uppercase text-xs tracking-wider mb-1">Facturé à</p>
            <p className="font-semibold text-gray-900">{client?.name || '—'}</p>
            {client?.address && (
              <p className="text-gray-500 text-xs mt-0.5 whitespace-pre-line">{client.address}</p>
            )}
            {client?.email && <p className="text-gray-500 text-xs">{client.email}</p>}
          </div>

          {/* Dates */}
          <div className="w-40 bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div>
              <p className="text-gray-400 text-xs">Date d'émission</p>
              <p className="font-medium text-gray-900">{formatDate(invoice?.issue_date)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Échéance</p>
              <p className="font-medium text-gray-900">{formatDate(invoice?.due_date) || '—'}</p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="text-left px-3 py-2 font-semibold">Description</th>
              <th className="text-center px-3 py-2 font-semibold w-12">Qté</th>
              <th className="text-right px-3 py-2 font-semibold w-24">PU HT</th>
              <th className="text-right px-3 py-2 font-semibold w-24">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-center text-gray-400">
                  Aucune prestation
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-gray-800">{item.description || '—'}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                    {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-52 space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total HT</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA ({invoice?.tva_rate || 0}%)</span>
              <span className="font-medium">{formatCurrency(tvaAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg mt-2">
              <span>TOTAL TTC</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        {(settings?.payment_terms || profile?.iban) && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-3">
            <p className="text-indigo-700 font-semibold uppercase text-xs tracking-wider mb-1">
              Conditions de paiement
            </p>
            {settings?.payment_terms && (
              <p className="text-gray-700">Délai : {settings.payment_terms}</p>
            )}
            {profile?.iban && <p className="text-gray-700">IBAN : {profile.iban}</p>}
          </div>
        )}

        {/* Notes */}
        {invoice?.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Notes</p>
            <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-center text-gray-400 text-xs">
        {settings?.footer_text || 'Merci pour votre confiance.'}
      </div>
    </div>
  )
}
