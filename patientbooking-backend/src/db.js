import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

let clientPromise
let setupPromise

export function defaultWorkingHours() {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    enabled: day >= 1 && day <= 5,
    start: '09:00',
    end: '17:00',
  }))
}

export async function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect().catch((error) => {
      clientPromise = undefined
      throw error
    })
  }
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'smart_clinic')
  if (!setupPromise) {
    setupPromise = setupDatabase(db).catch((error) => {
      setupPromise = undefined
      throw error
    })
  }
  await setupPromise
  return db
}

export async function collections() {
  const db = await getDb()
  return {
    users: db.collection('users'),
    sessions: db.collection('sessions'),
    services: db.collection('services'),
    doctors: db.collection('doctors'),
    appointments: db.collection('appointments'),
  }
}

async function setupDatabase(db) {
  const users = db.collection('users')
  const sessions = db.collection('sessions')
  const doctors = db.collection('doctors')
  const appointments = db.collection('appointments')
  const services = db.collection('services')

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    users.createIndex(
      { firebaseUid: 1 },
      { unique: true, partialFilterExpression: { firebaseUid: { $type: 'string' } } },
    ),
    sessions.createIndex({ tokenHash: 1 }, { unique: true }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    doctors.createIndex({ userId: 1 }, { unique: true }),
    appointments.createIndex({ doctorId: 1, start: 1 }, { unique: true, partialFilterExpression: { active: true } }),
    appointments.createIndex({ patientId: 1, start: -1 }),
  ])

  if ((await users.estimatedDocumentCount()) === 0) {
    await seed(users, services, doctors)
  }
}

async function seed(users, services, doctors) {
  const now = new Date()
  const hash = (p) => bcrypt.hash(p, 10)

  const serviceSeed = [
    { name: 'General Consultation', description: 'Routine check-ups, minor illnesses and health advice.', durationMinutes: 30, price: 50 },
    { name: 'Cardiology Consult', description: 'Heart health assessment, ECG review and blood pressure management.', durationMinutes: 60, price: 150 },
    { name: 'Dermatology Review', description: 'Skin, hair and nail concerns including acne and mole checks.', durationMinutes: 30, price: 80 },
    { name: 'Pediatric Check-up', description: 'Growth monitoring, vaccinations and child wellness visits.', durationMinutes: 30, price: 60 },
  ]
  const serviceResult = await services.insertMany(serviceSeed.map((s) => ({ ...s, createdAt: now })))
  const [general, cardio, derm, peds] = Object.values(serviceResult.insertedIds)

  const doctorPassword = await hash('doctor123')
  const doctorSeed = [
    { name: 'Dr. Maya Chen', email: 'doctor@clinic.dev', specialty: 'General Practice', bio: 'Family physician with 12 years of experience in preventive care.', serviceIds: [general, peds] },
    { name: 'Dr. Samuel Okafor', email: 'okafor@clinic.dev', specialty: 'Cardiology', bio: 'Consultant cardiologist focused on hypertension and heart rhythm.', serviceIds: [cardio, general] },
    { name: 'Dr. Priya Nair', email: 'nair@clinic.dev', specialty: 'Dermatology', bio: 'Board-certified dermatologist specialising in medical dermatology.', serviceIds: [derm] },
  ]

  for (const d of doctorSeed) {
    const user = await users.insertOne({
      name: d.name,
      email: d.email,
      passwordHash: doctorPassword,
      role: 'doctor',
      createdAt: now,
    })
    await doctors.insertOne({
      userId: user.insertedId,
      specialty: d.specialty,
      bio: d.bio,
      serviceIds: d.serviceIds,
      workingHours: defaultWorkingHours(),
      active: true,
      createdAt: now,
    })
  }

  await users.insertOne({
    name: 'Clinic Admin',
    email: 'admin@clinic.dev',
    passwordHash: await hash('admin123'),
    role: 'admin',
    createdAt: now,
  })
}
