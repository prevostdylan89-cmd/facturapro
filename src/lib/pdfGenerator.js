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
// Colonnes avec remise = 85 + 13 + 14 + 30 + 6 + 32 = 180 mm
// Colonnes sans remise = 100 + 15 + 33 + 32 = 180 mm

export function generateInvoicePDF(invoice, items, client, profile, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const isAutoEntrepreneur = profile?.is_auto_entrepreneur === true
  const hasRemise = items.some((i) => Number(i.remise || 0) > 0) || Number(invoice.remise_globale || 0) > 0
  const docLabel = invoice.type === 'quote' ? 'DEVIS' : invoice.type === 'credit_note' ? 'AVOIR' : 'FACTURE'

  // ── HEADER ─────────────────────────────────────────────
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, PAGE_W, 45, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(profile?.company_name || profile?.full_name || 'Mon Entreprise', MARGIN, 18)

  if (profile?.address) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.address.split('\n')[0], MARGIN, 27)
  }
  if (profile?.email) {
    doc.setFontSize(8)
    doc.text(profile.email, MARGIN, 34)
  }

  // Type de document (droite)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(docLabel, PAGE_W - MARGIN, 16, { align: 'right' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.invoice_number || '', PAGE_W - MARGIN, 26, { align: 'right' })
  if (invoice.po_number) {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(`Réf. client : ${invoice.po_number}`, PAGE_W - MARGIN, 35, { align: 'right' })
  }

  // ── BLOC DATES (droite) ────────────────────────────────
  const boxX = PAGE_W - MARGIN - 58
  const dateBoxH = invoice.type === 'quote' ? 33 : 33
  doc.setFillColor(...LIGHT)
  doc.roundedRect(boxX, 49, 58, dateBoxH, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(boxX, 49, 58, dateBoxH, 2, 2, 'S')

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text("Date d'émission :", boxX + 4, 58)
  doc.text(invoice.type === 'quote' ? 'Validité jusqu\'au :' : "Date d'échéance :", boxX + 4, 66)
  doc.text('Statut :', boxX + 4, 74)

  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(invoice.issue_date), boxX + 54, 58, { align: 'right' })
  doc.text(formatDate(invoice.due_date) || 'N/A', boxX + 54, 66, { align: 'right' })

  const statusLabels = {
    draft: 'Brouillon', sent: invoice.type === 'quote' ? 'Envoyé' : 'Envoyée',
    paid: 'Payée', overdue: 'En retard', accepted: 'Accepté', refused: 'Refusé',
  }
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
  if (profile?.tva_number && !isAutoEntrepreneur) {
    doc.text(`N° TVA : ${profile.tva_number}`, MARGIN, yPos); yPos += 4.5
  }

  // Mentions légales société (forme juridique, RCS, capital)
  const legalParts = []
  if (profile?.legal_form) legalParts.push(profile.legal_form)
  if (profile?.capital_social) legalParts.push(`Capital ${profile.capital_social} €`)
  if (profile?.rcs_city && profile?.rcs_number) legalParts.push(`RCS ${profile.rcs_city} ${profile.rcs_number}`)
  else if (profile?.rcs_city) legalParts.push(`RCS ${profile.rcs_city}`)
  if (legalParts.length > 0) {
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(legalParts.join(' — '), MARGIN, yPos); yPos += 4.5
    doc.setFontSize(8.5)
    doc.setTextColor(...DARK)
  }

  yPos = Math.max(yPos + 4, 88)

  // ── SÉPARATEUR ────────────────────────────────────────
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos)
  yPos += 6

  // ── BLOC CLIENT ────────────────────────────────────────
  const clientBoxH = 40
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
  if (client?.phone) { doc.text(client.phone, MARGIN + 4, cy); cy += 4.5 }
  if (client?.siret) { doc.setFontSize(7.5); doc.text(`SIRET : ${client.siret}`, MARGIN + 4, cy); cy += 4.5; doc.setFontSize(8) }
  if (client?.tva_number) { doc.setFontSize(7.5); doc.text(`TVA : ${client.tva_number}`, MARGIN + 4, cy); doc.setFontSize(8) }

  yPos += clientBoxH + 6

  // ── TABLEAU DES PRESTATIONS ────────────────────────────
  const tableHead = hasRemise
    ? [['Description', 'Qté', 'P.U. HT', 'Remise', 'Total HT']]
    : [['Description', 'Qté', 'Prix unitaire HT', 'Total HT']]

  const tableBody = items.map((item) => {
    const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
    const remisePct = Number(item.remise || 0)
    const lineTotalAfter = lineTotal * (1 - remisePct / 100)
    if (hasRemise) {
      return [
        item.description || '',
        String(Number(item.quantity || 0)),
        formatCurrencyPDF(item.unit_price),
        remisePct > 0 ? `${remisePct} %` : '—',
        formatCurrencyPDF(lineTotalAfter),
      ]
    }
    return [
      item.description || '',
      String(Number(item.quantity || 0)),
      formatCurrencyPDF(item.unit_price),
      formatCurrencyPDF(lineTotal),
    ]
  })

  const colStyles = hasRemise
    ? {
        0: { cellWidth: 85 },
        1: { cellWidth: 13, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      }
    : {
        0: { cellWidth: 100 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 33, halign: 'right' },
        3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      }

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableBody,
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
    columnStyles: colStyles,
    margin: { left: MARGIN, right: MARGIN },
    styles: { lineColor: BORDER, lineWidth: 0.15, overflow: 'linebreak' },
    tableLineWidth: 0.2,
    tableLineColor: BORDER,
  })

  yPos = doc.lastAutoTable.finalY + 6

  // ── TOTAUX ────────────────────────────────────────────
  const remiseGlobale = Number(invoice.remise_globale || 0)
  const subtotalBrut = Number(invoice.subtotal_brut || invoice.subtotal || 0)
  const remiseGlobaleAmount = subtotalBrut * (remiseGlobale / 100)
  const subtotal = Number(invoice.subtotal || 0)
  const totBoxRows = remiseGlobale > 0 ? 5 : 3
  const totW = 78
  const totX = PAGE_W - MARGIN - totW
  const totH = 14 + totBoxRows * 10 + 11

  doc.setFillColor(...LIGHT)
  doc.roundedRect(totX, yPos, totW, totH, 2, 2, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(totX, yPos, totW, totH, 2, 2, 'S')

  let ty = yPos + 10
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')

  doc.text('Sous-total brut HT :', totX + 4, ty)
  doc.setTextColor(...DARK)
  doc.text(formatCurrencyPDF(subtotalBrut), totX + totW - 4, ty, { align: 'right' })
  ty += 10

  if (remiseGlobale > 0) {
    doc.setTextColor(...GRAY)
    doc.text(`Remise globale (${remiseGlobale} %) :`, totX + 4, ty)
    doc.setTextColor([220, 38, 38])
    doc.text(`- ${formatCurrencyPDF(remiseGlobaleAmount)}`, totX + totW - 4, ty, { align: 'right' })
    ty += 10

    doc.setTextColor(...GRAY)
    doc.text('Sous-total HT :', totX + 4, ty)
    doc.setTextColor(...DARK)
    doc.text(formatCurrencyPDF(subtotal), totX + totW - 4, ty, { align: 'right' })
    ty += 10
  }

  doc.setTextColor(...GRAY)
  if (isAutoEntrepreneur) {
    doc.text('TVA :', totX + 4, ty)
    doc.setTextColor(...GRAY)
    doc.setFontSize(7.5)
    doc.text('non applicable (art. 293 B)', totX + totW - 4, ty, { align: 'right' })
    doc.setFontSize(9)
  } else {
    doc.text(`TVA (${invoice.tva_rate || 0} %) :`, totX + 4, ty)
    doc.setTextColor(...DARK)
    doc.text(formatCurrencyPDF(invoice.tva_amount || 0), totX + totW - 4, ty, { align: 'right' })
  }
  ty += 10

  doc.setFillColor(...PRIMARY)
  doc.roundedRect(totX, ty, totW, 11, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(isAutoEntrepreneur ? 'TOTAL NET' : 'TOTAL TTC', totX + 5, ty + 7.5)
  doc.text(formatCurrencyPDF(invoice.total || 0), totX + totW - 4, ty + 7.5, { align: 'right' })

  yPos = ty + 19

  // ── CONDITIONS DE PAIEMENT ────────────────────────────
  const hasPayment = settings?.payment_terms || profile?.iban || settings?.bank_details || invoice.payment_method
  if (hasPayment) {
    const lines = []
    if (settings?.payment_terms) lines.push(`Délai de paiement : ${settings.payment_terms}`)
    if (invoice.payment_method) {
      const methodLabels = {
        virement: 'Virement bancaire', cheque: 'Chèque', carte: 'Carte bancaire',
        especes: 'Espèces', prelevement: 'Prélèvement automatique',
      }
      lines.push(`Mode de paiement : ${methodLabels[invoice.payment_method] || invoice.payment_method}`)
    }
    if (profile?.iban) lines.push(`IBAN : ${profile.iban}`)
    else if (settings?.bank_details) lines.push(settings.bank_details)

    // Escompte : mention obligatoire
    lines.push('Aucun escompte consenti pour paiement anticipé.')

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

  // ── MENTIONS LÉGALES ──────────────────────────────────
  const legalMentions = []

  if (settings?.late_fees) {
    legalMentions.push(settings.late_fees)
  } else {
    legalMentions.push(
      "En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal seront appliquées, " +
      "ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €."
    )
  }

  if (isAutoEntrepreneur) {
    legalMentions.push('TVA non applicable, art. 293 B du CGI.')
  }

  if (profile?.insurance_mention) {
    legalMentions.push(profile.insurance_mention)
  }

  if (legalMentions.length > 0) {
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    legalMentions.forEach((mention) => {
      const lines = doc.splitTextToSize(mention, PAGE_W - 2 * MARGIN)
      doc.text(lines, MARGIN, yPos)
      yPos += lines.length * 4 + 3
    })
  }

  // ── PIED DE PAGE ──────────────────────────────────────
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(...LIGHT)
  doc.rect(0, pageH - 20, PAGE_W, 20, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, pageH - 20, PAGE_W, pageH - 20)

  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(
    settings?.footer_text || 'Merci pour votre confiance.',
    PAGE_W / 2, pageH - 12, { align: 'center' }
  )

  // Ligne inférieure pied de page : mentions légales courtes
  const footerParts = []
  if (profile?.siret) footerParts.push(`SIRET : ${profile.siret}`)
  if (profile?.legal_form) footerParts.push(profile.legal_form)
  if (profile?.rcs_city && profile?.rcs_number) footerParts.push(`RCS ${profile.rcs_city} ${profile.rcs_number}`)
  if (profile?.capital_social) footerParts.push(`Capital ${profile.capital_social} €`)
  if (!isAutoEntrepreneur && profile?.tva_number) footerParts.push(`TVA : ${profile.tva_number}`)

  if (footerParts.length > 0) {
    doc.setFontSize(6.5)
    doc.text(footerParts.join('  |  '), PAGE_W / 2, pageH - 5, { align: 'center' })
  }

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
