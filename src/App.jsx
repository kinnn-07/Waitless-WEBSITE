import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowDown, ArrowLeft, ArrowRight, Bell, BriefcaseBusiness, CalendarDays, Check, CheckCircle2,
  ChevronDown, Clock3, GraduationCap, HeartPulse, MapPin, Moon, Pause, Play, Plus,
  Printer, Scissors, ShieldCheck, Sparkles, Sun, TicketCheck, UserRound, Users, X,
} from 'lucide-react'
import { demoService } from './demoService'
import { estimateWait, formatWaitRange, getAvailableSlots, ACTIVE_STATUSES } from './domain'
import { messages } from './i18n'
import './index.css'

const sectorIcons = { 'College office': GraduationCap, Clinic: HeartPulse, Salon: Scissors }
const weekdayNames = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']]
const APP_TODAY = localDate(new Date())

function useDemoState() {
  return useSyncExternalStore(demoService.subscribe, demoService.getSnapshot, demoService.getSnapshot)
}

function Logo({ inverse = false }) {
  return <Link to="/" className={`brand ${inverse ? 'brand-inverse' : ''}`} aria-label="WaitLess home"><span>Wait</span><b>Less</b><i>.</i></Link>
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('waitless-theme') || 'light')
  const [language, setLanguage] = useState('en')
  const state = useDemoState()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('waitless-theme', theme)
  }, [theme])
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch((error) => console.error('PWA setup failed.', error))
  }, [])
  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light')
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Landing state={state} theme={theme} toggleTheme={toggleTheme} language={language} setLanguage={setLanguage} />} />
          <Route path="/business/:businessId" element={<BusinessPage />} />
          <Route path="/token/:businessId/:tokenId" element={<TokenPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/:businessId" element={<AdminDashboard />} />
          <Route path="/book/:businessId" element={<BookingPage />} />
          <Route path="/poster/:businessId" element={<PosterPage />} />
          <Route path="/display/:businessId" element={<PublicDisplay />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <footer className="site-footer"><Logo /><span>Less waiting. More living.</span><span className="footer-demo"><span className="live-dot" /> Demo mode · Your data stays in this browser</span></footer>
      </div>
    </BrowserRouter>
  )
}

