'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/categories', label: 'Категории' },
  { href: '/admin/products', label: 'Товары' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/settings/payments', label: 'Платежи' }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    // The login page must be reachable without auth; skip the gate there.
    if (pathname === '/admin/login') {
      setStatus('ok')
      return
    }

    let alive = true
    fetch('/api/store-config?scope=admin')
      .then((res) => {
        if (!alive) return
        if (res.ok) setStatus('ok')
        else {
          setStatus('denied')
          router.replace('/admin/login')
        }
      })
      .catch(() => {
        if (!alive) return
        setStatus('denied')
        router.replace('/admin/login')
      })
    return () => {
      alive = false
    }
  }, [router, pathname])

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  // Login page renders full-bleed without the admin chrome.
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (status !== 'ok') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="spinner-ss" />
      </main>
    )
  }

  return (
    <div className="min-h-screen flex">
      <aside className="card-ss fixed left-6 top-6 bottom-6 w-[240px] p-5 flex flex-col">
        <div className="brand-mark text-lg mb-8">
          Sunstore<span className="brand-dot" />
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link py-2 px-3 rounded-[var(--r-md)] ${
                  active ? 'nav-link-active bg-white/[0.04]' : ''
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="divider-ss mb-4" />
          <button onClick={logout} className="btn-quiet w-full justify-start">
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-[264px]">
        <div className="container-ss py-10">{children}</div>
      </div>
    </div>
  )
}
