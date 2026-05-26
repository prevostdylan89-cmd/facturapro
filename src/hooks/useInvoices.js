import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useInvoices(typeFilter = 'invoice') {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInvoices = async () => {
    if (!user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*, clients(id, name, email)')
      .eq('user_id', user.id)
      .eq('type', typeFilter)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setInvoices(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchInvoices()
  }, [user])

  const getInvoice = async (id) => {
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*, clients(*), invoice_items(*)')
      .eq('id', id)
      .single()
    return { data, error: err }
  }

  const createInvoice = async (invoiceData, items) => {
    const { data: numData, error: numErr } = await supabase.rpc('get_next_invoice_number', {
      p_user_id: user.id,
    })
    if (numErr) return { error: numErr }

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert([{ ...invoiceData, user_id: user.id, invoice_number: numData, type: 'invoice' }])
      .select()
      .single()
    if (invErr) return { error: invErr }

    const mapped = items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
    }))
    const { error: itemsErr } = await supabase.from('invoice_items').insert(mapped)
    if (itemsErr) return { error: itemsErr }

    await fetchInvoices()
    return { data: invoice }
  }

  const createQuote = async (quoteData, items) => {
    const { data: numData, error: numErr } = await supabase.rpc('get_next_quote_number', {
      p_user_id: user.id,
    })
    if (numErr) return { error: numErr }

    const { data: quote, error: quoteErr } = await supabase
      .from('invoices')
      .insert([{ ...quoteData, user_id: user.id, invoice_number: numData, type: 'quote' }])
      .select()
      .single()
    if (quoteErr) return { error: quoteErr }

    const mapped = items.map((item) => ({
      invoice_id: quote.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
    }))
    const { error: itemsErr } = await supabase.from('invoice_items').insert(mapped)
    if (itemsErr) return { error: itemsErr }

    await fetchInvoices()
    return { data: quote }
  }

  const createCreditNote = async (originalInvoiceId) => {
    const { data: original } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', originalInvoiceId)
      .single()
    if (!original) return { error: 'Facture introuvable' }

    const { data: numData, error: numErr } = await supabase.rpc('get_next_credit_note_number', {
      p_user_id: user.id,
    })
    if (numErr) return { error: numErr }

    const { invoice_items, id, invoice_number, created_at, type, ...rest } = original
    const { data: creditNote, error: cnErr } = await supabase
      .from('invoices')
      .insert([{
        ...rest,
        user_id: user.id,
        invoice_number: numData,
        type: 'credit_note',
        original_invoice_id: originalInvoiceId,
        status: 'draft',
        subtotal: -Math.abs(original.subtotal),
        tva_amount: -Math.abs(original.tva_amount),
        total: -Math.abs(original.total),
      }])
      .select()
      .single()
    if (cnErr) return { error: cnErr }

    const mapped = (invoice_items || []).map((item) => ({
      invoice_id: creditNote.id,
      description: item.description,
      quantity: -Math.abs(Number(item.quantity)),
      unit_price: Number(item.unit_price),
      total: -Math.abs(Number(item.quantity) * Number(item.unit_price)),
    }))
    if (mapped.length > 0) {
      await supabase.from('invoice_items').insert(mapped)
    }

    await fetchInvoices()
    return { data: creditNote }
  }

  const convertQuoteToInvoice = async (quoteId) => {
    const { data: quote } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', quoteId)
      .single()
    if (!quote) return { error: 'Devis introuvable' }

    const { data: numData, error: numErr } = await supabase.rpc('get_next_invoice_number', {
      p_user_id: user.id,
    })
    if (numErr) return { error: numErr }

    const { invoice_items, id, invoice_number, created_at, type, ...rest } = quote
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert([{
        ...rest,
        user_id: user.id,
        invoice_number: numData,
        type: 'invoice',
        original_invoice_id: quoteId,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
      }])
      .select()
      .single()
    if (invErr) return { error: invErr }

    const mapped = (invoice_items || []).map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
    }))
    if (mapped.length > 0) {
      await supabase.from('invoice_items').insert(mapped)
    }

    await supabase.from('invoices').update({ status: 'accepted' }).eq('id', quoteId)
    await fetchInvoices()
    return { data: invoice }
  }

  const updateInvoice = async (id, invoiceData, items) => {
    const { error: invErr } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
    if (invErr) return { error: invErr }

    await supabase.from('invoice_items').delete().eq('invoice_id', id)

    const mapped = items.map((item) => ({
      invoice_id: id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
    }))
    const { error: itemsErr } = await supabase.from('invoice_items').insert(mapped)
    if (itemsErr) return { error: itemsErr }

    await fetchInvoices()
    return { data: { id } }
  }

  const deleteInvoice = async (id) => {
    const { error: err } = await supabase.from('invoices').delete().eq('id', id)
    if (!err) await fetchInvoices()
    return { error: err }
  }

  const updateStatus = async (id, status) => {
    const { error: err } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
    if (!err) await fetchInvoices()
    return { error: err }
  }

  const duplicateInvoice = async (invoiceId) => {
    const { data: original } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .single()
    if (!original) return { error: 'Document introuvable' }

    const { id, invoice_number, created_at, invoice_items, type, ...rest } = original
    const items = (invoice_items || []).map(({ id: _id, invoice_id, ...item }) => item)

    if (type === 'quote') {
      return createQuote(
        { ...rest, status: 'draft', issue_date: new Date().toISOString().split('T')[0] },
        items
      )
    }
    return createInvoice(
      { ...rest, status: 'draft', issue_date: new Date().toISOString().split('T')[0] },
      items
    )
  }

  return {
    invoices,
    loading,
    error,
    getInvoice,
    createInvoice,
    createQuote,
    createCreditNote,
    convertQuoteToInvoice,
    updateInvoice,
    deleteInvoice,
    updateStatus,
    duplicateInvoice,
    refetch: fetchInvoices,
  }
}
