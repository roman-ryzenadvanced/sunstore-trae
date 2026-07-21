// Email service layer for Sunstore
// Supports raw SMTP via Node.js built-ins (net/tls) and Yandex.Mail API
// No external npm packages required

import net from 'node:net'
import tls from 'node:tls'
import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'

/* ======================== Types ======================== */

export interface EmailConfig {
  provider: 'smtp' | 'yandex-api' | 'none'
  // SMTP fields
  smtpHost?: string
  smtpPort?: number
  smtpSSL?: boolean
  smtpUser?: string
  smtpPass?: string
  fromEmail?: string
  fromName?: string
  // Yandex API fields
  yandexToken?: string
  yandexLogin?: string
  isActive: boolean
}

export interface EmailResult {
  ok: boolean
  error?: string
}

/* ======================== Config storage (globalThis) ======================== */

const globalForEmail = globalThis as unknown as {
  _sunstoreEmailConfig?: EmailConfig
}

if (!globalForEmail._sunstoreEmailConfig) {
  globalForEmail._sunstoreEmailConfig = {
    provider: 'none',
    isActive: false,
  }
}

let emailConfig: EmailConfig = globalForEmail._sunstoreEmailConfig

function syncConfig(): void {
  globalForEmail._sunstoreEmailConfig = emailConfig
}

/* ======================== Config CRUD ======================== */

export function getEmailConfig(): EmailConfig {
  return { ...emailConfig }
}

export function updateEmailConfig(patch: Partial<EmailConfig>): EmailConfig {
  emailConfig = { ...emailConfig, ...patch }
  syncConfig()
  return getEmailConfig()
}

/* ======================== Helpers ======================== */

/** Base64 encode a string (UTF-8 safe). */
function b64Encode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64')
}

/** Generate an RFC 2822 date string. */
function rfc2822Date(d?: Date): string {
  const date = d || new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n: number, w: number = 2) => n.toString().padStart(w, '0')
  return `${days[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`
}

