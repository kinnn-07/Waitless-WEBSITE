import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('demo appointment booking', () => {
  let demoService

  beforeEach(async () => {
    const data = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (key) => data.get(key) || null,
      setItem: (key, value) => data.set(key, value),
    })
    vi.resetModules()
    ;({ demoService } = await import('./demoService'))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a second booking for the same service slot', async () => {
    const business = demoService.getBusiness('city-college')
    const date = new Date()
    date.setDate(date.getDate() + 1)
    while (date.getDay() === 0) date.setDate(date.getDate() + 1)
    const slotDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    const appointments = demoService.getSnapshot().appointments
    const { getAvailableSlots } = await import('./domain')
    const time = getAvailableSlots(business, business.services[0].id, slotDate, appointments)[0]
    const details = {
      name: 'Demo Guest',
      phone: '9876501234',
      serviceId: business.services[0].id,
      date: slotDate,
      time,
    }

    demoService.bookAppointment(business.id, details)
    expect(() => demoService.bookAppointment(business.id, details)).toThrow('That slot is no longer available.')
  })
})
