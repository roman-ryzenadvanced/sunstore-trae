'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(false)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        router.push('/admin')
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card-ss w-full max-w-sm p-8 fade-up">
        <div className="flex items-center gap-2 mb-6">
          <span className="brand-mark">Sunstore<span className="brand-dot" /></span>
        </div>
        <h1 className="h-display text-2xl mb-1">Вход в панель управления</h1>
        <p className="muted-ss text-sm mb-6">Введите пароль для доступа к админке.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-ss" htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              className="input-ss"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error && (
            <span className="badge-danger">Неверный пароль</span>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Проверка…' : 'Войти'}
          </button>
        </form>
      </div>
    </main>
  )
}
