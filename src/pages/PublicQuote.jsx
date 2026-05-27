import { useState, useEffect } from 'react'
import { Download, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import InvoicePreview from '../components/invoice/InvoicePreview'
import { generateInvoicePDF, downloadPDF } from '../lib/pdfGenerator'
import { formatCurrency, formatDate } from '../lib/invoiceHelpers'

export default function PublicQuote() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [actionDone, setActionDone] = useState(null) // 'accepted' | 'refused'
  const [acting, setActing] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: quote, error: qErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('type', 'quote')
        .single()

      if (qErr || !quote) {
        setError('Devis introuvable ou lien expiré.')
        setLoading(false)
        return
      }

      const [{ data: items }, { data: client }, { data: profile }, { data: settings }] =
        await Promise.all([
          supabase.from('invoice_items').select('*').eq('invoice_id', id),
          quote.client_id
            ? supabase.from('clients').select('*').eq('id', quote.client_id).single()
            : Promise.resolve({ data: null }),
          supabase.from('profiles').select('*').eq('id', quote.user_id).single(),
          supabase.from('invoice_settings').select('*').eq('user_id', quote.user_id).single(),
        ])

      setData({ quote, items: items || [], client, profile, settings })
      if (quote.status === 'accepted' || quote.status === 'refused') {
        setActionDone(quote.status)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleAction = async (action) => {
    setActing(true)
    const { error: err } = await supabase.rpc('accept_quote', {
      p_quote_id: id,
      p_action: action,
    })
    setActing(false)
    if (err) {
      alert('Erreur : ' + err.message)
      return
    }
    setActionDone(action)
    setData((prev) => prev ? { ...prev, quote: { ...prev.quote, status: action } } : prev)
  }

  const handleDownload = async () => {
    if (!data) return
    setDownloading(true)
    const doc = await generateInvoicePDF(data.quote, data.items, data.client, data.profile, data.settings)
    downloadPDF(doc, data.quote)
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const { quote, items, client, profile, settings } = data
  const isExpired = quote.due_date && new Date(quote.due_date) < new Date()
  const canAct = !actionDone && !isExpired

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <ClipboardList size={20} />
            <span className="font-bold">Devis {quote.invoice_number}</span>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            {downloading ? 'Génération…' : 'Télécharger PDF'}
          </button>
        </div>

        {/* Bandeau statut */}
        {actionDone === 'accepted' && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle size={22} className="text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Devis accepté ✓</p>
              <p className="text-sm text-emerald-600">Merci ! {profile?.full_name || profile?.company_name || 'Votre prestataire'} a été notifié de votre acceptation.</p>
            </div>
          </div>
        )}

        {actionDone === 'refused' && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <XCircle size={22} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Devis refusé</p>
              <p className="text-sm text-red-600">Votre refus a bien été enregistré.</p>
            </div>
          </div>
        )}

        {isExpired && !actionDone && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Clock size={22} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Devis expiré</p>
              <p className="text-sm text-amber-600">Ce devis n'est plus valide depuis le {formatDate(quote.due_date)}. Contactez votre prestataire.</p>
            </div>
          </div>
        )}

        {/* Boutons Accepter / Refuser */}
        {canAct && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Montant : <span className="text-indigo-600 text-base">{formatCurrency(quote.total)}</span>
              {quote.due_date && (
                <span className="text-gray-400 font-normal ml-2">· Valable jusqu'au {formatDate(quote.due_date)}</span>
              )}
            </p>
            <p className="text-sm text-gray-500 mb-4">En cliquant sur "Accepter", vous confirmez votre accord sur les prestations et le montant ci-dessus.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAction('accepted')}
                disabled={acting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm"
              >
                <CheckCircle size={17} />
                {acting ? 'Enregistrement…' : 'Accepter le devis'}
              </button>
              <button
                onClick={() => handleAction('refused')}
                disabled={acting}
                className="flex items-center justify-center gap-2 px-5 py-3 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
              >
                <XCircle size={17} />
                Refuser
              </button>
            </div>
          </div>
        )}

        {/* Aperçu du devis */}
        <InvoicePreview
          invoice={quote}
          items={items}
          client={client}
          profile={profile}
          settings={settings}
        />
      </div>
    </div>
  )
}
