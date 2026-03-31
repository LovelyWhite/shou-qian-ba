const crypto = require('crypto')

const COOKIE_NAME = 'sqb_admin_auth'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin1234'

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const SECRET = process.env.ADMIN_AUTH_SECRET || process.env.COOKIE_SECRET || 'shou-qian-ba-dev'

function base64UrlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function parseCookies(cookieHeader) {
  const result = {}
  if (!cookieHeader) return result

  const parts = String(cookieHeader).split(';')
  for (const part of parts) {
    const idx = part.indexOf('=')
    if (idx < 0) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (!key) continue
    try {
      result[key] = decodeURIComponent(value)
    } catch (e) {
      result[key] = value
    }
  }
  return result
}

function hmacSha256Base64Url(value, secret) {
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(value).digest())
}

function timingSafeEqualString(a, b) {
  const bufA = Buffer.from(String(a || ''))
  const bufB = Buffer.from(String(b || ''))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function issueToken() {
  const payload = `${ADMIN_USERNAME}:${Date.now()}`
  const sig = hmacSha256Base64Url(payload, SECRET)
  return `${payload}.${sig}`
}

function verifyToken(token) {
  if (!token) return false
  const raw = String(token)
  const idx = raw.lastIndexOf('.')
  if (idx < 0) return false

  const payload = raw.slice(0, idx)
  const sig = raw.slice(idx + 1)
  const expected = hmacSha256Base64Url(payload, SECRET)
  if (!timingSafeEqualString(sig, expected)) return false

  const [username, tsText] = payload.split(':')
  if (username !== ADMIN_USERNAME) return false
  const ts = Number(tsText)
  if (!Number.isFinite(ts) || ts <= 0) return false
  if (Date.now() - ts > MAX_AGE_MS) return false

  return true
}

function isAuthed(req) {
  const cookies = parseCookies(req && req.headers ? req.headers.cookie : '')
  return verifyToken(cookies[COOKIE_NAME])
}

function setCookieHeader(res, cookie) {
  const existing = res.getHeader('Set-Cookie')
  if (!existing) {
    res.setHeader('Set-Cookie', cookie)
    return
  }
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie])
    return
  }
  res.setHeader('Set-Cookie', [String(existing), cookie])
}

function setAuthCookie(res, secure) {
  const token = issueToken()
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`,
  ]
  if (secure) parts.push('Secure')
  setCookieHeader(res, parts.join('; '))
}

function clearAuthCookie(res, secure) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (secure) parts.push('Secure')
  setCookieHeader(res, parts.join('; '))
}

function safeNextUrl(rawNext) {
  const next = typeof rawNext === 'string' ? rawNext : ''
  if (!next.startsWith('/admin')) return '/admin/applications'
  if (next.startsWith('/admin/login')) return '/admin/applications'
  return next
}

module.exports = {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  COOKIE_NAME,
  clearAuthCookie,
  isAuthed,
  safeNextUrl,
  setAuthCookie,
}
