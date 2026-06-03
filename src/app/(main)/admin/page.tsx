import { getInventory, getProposals } from '@/lib/sheets'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [inventory, proposals] = await Promise.all([getInventory(), getProposals()])
  const alertItems = inventory.filter((i) => i.stock <= i.alertThreshold)
  const pendingProposals = proposals.filter((p) => p.status === 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard href="/admin/inventory" icon="⚠️" label="在庫アラート" value={alertItems.length} unit="品"
          gradient={alertItems.length > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-green-600'} />
        <StatCard href="/admin/proposals" icon="📬" label="未確認の提案" value={pendingProposals.length} unit="件"
          gradient={pendingProposals.length > 0 ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-green-600'} />
        <StatCard href="/admin/inventory" icon="📦" label="総在庫品目" value={inventory.length} unit="品"
          gradient="from-blue-500 to-indigo-600" />
        <StatCard href="/admin/companies" icon="🏢" label="飼料会社管理" value={null} unit="管理"
          gradient="from-violet-500 to-purple-600" />
      </div>

      {/* アラート商品 */}
      {alertItems.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            アラート対象商品
          </h2>
          <div className="bg-white rounded-2xl border-2 border-red-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50 border-b border-red-100">
                  <th className="text-left px-5 py-3 font-semibold text-red-700">商品名</th>
                  <th className="text-right px-5 py-3 font-semibold text-red-700">現在在庫</th>
                  <th className="text-right px-5 py-3 font-semibold text-red-700">基準値</th>
                </tr>
              </thead>
              <tbody>
                {alertItems.map((item) => (
                  <tr key={item.id} className="border-b border-red-50 last:border-0 hover:bg-red-50">
                    <td className="px-5 py-3 font-medium">{item.name}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-600">{item.stock} {item.unit}</td>
                    <td className="px-5 py-3 text-right text-gray-400">{item.alertThreshold} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 未確認提案 */}
      {pendingProposals.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            未確認の提案
          </h2>
          <div className="bg-white rounded-2xl border-2 border-amber-100 overflow-hidden shadow-sm">
            {pendingProposals.map((p) => (
              <div key={p.id} className="px-5 py-3 border-b border-amber-50 last:border-0 hover:bg-amber-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{p.productName}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{p.companyName}</span>
                </div>
                {p.pricePerKg && <p className="text-xs text-gray-500 mt-0.5">提案価格: ¥{p.pricePerKg}/kg</p>}
              </div>
            ))}
            <div className="px-5 py-2.5">
              <Link href="/admin/proposals" className="text-xs text-emerald-700 font-semibold hover:underline">
                すべての提案を確認 →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ナビゲーション */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 mb-3">クイックアクセス</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/admin/inventory', icon: '📦', label: '在庫・価格編集' },
            { href: '/admin/proposals', icon: '📬', label: '提案一覧' },
            { href: '/admin/companies', icon: '🏢', label: '会社アカウント管理' },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md hover:border-green-200 transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({ href, icon, label, value, unit, gradient }: {
  href: string; icon: string; label: string; value: number | null; unit: string; gradient: string
}) {
  return (
    <Link href={href}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs font-medium opacity-90 mb-0.5">{label}</p>
      <p className="text-2xl font-bold">
        {value !== null ? value : ''}
        <span className="text-sm font-normal ml-1 opacity-80">{unit}</span>
      </p>
    </Link>
  )
}
