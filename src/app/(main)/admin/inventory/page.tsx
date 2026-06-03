'use client'

import { useState, useEffect } from 'react'
import type { InventoryItem } from '@/lib/types'

const CATEGORIES = ['粗飼料', '濃厚飼料', '添加剤'] as const

const EMPTY_FORM = {
  category: '粗飼料' as typeof CATEGORIES[number],
  name: '',
  stock: '',
  unit: 'パレット',
  pricePerKg: '',
  minLot: '10',
  minLotPrice: '',
  alertThreshold: '5',
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<InventoryItem>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)

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
      setInventory((prev) => prev.map((i) => i.id === item.id ? { ...i, ...editValues } : i))
      setEditingId(null)
      setMessage('✓ 保存しました')
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage('⚠ 保存に失敗しました')
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    setAdding(false)
    if (res.ok) {
      const updated = await fetch('/api/inventory').then((r) => r.json())
      setInventory(updated)
      setAddForm(EMPTY_FORM)
      setShowAddForm(false)
      setMessage('✓ 商品を追加しました')
      setTimeout(() => setMessage(''), 3000)
    } else {
      const data = await res.json()
      setMessage(`⚠ ${data.error ?? '追加に失敗しました'}`)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">在庫管理</h1>
          {message && (
            <p className={`text-sm mt-1 font-medium ${message.startsWith('⚠') ? 'text-red-500' : 'text-emerald-600'}`}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => { setShowAddForm(true); setMessage('') }}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-sm transition-all"
        >
          <span className="text-lg">＋</span> 商品を追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border-2 border-green-200 p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-green-600">＋</span> 新しい商品を追加
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>種類 *</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as typeof CATEGORIES[number] }))}
                className={inputClass} required
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>商品名 *</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass} placeholder="例: 新商品フレーク" required
              />
            </div>
            <div>
              <label className={labelClass}>在庫数</label>
              <input type="number" value={addForm.stock}
                onChange={(e) => setAddForm((f) => ({ ...f, stock: e.target.value }))}
                className={inputClass} min="0" placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>単位</label>
              <input type="text" value={addForm.unit}
                onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                className={inputClass} placeholder="パレット" />
            </div>
            <div>
              <label className={labelClass}>単価 (円/kg)</label>
              <input type="number" value={addForm.pricePerKg}
                onChange={(e) => setAddForm((f) => ({ ...f, pricePerKg: e.target.value }))}
                className={inputClass} min="0" step="0.1" placeholder="未設定" />
            </div>
            <div>
              <label className={labelClass}>最低ロット</label>
              <input type="number" value={addForm.minLot}
                onChange={(e) => setAddForm((f) => ({ ...f, minLot: e.target.value }))}
                className={inputClass} min="1" />
            </div>
            <div>
              <label className={labelClass}>アラート基準</label>
              <input type="number" value={addForm.alertThreshold}
                onChange={(e) => setAddForm((f) => ({ ...f, alertThreshold: e.target.value }))}
                className={inputClass} min="0" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={adding}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 shadow">
              {adding ? '追加中...' : '追加する'}
            </button>
            <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }}
              className="text-sm text-gray-500 hover:text-gray-700 border-2 border-gray-200 px-5 py-2.5 rounded-xl">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 在庫テーブル */}
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
                    <th className="text-right px-4 py-3 font-semibold text-gray-500">在庫数</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500">単価(円/kg)</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 hidden sm:table-cell">アラート基準</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isEditing = editingId === item.id
                    const isAlert = item.stock <= item.alertThreshold
                    return (
                      <tr key={item.id} className={`border-b border-gray-50 last:border-0 ${isAlert ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {isAlert && <span className="mr-1.5">⚠️</span>}
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input type="number" value={editValues.stock ?? ''}
                              onChange={(e) => setEditValues((v) => ({ ...v, stock: Number(e.target.value) }))}
                              className="w-20 border-2 border-green-400 rounded-lg px-2 py-1 text-right text-sm focus:outline-none" min="0" />
                          ) : (
                            <span className={`font-bold ${isAlert ? 'text-red-600' : 'text-emerald-600'}`}>
                              {item.stock} {item.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input type="number" value={editValues.pricePerKg ?? ''}
                              onChange={(e) => setEditValues((v) => ({ ...v, pricePerKg: e.target.value === '' ? undefined : Number(e.target.value) }))}
                              className="w-24 border-2 border-green-400 rounded-lg px-2 py-1 text-right text-sm focus:outline-none" min="0" step="0.1" />
                          ) : (
                            item.pricePerKg != null
                              ? <span className="font-semibold text-gray-700">¥{item.pricePerKg}</span>
                              : <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          {isEditing ? (
                            <input type="number" value={editValues.alertThreshold ?? ''}
                              onChange={(e) => setEditValues((v) => ({ ...v, alertThreshold: Number(e.target.value) }))}
                              className="w-20 border-2 border-green-400 rounded-lg px-2 py-1 text-right text-sm focus:outline-none" min="0" />
                          ) : (
                            <span className="text-gray-400 text-xs">{item.alertThreshold} {item.unit}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => saveEdit(item)} disabled={saving}
                                className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-bold">
                                {saving ? '保存中' : '保存'}
                              </button>
                              <button onClick={cancelEdit}
                                className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border-2 border-gray-200">
                                キャンセル
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(item)}
                              className="text-xs text-emerald-700 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
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

const inputClass = 'w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors'
const labelClass = 'block text-xs font-semibold text-gray-500 mb-1'
