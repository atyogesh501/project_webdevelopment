import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { collections } from './db.js'
import { HttpError } from './http.js'

export const SESSION_COOKIE = 'clinic_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

export const hashPassword = (password) => bcrypt.hash(password, 10)
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash)

// SameSite=None lets the cookie work when the client and API live on different origins
// (and inside the v0 preview iframe). It requires Secure, which browsers allow on localhost.
const cookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: process.env.COOKIE_SAMESITE ?? 'none',
  path: '/',
})

export const toSessionUser = (user) => ({
  id: user._id.toHexString(),
  name: user.name,
  email: user.email,
  role: user.role,
  photoURL: user.photoURL ?? null,
})

export async function createSession(res, userId) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const { sessions } = await collections()
  await sessions.insertOne({ tokenHash: sha256(token), userId, expiresAt, createdAt: new Date() })
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), expires: expiresAt })
}

export async function destroySession(req, res) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) {
    const { sessions } = await collections()
    await sessions.deleteOne({ tokenHash: sha256(token) })
  }
  res.clearCookie(SESSION_COOKIE, cookieOptions())
}

export async function loadUser(req, _res, next) {
  req.user = null
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) return next()

  const { sessions, users } = await collections()
  const session = await sessions.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } })
  if (!session) return next()

  const user = await users.findOne({ _id: session.userId })
  if (user) req.user = toSessionUser(user)
  next()
}

export function requireUser(roles) {
  return (req, _res, next) => {
    if (!req.user) throw new HttpError(401, 'Please sign in to continue.')
    if (roles && !roles.includes(req.user.role)) throw new HttpError(403, 'You do not have access to this action.')
    next()
  }
}
