'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      window.location.href = '/'
    } else {
      setError(data.error ?? 'ログインに失敗しました')
    }
  }

  return (
    <div className="w-full max-w-sm px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4 text-4xl">
          🐄
        </div>
        <h1 className="text-3xl font-bold text-white drop-shadow">池田牧場</h1>
        <p className="text-green-100 mt-1 text-sm">飼料在庫管理システム</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">
            ユーザー名 / 会社名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
            placeholder="admin または会社名"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-md hover:shadow-lg"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}
