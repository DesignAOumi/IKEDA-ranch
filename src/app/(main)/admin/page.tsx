import { getInventory, getProposals } from '@/lib/sheets'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [inventory, proposals] = await Promise.all([getInventory(), getProposals()])

  const alertItems = inventory.filter((i) => i.stock <= i.alertThreshold)
  const pendingProposals = proposals.filter((p) => p.status === 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">管理者ダッシュボード</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          href="/admin/inventory"
          label="在庫アラート"
          value={alertItems.length}
          unit="品"
          color={alertItems.length > 0 ? 'red' : 'green'}
        />
        <StatCard
          href="/admin/proposals"
          label="未確認の提案"
          value={pendingProposals.length}
          unit="件"
          color={pendingProposals.length > 0 ? 'amber' : 'green'}
        />
        <StatCard
          href="/admin/inventory"
          label="総在庫品目"
          value={inventory.length}
          unit="品"
          color="gray"
        />
        <StatCard
          href="/admin/companies"
          label="飼料会社"
          value={null}
          unit=""
          color="gray"
          label2="管理"
        />
      </div>

      {alertItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-600 mb-3">⚠️ アラート対象商品</h2>
          <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50 border-b border-red-100">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">商品名</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">現在在庫</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">基準値</th>
                </tr>
              </thead>
              <tbody>
                {alertItems.map((item) => (
                  <tr key={item.id} className="border-b border-red-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                      {item.stock} {item.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {item.alertThreshold} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {pendingProposals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-600 mb-3">📬 未確認の提案</h2>
          <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
            {pendingProposals.map((p) => (
              <div key={p.id} className="px-4 py-3 border-b border-amber-50 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.productName}</span>
                  <span className="text-xs text-gray-400">{p.companyName}</span>
                </div>
                {p.pricePerKg && (
                  <p className="text-xs text-gray-500 mt-0.5">提案価格: ¥{p.pricePerKg}/kg</p>
                )}
              </div>
            ))}
            <div className="px-4 py-2">
              <Link href="/admin/proposals" className="text-xs text-green-700 hover:underline">
                すべての提案を確認 →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  href, label, value, unit, color, label2,
}: {
  href: string
  label: string
  value: number | null
  unit: string
  color: 'red' | 'amber' | 'green' | 'gray'
  label2?: string
}) {
  const colorMap = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
    gray: 'text-gray-700',
  }

  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>
        {value !== null ? value : ''}
        <span className="text-sm font-normal ml-1">{label2 ?? unit}</span>
      </p>
    </Link>
  )
}
