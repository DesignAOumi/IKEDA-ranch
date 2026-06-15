'use client'

import { useState, useEffect } from 'react'
import type { InventoryItem, Company } from '@/lib/types'

const CATEGORIES = ['粗飼料', '濃厚飼料', '添加剤'] as const

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [companies, setCompanies] = useState<Omit<Company, 'passwordHash'>[]>([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addAmount, setAddAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/inventory').then((r) => r.json()),
      fetch('/api/companies').then((r) => r.json()),
    ])
      .then(([inv, comps]) => {
        setInventory(inv)
        setCompanies(Array.isArray(comps) ? comps : [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveCompany(item: InventoryItem, companyId: string) {
    setInventory((prev) => prev.map((i) => (i.id === item.id ? { ...i, companyId } : i)))
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })
    if (!res.ok) {
      setMessage('⚠ 担当会社の更新に失敗しました')
    }
  }

  function startAdd(item: InventoryItem) {
    setAddingId(item.id)
    setAddAmount('')
    setMessage('')
  }

  function cancelAdd() {
    setAddingId(null)
    setAddAmount('')
  }

  async function saveAdd(item: InventoryItem) {
    const amount = Number(addAmount)
    if (!amount || amount <= 0) {
      setMessage('⚠ 1以上の数を入力してください')
      return
    }
    setSaving(true)
    const newStock = item.stock + amount
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    })
    setSaving(false)
    if (res.ok) {
      setInventory((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, stock: newStock } : i)
      )
      setAddingId(null)
      setAddAmount('')
      setMessage(`✓ ${item.name} に ${amount}${item.unit} 追加しました`)
      setTimeout(() => setMessage(''), 4000)
    } else {
      setMessage('⚠ 更新に失敗しました')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">在庫管理</h1>
        {message && (
          <p className={`text-sm mt-1 font-medium ${message.startsWith('⚠') ? 'text-red-500' : 'text-emerald-600'}`}>
            {message}
          </p>
        )}
      </div>

      {CATEGORIES.map((category) => {
        const items = inventory.filter((i) => i.category === category)
        if (items.length === 0) return null
        return (
          <section key={category}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">商品名</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500">現在の在庫</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">担当会社</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500">入荷</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isAdding = addingId === item.id
                    const isAlert = item.stock < item.alertThreshold
                    return (
                      <tr key={item.id} className={`border-b border-gray-50 last:border-0 ${isAlert ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {isAlert && <span className="mr-1.5">⚠️</span>}
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${isAlert ? 'text-red-600' : 'text-emerald-600'}`}>
                            {item.stock} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.companyId}
                            onChange={(e) => saveCompany(item, e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 max-w-[10rem]"
                          >
                            <option value="">未設定</option>
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isAdding ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={addAmount}
                                  onChange={(e) => setAddAmount(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveAdd(item)}
                                  className="w-20 border-2 border-green-400 rounded-lg px-2 py-1.5 text-right text-sm focus:outline-none focus:border-green-500"
                                  placeholder="0"
                                  min="1"
                                  autoFocus
                                />
                                <span className="text-xs text-gray-500 whitespace-nowrap">{item.unit}</span>
                              </div>
                              <button
                                onClick={() => saveAdd(item)}
                                disabled={saving}
                                className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-bold whitespace-nowrap"
                              >
                                {saving ? '...' : '追加'}
                              </button>
                              <button
                                onClick={cancelAdd}
                                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startAdd(item)}
                              className="text-xs bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 px-3 py-1.5 rounded-lg transition-colors font-bold whitespace-nowrap"
                            >
                              ＋ 在庫を追加
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
