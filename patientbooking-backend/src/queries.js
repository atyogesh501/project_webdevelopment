import { collections } from './db.js'
import { dayBounds, generateSlots } from './slots.js'

export function toService(doc) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
    durationMinutes: doc.durationMinutes,
    price: doc.price,
  }
}

export function toDoctor(doc, user) {
  return {
    id: doc._id.toHexString(),
    userId: doc.userId.toHexString(),
    name: user?.name ?? 'Unknown doctor',
    email: user?.email ?? '',
    specialty: doc.specialty,
    bio: doc.bio,
    serviceIds: doc.serviceIds.map((id) => id.toHexString()),
    workingHours: doc.workingHours,
    active: doc.active,
  }
}

export async function listServices() {
  const { services } = await collections()
  const docs = await services.find().sort({ name: 1 }).toArray()
  return docs.map(toService)
}

export async function listDoctors(filter = {}) {
  const { doctors, users } = await collections()
  const docs = await doctors.find(filter).sort({ createdAt: 1 }).toArray()
  const people = await users
    .find({ _id: { $in: docs.map((d) => d.userId) } }, { projection: { name: 1, email: 1 } })
    .toArray()
  const byId = new Map(people.map((u) => [u._id.toHexString(), u]))
  return docs.map((d) => toDoctor(d, byId.get(d.userId.toHexString()) ?? null))
}

export async function listAppointments(filter) {
  const { appointments, users, doctors, services } = await collections()
  const docs = await appointments.find(filter).sort({ start: -1 }).limit(500).toArray()

  const doctorDocs = await doctors.find({ _id: { $in: docs.map((d) => d.doctorId) } }).toArray()
  const userIds = [...docs.map((d) => d.patientId), ...doctorDocs.map((d) => d.userId)]
  const [userDocs, serviceDocs] = await Promise.all([
    users.find({ _id: { $in: userIds } }, { projection: { name: 1, email: 1 } }).toArray(),
    services.find({ _id: { $in: docs.map((d) => d.serviceId) } }).toArray(),
  ])

  const userMap = new Map(userDocs.map((u) => [u._id.toHexString(), u]))
  const doctorMap = new Map(doctorDocs.map((d) => [d._id.toHexString(), d]))
  const serviceMap = new Map(serviceDocs.map((s) => [s._id.toHexString(), s]))

  return docs.map((a) => {
    const patient = userMap.get(a.patientId.toHexString())
    const doctor = doctorMap.get(a.doctorId.toHexString())
    const doctorUser = doctor ? userMap.get(doctor.userId.toHexString()) : undefined
    const service = serviceMap.get(a.serviceId.toHexString())
    return {
      id: a._id.toHexString(),
      patient: { id: a.patientId.toHexString(), name: patient?.name ?? 'Deleted patient', email: patient?.email ?? '' },
      doctor: { id: a.doctorId.toHexString(), name: doctorUser?.name ?? 'Former doctor', specialty: doctor?.specialty ?? '' },
      service: {
        id: a.serviceId.toHexString(),
        name: service?.name ?? 'Removed service',
        durationMinutes: service?.durationMinutes ?? Math.round((a.end - a.start) / 60_000),
        price: service?.price ?? 0,
      },
      start: a.start.toISOString(),
      end: a.end.toISOString(),
      status: a.status,
      reason: a.reason,
      notes: a.notes,
      feedback: a.feedback
        ? { rating: a.feedback.rating, comment: a.feedback.comment, createdAt: a.feedback.createdAt.toISOString() }
        : null,
      createdAt: a.createdAt.toISOString(),
    }
  })
}

export async function availableSlots(doctor, date, durationMinutes, excludeAppointmentId) {
  const bounds = dayBounds(date)
  if (!bounds) return []
  const { appointments } = await collections()
  const busy = await appointments
    .find(
      {
        doctorId: doctor._id,
        active: true,
        start: { $lt: bounds.end },
        end: { $gt: bounds.start },
        ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
      },
      { projection: { start: 1, end: 1 } },
    )
    .toArray()
  return generateSlots(doctor.workingHours, date, durationMinutes, busy)
}
