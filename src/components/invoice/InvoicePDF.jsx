import { useState } from 'react'
import { Download, ExternalLink } from 'lucide-react'
import Button from '../ui/Button'
import { generateInvoicePDF, downloadPDF, openPDFInNewTab } from '../../lib/pdfGenerator'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function InvoicePDF({ invoice, items, client }) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  const getSettings = async () => {
    const { data } = await supabase
      .from('invoice_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single()
    return data
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
      const settings = await getSettings()
      const doc = generateInvoicePDF(invoice, items, client, profile, settings)
      downloadPDF(doc, invoice)
    } catch (e) {
      console.error('Erreur PDF:', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const settings = await getSettings()
      const doc = generateInvoicePDF(invoice, items, client, profile, settings)
      openPDFInNewTab(doc)
    } catch (e) {
      console.error('Erreur PDF:', e)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handlePreview} variant="secondary" size="sm" loading={previewLoading}>
        <ExternalLink size={14} className="mr-1.5" />
        Aperçu PDF
      </Button>
      <Button onClick={handleDownload} size="sm" loading={loading}>
        <Download size={14} className="mr-1.5" />
        Télécharger
      </Button>
    </div>
  )
}
