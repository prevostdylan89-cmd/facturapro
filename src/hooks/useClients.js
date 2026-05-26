import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [user])

  const createClient = async (clientData) => {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, user_id: user.id }])
      .select()
      .single()
    if (!error) await fetchClients()
    return { data, error }
  }

  const updateClient = async (id, clientData) => {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single()
    if (!error) await fetchClients()
    return { data, error }
  }

  const deleteClient = async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (!error) await fetchClients()
    return { error }
  }

  return { clients, loading, createClient, updateClient, deleteClient, refetch: fetchClients }
}
