import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import { getAdminUsers, getCompanies, updateCompanyLastLogin } from '@/lib/sheets'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'ユーザー名とパスワードを入力してください' }, { status: 400 })
    }

    const [admins, companies] = await Promise.all([getAdminUsers(), getCompanies()])

    const admin = admins.find((a) => a.username === username)
    if (admin && await bcrypt.compare(password, admin.passwordHash)) {
      const token = await signToken({ id: admin.id, role: 'admin', name: 'admin' })
      const res = NextResponse.json({ ok: true, role: 'admin' })
      res.cookies.set(COOKIE_NAME, token, cookieOptions())
      return res
    }

    const company = companies.find((c) => c.name === username)
    if (company && await bcrypt.compare(password, company.passwordHash)) {
      const token = await signToken({ id: company.id, role: 'company', name: company.name })
      const res = NextResponse.json({ ok: true, role: 'company' })
      res.cookies.set(COOKIE_NAME, token, cookieOptions())
      await updateCompanyLastLogin(company.id)
      return res
    }

    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}
