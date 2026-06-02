import { NextResponse } from 'next/server'
import { getInventory } from '@/lib/sheets'
import { getSession } from '@/lib/auth'

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
