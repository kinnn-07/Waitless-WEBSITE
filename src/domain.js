export const MAX_ACTIVE_TOKENS = 30
export const ACTIVE_STATUSES = ['waiting', 'called', 'serving']

export function estimateWait(peopleAhead, completedDurations, fallbackMinutes) {
  const ahead = Math.max(0, Number(peopleAhead) || 0)
  const recent = (completedDurations || []).slice(-20).map(Number).filter((n) => Number.isFinite(n) && n > 0)
  const average = recent.length
    ? recent.reduce((sum, duration) => sum + duration, 0) / recent.length
    : Math.max(1, Number(fallbackMinutes) || 1)
  const minutes = ahead * average
  if (minutes === 0) return { min: 0, max: 0 }
  const rounded = Math.round(minutes / 5) * 5
  const center = Math.max(5, rounded || 5)
  return { min: Math.max(0, center - 5), max: center + 5 }
}

export function formatWaitRange(range) {
  if (range.max === 0) return 'You’re next'
  return `${range.min}–${range.max} min`
}

export function formatTokenNumber(prefix, sequence) {
  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

export function getAvailableSlots(business, serviceId, date, appointments = []) {
  const service = business?.services?.find((item) => item.id === serviceId)
  const day = new Date(`${date}T00:00:00`)
  if (!service || Number.isNaN(day.getTime())) return []
  const today = new Date()
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  if (date < todayString) return []
  const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day.getDay()]
  const hours = business.hours?.[weekday]
  if (!hours?.open || !hours.start || !hours.end) return []

  const [startHour, startMinute] = hours.start.split(':').map(Number)
  const [endHour, endMinute] = hours.end.split(':').map(Number)
  const start = startHour * 60 + startMinute
  const end = endHour * 60 + endMinute
  const duration = Math.max(5, Number(service.duration) || 15)
  const selectedIsToday = date === todayString
  const currentMinute = today.getHours() * 60 + today.getMinutes()
  const booked = appointments
    .filter((appointment) => appointment.date === date && appointment.status !== 'cancelled')
    .map((appointment) => {
      const [hour, minute] = appointment.time.split(':').map(Number)
      const appointmentStart = hour * 60 + minute
      const appointmentDuration = business.services.find((item) => item.id === appointment.serviceId)?.duration || 30
      return { start: appointmentStart, end: appointmentStart + appointmentDuration }
    })

  const slots = []
  for (let minute = start; minute + duration <= end; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
    if (selectedIsToday && minute <= currentMinute) continue
    if (!booked.some((appointment) => minute < appointment.end && minute + duration > appointment.start)) slots.push(time)
  }
  return slots
}
