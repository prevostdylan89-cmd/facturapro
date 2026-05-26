import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import InvoiceForm from '../components/invoice/InvoiceForm'
import InvoicePreview from '../components/invoice/InvoicePreview'
import { useAuth } from '../hooks/useAuth'
import { useClients } from '../hooks/useClients'
import { useInvoices } from '../hooks/useInvoices'
import { supabase } from '../lib/supabase'

export default function NewInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const { clients } = useClients()

  // Determine doc type from route
  const isQuoteRoute = location.pathname.startsWith('/quotes')
  const docType = isQuoteRoute ? 'quote' : 'invoice'

  const { createInvoice, updateInvoice, createQuote } = useInvoices(docType)

  const [initialData, setInitialData] = useState(null)
  const [initialItems, setInitialItems] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  const [previewData, setPreviewData] = useState({})
  const [previewItems, setPreviewItems] = useState([])

  useEffect(() => {
    supabase
      .from('invoice_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setSettings(data))
  }, [user])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Document introuvable')
        } else {
          const { invoice_items, ...invoice } = data
          setInitialData(invoice)
          setInitialItems(invoice_items || [])
          setPreviewData(invoice)
          setPreviewItems(invoice_items || [])
        }
        setLoading(false)
      })
  }, [id])

  const selectedClient = clients.find((c) => c.id === (previewData.client_id || initialData?.client_id))

  const handleSubmit = async (formData, items) => {
    setError('')
    setSaving(true)

    const remiseGlobale = Number(formData.remise_globale || 0)
    const payload = {
      client_id: formData.client_id || null,
      issue_date: formData.issue_date,
      due_date: formData.due_date || null,
      tva_rate: formData.tva_rate,
      status: formData.status,
      notes: formData.notes || null,
      po_number: formData.po_number || null,
      payment_method: formData.payment_method || 'virement',
      remise_globale: remiseGlobale,
      subtotal: formData.subtotal,
      tva_amount: formData.tva_amount,
      total: formData.total,
    }

    const itemsPayload = items.map((item) => {
      const lineTotal = Number(item.quantity) * Number(item.unit_price)
      const remisePct = Number(item.remise || 0)
      return {
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        remise: remisePct,
        total: lineTotal * (1 - remisePct / 100),
      }
    })

    let result
    if (id) {
      result = await updateInvoice(id, payload, itemsPayload)
    } else if (docType === 'quote') {
      result = await createQuote(payload, itemsPayload)
    } else {
      result = await createInvoice(payload, itemsPayload)
    }

    setSaving(false)

    if (result.error) {
      setError(result.error.message || 'Une erreur est survenue')
    } else {
      navigate(docType === 'quote' ? '/quotes' : '/invoices')
    }
  }

  const backPath = docType === 'quote' ? '/quotes' : '/invoices'
  const docLabel = docType === 'quote' ? 'devis' : 'facture'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backPath)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {id ? `Modifier le ${docLabel}` : `Nouveau ${docLabel}`}
            </h1>
            {id && initialData?.invoice_number && (
              <p className="text-sm text-gray-500">{initialData.invoice_number}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPreview ? 'Masquer aperçu' : 'Aperçu PDF'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl'}`}>
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5 pb-3 border-b border-gray-100">
            {docType === 'quote' ? 'Informations du devis' : 'Informations de la facture'}
          </h2>
          <InvoiceForm
            initialData={initialData}
            initialItems={initialItems}
            clients={clients}
            docType={docType}
            onSubmit={(data, items) => {
              setPreviewData(data)
              setPreviewItems(items)
              handleSubmit(data, items)
            }}
            saving={saving}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Aperçu PDF</h2>
            <div className="sticky top-20">
              <InvoicePreview
                invoice={{ ...initialData, ...previewData }}
                items={previewItems.length > 0 ? previewItems : initialItems}
                client={selectedClient}
                profile={profile}
                settings={settings}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
