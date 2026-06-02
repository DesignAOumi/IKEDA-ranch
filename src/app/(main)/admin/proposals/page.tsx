'use client'

import { useState, useEffect } from 'react'
import type { Proposal } from '@/lib/types'

const STATUS_LABELS: Record<Proposal['status'], { label: string; color: string }> = {
  pending:  { label: '未確認', color: 'bg-amber-100 text-amber-700' },
  reviewed: { label: '確認済', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: '採用',   color: 'bg-green-100 text-green-700' },
  rejected: { label: '見送り', color: 'bg-gray-100 text-gray-600' },
}

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/proposals')
      .then((r) => r.json())
      .then(setProposals)
      .finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: Proposal['status']) {
    setUpdating(id)
    const res = await fetch(`/api/proposals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    if (res.ok) {
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  const pending = proposals.filter((p) => p.status === 'pending')
  const others = proposals.filter((p) => p.status !== 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">新商材提案一覧</h1>

      {proposals.length === 0 && (
        <p className="text-center py-12 text-gray-400">提案はまだありません</p>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-600 mb-3">未確認 ({pending.length}件)</h2>
          <div className="space-y-3">
            {pending.map((p) => <ProposalCard key={p.id} proposal={p} onUpdate={updateStatus} updating={updating} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">対応済み</h2>
          <div className="space-y-3">
            {others.map((p) => <ProposalCard key={p.id} proposal={p} onUpdate={updateStatus} updating={updating} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ProposalCard({
  proposal: p,
  onUpdate,
  updating,
}: {
  proposal: Proposal
  onUpdate: (id: string, status: Proposal['status']) => void
  updating: string | null
}) {
  const { label, color } = STATUS_LABELS[p.status]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{p.productName}</h3>
            {p.category && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{p.category}</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{p.companyName}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${color}`}>{label}</span>
      </div>

      {p.description && <p className="text-sm text-gray-600">{p.description}</p>}

      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        {p.pricePerKg != null && <span>提案価格: <strong className="text-gray-800">¥{p.pricePerKg}/kg</strong></span>}
        {p.minLot != null && <span>最低ロット: <strong className="text-gray-800">{p.minLot}パレット</strong></span>}
        <span>連絡先: <strong className="text-gray-800">{p.contact}</strong></span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          {new Date(p.createdAt).toLocaleDateString('ja-JP')}
        </span>
        <div className="flex gap-2">
          {(['reviewed', 'accepted', 'rejected'] as const).map((s) => (
            p.status !== s && (
              <button
                key={s}
                onClick={() => onUpdate(p.id, s)}
                disabled={updating === p.id}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50 ${
                  s === 'accepted'
                    ? 'border-green-300 text-green-700 hover:bg-green-50'
                    : s === 'rejected'
                    ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {STATUS_LABELS[s].label}にする
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
