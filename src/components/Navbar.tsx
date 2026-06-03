'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AuthPayload } from '@/lib/types'

export default function Navbar({ session }: { session: AuthPayload }) {
  const pathname = usePathname()
  const isAdmin = session.role === 'admin'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <header className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-md sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg">
            <span className="text-2xl">🐄</span>
            <span className="hidden sm:inline tracking-wide">池田牧場</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink href="/" current={pathname === '/'}>在庫一覧</NavLink>
            {isAdmin && (
              <NavLink href="/admin" current={pathname.startsWith('/admin')}>管理</NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-green-100 hidden sm:inline">
            {isAdmin ? '管理者' : session.name}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-white border border-green-400 hover:bg-green-700 rounded-lg px-3 py-1.5 transition-colors"
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
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
        current
          ? 'bg-white text-green-700'
          : 'text-green-100 hover:bg-green-700'
      }`}
    >
      {children}
    </Link>
  )
}
