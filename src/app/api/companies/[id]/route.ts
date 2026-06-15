import { NextResponse } from 'next/server'
import { deleteCompany, updateCompanyEmail } from '@/lib/sheets'
import { requireAdmin } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { email } = await request.json()
    await updateCompanyEmail(id, email ?? '')
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: 'メールアドレスの更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    await deleteCompany(id)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}
