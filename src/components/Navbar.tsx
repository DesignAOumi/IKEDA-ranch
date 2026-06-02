'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthPayload } from '@/lib/types'

export default function Navbar({ session }: { session: AuthPayload }) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isAdmin = session.role === 'admin'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-green-800">
            <span className="text-xl">🐄</span>
            <span className="hidden sm:inline">池田牧場</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink href="/" current={pathname === '/'}>在庫一覧</NavLink>
            <NavLink href="/propose" current={pathname === '/propose'}>新商材を提案</NavLink>
            {isAdmin && (
              <NavLink href="/admin" current={pathname.startsWith('/admin')}>管理</NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {isAdmin ? '管理者' : session.name}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md px-3 py-1.5 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
        current
          ? 'bg-green-50 text-green-700 font-medium'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}
