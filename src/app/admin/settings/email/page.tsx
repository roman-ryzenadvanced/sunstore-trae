'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

type Provider = 'none' | 'smtp' | 'yandex-api'

interface SmtpConfig {
  host: string
  port: string
  ssl: boolean
  user: string
  pass: string
  fromEmail: string
  fromName: string
}

interface YandexConfig {
  yandexLogin: string
  yandexToken: string
  fromEmail: string
}

const defaultSmtp: SmtpConfig = {
  host: '',
  port: '587',
  ssl: false,
  user: '',
  pass: '',
  fromEmail: '',
  fromName: 'Sunstore',
}

const defaultYandex: YandexConfig = {
  yandexLogin: '',
  yandexToken: '',
  fromEmail: '',
}

export default function AdminEmailSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<Provider>('none')
  const [smtp, setSmtp] = useState<SmtpConfig>(defaultSmtp)
  const [yandex, setYandex] = useState<YandexConfig>(defaultYandex)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/email-config')
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.config ?? {}
        setProvider(cfg.provider ?? 'none')
        setSmtp({ ...defaultSmtp, ...cfg.smtp })
        setYandex({ ...defaultYandex, ...cfg.yandex })
        setEmailEnabled(cfg.emailEnabled ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider, smtp, yandex }),
      })
      const d = await res.json()
      if (d.success) {
        showToast('Подключение успешно')
      } else {
        showToast(d.message ?? 'Ошибка подключения')
      }
    } catch {
      showToast('Ошибка сети')
    } finally {
      setTesting(false)
    }
  }

  const save = async () => {
    const res = await fetch('/api/admin/email-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, smtp, yandex, emailEnabled }),
    })
    if (res.ok) showToast('Сохранено')
    else showToast('Не удалось сохранить')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="spinner-ss" />
      </div>
    )
  }

  return (
    <div className="fade-up">
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <header className="mb-8">
        <p className="eyebrow-ss mb-2">Интеграции</p>
        <h1 className="h-display text-3xl">Настройки email</h1>
      </header>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: SMTP / Provider */}
        <div className="card-ss p-6">
          <h2 className="h-display text-lg mb-5">Провайдер</h2>

          <div className="space-y-5">
            {/* Provider selector */}
            <div>
              <label className="label-ss">Провайдер</label>
              <select
                className="select-ss"
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
              >
                <option value="none">Выключено</option>
                <option value="smtp">Custom SMTP</option>
                <option value="yandex-api">Яндекс API</option>
              </select>
            </div>

            {/* SMTP fields */}
            {provider === 'smtp' && (
              <>
                <div>
                  <label className="label-ss">SMTP-сервер</label>
                  <input
                    className="input-ss"
                    placeholder="smtp.example.com"
                    value={smtp.host}
                    onChange={(e) =>
                      setSmtp((prev) => ({ ...prev, host: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">Порт</label>
                  <input
                    type="number"
                    className="input-ss"
                    placeholder="587"
                    value={smtp.port}
                    onChange={(e) =>
                      setSmtp((prev) => ({ ...prev, port: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="label-ss mb-0">SSL/TLS</span>
                  <button
                    type="button"
                    className="toggle-ss"
                    data-on={smtp.ssl ? 'true' : 'false'}
                    onClick={() =>
                      setSmtp((prev) => ({ ...prev, ssl: !prev.ssl }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">Логин</label>
                  <input
                    className="input-ss"
                    placeholder="user@example.com"
                    value={smtp.user}
                    onChange={(e) =>
                      setSmtp((prev) => ({ ...prev, user: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">Пароль</label>
                  <input
                    type="password"
                    className="input-ss"
                    placeholder="********"
                    value={smtp.pass}
                    onChange={(e) =>
                      setSmtp((prev) => ({ ...prev, pass: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">Email отправителя</label>
                  <input
                    className="input-ss"
                    placeholder="noreply@example.com"
                    value={smtp.fromEmail}
                    onChange={(e) =>
                      setSmtp((prev) => ({ ...prev, fromEmail: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">Имя отправителя</label>
                  <input
                    className="input-ss"
                    placeholder="Sunstore"
                    value={smtp.fromName}
                    onChange={(e) =>
                      setSmtp((prev) => ({ ...prev, fromName: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            {/* Yandex API fields */}
            {provider === 'yandex-api' && (
              <>
                <div>
                  <label className="label-ss">Яндекс логин</label>
                  <input
                    className="input-ss"
                    placeholder="user@yandex.ru"
                    value={yandex.yandexLogin}
                    onChange={(e) =>
                      setYandex((prev) => ({
                        ...prev,
                        yandexLogin: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">OAuth токен</label>
                  <input
                    type="password"
                    className="input-ss"
                    placeholder="********"
                    value={yandex.yandexToken}
                    onChange={(e) =>
                      setYandex((prev) => ({
                        ...prev,
                        yandexToken: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">Email отправителя</label>
                  <input
                    className="input-ss"
                    placeholder="user@yandex.ru"
                    value={yandex.fromEmail}
                    onChange={(e) =>
                      setYandex((prev) => ({
                        ...prev,
                        fromEmail: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}

            {provider === 'none' && (
              <p className="muted-ss text-sm">
                Email уведомления выключены. Выберите провайдера для включения.
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Yandex quick setup help */}
        <div className="card-ss p-6">
          <h2 className="h-display text-lg mb-5">Яндекс: инструкция</h2>

          <p className="muted-ss text-sm mb-5">
            Для настройки отправки писем через Яндекс выполните следующие шаги:
          </p>

          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/[0.06] border border-[color:var(--hairline)] flex items-center justify-center text-xs text-ink">
                1
              </span>
              <span className="text-ink">
                Перейдите на{' '}
                <span className="text-[color:var(--accent)]">
                  https://oauth.yandex.ru/client/new
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/[0.06] border border-[color:var(--hairline)] flex items-center justify-center text-xs text-ink">
                2
              </span>
              <span className="text-ink">
                Создайте приложение, выберите «Почта Яндекс: отправка писем»
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/[0.06] border border-[color:var(--hairline)] flex items-center justify-center text-xs text-ink">
                3
              </span>
              <span className="text-ink">Получите OAuth токен</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/[0.06] border border-[color:var(--hairline)] flex items-center justify-center text-xs text-ink">
                4
              </span>
              <span className="text-ink">
                Для SMTP: используйте smtp.yandex.ru, порт 465, SSL включён
              </span>
            </li>
          </ol>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-7">
        <div className="flex items-center justify-between gap-4">
          <span className="label-ss mb-0">Email уведомления</span>
          <button
            type="button"
            className="toggle-ss"
            data-on={emailEnabled ? 'true' : 'false'}
            onClick={() => setEmailEnabled((prev) => !prev)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            className="btn-accent"
            onClick={testConnection}
            disabled={testing || provider === 'none'}
          >
            {testing ? 'Проверка...' : 'Проверить подключение'}
          </button>
          <button className="btn-primary" onClick={save}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
