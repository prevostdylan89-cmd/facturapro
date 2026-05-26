import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './invoiceHelpers'

const PRIMARY = [79, 70, 229]
const DARK = [17, 24, 39]
const GRAY = [107, 114, 128]
const LIGHT = [249, 250, 251]
const WHITE = [255, 255, 255]
const BORDER = [229, 231, 235]
const PAGE_W = 210
const MARGIN = 20

export function generateInvoicePDF(invoice, items, client, profile, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Header band
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, PAGE_W, 50, 'F')

  // Company name
  doc.setTextColor(...WHITE)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(profile?.company_name || 'Mon Entreprise', MARGIN, 22)

  if (profile?.address) {
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.address.split('\n')[0], MARGIN, 30)
  }
  if (profile?.email) {
    doc.setFontSize(8)
    doc.text(profile.email, MARGIN, 37)
  }

  // Invoice number (right side of header)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('FACTURE', PAGE_W - MARGIN, 18, { align: 'right' })
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.invoice_number || '', PAGE_W - MARGIN, 28, { align: 'right' })

  let yPos = 62

  // Info box (dates + status)
  doc.setFillColor(...LIGHT)
  doc.roundedRect(130, 54, 60, 35, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(130, 54, 60, 35, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text("Date d'émission :", 134, 63)
  doc.text("Date d'échéance :", 134, 72)
  doc.text('Statut :', 134, 81)

  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(invoice.issue_date), 187, 63, { align: 'right' })
  doc.text(formatDate(invoice.due_date) || 'N/A', 187, 72, { align: 'right' })

  const statusLabels = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard' }
  doc.text(statusLabels[invoice.status] || invoice.status, 187, 81, { align: 'right' })

  // Company details (left)
  doc.setTextColor(...DARK)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  if (profile?.full_name) {
    doc.setFont('helvetica', 'bold')
    doc.text(profile.full_name, MARGIN, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 5
  }
  if (profile?.address) {
    profile.address.split('\n').forEach((line) => {
      doc.text(line, MARGIN, yPos)
      yPos += 4.5
    })
  }
  if (profile?.phone) { doc.text(`Tél : ${profile.phone}`, MARGIN, yPos); yPos += 4.5 }
  if (profile?.siret) { doc.text(`SIRET : ${profile.siret}`, MARGIN, yPos); yPos += 4.5 }
  if (profile?.tva_number) { doc.text(`N° TVA : ${profile.tva_number}`, MARGIN, yPos); yPos += 4.5 }

  yPos = Math.max(yPos, 95)

  // Divider
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos)
  yPos += 8

  // Client box
  const clientBoxH = 38
  doc.setFillColor(...LIGHT)
  doc.roundedRect(MARGIN, yPos, 85, clientBoxH, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(MARGIN, yPos, 85, clientBoxH, 2, 2, 'S')

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PRIMARY)
  doc.text('FACTURÉ À', MARGIN + 4, yPos + 7)

  doc.setTextColor(...DARK)
  doc.setFontSize(10)
  doc.text(client?.name || 'Client inconnu', MARGIN + 4, yPos + 14)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  let cy = yPos + 21
  if (client?.address) {
    client.address.split('\n').forEach((line) => { doc.text(line, MARGIN + 4, cy); cy += 4.5 })
  }
  if (client?.email) { doc.text(client.email, MARGIN + 4, cy); cy += 4.5 }
  if (client?.phone) { doc.text(client.phone, MARGIN + 4, cy) }

  yPos += clientBoxH + 8

  // Items table
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: items.map((item) => [
      item.description || '',
      Number(item.quantity || 0).toLocaleString('fr-FR'),
      formatCurrency(item.unit_price),
      formatCurrency(Number(item.quantity || 0) * Number(item.unit_price || 0)),
    ]),
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: { fontSize: 9, textColor: DARK, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 249, 255] },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 29, halign: 'right' },
    },
    margin: { left: MARGIN, right: MARGIN },
    styles: { lineColor: BORDER, lineWidth: 0.2, overflow: 'linebreak' },
    tableLineWidth: 0.2,
    tableLineColor: BORDER,
  })

  yPos = doc.lastAutoTable.finalY + 8

  // Totals block
  const totW = 75
  const totX = PAGE_W - MARGIN - totW

  doc.setFillColor(...LIGHT)
  doc.roundedRect(totX, yPos, totW, 35, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(totX, yPos, totW, 35, 2, 2, 'S')

  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text('Sous-total HT :', totX + 4, yPos + 10)
  doc.text(`TVA (${invoice.tva_rate || 0}%) :`, totX + 4, yPos + 19)

  doc.setTextColor(...DARK)
  doc.text(formatCurrency(invoice.subtotal || 0), totX + totW - 4, yPos + 10, { align: 'right' })
  doc.text(formatCurrency(invoice.tva_amount || 0), totX + totW - 4, yPos + 19, { align: 'right' })

  // Total TTC highlight row
  doc.setFillColor(...PRIMARY)
  doc.roundedRect(totX, yPos + 24, totW, 11, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL TTC', totX + 4, yPos + 31.5)
  doc.text(formatCurrency(invoice.total || 0), totX + totW - 4, yPos + 31.5, { align: 'right' })

  yPos += 48

  // Payment info
  const hasPayment = settings?.payment_terms || profile?.iban || settings?.bank_details
  if (hasPayment) {
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(MARGIN, yPos, PAGE_W - 2 * MARGIN, 28, 2, 2, 'F')
    doc.setDrawColor(199, 210, 254)
    doc.setLineWidth(0.2)
    doc.roundedRect(MARGIN, yPos, PAGE_W - 2 * MARGIN, 28, 2, 2, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text('CONDITIONS DE PAIEMENT', MARGIN + 4, yPos + 7)

    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'normal')
    let py = yPos + 14
    if (settings?.payment_terms) { doc.text(`Délai : ${settings.payment_terms}`, MARGIN + 4, py); py += 5 }
    if (profile?.iban) doc.text(`IBAN : ${profile.iban}`, MARGIN + 4, py)
    else if (settings?.bank_details) doc.text(settings.bank_details, MARGIN + 4, py)

    yPos += 36
  }

  // Notes
  if (invoice.notes) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRAY)
    doc.text('NOTES', MARGIN, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    const lines = doc.splitTextToSize(invoice.notes, PAGE_W - 2 * MARGIN)
    doc.text(lines, MARGIN, yPos)
    yPos += lines.length * 4.5 + 5
  }

  // Late fees
  if (settings?.late_fees) {
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(settings.late_fees, PAGE_W - 2 * MARGIN)
    doc.text(lines, MARGIN, yPos)
  }

  // Footer
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(...LIGHT)
  doc.rect(0, pageH - 18, PAGE_W, 18, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, pageH - 18, PAGE_W, pageH - 18)

  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(
    settings?.footer_text || 'Merci pour votre confiance.',
    PAGE_W / 2,
    pageH - 10,
    { align: 'center' }
  )
  if (profile?.siret) doc.text(`SIRET : ${profile.siret}`, MARGIN, pageH - 5)
  if (profile?.tva_number)
    doc.text(`TVA : ${profile.tva_number}`, PAGE_W - MARGIN, pageH - 5, { align: 'right' })

  return doc
}

export function downloadPDF(doc, invoice) {
  doc.save(`${invoice.invoice_number}.pdf`)
}

export function openPDFInNewTab(doc) {
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
