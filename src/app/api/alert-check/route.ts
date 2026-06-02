import { NextResponse } from 'next/server'
import { getInventory, addAlertHistory, getTodayAlertHistory } from '@/lib/sheets'
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
      (item) => item.stock <= item.alertThreshold && !alreadyAlerted.has(item.name)
    )

    if (alertItems.length === 0) {
      return NextResponse.json({ ok: true, alerted: 0 })
    }

    // LINEアラート送信
    if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_ADMIN_USER_ID) {
      const message = [
        '【池田牧場 在庫アラート】',
        '以下の飼料が基準値を下回りました：',
        '',
        ...alertItems.map((i) => `⚠️ ${i.name}: ${i.stock}${i.unit}（基準: ${i.alertThreshold}${i.unit}）`),
      ].join('\n')

      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: process.env.LINE_ADMIN_USER_ID,
          messages: [{ type: 'text', text: message }],
        }),
      })
    }

    // アラート履歴に記録
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
