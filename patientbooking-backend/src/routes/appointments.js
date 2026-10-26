import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { collections } from '../db.js'
import { requireUser } from '../auth.js'
import { HttpError, toObjectId } from '../http.js'
import { availableSlots, listAppointments } from '../queries.js'

const router = Router()

const STATUSES = ['pending', 'approved', 'cancelled', 'completed']

const createSchema = z.object({
  doctorId: z.string(),
  serviceId: z.string(),
  start: z.iso.datetime(),
  reason: z.string().trim().max(1000).default(''),
})

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('reschedule'), start: z.iso.datetime() }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('notes'), notes: z.string().max(5000) }),
  z.object({
    action: z.literal('feedback'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).default(''),
  }),
  z.object({ action: z.literal('status'), status: z.enum(STATUSES) }),
])

router.get('/', requireUser(), async (req, res) => {
  const { doctors } = await collections()
  const filter = {}

  if (req.user.role === 'patient') filter.patientId = new ObjectId(req.user.id)
  if (req.user.role === 'doctor') {
    const doctor = await doctors.findOne({ userId: new ObjectId(req.user.id) })
    if (!doctor) return res.json({ appointments: [] })
    filter.doctorId = doctor._id
  }

  const { status } = req.query
  if (typeof status === 'string' && STATUSES.includes(status)) filter.status = status

  res.json({ appointments: await listAppointments(filter) })
})

router.post('/', requireUser(['patient']), async (req, res) => {
  const input = createSchema.parse(req.body)
  const doctorId = toObjectId(input.doctorId, 'doctorId')
  const serviceId = toObjectId(input.serviceId, 'serviceId')

  const { doctors, services, appointments } = await collections()
  const [doctor, service] = await Promise.all([
    doctors.findOne({ _id: doctorId, active: true }),
    services.findOne({ _id: serviceId }),
  ])
  if (!doctor) throw new HttpError(404, 'Doctor not found.')
  if (!service) throw new HttpError(404, 'Service not found.')
  if (!doctor.serviceIds.some((id) => id.equals(serviceId))) {
    throw new HttpError(400, 'This doctor does not offer the selected service.')
  }

  const start = new Date(input.start)
  const slots = await availableSlots(doctor, start.toISOString().slice(0, 10), service.durationMinutes)
  if (!slots.includes(start.toISOString())) throw new HttpError(409, 'That time slot is no longer available.')

  const now = new Date()
  const result = await appointments.insertOne({
    patientId: new ObjectId(req.user.id),
    doctorId,
    serviceId,
    start,
    end: new Date(start.getTime() + service.durationMinutes * 60_000),
    status: 'pending',
    active: true,
    reason: input.reason,
    notes: '',
    feedback: null,
    createdAt: now,
    updatedAt: now,
  })
  const [appointment] = await listAppointments({ _id: result.insertedId })
  res.status(201).json({ appointment })
})

router.patch('/:id', requireUser(), async (req, res) => {
  const id = toObjectId(req.params.id)
  const input = actionSchema.parse(req.body)
  const { appointments, doctors, services } = await collections()

  const appt = await appointments.findOne({ _id: id })
  if (!appt) throw new HttpError(404, 'Appointment not found.')

  const userId = new ObjectId(req.user.id)
  const isAdmin = req.user.role === 'admin'
  const isPatient = req.user.role === 'patient' && appt.patientId.equals(userId)
  const doctor = await doctors.findOne({ _id: appt.doctorId })
  const isDoctor = req.user.role === 'doctor' && !!doctor && doctor.userId.equals(userId)
  if (!isAdmin && !isPatient && !isDoctor) throw new HttpError(403, 'You do not have access to this appointment.')

  const now = new Date()
  let guard = {}
  let update = {}

  switch (input.action) {
    case 'reschedule': {
      if (!isPatient && !isAdmin) throw new HttpError(403, 'Only the patient can reschedule.')
      if (!doctor?.active) throw new HttpError(400, 'This doctor is no longer accepting bookings.')
      const service = await services.findOne({ _id: appt.serviceId })
      if (!service) throw new HttpError(400, 'The service for this appointment no longer exists.')
      const start = new Date(input.start)
      const slots = await availableSlots(doctor, start.toISOString().slice(0, 10), service.durationMinutes, appt._id)
      if (!slots.includes(start.toISOString())) throw new HttpError(409, 'That time slot is not available.')
      guard = { status: { $in: ['pending', 'approved'] } }
      update = { start, end: new Date(start.getTime() + service.durationMinutes * 60_000), status: 'pending' }
      break
    }
    case 'cancel':
      guard = { status: { $in: ['pending', 'approved'] } }
      update = { status: 'cancelled', active: false }
      break
    case 'approve':
      if (!isDoctor && !isAdmin) throw new HttpError(403, 'Only the clinician can approve.')
      guard = { status: 'pending' }
      update = { status: 'approved' }
      break
    case 'complete':
      if (!isDoctor && !isAdmin) throw new HttpError(403, 'Only the clinician can complete a session.')
      guard = { status: 'approved' }
      update = { status: 'completed' }
      break
    case 'notes':
      if (!isDoctor) throw new HttpError(403, 'Only the assigned clinician can write notes.')
      guard = { status: { $ne: 'cancelled' } }
      update = { notes: input.notes }
      break
    case 'feedback':
      if (!isPatient) throw new HttpError(403, 'Only the patient can leave feedback.')
      guard = { status: 'completed' }
      update = { feedback: { rating: input.rating, comment: input.comment, createdAt: now } }
      break
    case 'status':
      if (!isAdmin) throw new HttpError(403, 'Only admins can override status.')
      update = { status: input.status, active: input.status !== 'cancelled' }
      break
  }

  const result = await appointments.updateOne({ _id: id, ...guard }, { $set: { ...update, updatedAt: now } })
  if (result.matchedCount === 0) {
    throw new HttpError(409, `This action is not allowed while the appointment is ${appt.status}.`)
  }

  const [appointment] = await listAppointments({ _id: id })
  res.json({ appointment })
})

router.delete('/:id', requireUser(['admin']), async (req, res) => {
  const id = toObjectId(req.params.id)
  const { appointments } = await collections()
  const result = await appointments.deleteOne({ _id: id })
  if (result.deletedCount === 0) throw new HttpError(404, 'Appointment not found.')
  res.json({ ok: true })
})

export default router
