import { describe, expect, it } from 'vitest'
import { estimateWait, formatTokenNumber, getAvailableSlots } from './domain'

describe('estimateWait', () => {
  it('uses the average of up to the latest 20 completed services', () => {
    const durations = Array.from({ length: 22 }, (_, index) => index + 1)
    expect(estimateWait(2, durations, 99)).toEqual({ min: 20, max: 30 })
  })

  it('uses the service duration when there is no completed history', () => {
    expect(estimateWait(3, [], 12)).toEqual({ min: 30, max: 40 })
  })

  it('returns a zero wait when nobody is ahead', () => {
    expect(estimateWait(0, [], 12)).toEqual({ min: 0, max: 0 })
  })
})

describe('available appointment slots', () => {
  const business = {
    services: [{ id: 'consult', duration: 30 }, { id: 'follow-up', duration: 15 }],
    hours: { mon: { open: true, start: '09:00', end: '11:00' }, sun: { open: false, start: '09:00', end: '11:00' } },
  }
  it('rejects closed hours and booked slots', () => {
    expect(getAvailableSlots(business, 'consult', '2026-11-08')).toEqual([])
    expect(getAvailableSlots(business, 'consult', '2026-11-09', [
      { serviceId: 'consult', date: '2026-11-09', time: '09:00', status: 'booked' },
    ])).toEqual(['09:30', '10:00', '10:30'])
  })

  it('does not double-book the same time across services', () => {
    expect(getAvailableSlots(business, 'consult', '2026-11-09', [
      { serviceId: 'follow-up', date: '2026-11-09', time: '09:00', status: 'booked' },
    ])).toEqual(['09:30', '10:00', '10:30'])
  })

  it('rejects dates in the past', () => {
    expect(getAvailableSlots(business, 'consult', '2000-01-03')).toEqual([])
  })
})

describe('token numbering', () => {
  it('keeps the business prefix and pads sequence to three digits', () => {
    expect(formatTokenNumber('A', 24)).toBe('A-024')
    expect(formatTokenNumber('G', 108)).toBe('G-108')
  })
})
