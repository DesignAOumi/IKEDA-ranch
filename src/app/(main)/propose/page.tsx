'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['粗飼料', '濃厚飼料', '添加剤', 'その他']

export default function ProposePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    productName: '',
    category: '',
    description: '',
    pricePerKg: '',
    minLot: '',
    contact: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSuccess(true)
    } else {
      setError(data.error ?? '送信に失敗しました')
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">提案を受け付けました</h2>
        <p className="text-gray-500 text-sm mb-8">内容を確認後、ご連絡いたします。</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-green-700 hover:underline"
        >
          在庫一覧に戻る
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">新商材の提案</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <Field label="商品名 *">
          <input
            type="text"
            value={form.productName}
            onChange={(e) => update('productName', e.target.value)}
            className={inputClass}
            placeholder="例: XXXグレインフレーク"
            required
          />
        </Field>

        <Field label="種類">
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className={inputClass}
          >
            <option value="">選択してください</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="商品説明・特徴">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="商品の特徴、栄養成分、実績など"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="提案価格 (円/kg)">
            <input
              type="number"
              value={form.pricePerKg}
              onChange={(e) => update('pricePerKg', e.target.value)}
              className={inputClass}
              placeholder="例: 75"
              min="0"
              step="0.1"
            />
          </Field>
          <Field label="最低ロット (パレット)">
            <input
              type="number"
              value={form.minLot}
              onChange={(e) => update('minLot', e.target.value)}
              className={inputClass}
              placeholder="例: 10"
              min="1"
            />
          </Field>
        </div>

        <Field label="連絡先 (担当者名・電話・メール等) *">
          <input
            type="text"
            value={form.contact}
            onChange={(e) => update('contact', e.target.value)}
            className={inputClass}
            placeholder="例: 田中 太郎 / 090-xxxx-xxxx"
            required
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          {loading ? '送信中...' : '提案を送信する'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
