import { NextResponse } from 'next/server'
import { updateProposalStatus } from '@/lib/sheets'
import { requireAdmin } from '@/lib/auth'
import type { Proposal } from '@/lib/types'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { status } = await request.json() as { status: Proposal['status'] }

    await updateProposalStatus(id, status)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  }
}
