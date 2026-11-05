import { ACTIVE_STATUSES, MAX_ACTIVE_TOKENS, formatTokenNumber, getAvailableSlots } from './domain'

const STORAGE_KEY = 'waitless-demo-v1'
const CHANNEL_NAME = 'waitless-demo-sync'
const SERVICE_PREFIX = 'service-'
const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const standardHours = Object.fromEntries(weekdays.map((day) => [
  day,
  { open: true, start: '09:00', end: day === 'sat' ? '14:00' : '17:00' },
]))
standardHours.sun = { open: false, start: '09:00', end: '17:00' }

const seedBusinesses = [
  {
    id: 'city-college',
    name: 'City College Admin Office',
    sector: 'College office',
    description: 'Admissions, certificates and student services — without the long wait.',
    address: '12 College Road, Mumbai',
    color: 'lavender',
    prefix: 'A',
    hours: structuredClone(standardHours),
    services: [
      { id: 'admissions', name: 'Admissions help', duration: 12 },
      { id: 'certificate', name: 'Certificate collection', duration: 8 },
      { id: 'fees', name: 'Fee counter', duration: 10 },
    ],
    completedDurations: [9, 12, 8, 11, 10, 13, 9, 14, 8, 10],
  },
  {
    id: 'careplus-clinic',
    name: 'CarePlus Clinic',
    sector: 'Clinic',
    description: 'A calmer clinic visit starts with knowing when it’s your turn.',
    address: '48 Green Park, Mumbai',
    color: 'mint',
    prefix: 'C',
    hours: structuredClone(standardHours),
    services: [
      { id: 'general-consult', name: 'General consultation', duration: 15 },
      { id: 'follow-up', name: 'Follow-up visit', duration: 10 },
      { id: 'lab', name: 'Lab reports', duration: 8 },
    ],
    completedDurations: [13, 16, 11, 18, 14, 12, 15, 17, 10, 14],
  },
  {
    id: 'glow-salon',
    name: 'Glow Salon',
    sector: 'Salon',
    description: 'Make time for you, not for waiting.',
    address: '5 Lake View Avenue, Mumbai',
    color: 'peach',
    prefix: 'G',
    hours: structuredClone(standardHours),
    services: [
      { id: 'haircut', name: 'Haircut & styling', duration: 30 },
      { id: 'blowdry', name: 'Wash & blow-dry', duration: 25 },
      { id: 'consultation', name: 'Style consultation', duration: 15 },
    ],
    completedDurations: [27, 32, 24, 35, 29, 26, 31, 28, 33, 25],
  },
]

function seedState() {
  const businesses = seedBusinesses.map((business) => ({
    ...business,
    queueOpen: true,
    nextSequence: 27,
    tokens: [
      { id: `${business.prefix}-021`, number: `${business.prefix}-021`, sequence: 21, name: 'Aarav Mehta', phone: '9876500001', serviceId: business.services[0].id, status: 'done', joinedAt: Date.now() - 3_600_000, completedAt: Date.now() - 2_800_000, durationMinutes: 9 },
      { id: `${business.prefix}-022`, number: `${business.prefix}-022`, sequence: 22, name: 'Diya Shah', phone: '9876500002', serviceId: business.services[1].id, status: 'serving', joinedAt: Date.now() - 3_000_000, calledAt: Date.now() - 60_000 },
      { id: `${business.prefix}-023`, number: `${business.prefix}-023`, sequence: 23, name: 'Kabir Rao', phone: '9876500003', serviceId: business.services[0].id, status: 'waiting', joinedAt: Date.now() - 2_100_000 },
      { id: `${business.prefix}-024`, number: `${business.prefix}-024`, sequence: 24, name: 'Mira Patel', phone: '9876500004', serviceId: business.services[2].id, status: 'waiting', joinedAt: Date.now() - 1_500_000 },
      { id: `${business.prefix}-025`, number: `${business.prefix}-025`, sequence: 25, name: 'Ishaan Joshi', phone: '9876500005', serviceId: business.services[0].id, status: 'waiting', joinedAt: Date.now() - 900_000 },
      { id: `${business.prefix}-026`, number: `${business.prefix}-026`, sequence: 26, name: 'Sara Khan', phone: '9876500006', serviceId: business.services[1].id, status: 'waiting', joinedAt: Date.now() - 400_000 },
    ],
  }))
  return { businesses, appointments: [] }
}

