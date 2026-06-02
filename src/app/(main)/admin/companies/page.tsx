'use client'

import { useState, useEffect } from 'react'
import type { Company } from '@/lib/types'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Omit<Company, 'passwordHash'>[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then(setCompanies)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setForm({ name: '', password: '' })
      setShowForm(false)
      const updated = await fetch('/api/companies').then((r) => r.json())
      setCompanies(updated)
    } else {
      setError(data.error ?? '追加に失敗しました')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除してよいですか？`)) return
    setDeletingId(id)
    await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    setCompanies((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">飼料会社アカウント管理</h1>
        <button
          onClick={() => { setShowForm(true); setError('') }}
          className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + 会社を追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-green-200 p-5 space-y-4">
          <h2 className="font-medium text-gray-900">新しい飼料会社を追加</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="例: ○○飼料株式会社"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="初期パスワードを設定"
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? '追加中...' : '追加する'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {companies.length === 0 ? (
        <p className="text-center py-12 text-gray-400">飼料会社アカウントがまだありません</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">会社名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">作成日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">最終ログイン</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('ja-JP') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {c.lastLogin ? new Date(c.lastLogin).toLocaleDateString('ja-JP') : '未ログイン'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={deletingId === c.id}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                    >
                      {deletingId === c.id ? '削除中...' : '削除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
