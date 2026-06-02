import { getInventory } from '@/lib/sheets'
import type { InventoryItem } from '@/lib/types'

const CATEGORIES = ['粗飼料', '濃厚飼料', '添加剤'] as const

function StockBadge({ item }: { item: InventoryItem }) {
  const isAlert = item.stock <= item.alertThreshold
  const isWarning = item.stock <= item.alertThreshold * 1.5 && !isAlert

  if (isAlert) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        {item.stock} {item.unit}
      </span>
    )
  }
  if (isWarning) {
    return (
      <span className="font-semibold text-amber-600">
        {item.stock} {item.unit}
      </span>
    )
  }
  return (
    <span className="font-semibold text-green-700">
      {item.stock} {item.unit}
    </span>
  )
}

export default async function InventoryPage() {
  const inventory = await getInventory()
  const alertCount = inventory.filter((i) => i.stock <= i.alertThreshold).length
  const lastUpdated = inventory
    .map((i) => i.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">飼料在庫一覧</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
            </p>
          )}
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {alertCount}品が基準値以下
          </div>
        )}
      </div>

      {CATEGORIES.map((category) => {
        const items = inventory.filter((i) => i.category === category)
        if (items.length === 0) return null
        return (
          <section key={category}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {category}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">商品名</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">在庫数</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">単価</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">アラート基準</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const isAlert = item.stock <= item.alertThreshold
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-50 last:border-0 ${
                          isAlert ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {isAlert && <span className="mr-1.5 text-red-500">⚠️</span>}
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StockBadge item={item} />
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {item.pricePerKg != null
                            ? `¥${item.pricePerKg.toLocaleString()}/kg`
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
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
