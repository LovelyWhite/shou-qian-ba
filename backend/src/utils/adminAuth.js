const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const COOKIE_NAME = 'sqb_admin_auth'
const USERS_FILE =
  process.env.ADMIN_USERS_FILE ||
  path.join(__dirname, '..', '..', 'admin-users.json')

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

function readUsersFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) return []
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((u) => ({
        username: u && u.username ? String(u.username).trim() : '',
        password: u && u.password != null ? String(u.password) : '',
        disabled: Boolean(u && u.disabled),
      }))
      .filter((u) => u.username && !u.disabled)
  } catch (e) {
    return []
  }
}

function getUser(username) {
  const name = String(username || '').trim()
  if (!name) return null
  const users = readUsersFile()
  return users.find((u) => u.username === name) || null
}

function calcUserVersion(user) {
  return crypto
    .createHash('sha256')
    .update(`pw:${user && user.password ? user.password : ''}`)
    .digest('hex')
    .slice(0, 16)
}

function verifyPassword(inputPassword, storedPassword) {
  const stored = String(storedPassword || '')
  const input = String(inputPassword || '')
  return timingSafeEqualString(input, stored)
}

function authenticate(username, password) {
  const user = getUser(username)
  if (!user) return null
  if (!verifyPassword(password, user.password)) return null
  return { username: user.username, version: calcUserVersion(user) }
}

function issueToken(username, version) {
  const payload = `${username}:${version}:${Date.now()}`
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

  const parts = payload.split(':')
  if (parts.length !== 3) return false
  const username = parts[0]
  const version = parts[1]
  const ts = Number(parts[2])
  if (!username || !version) return false
  if (!Number.isFinite(ts) || ts <= 0) return false
  if (Date.now() - ts > MAX_AGE_MS) return false

  const user = getUser(username)
  if (!user) return false
  const expectedVersion = calcUserVersion(user)
  if (!timingSafeEqualString(version, expectedVersion)) return false

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

function setAuthCookie(res, secure, auth) {
  const username = auth && auth.username ? String(auth.username) : ''
  const version = auth && auth.version ? String(auth.version) : ''
  if (!username || !version) {
    throw new Error('Invalid auth')
  }
  const token = issueToken(username, version)
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
  COOKIE_NAME,
  clearAuthCookie,
  authenticate,
  isAuthed,
  safeNextUrl,
  setAuthCookie,
}
