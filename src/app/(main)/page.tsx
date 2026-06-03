import { getInventory } from '@/lib/sheets'
import type { InventoryItem } from '@/lib/types'

const CATEGORY_CONFIG = {
  粗飼料: { color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', icon: '🌾' },
  濃厚飼料: { color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500', icon: '🌽' },
  添加剤: { color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500', icon: '🧪' },
} as const

const CATEGORIES = ['粗飼料', '濃厚飼料', '添加剤'] as const

function StockCell({ item }: { item: InventoryItem }) {
  const isAlert = item.stock <= item.alertThreshold
  const isWarning = !isAlert && item.stock <= item.alertThreshold * 1.5

  if (isAlert) return (
    <span className="inline-flex items-center gap-1.5 font-bold text-red-600">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      {item.stock} {item.unit}
    </span>
  )
  if (isWarning) return (
    <span className="font-bold text-amber-600">{item.stock} {item.unit}</span>
  )
  return (
    <span className="font-bold text-emerald-600">{item.stock} {item.unit}</span>
  )
}

export default async function InventoryPage() {
  const inventory = await getInventory()
  const alertCount = inventory.filter((i) => i.stock <= i.alertThreshold).length
  const lastUpdated = inventory.map((i) => i.updatedAt).filter(Boolean).sort().at(-1)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">飼料在庫一覧</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
            </p>
          )}
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-2 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {alertCount}品が基準値以下
          </div>
        )}
      </div>

      {/* カテゴリ別テーブル */}
      {CATEGORIES.map((category) => {
        const items = inventory.filter((i) => i.category === category)
        if (items.length === 0) return null
        const cfg = CATEGORY_CONFIG[category]
        const catAlerts = items.filter((i) => i.stock <= i.alertThreshold).length

        return (
          <section key={category}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{cfg.icon}</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
                {category}
              </span>
              {catAlerts > 0 && (
                <span className="text-xs text-red-500 font-semibold">⚠️ {catAlerts}品アラート中</span>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-semibold text-gray-500">商品名</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-500">在庫数</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-500">単価</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-500 hidden sm:table-cell">アラート基準</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const isAlert = item.stock <= item.alertThreshold
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-50 last:border-0 transition-colors ${
                          isAlert
                            ? 'bg-red-50 hover:bg-red-100'
                            : idx % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-gray-50/40 hover:bg-green-50'
                        }`}
                      >
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {isAlert && <span className="mr-1.5">⚠️</span>}
                          {item.name}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <StockCell item={item} />
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-700">
                          {item.pricePerKg != null
                            ? <span>¥<span className="text-base">{item.pricePerKg.toLocaleString()}</span><span className="text-xs text-gray-400">/kg</span></span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">
                          {item.alertThreshold} {item.unit}
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
