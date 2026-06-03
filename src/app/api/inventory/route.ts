import { NextResponse } from 'next/server'
import { getInventory, addInventoryItem } from '@/lib/sheets'
import { getSession, requireAdmin } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const items = await getInventory()
    return NextResponse.json(items)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { category, name, stock, unit, pricePerKg, minLot, minLotPrice, alertThreshold } = body

    if (!category || !name) {
      return NextResponse.json({ error: '種類と商品名は必須です' }, { status: 400 })
    }

    await addInventoryItem({
      category,
      name,
      stock: Number(stock) || 0,
      unit: unit || 'パレット',
      pricePerKg: pricePerKg !== '' && pricePerKg != null ? Number(pricePerKg) : null,
      minLot: Number(minLot) || 10,
      minLotPrice: minLotPrice !== '' && minLotPrice != null ? Number(minLotPrice) : null,
      alertThreshold: Number(alertThreshold) || 5,
    }, session.name)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: '追加に失敗しました' }, { status: 500 })
  }
}
