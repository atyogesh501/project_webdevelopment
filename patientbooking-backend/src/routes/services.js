import { Router } from 'express'
import { z } from 'zod'
import { collections } from '../db.js'
import { requireUser } from '../auth.js'
import { HttpError, toObjectId } from '../http.js'
import { listServices, toService } from '../queries.js'

const router = Router()

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(''),
  durationMinutes: z.number().int().min(10).max(240),
  price: z.number().min(0).max(100000),
})

router.get('/', async (_req, res) => {
  res.json({ services: await listServices() })
})

router.post('/', requireUser(['admin']), async (req, res) => {
  const input = serviceSchema.parse(req.body)
  const { services } = await collections()
  const doc = { ...input, createdAt: new Date() }
  const result = await services.insertOne(doc)
  res.status(201).json({ service: toService({ ...doc, _id: result.insertedId }) })
})

router.patch('/:id', requireUser(['admin']), async (req, res) => {
  const id = toObjectId(req.params.id)
  const input = serviceSchema.partial().parse(req.body)
  const { services } = await collections()
  const updated = await services.findOneAndUpdate({ _id: id }, { $set: input }, { returnDocument: 'after' })
  if (!updated) throw new HttpError(404, 'Service not found.')
  res.json({ service: toService(updated) })
})

router.delete('/:id', requireUser(['admin']), async (req, res) => {
  const id = toObjectId(req.params.id)
  const { services, doctors } = await collections()
  const result = await services.deleteOne({ _id: id })
  if (result.deletedCount === 0) throw new HttpError(404, 'Service not found.')
  await doctors.updateMany({ serviceIds: id }, { $pull: { serviceIds: id } })
  res.json({ ok: true })
})

export default router
