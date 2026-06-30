import { NextResponse } from 'next/server'
import { getInventory, getCompanies, updateInventoryItem, addAlertHistory, getTodayAlertHistory, resolveCompany } from '@/lib/sheets'
import { requireAdmin } from '@/lib/auth'
import { sendLineBroadcast } from '@/lib/line'
import { sendOrderRequestEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const items = await getInventory()
    const currentItem = items.find((i) => i.id === id)
    if (!currentItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await updateInventoryItem(id, {
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      pricePerKg: body.pricePerKg !== undefined ? (body.pricePerKg === '' ? null : Number(body.pricePerKg)) : undefined,
      minLot: body.minLot !== undefined ? Number(body.minLot) : undefined,
      minLotPrice: body.minLotPrice !== undefined ? (body.minLotPrice === '' ? null : Number(body.minLotPrice)) : undefined,
      alertThreshold: body.alertThreshold !== undefined ? Number(body.alertThreshold) : undefined,
    }, session.name)

    if (body.stock !== undefined) {
      const newStock = Number(body.stock)
      const newThreshold = body.alertThreshold !== undefined ? Number(body.alertThreshold) : currentItem.alertThreshold

      // 入荷通知: 在庫が増加した場合は必ず通知
      if (newStock > currentItem.stock) {
        const added = newStock - currentItem.stock
        await sendLineBroadcast(
          `【在庫 入荷】\n${currentItem.name} が入荷されました\n入荷数：+${added}${currentItem.unit}\n現在の在庫：${newStock}${currentItem.unit}`
        )
      }

      // アラート通知: 在庫がアラート基準以下になった場合（当日重複なし）
      if (newStock < newThreshold) {
        const todayAlerts = await getTodayAlertHistory()
        const alreadyAlerted = todayAlerts.some((a) => a.productName === currentItem.name)
        if (!alreadyAlerted) {
          await sendLineBroadcast(
            `【在庫アラート】\n⚠️ ${currentItem.name}: ${newStock}${currentItem.unit}\n基準値：${newThreshold}${currentItem.unit}`
          )
          if (currentItem.company) {
            const company = resolveCompany(currentItem.company, await getCompanies())
            if (company?.email) {
              await sendOrderRequestEmail(company.name, company.email, [
                { ...currentItem, stock: newStock, alertThreshold: newThreshold },
              ])
            }
          }
          await addAlertHistory({
            id: randomUUID(),
            productName: currentItem.name,
            stock: newStock,
            threshold: newThreshold,
            sentAt: new Date().toISOString(),
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  }
}