/** Encode a subject for MIME using base64 (=?UTF-8?B?...?=). */
function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${b64Encode(subject)}?=`
}

/** Build a complete MIME email message. */
function buildMimeMessage(
  fromEmail: string,
  fromName: string,
  to: string,
  subject: string,
  html: string,
  text?: string
): string {
  const lines: string[] = []

  lines.push(`From: "${fromName}" <${fromEmail}>`)
  lines.push(`To: ${to}`)
  lines.push(`Subject: ${encodeSubject(subject)}`)
  lines.push('MIME-Version: 1.0')
  lines.push(`Date: ${rfc2822Date()}`)

  if (text) {
    const boundary = `boundary-${crypto.randomBytes(16).toString('hex')}`
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
    lines.push('')
    lines.push(`--${boundary}`)
    lines.push('Content-Type: text/plain; charset=UTF-8')
    lines.push('Content-Transfer-Encoding: base64')
    lines.push('')
    lines.push(b64Encode(text))
    lines.push('')
    lines.push(`--${boundary}`)
    lines.push('Content-Type: text/html; charset=UTF-8')
    lines.push('Content-Transfer-Encoding: base64')
    lines.push('')
    lines.push(b64Encode(html))
    lines.push('')
    lines.push(`--${boundary}--`)
  } else {
    lines.push('Content-Type: text/html; charset=UTF-8')
    lines.push('Content-Transfer-Encoding: base64')
    lines.push('')
    lines.push(b64Encode(html))
  }

  return lines.join('\r\n')
}

/* ======================== Raw SMTP Client ======================== */

interface SmtpResponse {
  code: number
  text: string
  complete: boolean
}

/**
 * Minimal SMTP client using Node.js net/tls builtins.
 * Handles connect, EHLO, STARTTLS, AUTH LOGIN, MAIL FROM, RCPT TO, DATA, QUIT.
 */
async function smtpSend(
  host: string,
  port: number,
  useSSL: boolean,
  user: string,
  pass: string,
  fromEmail: string,
  toAddresses: string[],
  message: string,
  timeoutMs: number = 15000,
): Promise<EmailResult> {
  return new Promise<EmailResult>((resolve) => {
    let socket: net.Socket | null = null
    let buffer = ''
    let useTls = useSSL
    const timer = setTimeout(() => {
      cleanup()
      resolve({ ok: false, error: 'SMTP connection timed out' })
    }, timeoutMs)

    function cleanup(): void {
      clearTimeout(timer)
      if (socket) {
        try { socket.destroy() } catch { /* ignore */ }
        socket = null
      }
    }

    function parseResponse(): SmtpResponse {
      const match = buffer.match(/^(\d{3})([ -])(.*)/m)
      if (!match) return { code: 0, text: buffer, complete: false }
      const code = parseInt(match[1], 10)
      const isLast = match[2] === ' '
      return { code, text: match[3].trim(), complete: isLast }
    }

    function sendLine(data: string): void {
      if (socket && !socket.destroyed) {
        socket.write(data + '\r\n')
      }
    }

    function sendCommand(cmd: string): Promise<SmtpResponse> {
      return new Promise<SmtpResponse>((cmdResolve) => {
        buffer = ''
        sendLine(cmd)
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString('utf-8')
          const resp = parseResponse()
          if (resp.complete) {
            socket?.off('data', onData)
            cmdResolve(resp)
          }
        }
        socket?.on('data', onData)
      })
    }

    function handleError(err: Error): void {
      cleanup()
      resolve({ ok: false, error: err.message })
    }

    // Step 1: Connect
    if (useSSL) {
      socket = tls.connect({ host, port, servername: host }, () => {
        runSequence()
      })
    } else {
      socket = net.connect({ host, port }, () => {
        runSequence()
      })
    }

    socket.on('error', handleError)

    async function runSequence(): Promise<void> {
      try {
        // Wait for server greeting
        buffer = ''
        const greeting = await new Promise<SmtpResponse>((gResolve) => {
          const onData = (chunk: Buffer) => {
            buffer += chunk.toString('utf-8')
            const resp = parseResponse()
            if (resp.complete) {
              socket?.off('data', onData)
              gResolve(resp)
            }
          }
          socket?.on('data', onData)
        })

        if (greeting.code !== 220) {
          cleanup()
          resolve({ ok: false, error: `SMTP greeting failed: ${greeting.code} ${greeting.text}` })
          return
        }

        // EHLO
        const hostname = 'sunstore.ru'
        const ehlo = await sendCommand(`EHLO ${hostname}`)
        if (ehlo.code !== 250) {
          // Fallback to HELO
          const helo = await sendCommand(`HELO ${hostname}`)
          if (helo.code !== 250) {
            cleanup()
            resolve({ ok: false, error: `HELO failed: ${helo.code} ${helo.text}` })
            return
          }
        }

        // STARTTLS if not already SSL and server supports it
        if (!useTls && buffer.toLowerCase().includes('starttls')) {
          const starttls = await sendCommand('STARTTLS')
          if (starttls.code === 220) {
            // Upgrade socket to TLS
            const tlsSocket = tls.connect({
              socket: socket!,
              servername: host,
            })
            socket.removeAllListeners()
            socket = tlsSocket

            await new Promise<void>((tlsResolve, tlsReject) => {
              tlsSocket.on('error', (err: Error) => {
                cleanup()
                resolve({ ok: false, error: `TLS upgrade failed: ${err.message}` })
              })
              tlsSocket.on('secureConnect', () => {
                tlsResolve()
              })
              // Some TLS connections emit 'connect' instead
              tlsSocket.on('connect', () => {
                tlsResolve()
              })
            })

            // Re-EHLO after TLS upgrade
            const ehlo2 = await sendCommand(`EHLO ${hostname}`)
            if (ehlo2.code !== 250) {
              cleanup()
              resolve({ ok: false, error: `EHLO after STARTTLS failed: ${ehlo2.code} ${ehlo2.text}` })
              return
            }
            useTls = true
          }
        }

        // AUTH LOGIN
        if (user && pass) {
          const auth = await sendCommand('AUTH LOGIN')
          if (auth.code === 334) {
            const userResp = await sendCommand(b64Encode(user))
            if (userResp.code === 334) {
              const passResp = await sendCommand(b64Encode(pass))
              if (passResp.code !== 235) {
                cleanup()
                resolve({ ok: false, error: `AUTH failed: ${passResp.code} ${passResp.text}` })
                return
              }
            } else {
              cleanup()
              resolve({ ok: false, error: `AUTH username rejected: ${userResp.code} ${userResp.text}` })
              return
            }
          } else {
            cleanup()
            resolve({ ok: false, error: `AUTH LOGIN not supported: ${auth.code} ${auth.text}` })
            return
          }
        }

        // MAIL FROM
        const mailFrom = await sendCommand(`MAIL FROM:<${fromEmail}>`)
        if (mailFrom.code !== 250) {
          cleanup()
          resolve({ ok: false, error: `MAIL FROM rejected: ${mailFrom.code} ${mailFrom.text}` })
          return
        }

        // RCPT TO for each recipient
        for (const addr of toAddresses) {
          const rcpt = await sendCommand(`RCPT TO:<${addr}>`)
          if (rcpt.code !== 250 && rcpt.code !== 251) {
            cleanup()
            resolve({ ok: false, error: `RCPT TO rejected for ${addr}: ${rcpt.code} ${rcpt.text}` })
            return
          }
        }

        // DATA
        const dataCmd = await sendCommand('DATA')
        if (dataCmd.code !== 354) {
          cleanup()
          resolve({ ok: false, error: `DATA rejected: ${dataCmd.code} ${dataCmd.text}` })
          return
        }

        // Send the message, ensuring line endings are CRLF
        const crlfMessage = message.replace(/\r?\n/g, '\r\n')
        socket?.write(crlfMessage + '\r\n.\r\n')

        // Wait for final DATA response
        const dataResp = await new Promise<SmtpResponse>((dResolve) => {
          const onData = (chunk: Buffer) => {
            buffer += chunk.toString('utf-8')
            const resp = parseResponse()
            if (resp.complete) {
              socket?.off('data', onData)
              dResolve(resp)
            }
          }
          socket?.on('data', onData)
        })

        if (dataResp.code !== 250) {
          cleanup()
          resolve({ ok: false, error: `Message rejected: ${dataResp.code} ${dataResp.text}` })
          return
        }

        // QUIT
        await sendCommand('QUIT')

        cleanup()
        resolve({ ok: true })
      } catch (err) {
        cleanup()
        resolve({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }
  })
}

/* ======================== Yandex API sender ======================== */

async function yandexApiSend(
  token: string,
  login: string,
  toAddresses: string[],
  subject: string,
  html: string,
  text?: string,
): Promise<EmailResult> {
  try {
    const payload: Record<string, unknown> = {
      from: login,
      to: Array.isArray(toAddresses) ? toAddresses.join(', ') : toAddresses,
      subject,
      body_html: html,
    }
    if (text) {
      payload.body_text = text
    }

    const response = await fetch('https://post.yandex.ru/letter/send', {
      method: 'POST',
      headers: {
        'Authorization': `OAuth ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Sunstore/1.0',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text()
      return { ok: false, error: `Yandex API error ${response.status}: ${body}` }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/* ======================== Public API ======================== */

