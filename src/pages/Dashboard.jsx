import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, FileText, Clock, CheckCircle, AlertTriangle, Plus, ArrowRight, AlertCircle } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { useAuth } from '../hooks/useAuth'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import {
  formatCurrency,
  formatDate,
  STATUS_LABELS,
  STATUS_COLORS,
  getEffectiveStatus,
  getLast6Months,
} from '../lib/invoiceHelpers'

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function BarChart({ data }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const chartH = 120
  const barCount = data.length
  const svgW = 400
  const colW = svgW / barCount

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${svgW} ${chartH + 28}`} className="w-full">
        {data.map((item, i) => {
          const bh = maxValue > 0 ? (item.value / maxValue) * chartH : 2
          const bw = colW * 0.55
          const x = i * colW + (colW - bw) / 2
          const y = chartH - bh
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={bw}
                height={Math.max(bh, 2)}
                fill={item.value > 0 ? '#4F46E5' : '#E5E7EB'}
                rx={3}
                opacity={0.85}
              />
              {bh > 14 && (
                <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#6B7280">
                  {item.value > 0 ? `${Math.round(item.value / 100) / 10}k` : ''}
                </text>
              )}
              <text
                x={x + bw / 2}
                y={chartH + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#9CA3AF"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ProfileBanner({ profile, onGoToSettings }) {
  const missing = []
  if (!profile?.company_name && !profile?.full_name) missing.push('nom / raison sociale')
  if (!profile?.address) missing.push('adresse')
  if (!profile?.siret) missing.push('SIRET')

  if (missing.length === 0) return null

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800">Profil incomplet</p>
        <p className="text-xs text-amber-600 mt-0.5">
          Champs manquants sur vos PDF : {missing.join(', ')}.
        </p>
      </div>
      <button
        onClick={onGoToSettings}
        className="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap underline"
      >
        Compléter →
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { invoices, loading } = useInvoices()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthInvoices = invoices.filter((inv) => {
    const d = new Date(inv.issue_date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && inv.status !== 'draft'
  })

  const caMonth = monthInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0)

  const counts = invoices.reduce(
    (acc, inv) => {
      const s = getEffectiveStatus(inv)
      acc[s] = (acc[s] || 0) + 1
      return acc
    },
    { draft: 0, sent: 0, paid: 0, overdue: 0 }
  )

  const months = getLast6Months()
  const chartData = months.map(({ year, month, label }) => ({
    label,
    value: invoices
      .filter((inv) => {
        const d = new Date(inv.issue_date)
        return d.getMonth() === month && d.getFullYear() === year && inv.status !== 'draft'
      })
      .reduce((s, inv) => s + Number(inv.total || 0), 0),
  }))

  const recent = invoices.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Bonjour{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-500">Voici un aperçu de votre activité</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus size={16} className="mr-1.5" />
          Nouvelle facture
        </Button>
      </div>

      {/* Profile incomplete banner */}
      <ProfileBanner profile={profile} onGoToSettings={() => navigate('/settings')} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="CA du mois"
          value={formatCurrency(caMonth)}
          sub={`${monthInvoices.length} facture${monthInvoices.length !== 1 ? 's' : ''}`}
          color="indigo"
        />
        <StatCard
          icon={FileText}
          label="Envoyées"
          value={counts.sent}
          sub="en attente de paiement"
          color="yellow"
        />
        <StatCard
          icon={CheckCircle}
          label="Payées"
          value={counts.paid}
          sub="ce mois-ci"
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="En retard"
          value={counts.overdue}
          sub="à relancer"
          color="red"
        />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">CA des 6 derniers mois</h2>
          <BarChart data={chartData} />
        </div>

        {/* Recent invoices */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Dernières factures</h2>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucune facture encore
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((inv) => {
                const status = getEffectiveStatus(inv)
                return (
                  <div
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {inv.clients?.name || '—'} · {formatDate(inv.issue_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge color={STATUS_COLORS[status]} size="xs">
                        {STATUS_LABELS[status]}
                      </Badge>
                      <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {formatCurrency(inv.total)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
