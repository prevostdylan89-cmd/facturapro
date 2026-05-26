import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrencyPDF, formatDate } from './invoiceHelpers'

const PRIMARY = [79, 70, 229]
const DARK    = [17, 24, 39]
const GRAY    = [107, 114, 128]
const LIGHT   = [249, 250, 251]
const WHITE   = [255, 255, 255]
const BORDER  = [229, 231, 235]
const PAGE_W  = 210
const MARGIN  = 15

// Zone utile = 210 - 15 - 15 = 180 mm
// Colonnes   = 100 + 15 + 33 + 32 = 180 mm
const COL = { desc: 100, qty: 15, pu: 33, total: 32 }

export function generateInvoicePDF(invoice, items, client, profile, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── HEADER ─────────────────────────────────────────────
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, PAGE_W, 45, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(profile?.company_name || 'Mon Entreprise', MARGIN, 18)

  if (profile?.address) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.address.split('\n')[0], MARGIN, 27)
  }
  if (profile?.email) {
    doc.setFontSize(8)
    doc.text(profile.email, MARGIN, 34)
  }

  // Numéro de facture (droite)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('FACTURE', PAGE_W - MARGIN, 16, { align: 'right' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.invoice_number || '', PAGE_W - MARGIN, 26, { align: 'right' })

  // ── BLOC DATES (droite) ────────────────────────────────
  const boxX = PAGE_W - MARGIN - 58
  doc.setFillColor(...LIGHT)
  doc.roundedRect(boxX, 49, 58, 33, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(boxX, 49, 58, 33, 2, 2, 'S')

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text("Date d'émission :", boxX + 4, 58)
  doc.text("Date d'échéance :", boxX + 4, 66)
  doc.text('Statut :', boxX + 4, 74)

  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(invoice.issue_date), boxX + 54, 58, { align: 'right' })
  doc.text(formatDate(invoice.due_date) || 'N/A', boxX + 54, 66, { align: 'right' })

  const statusLabels = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard' }
  doc.text(statusLabels[invoice.status] || invoice.status, boxX + 54, 74, { align: 'right' })

  // ── INFOS ÉMETTEUR (gauche) ────────────────────────────
  let yPos = 52
  doc.setTextColor(...DARK)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')

  if (profile?.full_name) {
    doc.setFont('helvetica', 'bold')
    doc.text(profile.full_name, MARGIN, yPos); yPos += 5
    doc.setFont('helvetica', 'normal')
  }
  if (profile?.address) {
    profile.address.split('\n').forEach((l) => { doc.text(l, MARGIN, yPos); yPos += 4.5 })
  }
  if (profile?.phone) { doc.text(`Tél : ${profile.phone}`, MARGIN, yPos); yPos += 4.5 }
  if (profile?.siret) { doc.text(`SIRET : ${profile.siret}`, MARGIN, yPos); yPos += 4.5 }
  if (profile?.tva_number) { doc.text(`N° TVA : ${profile.tva_number}`, MARGIN, yPos); yPos += 4.5 }

  yPos = Math.max(yPos + 4, 88)

  // ── SÉPARATEUR ────────────────────────────────────────
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos)
  yPos += 6

  // ── BLOC CLIENT ────────────────────────────────────────
  const clientBoxH = 36
  doc.setFillColor(...LIGHT)
  doc.roundedRect(MARGIN, yPos, 90, clientBoxH, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(MARGIN, yPos, 90, clientBoxH, 2, 2, 'S')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PRIMARY)
  doc.text('FACTURÉ À', MARGIN + 4, yPos + 7)

  doc.setTextColor(...DARK)
  doc.setFontSize(10)
  doc.text(client?.name || 'Client inconnu', MARGIN + 4, yPos + 14)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  let cy = yPos + 21
  if (client?.address) {
    client.address.split('\n').forEach((l) => { doc.text(l, MARGIN + 4, cy); cy += 4.5 })
  }
  if (client?.email) { doc.text(client.email, MARGIN + 4, cy); cy += 4.5 }
  if (client?.phone) { doc.text(client.phone, MARGIN + 4, cy) }

  yPos += clientBoxH + 6

  // ── TABLEAU DES PRESTATIONS ────────────────────────────
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: items.map((item) => [
      item.description || '',
      String(Number(item.quantity || 0)),
      formatCurrencyPDF(item.unit_price),
      formatCurrencyPDF(Number(item.quantity || 0) * Number(item.unit_price || 0)),
    ]),
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: DARK,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [248, 249, 255] },
    columnStyles: {
      0: { cellWidth: COL.desc },
      1: { cellWidth: COL.qty, halign: 'center' },
      2: { cellWidth: COL.pu, halign: 'right' },
      3: { cellWidth: COL.total, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: MARGIN, right: MARGIN },
    styles: { lineColor: BORDER, lineWidth: 0.15, overflow: 'linebreak' },
    tableLineWidth: 0.2,
    tableLineColor: BORDER,
  })

  yPos = doc.lastAutoTable.finalY + 6

  // ── TOTAUX ────────────────────────────────────────────
  const totW = 78
  const totX = PAGE_W - MARGIN - totW

  doc.setFillColor(...LIGHT)
  doc.roundedRect(totX, yPos, totW, 36, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(totX, yPos, totW, 36, 2, 2, 'S')

  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text('Sous-total HT :', totX + 4, yPos + 10)
  doc.text(`TVA (${invoice.tva_rate || 0} %) :`, totX + 4, yPos + 20)

  doc.setTextColor(...DARK)
  doc.text(formatCurrencyPDF(invoice.subtotal || 0), totX + totW - 4, yPos + 10, { align: 'right' })
  doc.text(formatCurrencyPDF(invoice.tva_amount || 0), totX + totW - 4, yPos + 20, { align: 'right' })

  doc.setFillColor(...PRIMARY)
  doc.roundedRect(totX, yPos + 25, totW, 11, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL TTC', totX + 5, yPos + 32.5)
  doc.text(formatCurrencyPDF(invoice.total || 0), totX + totW - 4, yPos + 32.5, { align: 'right' })

  yPos += 44

  // ── CONDITIONS DE PAIEMENT ────────────────────────────
  const hasPayment = settings?.payment_terms || profile?.iban || settings?.bank_details
  if (hasPayment) {
    const lines = []
    if (settings?.payment_terms) lines.push(`Délai de paiement : ${settings.payment_terms}`)
    if (profile?.iban) lines.push(`IBAN : ${profile.iban}`)
    else if (settings?.bank_details) lines.push(settings.bank_details)

    const boxH = 14 + lines.length * 5.5
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(MARGIN, yPos, PAGE_W - 2 * MARGIN, boxH, 2, 2, 'F')
    doc.setDrawColor(199, 210, 254)
    doc.setLineWidth(0.2)
    doc.roundedRect(MARGIN, yPos, PAGE_W - 2 * MARGIN, boxH, 2, 2, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text('CONDITIONS DE PAIEMENT', MARGIN + 4, yPos + 8)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    lines.forEach((l, i) => doc.text(l, MARGIN + 4, yPos + 15 + i * 5.5))

    yPos += boxH + 6
  }

  // ── NOTES ─────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRAY)
    doc.text('NOTES', MARGIN, yPos); yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    const noteLines = doc.splitTextToSize(invoice.notes, PAGE_W - 2 * MARGIN)
    doc.text(noteLines, MARGIN, yPos)
    yPos += noteLines.length * 4.5 + 5
  }

  // ── PÉNALITÉS ─────────────────────────────────────────
  if (settings?.late_fees) {
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    const feeLines = doc.splitTextToSize(settings.late_fees, PAGE_W - 2 * MARGIN)
    doc.text(feeLines, MARGIN, yPos)
  }

  // ── PIED DE PAGE ──────────────────────────────────────
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(...LIGHT)
  doc.rect(0, pageH - 16, PAGE_W, 16, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, pageH - 16, PAGE_W, pageH - 16)

  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(
    settings?.footer_text || 'Merci pour votre confiance.',
    PAGE_W / 2, pageH - 8, { align: 'center' }
  )
  if (profile?.siret)
    doc.text(`SIRET : ${profile.siret}`, MARGIN, pageH - 4)
  if (profile?.tva_number)
    doc.text(`TVA : ${profile.tva_number}`, PAGE_W - MARGIN, pageH - 4, { align: 'right' })

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
