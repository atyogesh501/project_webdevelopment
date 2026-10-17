import { ObjectId } from 'mongodb'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function toObjectId(id, label = 'id') {
  if (typeof id !== 'string' || !ObjectId.isValid(id)) throw new HttpError(400, `Invalid ${label}.`)
  return new ObjectId(id)
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found.' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message })
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0]
    const field = issue?.path.join('.')
    return res.status(400).json({ error: field ? `${field}: ${issue.message}` : (issue?.message ?? 'Invalid input.') })
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' })
  }
  if (error?.code === 11000) {
    return res.status(409).json({ error: 'That record already exists or the slot is taken.' })
  }
  console.error('[api] Unhandled error', error)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}