/**
 * Send an email using the currently configured provider.
 * Routes to SMTP or Yandex API based on config.provider.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string,
): Promise<EmailResult> {
  if (!emailConfig.isActive || emailConfig.provider === 'none') {
    return { ok: false, error: 'Email not configured. Set up a provider in admin settings.' }
  }

  const recipients = Array.isArray(to) ? to : [to]
  if (recipients.length === 0) {
    return { ok: false, error: 'No recipients specified' }
  }

  const fromEmail = emailConfig.fromEmail || 'noreply@sunstore.ru'
  const fromName = emailConfig.fromName || 'Sunstore'

  if (emailConfig.provider === 'smtp') {
    if (!emailConfig.smtpHost || !emailConfig.smtpPort) {
      return { ok: false, error: 'SMTP host and port are required' }
    }

    const message = buildMimeMessage(fromEmail, fromName, recipients.join(', '), subject, html, text)

    return smtpSend(
      emailConfig.smtpHost,
      emailConfig.smtpPort,
      emailConfig.smtpSSL !== false, // default true
      emailConfig.smtpUser || '',
      emailConfig.smtpPass || '',
      fromEmail,
      recipients,
      message,
    )
  }

  if (emailConfig.provider === 'yandex-api') {
    if (!emailConfig.yandexToken || !emailConfig.yandexLogin) {
      return { ok: false, error: 'Yandex token and login are required' }
    }

    return yandexApiSend(
      emailConfig.yandexToken,
      emailConfig.yandexLogin,
      recipients,
      subject,
      html,
      text,
    )
  }

  return { ok: false, error: `Unknown provider: ${emailConfig.provider}` }
}

/**
 * Test the email connection by sending a test email to the configured fromEmail.
 */
export async function testConnection(): Promise<EmailResult> {
  if (!emailConfig.isActive || emailConfig.provider === 'none') {
    return { ok: false, error: 'Email not configured' }
  }

  const testTo = emailConfig.fromEmail || 'noreply@sunstore.ru'
  const testSubject = 'Sunstore - Проверка подключения'
  const testHtml = `
    <div style="background:#000;color:#f5f5f7;font-family:Arial,sans-serif;padding:40px;text-align:center;">
      <h1 style="color:#f59e0b;margin-bottom:16px;">Sunstore</h1>
      <p>Тестовое письмо успешно отправлено.</p>
      <p style="color:#a1a1aa;font-size:13px;">Настройка электронной почты работает корректно.</p>
      <p style="color:#71717a;font-size:12px;margin-top:24px;">${new Date().toISOString()}</p>
    </div>
  `
  const testText = `Sunstore - Тестовое письмо успешно отправлено.\nНастройка электронной почты работает корректно.\n${new Date().toISOString()}`

  return sendEmail(testTo, testSubject, testHtml, testText)
}
