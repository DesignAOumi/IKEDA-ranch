import { NextResponse } from 'next/server'
import { getInventory, addAlertHistory, getTodayAlertHistory } from '@/lib/sheets'
import { sendLineBroadcast } from '@/lib/line'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [inventory, todayAlerts] = await Promise.all([getInventory(), getTodayAlertHistory()])
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