function readState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const state = seedState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      return state
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('WaitLess could not load demo data.', error)
    throw new Error('Demo data could not be loaded. Please reload the page.')
  }
}

let state = readState()
let channel
const listeners = new Set()

if (typeof BroadcastChannel !== 'undefined') {
  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = ({ data }) => {
    if (data?.state) {
      state = data.state
      emit()
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        state = JSON.parse(event.newValue)
        emit()
      } catch (error) {
        console.error('WaitLess received invalid demo data from another tab.', error)
      }
    }
  })
}

function emit() {
  listeners.forEach((listener) => listener())
}

function commit(nextState) {
  state = nextState
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('WaitLess could not save demo data.', error)
    throw new Error('Your change could not be saved. Check browser storage and try again.')
  }
  channel?.postMessage({ state })
  emit()
  return state
}

function updateBusiness(businessId, updater) {
  const business = state.businesses.find((item) => item.id === businessId)
  if (!business) throw new Error('Business not found.')
  const updated = updater(business)
  return commit({
    ...state,
    businesses: state.businesses.map((item) => item.id === businessId ? updated : item),
  })
}

function validateIdentity(name, phone) {
  if (!name?.trim()) throw new Error('Please enter your name.')
  if (!/^\d{10}$/.test(phone || '')) throw new Error('Enter a valid 10-digit phone number.')
}

