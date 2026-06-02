'use client'

import { useState, useEffect } from 'react'
import type { InventoryItem } from '@/lib/types'

const CATEGORIES = ['粗飼料', '濃厚飼料', '添加剤'] as const

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<InventoryItem>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then(setInventory)
      .finally(() => setLoading(false))
  }, [])

  function startEdit(item: InventoryItem) {
    setEditingId(item.id)
    setEditValues({
      stock: item.stock,
      pricePerKg: item.pricePerKg ?? undefined,
      minLot: item.minLot,
      alertThreshold: item.alertThreshold,
    })
    setMessage('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  async function saveEdit(item: InventoryItem) {
    setSaving(true)
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editValues),
    })
    setSaving(false)

    if (res.ok) {
      setInventory((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, ...editValues } : i)
      )
      setEditingId(null)
      setMessage('✓ 保存しました')
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage('⚠ 保存に失敗しました')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">在庫管理</h1>
        {message && <p className="text-sm text-green-600">{message}</p>}
      </div>

      {CATEGORIES.map((category) => {
        const items = inventory.filter((i) => i.category === category)
        if (items.length === 0) return null
        return (
          <section key={category}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">商品名</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">在庫数</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">単価(円/kg)</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">アラート基準</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isEditing = editingId === item.id
                    const isAlert = item.stock <= item.alertThreshold
                    return (
                      <tr key={item.id} className={`border-b border-gray-50 last:border-0 ${isAlert ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-medium">
                          {isAlert && <span className="mr-1.5">⚠️</span>}
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.stock ?? ''}
                              onChange={(e) => setEditValues((v) => ({ ...v, stock: Number(e.target.value) }))}
                              className="w-20 border border-green-400 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              min="0"
                            />
                          ) : (
                            <span className={`font-semibold ${isAlert ? 'text-red-600' : 'text-green-700'}`}>
                              {item.stock} {item.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.pricePerKg ?? ''}
                              onChange={(e) => setEditValues((v) => ({ ...v, pricePerKg: e.target.value === '' ? undefined : Number(e.target.value) }))}
                              className="w-24 border border-green-400 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              min="0"
                              step="0.1"
                            />
                          ) : (
                            item.pricePerKg != null ? `¥${item.pricePerKg}` : <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.alertThreshold ?? ''}
                              onChange={(e) => setEditValues((v) => ({ ...v, alertThreshold: Number(e.target.value) }))}
                              className="w-20 border border-green-400 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              min="0"
                            />
                          ) : (
                            <span className="text-gray-400">{item.alertThreshold} {item.unit}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => saveEdit(item)}
                                disabled={saving}
                                className="text-xs bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                              >
                                {saving ? '保存中' : '保存'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md border border-gray-200"
                              >
                                キャンセル
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(item)}
                              className="text-xs text-green-700 hover:text-green-800 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-md transition-colors"
                            >
                              編集
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