function Header({ theme, toggleTheme, language, setLanguage, compact = false }) {
  const text = messages[language]
  return (
    <header className="topbar">
      <Logo />
      {!compact && <nav className="main-nav" aria-label="Main navigation">
        <a href="/#how">{text.howItWorks}</a><a href="/#businesses">{text.businesses}</a><a href="/#pricing">{text.pricing}</a>
      </nav>}
      <div className="header-actions">
        {!compact && <label className="language-picker"><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language"><option value="en">EN</option><option value="hi">हिं</option><option value="mr">मर</option></select><ChevronDown size={13} /></label>}
        <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
        <Link className="button button-small button-outline admin-link" to="/admin">Business login <ArrowRight size={15} /></Link>
      </div>
    </header>
  )
}

function Landing({ state, theme, toggleTheme, language, setLanguage }) {
  const steps = [
    ['01', 'Choose a service', 'Find the right business and the service you need.'],
    ['02', 'Join the queue', 'Take a token or book a time that works for you.'],
    ['03', 'Get on with your day', 'See your live position and estimated wait.'],
    ['04', 'We’ll call your turn', 'Get a heads-up when you’re two places away.'],
  ]
  return (
    <>
      <Header theme={theme} toggleTheme={toggleTheme} language={language} setLanguage={setLanguage} />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> THE QUEUE, REIMAGINED</div>
            <h1>Skip the queue,<br /><span>not your turn.</span></h1>
            <p className="hero-lead">Your time is too valuable to spend waiting. Join a virtual queue, track your turn live, and show up when it’s almost time.</p>
            <div className="hero-actions"><a className="button button-primary" href="#businesses">Find a place <ArrowRight size={18} /></a><Link className="text-link" to="/admin">I run a business <ArrowRight size={16} /></Link></div>
            <div className="trust-note"><ShieldCheck size={17} /> No app download. No account needed.</div>
          </div>
          <div className="hero-art" aria-label="WaitLess token preview">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="floating-pill pill-one"><span className="mini-avatar">R</span><span><b>Your turn is close</b><small>Just 2 people ahead</small></span><Bell size={16} /></div>
            <div className="ticket-card">
              <div className="ticket-head"><span className="ticket-icon"><TicketCheck size={20} /></span><span className="live-label"><span className="live-dot" /> LIVE QUEUE</span></div>
              <p className="ticket-business">CarePlus Clinic</p><p className="ticket-service">General consultation</p>
              <div className="ticket-number">C-024</div><div className="ticket-divider"><span /><span /></div>
              <div className="ticket-stats"><div><small>YOUR POSITION</small><strong>#3 <em>in line</em></strong></div><div><small>EST. WAIT</small><strong>15–20 <em>min</em></strong></div></div>
              <div className="ticket-progress"><span /></div><div className="ticket-foot"><Users size={15} /> Two people ahead of you</div>
            </div>
            <div className="floating-pill pill-two"><span className="check-bubble"><Check size={15} /></span><span><b>It’s your turn!</b><small>Head over to the counter</small></span></div>
            <div className="hero-sparkle sparkle-one"><Sparkles size={21} /></div><div className="hero-sparkle sparkle-two"><span>✦</span></div>
          </div>
          <a className="scroll-cue" href="#how"><ArrowDown size={15} /> A better way to wait</a>
        </section>

        <section className="section how-section" id="how">
          <div className="section-heading"><span className="eyebrow">HOW IT WORKS</span><h2>Four steps. <span>Zero waiting rooms.</span></h2><p>WaitLess keeps you in the loop while you’re out living your life.</p></div>
          <div className="steps-grid">{steps.map(([number, title, copy]) => <article className="step-card" key={number}><span className="step-number">{number}</span><div className="step-connector" /><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </section>

        <section className="section business-section" id="businesses">
          <div className="section-heading section-heading-row"><div><span className="eyebrow">YOUR NEXT STOP</span><h2>Find your <span>WaitLess.</span></h2><p>Pick a place and we’ll take it from here.</p></div><span className="demo-badge"><span className="live-dot" /> {state.businesses.length} demo locations</span></div>
          <div className="business-grid">{state.businesses.map((business) => <BusinessCard business={business} key={business.id} />)}</div>
        </section>

        <section className="section pricing-section" id="pricing">
          <div className="section-heading"><span className="eyebrow">SIMPLE, TRANSPARENT PRICING</span><h2>More flow. <span>Less overhead.</span></h2><p>Plans that grow with your business. No surprises.</p></div>
          <div className="pricing-grid">
            {[['Free', '₹0', 'To get started', ['One location', 'Virtual queue', 'Live position updates']], ['Starter', '₹499', 'per location / month', ['Everything in Free', 'Appointment booking', 'Customer notifications']], ['Pro', '₹999', 'per location / month', ['Everything in Starter', 'Multi-counter support', 'Queue analytics']]].map(([name, price, suffix, features], i) => <article className={`price-card ${i === 1 ? 'price-featured' : ''}`} key={name}>{i === 1 && <span className="popular-tag">MOST POPULAR</span>}<h3>{name}</h3><p>{name === 'Free' ? 'For trying a better way.' : `For ${name === 'Starter' ? 'small teams ready to flow.' : 'busy teams that keep growing.'}`}</p><div className="price">{price}<small>{suffix}</small></div><ul>{features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><Link className={`button ${i === 1 ? 'button-primary' : 'button-outline'} button-full`} to="/admin">Get started <ArrowRight size={16} /></Link></article>)}
          </div><p className="pricing-note">Plans shown for preview only. Demo mode is always free.</p>
        </section>

        <section className="closing-cta"><div><span className="eyebrow">YOUR TIME, YOURS AGAIN</span><h2>Ready to make waiting<br />a thing of the past?</h2></div><a className="button button-white" href="#businesses">Find your place <ArrowRight size={18} /></a></section>
      </main>
    </>
  )
}

function BusinessCard({ business }) {
  const Icon = sectorIcons[business.sector] || BriefcaseBusiness
  const waiting = business.tokens.filter((token) => ACTIVE_STATUSES.includes(token.status)).length
  return <article className="business-card">
    <div className={`business-illustration ${business.color}`}><div className="illustration-shape shape-back" /><div className="illustration-shape shape-front"><Icon size={34} strokeWidth={1.6} /></div><span className={`open-pill ${business.queueOpen ? '' : 'closed-pill'}`}><span className={business.queueOpen ? 'live-dot' : 'closed-dot'} /> {business.queueOpen ? 'Queue open' : 'Paused'}</span></div>
    <div className="business-card-body"><span className="sector-tag">{business.sector}</span><h3>{business.name}</h3><p><MapPin size={14} />{business.address}</p><div className="business-card-bottom"><span><Users size={15} /> {waiting} in queue</span><Link to={`/business/${business.id}`} aria-label={`Visit ${business.name}`}><ArrowRight size={17} /></Link></div></div>
  </article>
}

function PageHeader({ back = '/', label = 'Back to WaitLess' }) {
  return <div className="subpage-header"><Link to={back} className="back-link"><ArrowLeft size={16} />{label}</Link><Logo /></div>
}

function BusinessPage() {
  const { businessId } = useParams()
  const state = useDemoState()
  const business = state.businesses.find((item) => item.id === businessId)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceId, setServiceId] = useState(business?.services[0]?.id || '')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  if (!business) return <NotFound />
  const selectedServiceId = business.services.some((service) => service.id === serviceId)
    ? serviceId
    : business.services[0]?.id || ''
  const submit = (event) => {
    event.preventDefault()
    setError('')
    setJoining(true)
    try {
      const token = demoService.joinQueue(business.id, { name, phone, serviceId: selectedServiceId })
      navigate(`/token/${business.id}/${encodeURIComponent(token.id)}`)
    } catch (issue) { setError(issue.message) } finally { setJoining(false) }
  }
  const active = business.tokens.filter((token) => ACTIVE_STATUSES.includes(token.status))
  return <div className="page-background"><PageHeader /><main className="content-width">
    <section className="business-detail-hero"><div><span className="sector-tag">{business.sector}</span><h1>{business.name}</h1><p>{business.description}</p><div className="detail-meta"><span><MapPin size={16} />{business.address}</span><span><Clock3 size={16} />Today · 9:00 AM – 5:00 PM</span></div></div><div className={`detail-emblem ${business.color}`}>{(() => { const Icon = sectorIcons[business.sector]; return <Icon size={46} /> })()}</div></section>
    {!business.queueOpen && <div className="notice-banner notice-warning"><Pause size={18} /><div><b>Queue temporarily paused</b><span>You can still browse services. Please check back soon to join.</span></div></div>}
    <div className="two-column-layout customer-layout">
      <section className="panel services-panel"><div className="panel-heading"><div><span className="eyebrow">CHOOSE YOUR VISIT</span><h2>Services</h2></div><span className="live-count"><span className={business.queueOpen ? 'live-dot' : 'closed-dot'} />{business.queueOpen ? 'Accepting visitors' : 'Not accepting visitors'}</span></div>
        <div className="service-list">{business.services.map((service) => <div className="service-row" key={service.id}><span className="service-icon"><Sparkles size={18} /></span><span className="service-info"><b>{service.name}</b><small><Clock3 size={13} /> About {service.duration} min</small></span><span className="service-queue">{active.length} <small>in queue</small></span></div>)}</div>
        <div className="current-queue"><div><span className="eyebrow">LIVE QUEUE</span><h3>Right now</h3></div><div className="queue-summary"><strong>{active.length}</strong><span>people waiting</span><span className="queue-position-preview">{active.filter((token) => token.status === 'waiting').length > 0 ? `Next up · ${active.find((token) => token.status === 'waiting')?.number}` : 'Queue is clear'}</span></div></div>
      </section>
      <aside className="panel join-panel"><div className="join-heading"><span className="join-icon"><TicketCheck size={21} /></span><span className="open-pill"><span className={business.queueOpen ? 'live-dot' : 'closed-dot'} />{business.queueOpen ? 'JOIN THE LIVE QUEUE' : 'QUEUE PAUSED'}</span></div><h2>Your turn,<br />on your time.</h2><p>Take a virtual token, then relax somewhere more comfortable.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="e.g. Ananya Shah" required maxLength={70} /></label>
          <label>Phone number<div className="phone-input"><span>+91</span><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} autoComplete="tel-national" inputMode="numeric" placeholder="10-digit mobile number" required minLength={10} maxLength={10} pattern="\d{10}" /></div></label>
          <label>What do you need?<select value={selectedServiceId} onChange={(event) => setServiceId(event.target.value)}>{business.services.map((service) => <option value={service.id} key={service.id}>{service.name} · {service.duration} min</option>)}</select></label>
          <p className="privacy-note"><ShieldCheck size={15} /> Only your name and phone number are collected to manage your visit.</p>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-full" disabled={!business.queueOpen || joining}>{joining ? 'Getting your token…' : business.queueOpen ? 'Join the queue' : 'Queue is paused'} <ArrowRight size={17} /></button>
        </form>
        <Link className="booking-link" to={`/book/${business.id}`}><CalendarDays size={16} /> Prefer to plan ahead? <b>Book an appointment</b></Link>
      </aside>
    </div>
    <div className="secondary-links"><Link to={`/poster/${business.id}`}><QrCodeIcon /> Get the QR poster</Link><Link to={`/display/${business.id}`}><Play size={15} /> Open public display</Link></div>
  </main></div>
}

function QrCodeIcon() { return <TicketCheck size={15} /> }

function TokenPage() {
  const { businessId, tokenId } = useParams()
  const state = useDemoState()
  const business = state.businesses.find((item) => item.id === businessId)
  const token = business?.tokens.find((item) => item.id === decodeURIComponent(tokenId))
  const [notice, setNotice] = useState(false)
  const previousAhead = useRef(null)
  const notifiedRef = useRef(false)
  const activeAhead = business?.tokens.filter((item) => ACTIVE_STATUSES.includes(item.status) && item.sequence < (token?.sequence || 0)) || []
  const ahead = activeAhead.length
  const service = business?.services.find((item) => item.id === token?.serviceId)
  const wait = estimateWait(ahead, business?.completedDurations, service?.duration)
  useEffect(() => {
    if (business && token && ahead <= 2 && token.status === 'waiting' && !notifiedRef.current && (previousAhead.current === null || previousAhead.current > 2)) {
      setNotice(true)
      notifiedRef.current = true
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Your WaitLess turn is approaching', { body: `${ahead} ${ahead === 1 ? 'person' : 'people'} ahead at ${business.name}.` })
    }
    previousAhead.current = ahead
  }, [ahead, business, token])
  if (!business || !token) return <NotFound />
  const requestNotifications = async () => {
    if (!('Notification' in window)) { setNotice(true); return }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') new Notification('WaitLess notifications enabled', { body: 'We’ll let you know when your turn is close.' })
  }
  const leave = () => {
    if (!window.confirm('Leave this queue? Your token will be removed.')) return
    demoService.finishToken(businessId, token.id, 'skipped')
  }
  const done = token.status === 'done'
  const left = ['skipped', 'no_show'].includes(token.status)
  return <div className="page-background"><PageHeader back={`/business/${business.id}`} label={business.name} /><main className="token-page content-narrow">
    <div className="token-live"><span className="live-dot" /> YOUR LIVE QUEUE PASS</div>
    {notice && <div className="notice-banner notice-teal" role="status"><Bell size={18} /><div><b>Your turn is getting close!</b><span>You’re {ahead} {ahead === 1 ? 'person' : 'people'} away. Make your way to {business.name}.</span></div><button onClick={() => setNotice(false)} aria-label="Dismiss notification"><X size={16} /></button></div>}
    <article className="token-card panel">
      <div className="token-card-top"><div><span className="eyebrow">{business.name}</span><p>{service?.name}</p></div><span className={`status-pill status-${token.status}`}>{token.status === 'serving' ? 'Now serving' : token.status === 'called' ? 'You’re called' : done ? 'Visit complete' : left ? 'Queue left' : 'In queue'}</span></div>
      <div className="token-number-block"><span>YOUR TOKEN</span><strong>{token.number}</strong><small>Keep this screen handy</small></div>
      <div className="token-dotted-line"><span /><span /></div>
      {!done && !left ? <div className="token-metrics"><div><strong>{token.status === 'serving' ? 'Now' : ahead + 1}</strong><span>{token.status === 'serving' ? 'It’s your turn' : 'Your position'}</span></div><div><strong>{ahead}</strong><span>People ahead</span></div><div><strong>{formatWaitRange(wait)}</strong><span>Estimated wait</span></div></div> : <div className="completed-state"><CheckCircle2 size={26} /><b>{done ? 'Thanks for visiting!' : 'You have left this queue.'}</b><span>{done ? 'We hope to see you again soon.' : 'You can join the queue again anytime.'}</span></div>}
      {!done && !left && <div className="token-status-message"><span className="status-icon"><Clock3 size={17} /></span><span>{token.status === 'serving' ? 'Please head to the counter now.' : token.status === 'called' ? 'Your token has been called. Please head to the counter.' : 'We’ll keep your place updated in real time.'}</span></div>}
    </article>
    {!done && !left && <div className="token-actions"><button className="button button-outline" onClick={requestNotifications}><Bell size={16} /> Turn on notifications</button><button className="text-button danger-text" onClick={leave}>Leave queue</button></div>}
    <div className="token-help"><ShieldCheck size={16} /><span>Your place is saved on this device. Keep this page open for live updates.</span></div>
  </main></div>
}

function AdminLogin() {
  const state = useDemoState()
  const [businessId, setBusinessId] = useState(state.businesses[0]?.id || '')
  const [email, setEmail] = useState('admin@waitless.demo')
  const [password, setPassword] = useState('waitless123')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const submit = (event) => {
    event.preventDefault()
    if (email !== 'admin@waitless.demo' || password !== 'waitless123') { setError('Use the demo login shown below.'); return }
    navigate(`/admin/${businessId}`)
  }
  return <div className="page-background"><PageHeader /><main className="login-wrap"><div className="login-card panel"><div className="login-symbol"><BriefcaseBusiness size={26} /></div><span className="eyebrow">BUSINESS DASHBOARD</span><h1>Welcome back.</h1><p>Sign in to keep your queue moving.</p>
    <form className="form-stack" onSubmit={submit}><label>Choose your business<select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{state.businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary button-full">Open demo dashboard <ArrowRight size={17} /></button></form>
    <div className="demo-login"><span className="eyebrow">DEMO LOGIN</span><p><b>Email</b> admin@waitless.demo</p><p><b>Password</b> waitless123</p><span>Demo only · No real account needed</span></div>
  </div></main></div>
}

function AdminDashboard() {
  const { businessId } = useParams()
  const state = useDemoState()
  const business = state.businesses.find((item) => item.id === businessId)
  const [error, setError] = useState('')
  const [walkIn, setWalkIn] = useState({ name: '', phone: '', serviceId: business?.services[0]?.id || '' })
  const [simulating, setSimulating] = useState(false)
  const [serviceDraft, setServiceDraft] = useState({ name: '', duration: 15 })
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!businessId) return undefined
    const timer = window.setInterval(() => demoService.autoSkipCalled(businessId), 15_000)
    return () => window.clearInterval(timer)
  }, [businessId])
  useEffect(() => {
    if (!simulating || !businessId) return undefined
    const timer = window.setInterval(() => {
      try { demoService.simulateCustomer(businessId); setError('') } catch (issue) { setError(issue.message); setSimulating(false) }
    }, 3500)
    return () => window.clearInterval(timer)
  }, [simulating, businessId])
  if (!business) return <NotFound />
  const walkInServiceId = business.services.some((service) => service.id === walkIn.serviceId)
    ? walkIn.serviceId
    : business.services[0]?.id || ''
  const active = business.tokens.filter((token) => ACTIVE_STATUSES.includes(token.status)).sort((a, b) => a.sequence - b.sequence)
  const inProgress = business.tokens.find((token) => ['called', 'serving'].includes(token.status))
  const waiting = active.filter((token) => token.status === 'waiting')
  const act = (operation) => { setError(''); setNotice(''); try { operation(); } catch (issue) { setError(issue.message) } }
  const currentAction = () => {
    if (inProgress?.status === 'called') return <button className="button button-primary" onClick={() => act(() => demoService.startServing(business.id, inProgress.id))}><Play size={16} /> Start serving</button>
    if (inProgress?.status === 'serving') return <button className="button button-primary" onClick={() => act(() => demoService.finishToken(business.id, inProgress.id, 'done'))}><Check size={16} /> Mark done</button>
    return <button className="button button-primary" disabled={!waiting.length || !business.queueOpen} onClick={() => act(() => demoService.callNext(business.id))}><ArrowRight size={16} /> Call next</button>
  }
  const addWalkIn = (event) => {
    event.preventDefault()
    act(() => { demoService.addWalkIn(business.id, { ...walkIn, serviceId: walkInServiceId }); setWalkIn((current) => ({ ...current, name: '', phone: '' })); setNotice('Walk-in added to the queue.') })
  }
  const addService = (event) => {
    event.preventDefault()
    act(() => { demoService.addService(business.id, serviceDraft); setServiceDraft({ name: '', duration: 15 }); setNotice('Service added.') })
  }
  return <div className="dashboard-background"><header className="dashboard-topbar"><div className="dashboard-brand"><Logo /><span className="dashboard-tag">BUSINESS</span></div><div className="dashboard-top-actions"><Link className="button button-outline button-small admin-view-link" to={`/business/${business.id}`}><UserRound size={15} /> Customer view</Link><Link className="button button-outline button-small" to="/admin">Switch business</Link></div></header>
    <main className="dashboard-content"><div className="dashboard-title-row"><div><div className="breadcrumb">DASHBOARD <span>/</span> {business.sector.toUpperCase()}</div><h1>{business.name}</h1><p>Here’s what’s happening with your queue today.</p></div><span className="demo-badge"><span className="live-dot" /> LIVE DEMO</span></div>
      <div className="stat-grid"><StatCard icon={<Users size={18} />} label="In the queue" value={active.length} detail="Active tokens" /><StatCard icon={<Clock3 size={18} />} label="Currently serving" value={inProgress ? inProgress.number : '—'} detail={inProgress ? inProgress.name : 'No one at the counter'} /><StatCard icon={<CheckCircle2 size={18} />} label="Completed today" value={business.tokens.filter((token) => token.status === 'done').length} detail="Visits served" /></div>
      {error && <div className="notice-banner notice-error" role="alert"><X size={18} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
      {notice && <div className="notice-banner notice-teal" role="status"><CheckCircle2 size={18} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
      <div className="dashboard-grid">
        <section className="panel admin-queue-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR CUSTOMERS</span><h2>Live queue <span className="live-dot" /></h2></div><button className={`button button-small ${business.queueOpen ? 'button-outline' : 'button-primary'}`} onClick={() => act(() => demoService.toggleQueue(business.id))}>{business.queueOpen ? <><Pause size={15} /> Pause queue</> : <><Play size={15} /> Open queue</>}</button></div>
          {!business.queueOpen && <div className="queue-paused-note"><Pause size={14} /> New customers can’t join while paused.</div>}
          <div className="queue-actions-bar">{currentAction()}<button className="button button-outline" onClick={() => setSimulating((value) => !value)}>{simulating ? <><Pause size={15} /> Stop simulation</> : <><Play size={15} /> Simulate customers</>}</button></div>
          {active.length ? <div className="admin-queue-list">{active.map((token, index) => <AdminTokenRow key={token.id} token={token} index={index} isCurrent={token.id === inProgress?.id} businessId={business.id} act={act} />)}</div> : <div className="empty-state"><span className="empty-icon"><Users size={23} /></span><b>The queue is clear</b><p>Add a walk-in or turn on customer simulation to see it in action.</p></div>}
          <div className="walkin-section"><div className="walkin-title"><span><Plus size={16} /></span><div><b>Add a walk-in</b><small>Give an in-person visitor a virtual token.</small></div></div><form className="walkin-form" onSubmit={addWalkIn}><input placeholder="Customer name" aria-label="Customer name" required value={walkIn.name} onChange={(event) => setWalkIn({ ...walkIn, name: event.target.value })} /><input placeholder="10-digit phone" aria-label="Customer phone" inputMode="numeric" pattern="\d{10}" maxLength={10} required value={walkIn.phone} onChange={(event) => setWalkIn({ ...walkIn, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} /><select aria-label="Service" value={walkInServiceId} onChange={(event) => setWalkIn({ ...walkIn, serviceId: event.target.value })}>{business.services.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select><button className="button button-primary button-small" type="submit"><Plus size={15} /> Add</button></form></div>
        </section>
        <aside className="dashboard-side">
          <section className="panel manage-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR OFFERINGS</span><h2>Services</h2></div><span className="count-chip">{business.services.length}</span></div>
            <div className="manage-service-list">{business.services.map((service) => <ServiceEditor service={service} key={service.id} businessId={business.id} setError={setError} />)}</div>
            <form className="add-service-form" onSubmit={addService}><input placeholder="New service name" aria-label="New service name" required value={serviceDraft.name} onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })} /><div className="add-service-controls"><input type="number" min="5" max="240" aria-label="Service duration in minutes" value={serviceDraft.duration} onChange={(event) => setServiceDraft({ ...serviceDraft, duration: event.target.value })} /><span>min</span><button className="button button-outline button-small" type="submit"><Plus size={14} /> Add service</button></div></form>
          </section>
          <section className="panel hours-panel"><div className="panel-heading"><div><span className="eyebrow">SET YOUR SCHEDULE</span><h2>Working hours</h2></div><Clock3 size={18} className="muted-icon" /></div>{weekdayNames.map(([day, label]) => <HoursEditor key={day} business={business} day={day} label={label} setError={setError} />)}</section>
          <section className="panel quick-links"><span className="eyebrow">SHARE YOUR QUEUE</span><Link to={`/poster/${business.id}`}><QrCodeIcon /> Print QR poster <ArrowRight size={14} /></Link><Link to={`/display/${business.id}`}><Play size={15} /> Open public display <ArrowRight size={14} /></Link></section>
        </aside>
      </div>
      <p className="auto-skip-note"><Clock3 size={14} /> A called customer is marked no-show automatically if they don’t arrive within 2 minutes.</p>
      <div className="dashboard-bottom-links"><Link to="/">Back to WaitLess</Link><button className="text-button danger-text" onClick={() => { if (window.confirm('Reset all demo queues and appointments?')) demoService.resetDemo() }}>Reset demo data</button></div>
    </main>
  </div>
}

function StatCard({ icon, label, value, detail }) {
  return <article className="panel stat-card"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function AdminTokenRow({ token, index, isCurrent, businessId, act }) {
  const stateLabels = { waiting: 'Waiting', called: 'Called', serving: 'Serving', done: 'Done', skipped: 'Skipped', no_show: 'No-show' }
  const service = demoService.getBusiness(businessId)?.services.find((item) => item.id === token.serviceId)
  return <div className={`admin-token-row ${isCurrent ? 'current-token' : ''}`}><span className="queue-rank">{String(index + 1).padStart(2, '0')}</span><span className="admin-token-number">{token.number}</span><span className="admin-token-person"><b>{token.name}</b><small>{service?.name || 'Walk-in'}</small></span><span className={`status-pill status-${token.status}`}>{stateLabels[token.status]}</span><div className="row-actions">{token.status === 'waiting' && <button className="icon-button tiny-action" title="Skip token" aria-label={`Skip ${token.name}`} onClick={() => act(() => demoService.finishToken(businessId, token.id, 'skipped'))}><ArrowRight size={15} /></button>}{token.status === 'called' && <button className="icon-button tiny-action" title="Mark no-show" aria-label={`Mark ${token.name} no-show`} onClick={() => act(() => demoService.finishToken(businessId, token.id, 'no_show'))}><X size={15} /></button>}{token.status === 'serving' && <button className="icon-button tiny-action" title="Mark done" aria-label={`Mark ${token.name} done`} onClick={() => act(() => demoService.finishToken(businessId, token.id, 'done'))}><Check size={15} /></button>}</div></div>
}

function ServiceEditor({ service, businessId, setError }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ name: service.name, duration: service.duration })
  const save = (event) => {
    event.preventDefault()
    try { demoService.updateService(businessId, service.id, draft); setEditing(false); setError('') } catch (issue) { setError(issue.message) }
  }
  if (editing) return <form className="service-edit-row" onSubmit={save}><input aria-label="Service name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /><input aria-label="Duration in minutes" type="number" min="5" max="240" value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} /><button className="icon-button" type="submit" aria-label="Save service"><Check size={15} /></button><button className="icon-button" type="button" onClick={() => setEditing(false)} aria-label="Cancel edit"><X size={15} /></button></form>
  return <button className="manage-service-row" onClick={() => setEditing(true)}><span><b>{service.name}</b><small>{service.duration} min</small></span><span className="edit-label">Edit</span></button>
}

function HoursEditor({ business, day, label, setError }) {
  const hours = business.hours[day]
  const update = (patch) => {
    try { demoService.updateHours(business.id, day, { ...hours, ...patch }); setError('') } catch (issue) { setError(issue.message) }
  }
  return <div className={`hours-row ${hours.open ? '' : 'hours-closed'}`}><label><input type="checkbox" checked={hours.open} onChange={(event) => update({ open: event.target.checked })} /><span>{label}</span></label>{hours.open ? <div className="hours-times"><input aria-label={`${label} opening time`} type="time" value={hours.start} onChange={(event) => update({ start: event.target.value })} /><span>–</span><input aria-label={`${label} closing time`} type="time" value={hours.end} onChange={(event) => update({ end: event.target.value })} /></div> : <span className="closed-text">Closed</span>}</div>
}

function BookingPage() {
  const { businessId } = useParams()
  const state = useDemoState()
  const business = state.businesses.find((item) => item.id === businessId)
  const [serviceId, setServiceId] = useState(business?.services[0]?.id || '')
  const [date, setDate] = useState(APP_TODAY)
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [booked, setBooked] = useState(null)
  const slots = useMemo(() => business ? getAvailableSlots(business, serviceId, date, state.appointments.filter((item) => item.businessId === businessId)) : [], [business, serviceId, date, state.appointments, businessId])
  const selectedTime = slots.includes(time) ? time : time ? '' : slots[0] || ''
  if (!business) return <NotFound />
  const submit = (event) => {
    event.preventDefault()
    setError('')
    try { setBooked(demoService.bookAppointment(business.id, { name, phone, serviceId, date, time: selectedTime })) } catch (issue) { setError(issue.message) }
  }
  return <div className="page-background"><PageHeader back={`/business/${business.id}`} label={business.name} /><main className="booking-wrap content-narrow">
    <div className="booking-intro"><span className="eyebrow">PLAN YOUR VISIT</span><h1>Book a time.<br /><span>Keep your day.</span></h1><p>Choose an available slot and we’ll save it just for you.</p></div>
    {booked ? <section className="panel booking-confirmation"><span className="success-icon"><CheckCircle2 size={31} /></span><span className="eyebrow">YOU’RE ALL SET</span><h2>Appointment booked.</h2><p>{business.name} · {business.services.find((item) => item.id === booked.serviceId)?.name}</p><strong>{new Date(`${booked.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at {formatTime(booked.time)}</strong><div><button className="button button-outline" onClick={() => { demoService.cancelAppointment(booked.id); setBooked(null); setTime('') }}>Cancel appointment</button><Link className="button button-primary" to={`/business/${business.id}`}>Done</Link></div></section> : <form className="panel booking-form" onSubmit={submit}>
      <label>Choose a service<select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>{business.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.duration} min</option>)}</select></label>
      <label>Pick a date<input type="date" min={APP_TODAY} value={date} onChange={(event) => { setDate(event.target.value); setTime('') }} required /></label>
      <fieldset className="slot-fieldset"><legend>Available times</legend>{slots.length ? <div className="slots-grid">{slots.map((slot) => <button type="button" className={`slot-button ${selectedTime === slot ? 'selected-slot' : ''}`} key={slot} onClick={() => setTime(slot)} aria-pressed={selectedTime === slot}>{formatTime(slot)}</button>)}</div> : <div className="empty-slots"><CalendarDays size={18} /> No available slots on this date. Try another day.</div>}</fieldset>
      <div className="form-row"><label>Your name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={70} required /></label><label>Phone number<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" pattern="\d{10}" maxLength={10} required /></label></div>
      <p className="privacy-note"><ShieldCheck size={15} /> Your name and phone are only used to manage this appointment.</p>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary button-full" disabled={!selectedTime}>Confirm appointment <ArrowRight size={17} /></button>
    </form>}
  </main></div>
}

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTime(time) {
  if (!time) return ''
  return new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function PosterPage() {
  const { businessId } = useParams()
  const business = useDemoState().businesses.find((item) => item.id === businessId)
  if (!business) return <NotFound />
  const joinUrl = `${window.location.origin}/business/${business.id}`
  return <div className="page-background poster-background"><PageHeader back={`/admin/${business.id}`} label="Back to dashboard" /><main className="poster-controls"><p>Print this poster and put it where your customers can see it.</p><button className="button button-primary" onClick={() => window.print()}><Printer size={16} /> Print poster</button></main><main className="poster-sheet"><span className="poster-kicker">WELCOME TO {business.name.toUpperCase()}</span><div className="poster-brand"><Logo /></div><h1>Scan to join<br /><span>the queue.</span></h1><p>No app. No waiting around.<br />Just scan, join, and carry on.</p><div className="poster-qr"><QRCodeSVG value={joinUrl} size={210} bgColor="#ffffff" fgColor="#14213d" level="H" includeMargin /></div><span className="poster-scan-label"><QrCodeIcon /> OPEN YOUR CAMERA TO SCAN</span><div className="poster-bottom"><div><span>ONE LESS THING TO WAIT FOR.</span><small>Powered by WaitLess</small></div><Logo /></div></main></div>
}

function PublicDisplay() {
  const { businessId } = useParams()
  const state = useDemoState()
  const business = state.businesses.find((item) => item.id === businessId)
  if (!business) return <NotFound />
  const serving = business.tokens.find((token) => token.status === 'serving' || token.status === 'called')
  const nextTokens = business.tokens.filter((token) => token.status === 'waiting').sort((a, b) => a.sequence - b.sequence).slice(0, 5)
  return <main className="public-display"><header><Logo inverse /><span><span className={business.queueOpen ? 'live-dot' : 'closed-dot'} /> {business.queueOpen ? 'LIVE QUEUE' : 'QUEUE PAUSED'}</span><span>{business.name}</span></header><section className="display-main"><span className="display-label">NOW SERVING</span><h1>{serving?.number || '— — —'}</h1><p>{serving ? serving.name : 'The next customer will be called shortly'}</p><div className="display-divider" /><span className="display-label">COMING UP NEXT</span><div className="display-next">{nextTokens.length ? nextTokens.map((token) => <span key={token.id}>{token.number}</span>) : <span className="display-empty">No one waiting yet</span>}</div></section><footer><span>Thank you for your patience.</span><span>Powered by <b>WaitLess</b></span></footer></main>
}

function NotFound() {
  return <div className="page-background not-found"><PageHeader /><main><span className="not-found-code">404</span><span className="eyebrow">THIS TURN DOESN’T EXIST</span><h1>Looks like we took<br /><span>a wrong turn.</span></h1><p>The page you’re looking for isn’t here. Let’s get you back on track.</p><Link className="button button-primary" to="/">Back to WaitLess <ArrowRight size={17} /></Link></main></div>
}

export default function Root() {
  return <App />
}