export const demoService = {
  getSnapshot: () => state,
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getBusiness(businessId) {
    return state.businesses.find((business) => business.id === businessId)
  },
  joinQueue(businessId, { name, phone, serviceId }) {
    validateIdentity(name, phone)
    const business = this.getBusiness(businessId)
    if (!business) throw new Error('Business not found.')
    if (!business.queueOpen) throw new Error('This queue is paused or closed. Please try again later.')
    if (!business.services.some((service) => service.id === serviceId)) throw new Error('Choose an available service.')
    if (business.tokens.some((token) => token.phone === phone && ACTIVE_STATUSES.includes(token.status))) {
      throw new Error('This phone number already has an active token here.')
    }
    if (business.tokens.filter((token) => ACTIVE_STATUSES.includes(token.status)).length >= MAX_ACTIVE_TOKENS) {
      throw new Error('This queue has reached its token limit. Please check back soon.')
    }
    const sequence = business.nextSequence
    const number = formatTokenNumber(business.prefix, sequence)
    const token = {
      id: `${business.prefix}-${sequence}`,
      number,
      sequence,
      name: name.trim(),
      phone,
      serviceId,
      status: 'waiting',
      joinedAt: Date.now(),
    }
    updateBusiness(businessId, (item) => ({
      ...item,
      nextSequence: sequence + 1,
      tokens: [...item.tokens, token],
    }))
    return token
  },
  addWalkIn(businessId, { name, phone, serviceId }) {
    return this.joinQueue(businessId, { name, phone, serviceId })
  },
  callNext(businessId) {
    const business = this.getBusiness(businessId)
    if (!business.queueOpen) throw new Error('Open the queue before calling the next customer.')
    if (business.tokens.some((token) => token.status === 'serving' || token.status === 'called')) {
      throw new Error('Finish or skip the current customer first.')
    }
    const next = business.tokens.find((token) => token.status === 'waiting')
    if (!next) throw new Error('There are no customers waiting.')
    updateBusiness(businessId, (item) => ({
      ...item,
      tokens: item.tokens.map((token) => token.id === next.id ? { ...token, status: 'called', calledAt: Date.now() } : token),
    }))
    return next
  },
  startServing(businessId, tokenId) {
    updateBusiness(businessId, (business) => ({
      ...business,
      tokens: business.tokens.map((token) => token.id === tokenId && token.status === 'called'
        ? { ...token, status: 'serving', servingAt: Date.now() }
        : token),
    }))
  },
  finishToken(businessId, tokenId, status) {
    const business = this.getBusiness(businessId)
    const token = business.tokens.find((item) => item.id === tokenId)
    if (!token || !['done', 'skipped', 'no_show'].includes(status)) throw new Error('This queue action is not available.')
    const duration = Math.max(1, Math.round((Date.now() - (token.servingAt || token.calledAt || token.joinedAt)) / 60_000))
    updateBusiness(businessId, (item) => ({
      ...item,
      completedDurations: status === 'done'
        ? [...item.completedDurations, duration].slice(-20)
        : item.completedDurations,
      tokens: item.tokens.map((current) => current.id === tokenId
        ? { ...current, status, completedAt: Date.now(), durationMinutes: duration }
        : current),
    }))
  },
  toggleQueue(businessId) {
    updateBusiness(businessId, (business) => ({ ...business, queueOpen: !business.queueOpen }))
  },
  autoSkipCalled(businessId) {
    const business = this.getBusiness(businessId)
    const expired = business.tokens.filter((token) =>
      token.status === 'called' && token.calledAt && Date.now() - token.calledAt > 120_000,
    )
    if (!expired.length) return
    updateBusiness(businessId, (item) => ({
      ...item,
      tokens: item.tokens.map((token) => expired.some((old) => old.id === token.id)
        ? { ...token, status: 'no_show', completedAt: Date.now() }
        : token),
    }))
  },
  addService(businessId, { name, duration }) {
    if (!name?.trim()) throw new Error('Enter a service name.')
    const service = { id: `${SERVICE_PREFIX}${Date.now()}`, name: name.trim(), duration: Math.max(5, Number(duration) || 15) }
    updateBusiness(businessId, (business) => ({ ...business, services: [...business.services, service] }))
  },
  updateService(businessId, serviceId, { name, duration }) {
    if (!name?.trim()) throw new Error('Enter a service name.')
    updateBusiness(businessId, (business) => ({
      ...business,
      services: business.services.map((service) => service.id === serviceId
        ? { ...service, name: name.trim(), duration: Math.max(5, Number(duration) || 15) }
        : service),
    }))
  },
  updateHours(businessId, weekday, hours) {
    if (!weekdays.includes(weekday)) throw new Error('Choose a valid weekday.')
    updateBusiness(businessId, (business) => ({
      ...business,
      hours: { ...business.hours, [weekday]: { ...hours } },
    }))
  },
  bookAppointment(businessId, { name, phone, serviceId, date, time }) {
    validateIdentity(name, phone)
    const business = this.getBusiness(businessId)
    const appointment = { id: `booking-${Date.now()}`, businessId, name: name.trim(), phone, serviceId, date, time, status: 'booked' }
    const validSlots = getAvailableSlots(business, serviceId, date, state.appointments)
    if (!validSlots.includes(time)) throw new Error('That slot is no longer available. Choose another time.')
    commit({ ...state, appointments: [...state.appointments, appointment] })
    return appointment
  },
  cancelAppointment(appointmentId) {
    const appointment = state.appointments.find((item) => item.id === appointmentId)
    if (!appointment) throw new Error('Appointment not found.')
    if (new Date(`${appointment.date}T${appointment.time}:00`).getTime() <= Date.now()) {
      throw new Error('Past appointments cannot be cancelled.')
    }
    commit({
      ...state,
      appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'cancelled' } : item),
    })
  },
  simulateCustomer(businessId) {
    const business = this.getBusiness(businessId)
    const names = ['Nisha', 'Rohan', 'Anaya', 'Vivaan', 'Tara', 'Arjun', 'Ira', 'Dev']
    const name = names[Math.floor(Math.random() * names.length)]
    const phone = `98${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`
    return this.addWalkIn(businessId, {
      name,
      phone,
      serviceId: business.services[Math.floor(Math.random() * business.services.length)].id,
    })
  },
  resetDemo() {
    return commit(seedState())
  },
}
