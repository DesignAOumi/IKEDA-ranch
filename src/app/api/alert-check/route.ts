import { NextResponse } from 'next/server'
import { getInventory, getCompanies, addAlertHistory, getTodayAlertHistory, resolveCompany } from '@/lib/sheets'
import type { Company } from '@/lib/types'
import { sendLineBroadcast } from '@/lib/line'
import { sendOrderRequestEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [inventory, companies, todayAlerts] = await Promise.all([
      getInventory(),
      getCompanies(),
      getTodayAlertHistory(),
    ])
    const alreadyAlerted = new Set(todayAlerts.map((a) => a.productName))

    const alertItems = inventory.filter(
      (item) => item.stock < item.alertThreshold && !alreadyAlerted.has(item.name)
    )

    if (alertItems.length === 0) {
      return NextResponse.json({ ok: true, alerted: 0 })
    }

    const message = [
      '【池田牧場 在庫アラート】',
      '以下の飼料が基準値を下回りました：',
      '',
      ...alertItems.map((i) => `⚠️ ${i.name}: ${i.stock}${i.unit}（基準: ${i.alertThreshold}${i.unit}）`),
    ].join('\n')

    await sendLineBroadcast(message)

    // 担当会社（スプレッドシートで設定）ごとに対象品目をまとめて発注依頼メールを送信
    const itemsByCompany = new Map<string, { company: Company; items: typeof alertItems }>()
    for (const item of alertItems) {
      const company = resolveCompany(item.company, companies)
      if (!company?.email) continue
      const entry = itemsByCompany.get(company.id) ?? { company, items: [] }
      entry.items.push(item)
      itemsByCompany.set(company.id, entry)
    }
    await Promise.all(
      [...itemsByCompany.values()].map(({ company, items }) =>
        sendOrderRequestEmail(company.name, company.email, items)
      )
    )

    const now = new Date().toISOString()
    await Promise.all(
      alertItems.map((item) =>
        addAlertHistory({
          id: randomUUID(),
          productName: item.name,
          stock: item.stock,
          threshold: item.alertThreshold,
          sentAt: now,
        })
      )
    )

    return NextResponse.json({ ok: true, alerted: alertItems.length, items: alertItems.map((i) => i.name) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'アラートチェックに失敗しました' }, { status: 500 })
  }
}
