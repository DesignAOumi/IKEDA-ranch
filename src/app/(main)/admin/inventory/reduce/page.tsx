'use client'

import { useState, useEffect } from 'react'
import type { InventoryItem } from '@/lib/types'

const CATEGORIES = ['粗飼料', '濃厚飼料', '添加剤'] as const

export default function ReduceInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reducingId, setReducingId] = useState<string | null>(null)
  const [reduceAmount, setReduceAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then(setInventory)
      .finally(() => setLoading(false))
  }, [])

  function startReduce(item: InventoryItem) {
    setReducingId(item.id)
    setReduceAmount('')
    setMessage('')
  }

  function cancelReduce() {
    setReducingId(null)
    setReduceAmount('')
  }

  async function saveReduce(item: InventoryItem) {
    const amount = Number(reduceAmount)
    if (!amount || amount <= 0) {
      setMessage('⚠ 1以上の数を入力してください')
      return
    }
    if (amount > item.stock) {
      setMessage(`⚠ 現在の在庫（${item.stock}${item.unit}）を超えています`)
      return
    }
    setSaving(true)
    const newStock = item.stock - amount
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
      setReducingId(null)
      setReduceAmount('')
      setMessage(`✓ ${item.name} から ${amount}${item.unit} 減らしました`)
      setTimeout(() => setMessage(''), 4000)
    } else {
      setMessage('⚠ 更新に失敗しました')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">在庫削減</h1>
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
              <table className="block w-full text-sm">
                <tbody className="block divide-y divide-gray-100">
                  {items.map((item) => {
                    const isReducing = reducingId === item.id
                    const isAlert = item.stock < item.alertThreshold
                    return (
                      <tr
                        key={item.id}
                        className={`flex flex-col gap-2.5 px-4 py-4 ${isAlert ? 'bg-red-50' : ''}`}
                      >
                        {/* 商品名 */}
                        <td className="block text-base font-semibold text-gray-800">
                          {isAlert && <span className="mr-1.5">⚠️</span>}
                          {item.name}
                        </td>
                        {/* 現在の在庫 */}
                        <td className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-gray-400">現在の在庫</span>
                          <span className={`font-bold ${isAlert ? 'text-red-600' : 'text-emerald-600'}`}>
                            {item.stock} {item.unit}
                          </span>
                        </td>
                        {/* 単価 */}
                        <td className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-gray-400">単価</span>
                          <span className="text-gray-500">
                            {item.pricePerKg != null ? `¥${item.pricePerKg}/kg` : '—'}
                          </span>
                        </td>
                        {/* 削減 */}
                        <td className="block pt-1">
                          {isReducing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={reduceAmount}
                                onChange={(e) => setReduceAmount(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveReduce(item)}
                                className="w-20 border-2 border-red-400 rounded-lg px-2 py-1.5 text-right text-sm focus:outline-none focus:border-red-500"
                                placeholder="0"
                                min="1"
                                max={item.stock}
                                autoFocus
                              />
                              <span className="text-xs text-gray-500 whitespace-nowrap">{item.unit}</span>
                              <button
                                onClick={() => saveReduce(item)}
                                disabled={saving}
                                className="text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-bold whitespace-nowrap"
                              >
                                {saving ? '...' : '削減'}
                              </button>
                              <button
                                onClick={cancelReduce}
                                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 ml-auto"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startReduce(item)}
                              disabled={item.stock === 0}
                              className="w-full text-xs bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 hover:border-red-400 px-3 py-2 rounded-lg transition-colors font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              － 在庫を減らす
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
