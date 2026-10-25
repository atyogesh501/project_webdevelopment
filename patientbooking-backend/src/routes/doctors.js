import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { collections, defaultWorkingHours } from '../db.js'
import { hashPassword, requireUser } from '../auth.js'
import { HttpError, toObjectId } from '../http.js'
import { availableSlots, listDoctors, toDoctor } from '../queries.js'
import { toMinutes } from '../slots.js'

const router = Router()

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  specialty: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1000).default(''),
  serviceIds: z.array(z.string()).max(50).default([]),
})

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  specialty: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(1000).optional(),
  serviceIds: z.array(z.string()).max(50).optional(),
  active: z.boolean().optional(),
})

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format')

const selfUpdateSchema = z.object({
  bio: z.string().trim().max(1000).optional(),
  workingHours: z
    .array(z.object({ day: z.number().int().min(0).max(6), enabled: z.boolean(), start: time, end: time }))
    .length(7)
    .refine((days) => new Set(days.map((d) => d.day)).size === 7, 'Each weekday must appear once')
    .refine((days) => days.every((d) => !d.enabled || toMinutes(d.start) < toMinutes(d.end)), 'End time must be after start time')
    .optional(),
})

async function validateServiceIds(ids) {
  const serviceIds = ids.map((id) => toObjectId(id, 'serviceId'))
  const { services } = await collections()
  if ((await services.countDocuments({ _id: { $in: serviceIds } })) !== serviceIds.length) {
    throw new HttpError(400, 'One or more services do not exist.')
  }
  return serviceIds
}

async function currentDoctor(req) {
  const { doctors } = await collections()
  const doctor = await doctors.findOne({ userId: new ObjectId(req.user.id) })
  if (!doctor) throw new HttpError(404, 'Doctor profile not found.')
  return doctor
}

router.get('/', async (req, res) => {
  const filter = {}
  if (!(req.query.all === '1' && req.user?.role === 'admin')) filter.active = true
  if (req.query.serviceId) filter.serviceIds = toObjectId(req.query.serviceId, 'serviceId')
  res.json({ doctors: await listDoctors(filter) })
})

router.post('/', requireUser(['admin']), async (req, res) => {
  const input = createSchema.parse(req.body)
  const { users, doctors } = await collections()
  if (await users.findOne({ email: input.email })) {
    throw new HttpError(409, 'An account with this email already exists.')
  }
  const serviceIds = await validateServiceIds(input.serviceIds)

  const now = new Date()
  const user = await users.insertOne({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: 'doctor',
    createdAt: now,
  })
  const doc = {
    userId: user.insertedId,
    specialty: input.specialty,
    bio: input.bio,
    serviceIds,
    workingHours: defaultWorkingHours(),
    active: true,
    createdAt: now,
  }
  const result = await doctors.insertOne(doc)
  res.status(201).json({ doctor: toDoctor({ ...doc, _id: result.insertedId }, { name: input.name, email: input.email }) })
})

// "/me" must be registered before "/:id" so it is not treated as an id.
router.get('/me', requireUser(['doctor']), async (req, res) => {
  const doctor = await currentDoctor(req)
  const [result] = await listDoctors({ _id: doctor._id })
  res.json({ doctor: result })
})

router.patch('/me', requireUser(['doctor']), async (req, res) => {
  const doctor = await currentDoctor(req)
  const input = selfUpdateSchema.parse(req.body)
  const { doctors } = await collections()
  const update = {}
  if (input.bio !== undefined) update.bio = input.bio
  if (input.workingHours) update.workingHours = [...input.workingHours].sort((a, b) => a.day - b.day)
  if (Object.keys(update).length) await doctors.updateOne({ _id: doctor._id }, { $set: update })
  const [result] = await listDoctors({ _id: doctor._id })
  res.json({ doctor: result })
})

router.get('/:id/slots', async (req, res) => {
  const id = toObjectId(req.params.id)
  const date = typeof req.query.date === 'string' ? req.query.date : ''
  const serviceId = toObjectId(req.query.serviceId ?? '', 'serviceId')
  const exclude = req.query.exclude

  const { doctors, services } = await collections()
  const [doctor, service] = await Promise.all([
    doctors.findOne({ _id: id, active: true }),
    services.findOne({ _id: serviceId }),
  ])
  if (!doctor) throw new HttpError(404, 'Doctor not found.')
  if (!service) throw new HttpError(404, 'Service not found.')

  const slots = await availableSlots(doctor, date, service.durationMinutes, exclude ? toObjectId(exclude) : undefined)
  res.json({ slots })
})

router.patch('/:id', requireUser(['admin']), async (req, res) => {
  const id = toObjectId(req.params.id)
  const input = updateSchema.parse(req.body)
  const { doctors, users } = await collections()

  const doctor = await doctors.findOne({ _id: id })
  if (!doctor) throw new HttpError(404, 'Doctor not found.')

  const update = {}
  if (input.specialty !== undefined) update.specialty = input.specialty
  if (input.bio !== undefined) update.bio = input.bio
  if (input.active !== undefined) update.active = input.active
  if (input.serviceIds) update.serviceIds = await validateServiceIds(input.serviceIds)

  if (Object.keys(update).length) await doctors.updateOne({ _id: id }, { $set: update })
  if (input.name) await users.updateOne({ _id: doctor.userId }, { $set: { name: input.name } })

  const [result] = await listDoctors({ _id: id })
  res.json({ doctor: result })
})

router.delete('/:id', requireUser(['admin']), async (req, res) => {
  const id = toObjectId(req.params.id)
  const { doctors, users, sessions, appointments } = await collections()
  const doctor = await doctors.findOne({ _id: id })
  if (!doctor) throw new HttpError(404, 'Doctor not found.')

  await appointments.updateMany(
    { doctorId: id, active: true, start: { $gt: new Date() } },
    { $set: { status: 'cancelled', active: false, updatedAt: new Date() } },
  )
  await Promise.all([
    doctors.deleteOne({ _id: id }),
    users.deleteOne({ _id: doctor.userId }),
    sessions.deleteMany({ userId: doctor.userId }),
  ])
  res.json({ ok: true })
})

export default router
