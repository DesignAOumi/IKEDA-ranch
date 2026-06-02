import { NextResponse } from 'next/server'
import { getProposals, addProposal } from '@/lib/sheets'
import { getSession, requireAdmin } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    await requireAdmin()
    const proposals = await getProposals()
    return NextResponse.json(proposals)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { productName, category, description, pricePerKg, minLot, contact } = body

    if (!productName || !contact) {
      return NextResponse.json({ error: '商品名と連絡先は必須です' }, { status: 400 })
    }

    await addProposal({
      id: randomUUID(),
      companyName: session.name,
      productName,
      category: category ?? '',
      description: description ?? '',
      pricePerKg: pricePerKg ? Number(pricePerKg) : null,
      minLot: minLot ? Number(minLot) : null,
      contact,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '提案の送信に失敗しました' }, { status: 500 })
  }
}
