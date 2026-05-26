import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { useInvoices } from '../hooks/useInvoices'
import ClientList from '../components/clients/ClientList'
import ClientForm from '../components/clients/ClientForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients()
  const { invoices } = useInvoices()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const openCreate = () => {
    setEditingClient(null)
    setModalOpen(true)
  }

  const openEdit = (client) => {
    setEditingClient(client)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce client ? Ses factures ne seront pas supprimées.')) return
    await deleteClient(id)
  }

  const handleSubmit = async (formData) => {
    setSaving(true)
    const { error } = editingClient
      ? await updateClient(editingClient.id, formData)
      : await createClient(formData)

    setSaving(false)
    if (error) {
      alert(`Erreur : ${error.message}`)
    } else {
      setModalOpen(false)
      setEditingClient(null)
      setSuccessMsg(editingClient ? 'Client mis à jour !' : 'Client créé !')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const filtered = clients.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">{clients.length} client{clients.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          Nouveau client
        </Button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3">
          {successMsg}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* List */}
      <ClientList
        clients={filtered}
        invoices={invoices}
        onEdit={openEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingClient(null) }}
        title={editingClient ? 'Modifier le client' : 'Nouveau client'}
      >
        <ClientForm
          initialData={editingClient}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </Modal>
    </div>
  )
}
