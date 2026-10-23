/**
 * Appointment times are stored as UTC instants that represent clinic wall-clock time,
 * so a 09:00 slot is always saved as T09:00:00Z and displayed with timeZone 'UTC'.
 */
export const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function dayBounds(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const start = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime())) return null
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
}

export function generateSlots(workingHours, date, durationMinutes, busy, now = new Date()) {
  const bounds = dayBounds(date)
  if (!bounds) return []
  const workday = workingHours.find((w) => w.day === bounds.start.getUTCDay())
  if (!workday?.enabled) return []

  const slots = []
  const open = toMinutes(workday.start)
  const close = toMinutes(workday.end)
  for (let minute = open; minute + durationMinutes <= close; minute += durationMinutes) {
    const start = new Date(bounds.start.getTime() + minute * 60_000)
    const end = new Date(start.getTime() + durationMinutes * 60_000)
    if (start <= now) continue
    if (busy.some((b) => b.start < end && b.end > start)) continue
    slots.push(start.toISOString())
  }
  return slots
}
