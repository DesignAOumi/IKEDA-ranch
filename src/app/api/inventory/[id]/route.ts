import { NextResponse } from 'next/server'
import { updateInventoryItem } from '@/lib/sheets'
import { requireAdmin } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    await updateInventoryItem(id, {
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      pricePerKg: body.pricePerKg !== undefined ? (body.pricePerKg === '' ? null : Number(body.pricePerKg)) : undefined,
      minLot: body.minLot !== undefined ? Number(body.minLot) : undefined,
      minLotPrice: body.minLotPrice !== undefined ? (body.minLotPrice === '' ? null : Number(body.minLotPrice)) : undefined,
      alertThreshold: body.alertThreshold !== undefined ? Number(body.alertThreshold) : undefined,
    }, session.name)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  }
}
