import { Router } from 'express'
import { z } from 'zod'
import { collections } from '../db.js'
import { createSession, destroySession, toSessionUser, verifyPassword } from '../auth.js'
import { verifyGoogleIdToken } from '../firebase.js'
import { HttpError } from '../http.js'

const router = Router()

const staffLoginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
})

const googleSchema = z.object({ idToken: z.string().min(1).max(5000) })

router.get('/me', (req, res) => {
  res.json({ user: req.user })
})

// Clinic staff (doctors and admins) sign in with email and password.
router.post('/login', async (req, res) => {
  const input = staffLoginSchema.parse(req.body)
  const { users } = await collections()
  const user = await users.findOne({ email: input.email })
  if (user?.role === 'patient') {
    throw new HttpError(400, 'Patients sign in with Google. Use the "Continue with Google" button.')
  }
  if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password.')
  }
  await createSession(res, user._id)
  res.json({ user: toSessionUser(user) })
})

// Patients sign in with Google via Firebase. The client sends the Firebase ID token,
// which we verify before creating (or linking) the patient record and a session cookie.
router.post('/google', async (req, res) => {
  const { idToken } = googleSchema.parse(req.body)
  const decoded = await verifyGoogleIdToken(idToken)
  const email = decoded.email.toLowerCase()
  const name = (decoded.name ?? email.split('@')[0]).slice(0, 80)
  const photoURL = decoded.picture ?? null
  const { users } = await collections()

  let user = await users.findOne({ $or: [{ firebaseUid: decoded.uid }, { email }] })
  if (user && user.role !== 'patient') {
    throw new HttpError(403, 'This email belongs to a clinic staff account. Please use the staff sign-in form.')
  }

  const now = new Date()
  if (user) {
    await users.updateOne({ _id: user._id }, { $set: { firebaseUid: decoded.uid, photoURL, lastLoginAt: now } })
    user = { ...user, firebaseUid: decoded.uid, photoURL }
  } else {
    const doc = { name, email, firebaseUid: decoded.uid, photoURL, role: 'patient', createdAt: now, lastLoginAt: now }
    const result = await users.insertOne(doc)
    user = { ...doc, _id: result.insertedId }
  }

  await createSession(res, user._id)
  res.status(200).json({ user: toSessionUser(user) })
})

router.post('/logout', async (req, res) => {
  await destroySession(req, res)
  res.json({ ok: true })
})

export default router
