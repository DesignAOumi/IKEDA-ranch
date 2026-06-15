import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getCompanies, addCompany } from '@/lib/sheets'
import { requireAdmin } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    await requireAdmin()
    const companies = await getCompanies()
    return NextResponse.json(companies.map((c) => ({ ...c, passwordHash: undefined })))
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const { name, password, email } = await request.json()

    if (!name || !password) {
      return NextResponse.json({ error: '会社名とパスワードは必須です' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await addCompany({
      id: randomUUID(),
      name,
      passwordHash,
      email: email ?? '',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: '会社の追加に失敗しました' }, { status: 500 })
  }
}
