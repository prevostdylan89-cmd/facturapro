import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Receipt } from 'lucide-react'
import { supabase } from '../lib/supabase'
import InvoicePreview from '../components/invoice/InvoicePreview'
import { generateInvoicePDF, downloadPDF } from '../lib/pdfGenerator'

export default function PublicInvoice() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      if (invErr || !invoice) {
        setError('Facture introuvable ou lien expiré.')
        setLoading(false)
        return
      }

      const [{ data: items }, { data: client }, { data: profile }, { data: settings }] =
        await Promise.all([
          supabase.from('invoice_items').select('*').eq('invoice_id', id),
          invoice.client_id
            ? supabase.from('clients').select('*').eq('id', invoice.client_id).single()
            : Promise.resolve({ data: null }),
          supabase.from('profiles').select('*').eq('id', invoice.user_id).single(),
          supabase.from('invoice_settings').select('*').eq('user_id', invoice.user_id).single(),
        ])

      setData({ invoice, items: items || [], client, profile, settings })
      setLoading(false)
    }
    load()
  }, [id])

  const handleDownload = async () => {
    if (!data) return
    setDownloading(true)
    const doc = generateInvoicePDF(
      data.invoice,
      data.items,
      data.client,
      data.profile,
      data.settings
    )
    downloadPDF(doc, data.invoice)
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
          <Receipt size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-indigo-600">
            <Receipt size={20} />
            <span className="font-bold">FacturaPro</span>
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

        {/* Invoice */}
        <InvoicePreview
          invoice={data.invoice}
          items={data.items}
          client={data.client}
          profile={data.profile}
          settings={data.settings}
        />
      </div>
    </div>
  )
}
