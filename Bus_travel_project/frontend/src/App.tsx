import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Armchair, ArrowLeftRight, ArrowRight, BadgePercent, BatteryCharging, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Droplets, Handshake, Headset, Mail, MapPin, Phone, Search, Snowflake, TicketCheck, Utensils, Wifi, X } from 'lucide-react'
import { OperationsPage } from './OperationsPage'
import { request } from './api'
import './App.css'

type Trip = {
  id: number
  operator: string
  busType: string
  origin: string
  destination: string
  departureAt: string
  arrivalAt: string
  fare: number
  availableSeats: number
}

type Seat = { seatNumber: string; available: boolean }
type Booking = { id: number; reference: string; totalAmount: number }
type Account = { id: number; fullName: string; email: string; role: 'CUSTOMER' | 'OPERATOR' | 'ADMIN'; dateOfBirth?: string | null }
type FeaturedRoute = { origin: string; destination: string; image: string; title: string }
type FeaturedDestination = {
  city: string
  image: string
  alt: string
  routeOrigin: string
  routeDestination: string
  credit: string
  license: string
  source: string
}
type GallerySlide = { image: string; title: string; caption: string; alt: string; credit?: string; source?: string }
type GalleryCategory = 'All views' | 'Interior' | 'Exterior'
type BusPhoto = { image: string; title: string; category: Exclude<GalleryCategory, 'All views'>; description: string; credit?: string; source?: string }

function Marquee({ children, className }: { children: ReactNode; className: string }) {
  return <div className={`marquee ${className}`}><div className="marquee-track"><div className="marquee-group">{children}</div><div className="marquee-group" aria-hidden="true" inert>{children}</div></div></div>
}

const locations = [
  { value: 'Bengaluru', label: 'Bangalore' },
  { value: 'Dharmasthala', label: 'Dharmasthala' },
  { value: 'Mangalore', label: 'Mangalore' },
  { value: 'Chikkamagaluru', label: 'Chikkamagaluru (Chikkamagalore)' },
  { value: 'Balehonnur', label: 'Balehonnur' },
  { value: 'Anantapur', label: 'Anantapur' },
  { value: 'Tirupati', label: 'Tirupati' },
  { value: 'Mysuru', label: 'Mysuru' },
  { value: 'Hampi', label: 'Hampi' },
  { value: 'Jog Falls', label: 'Jog Falls' },
  { value: 'Madikeri', label: 'Madikeri (Coorg)' },
  { value: 'Hyderabad', label: 'Hyderabad' },
]

const displayLocation = (value: string) =>
  locations.find((location) => location.value.toLowerCase() === value.toLowerCase())?.label ?? value

const featuredRoutes: FeaturedRoute[] = [
  { origin: 'Bengaluru', destination: 'Hampi', image: '/hampi.jpg', title: 'Bangalore to Hampi' },
  { origin: 'Bengaluru', destination: 'Jog Falls', image: '/jog-falls.jpg', title: 'Bangalore to Jog Falls' },
  { origin: 'Mangalore', destination: 'Dharmasthala', image: '/dharmasthala.jpg', title: 'Mangalore to Dharmasthala' },
  { origin: 'Mysuru', destination: 'Madikeri', image: '/madikeri.jpg', title: 'Mysuru to Coorg' },
  { origin: 'Bengaluru', destination: 'Mysuru', image: '/mysuru-palace.jpg', title: 'Bangalore to Mysuru' },
]

const featuredDestinations: FeaturedDestination[] = [
  { city: 'Mysuru', image: '/mysuru-palace.jpg', alt: 'Mysore Palace towers', routeOrigin: 'Bengaluru', routeDestination: 'Mysuru', credit: 'Ingo Mehling', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Mysuru_Palace_-_Left_Front_Towers.jpg' },
  { city: 'Hampi', image: '/hampi.jpg', alt: 'Granite landscape and ruins at Hampi', routeOrigin: 'Bengaluru', routeDestination: 'Hampi', credit: 'Vyacheslav Argenberg', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File:Hampi,_India,_Rocky_landscape_of_Hampi,_Granite_rocks_of_Matanga_Hill.jpg' },
  { city: 'Jog Falls', image: '/jog-falls.jpg', alt: 'Jog Falls cascading down a green cliff', routeOrigin: 'Bengaluru', routeDestination: 'Jog Falls', credit: 'Nikhilb239', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Jog_Falls,_Sep,_2016.jpg' },
  { city: 'Coorg', image: '/madikeri.jpg', alt: 'Green hills around Madikeri in Coorg', routeOrigin: 'Bengaluru', routeDestination: 'Madikeri', credit: '372shivanipoovaiah', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:RAJA_SEAT_HILL_VIEW.jpg' },
  { city: 'Dharmasthala', image: '/dharmasthala.jpg', alt: 'Temple grounds at Dharmasthala', routeOrigin: 'Mangalore', routeDestination: 'Dharmasthala', credit: 'A. Murali', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Sri_Manjunatha_Swamy_Temple,_Dharmasthala,_Karnataka_05.jpg' },
]

const amenities = [
  { name: 'Air conditioning', Icon: Snowflake },
  { name: 'Wi-Fi', Icon: Wifi },
  { name: 'Snacks', Icon: Utensils },
  { name: 'Charging point', Icon: BatteryCharging },
  { name: 'Water bottle', Icon: Droplets },
]

function AboutPage() {
  return <div className="about-page">
    <section className="about-page-hero" aria-labelledby="about-page-title">
      <img src="/himalaya.jpg" alt="A wide Himalayan mountain panorama above forested foothills" />
      <div className="about-page-hero-copy"><p>SSRAM TRAVELS · OUR STORY</p><h1 id="about-page-title">ABOUT US</h1><span>Every journey deserves a thoughtful beginning.</span></div>
      <a className="about-page-photo-credit" href="https://commons.wikimedia.org/wiki/File:Panorama_of_Himalayas_from_Ranikhet,_Uttarakhand,_India.jpg" target="_blank" rel="noreferrer">Photo: Harshit SR / UnpetitproleX · CC BY-SA 4.0</a>
    </section>
    <section className="about-page-story">
      <div className="about-page-story-heading"><p className="eyebrow">TRAVEL, MADE MORE HUMAN</p><h2>Connecting people<br />to the places they love.</h2></div>
      <div className="about-page-story-copy"><p>SSRAM Travels helps you plan bus journeys across Karnataka and South India. Search a route, compare available schedules, check seat availability, and choose your seat from one place.</p><p>Whether you are heading to a familiar city or discovering somewhere new, we want booking your trip to feel clear and straightforward from the first search to the final stop.</p><a href="/#manage-bookings" className="about-link">Explore available trips <ArrowRight size={16} /></a></div>
    </section>
    <section className="about-page-facilities" aria-labelledby="about-facilities-title">
      <div className="about-page-facilities-heading"><p className="eyebrow">PLAN WITH CONFIDENCE</p><h2 id="about-facilities-title">FACILITIES & COMFORTS</h2><p>Available facilities depend on the bus operator and selected trip.</p></div>
      <div className="about-page-facility-grid">{amenities.map(({ name, Icon }, index) => <div className="about-page-facility" key={name}><span><Icon size={22} strokeWidth={1.7} /></span><div><small>0{index + 1}</small><strong>{name}</strong></div></div>)}</div>
    </section>
    <section className="about-page-cta"><span>YOUR NEXT JOURNEY STARTS HERE</span><a href="/#manage-bookings">Find a bus <ArrowRight size={16} /></a></section>
  </div>
}

function GalleryPage() {
  const [category, setCategory] = useState<GalleryCategory>('All views')
  const categories: GalleryCategory[] = ['All views', 'Interior', 'Exterior']
  const visiblePhotos = category === 'All views' ? busPhotos : busPhotos.filter((photo) => photo.category === category)

  return <div className="bus-gallery-page">
    <section className="bus-gallery-hero" aria-labelledby="bus-gallery-title">
      <img src="/coach-gallery.jpg" alt="Long-distance coach travelling through a mountain landscape" />
      <div><p>SSRAM TRAVELS · ON THE ROAD</p><h1 id="bus-gallery-title">A closer look<br />at the journey.</h1><span>Cabin comforts, coach details, and views from the road.</span></div>
    </section>
    <section className="bus-gallery-content" aria-labelledby="bus-gallery-grid-title">
      <div className="bus-gallery-heading"><div><p className="eyebrow">INSIDE & OUT</p><h2 id="bus-gallery-grid-title">THE SSRAM TRAVELS GALLERY</h2></div><span>{visiblePhotos.length} PHOTOS</span></div>
      <div className="gallery-filter" role="group" aria-label="Filter bus photos">{categories.map((item) => <button key={item} type="button" className={category === item ? 'gallery-filter-active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="bus-gallery-grid">{visiblePhotos.map((photo, index) => <article className="bus-gallery-card" key={photo.image}>
        <div className="bus-gallery-image"><img src={photo.image} alt={photo.description} loading="lazy" /><span>{photo.category}</span></div>
        <div className="bus-gallery-card-copy"><div><small>VIEW {String(index + 1).padStart(2, '0')}</small><h3>{photo.title}</h3><p>{photo.description}</p></div>{photo.source && <a href={photo.source} target="_blank" rel="noreferrer">Photo: {photo.credit}</a>}</div>
      </article>)}</div>
    </section>
  </div>
}

const salientFeatures = [
  { title: 'Online Payment', description: 'Try the local demo checkout when you book a trip.', Icon: CreditCard, status: 'DEMO' },
  { title: 'Online Booking', description: 'Choose your route and seats in a few simple steps.', Icon: TicketCheck, status: 'AVAILABLE' },
  { title: 'Round Trip', description: 'Return-trip booking is planned for a future update.', Icon: ArrowLeftRight, status: 'COMING SOON' },
  { title: 'Customer Service', description: 'Reach us by phone or email for travel questions.', Icon: Headset, status: 'CONTACT US' },
  { title: 'Ladies Seat', description: 'Seat preferences will depend on each operator.', Icon: Armchair, status: 'COMING SOON' },
  { title: 'Regular Offers', description: 'Promotions and fare offers are planned for later.', Icon: BadgePercent, status: 'COMING SOON' },
]

const gallerySlides: GallerySlide[] = [
  { image: '/ssram-bus.jpg', title: 'Ready for the road', caption: 'Start your next South India journey with SSRAM Travels.', alt: 'SSRAM Travels coach on a night road' },
  { image: '/coach-gallery.jpg', title: 'The open road', caption: 'A coach travelling through a mountain landscape.', alt: 'Coach parked beside a dramatic mountain range' },
  { image: '/mysuru-palace.jpg', title: 'Mysuru', caption: 'Discover the palace city and its grand architecture.', alt: 'Mysore Palace in Karnataka', credit: 'Ingo Mehling · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Mysuru_Palace_-_Left_Front_Towers.jpg' },
  { image: '/hampi.jpg', title: 'Hampi', caption: 'Explore the ancient stone landscape of the Vijayanagara empire.', alt: 'Granite landscape and ruins at Hampi', credit: 'Vyacheslav Argenberg · CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File:Hampi,_India,_Rocky_landscape_of_Hampi,_Granite_rocks_of_Matanga_Hill.jpg' },
  { image: '/jog-falls.jpg', title: 'Jog Falls', caption: 'Take in one of Karnataka’s most spectacular waterfalls.', alt: 'Jog Falls cascading in Karnataka', credit: 'Nikhilb239 · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Jog_Falls,_Sep,_2016.jpg' },
]

const busPhotos: BusPhoto[] = [
  { image: '/bus-interior.jpg', title: 'Sleeper cabin', category: 'Interior', description: 'A wide view through a sleeper coach cabin.', credit: 'Ilya Plekhanov · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Thaco_Mobihome_sleeper_bus_interior.jpg' },
  { image: '/ssram-bus.jpg', title: 'Night departure', category: 'Exterior', description: 'A coach ready to begin an evening journey.' },
  { image: '/coach-gallery.jpg', title: 'Coach in the mountains', category: 'Exterior', description: 'A long-distance coach framed by a mountain landscape.' },
  { image: '/bus-front.jpg', title: 'Front view', category: 'Exterior', description: 'Front detail of a modern coach.', credit: 'Cranezyer · CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Ulsan-Limousine_Bus-5005-front.jpg' },
  { image: '/bus-rear.jpg', title: 'Rear view', category: 'Exterior', description: 'The rear profile of a highway coach.', credit: 'Mj-bird · CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:JR_BUS_KANTO,_ISUZU_GALA,_Rear-View.jpg' },
]

const today = new Date()
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
const dateValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function App() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [travelDate, setTravelDate] = useState(dateValue(tomorrow))
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [passengerName, setPassengerName] = useState('')
  const [passengerEmail, setPassengerEmail] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [loginRole, setLoginRole] = useState<'customer' | 'operator' | 'admin' | null>(null)
  const [loginNotice, setLoginNotice] = useState('')
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login')
  const [account, setAccount] = useState<Account | null>(null)
  const [authName, setAuthName] = useState('')
  const [authDateOfBirth, setAuthDateOfBirth] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authPasswordConfirmation, setAuthPasswordConfirmation] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const currentPath = window.location.pathname.replace(/\/+$/, '')
  const isAboutPage = currentPath === '/about'
  const isGalleryPage = currentPath === '/gallery'
  const isOperationsPage = currentPath === '/operations'

  useEffect(() => {
    let active = true
    void request<Account | undefined>('/auth/me')
      .then((profile) => { if (active) setAccount(profile ?? null) })
      .catch(() => { if (active) setAccount(null) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!resultsOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setResultsOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [resultsOpen])

  function showGallerySlide(index: number) {
    setGalleryIndex((index + gallerySlides.length) % gallerySlides.length)
  }

  async function runTripSearch(nextOrigin: string, nextDestination: string) {
    setOrigin(nextOrigin)
    setDestination(nextDestination)
    setError('')
    setMessage('')
    setBooking(null)
    setSelectedTrip(null)
    setTrips([])
    setLoading(true)
    setHasSearched(true)
    setResultsOpen(false)
    try {
      const params = new URLSearchParams({ origin: nextOrigin, destination: nextDestination, date: travelDate })
      setTrips(await request<Trip[]>(`/trips?${params}`))
      setResultsOpen(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load trips.')
      setResultsOpen(true)
    } finally {
      setLoading(false)
    }
  }

  async function searchTrips(event?: FormEvent) {
    event?.preventDefault()
    await runTripSearch(origin, destination)
  }

  async function searchFeaturedRoute(nextOrigin: string, nextDestination: string) {
    await runTripSearch(nextOrigin, nextDestination)
  }

  function openCustomerLogin() {
    setLoginRole('customer')
    setLoginMode('login')
    setLoginNotice('')
  }

  function openStaffLogin(role: 'operator' | 'admin') {
    setLoginRole(role)
    setLoginNotice('')
  }

  async function submitCustomerAuth(event: FormEvent) {
    event.preventDefault()
    setLoginNotice('')
    if (loginMode === 'signup' && authPassword !== authPasswordConfirmation) {
      setLoginNotice('Passwords do not match.')
      return
    }

    setAuthLoading(true)
    try {
      const profile = loginMode === 'signup'
        ? await request<Account>('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            fullName: authName.trim(),
            dateOfBirth: authDateOfBirth,
            email: authEmail.trim(),
            password: authPassword,
            confirmPassword: authPasswordConfirmation,
          }),
        })
        : await request<Account>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: authEmail.trim(), password: authPassword }),
        })
      setAccount({ ...profile, role: 'CUSTOMER' })
      setLoginRole(null)
      setAuthName('')
      setAuthDateOfBirth('')
      setAuthEmail('')
      setAuthPassword('')
      setAuthPasswordConfirmation('')
    } catch (cause) {
      setLoginNotice(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function submitStaffAuth(event: FormEvent) {
    event.preventDefault()
    if (loginRole !== 'operator' && loginRole !== 'admin') return
    setLoginNotice('')
    setAuthLoading(true)
    try {
      const profile = await request<Account>(`/auth/${loginRole}/login`, {
        method: 'POST',
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword }),
      })
      setAccount(profile)
      setLoginRole(null)
      setAuthEmail('')
      setAuthPassword('')
    } catch (cause) {
      setLoginNotice(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function logoutAccount() {
    try {
      await request<{ status: string }>('/auth/logout', { method: 'POST' })
    } finally {
      setAccount(null)
      setLoginNotice('')
    }
  }

  async function chooseTrip(trip: Trip) {
    setSelectedTrip(trip)
    setSelectedSeats([])
    setError('')
    setMessage('')
    setBooking(null)
    setLoading(true)
    try {
      setSeats(await request<Seat[]>(`/trips/${trip.id}/seats`))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load seats.')
    } finally {
      setLoading(false)
    }
  }

  function toggleSeat(seatNumber: string) {
    setSelectedSeats((current) => current.includes(seatNumber)
      ? current.filter((seat) => seat !== seatNumber)
      : [...current, seatNumber])
  }

  async function bookSeats(event: FormEvent) {
    event.preventDefault()
    if (!selectedTrip || selectedSeats.length === 0) return
    setLoading(true)
    setError('')
    try {
      const pending = await request<Booking>('/bookings/hold', {
        method: 'POST',
        body: JSON.stringify({
          tripId: selectedTrip.id,
          seatNumbers: selectedSeats,
          passengerName,
          passengerEmail,
        }),
      })
      const payment = await request<{ status: string }>(`/payments/mock/${pending.id}/confirm`, { method: 'POST' })
      if (payment.status !== 'CONFIRMED') {
        throw new Error('The seat hold expired before payment completed. Search again to reselect your seats.')
      }
      setBooking(pending)
      setMessage('Payment confirmed. Your seats are booked.')
      setTrips(await request<Trip[]>(`/trips?${new URLSearchParams({ origin, destination, date: travelDate })}`))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Booking could not be completed.')
      if (selectedTrip) {
        setSeats(await request<Seat[]>(`/trips/${selectedTrip.id}/seats`).catch(() => []))
      }
    } finally {
      setLoading(false)
    }
  }

  const money = (amount: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount)
  const time = (value: string) => new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="utility-bar">
          <div className="utility-inner">
            <div className="contact-links">
              <a href="mailto:abc.test@gmail.com"><span aria-hidden="true">✉</span> abc.test@gmail.com</a>
              <a href="tel:1234567890"><span aria-hidden="true">☎</span> 1234567890</a>
            </div>
            <nav className="login-links" aria-label="Account access">
              {account ? <><span className="customer-greeting">Hi, {account.fullName}</span>{account.role !== 'CUSTOMER' && <a href="/operations">Operations</a>}<button type="button" onClick={logoutAccount}>Sign out</button></> : <>
                <button type="button" onClick={openCustomerLogin}>Customer Login</button>
                <button type="button" onClick={() => openStaffLogin('operator')}>Operator Login</button>
                <button type="button" onClick={() => openStaffLogin('admin')}>Admin / Owner Login</button>
              </>}
            </nav>
          </div>
        </div>
        <div className="brandbar">
          <a className="brand" href="/" aria-label="SSRAM Travels home">
            <span className="brand-mark">S</span>
            <span>SSRAM <span className="brand-travels">Travels</span></span>
          </a>
          <nav className="primary-nav" aria-label="Main navigation">
            <a href="/">Home</a>
            <a href="/#manage-bookings">Manage Bookings</a>
            <a href="/gallery">Gallery</a>
            <a href="/about">About Us</a>
            <a href="/#contact">Contact</a>
            {account && account.role !== 'CUSTOMER' && <a href="/operations">Operations</a>}
          </nav>
        </div>
      </header>

      {loginRole && <div className="dialog-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setLoginRole(null) }}>
        <section className="login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <button className="dialog-close" type="button" aria-label="Close login dialog" onClick={() => setLoginRole(null)}>×</button>
          <p className="eyebrow">SSRAM TRAVELS ACCOUNT</p>
          <h2 id="login-title">{loginRole === 'customer' ? 'Customer Login' : loginRole === 'operator' ? 'Operator Login' : 'Admin / Owner Login'}</h2>
          {loginRole === 'customer' ? <>
            <div className="auth-mode-tabs" role="tablist" aria-label="Customer account action">
              <button type="button" role="tab" aria-selected={loginMode === 'login'} className={loginMode === 'login' ? 'auth-tab-active' : ''} onClick={() => { setLoginMode('login'); setLoginNotice('') }}>Login</button>
              <button type="button" role="tab" aria-selected={loginMode === 'signup'} className={loginMode === 'signup' ? 'auth-tab-active' : ''} onClick={() => { setLoginMode('signup'); setLoginNotice('') }}>Sign up</button>
            </div>
            <form onSubmit={submitCustomerAuth}>
              {loginMode === 'signup' && <>
                <label>Full name<input type="text" required minLength={2} maxLength={120} autoComplete="name" value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Your full name" /></label>
                <label>Date of birth<input type="date" required max={dateValue(today)} autoComplete="bday" value={authDateOfBirth} onChange={(event) => setAuthDateOfBirth(event.target.value)} /></label>
              </>}
              <label>Email address<input type="email" required maxLength={254} autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></label>
              <label>Password<input type="password" required minLength={8} maxLength={72} autoComplete={loginMode === 'signup' ? 'new-password' : 'current-password'} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 8 characters" /></label>
              {loginMode === 'signup' && <label>Confirm password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={authPasswordConfirmation} onChange={(event) => setAuthPasswordConfirmation(event.target.value)} placeholder="Enter the password again" /></label>}
              {loginNotice && <p className="login-notice" role="alert">{loginNotice}</p>}
              <button className="search-button dialog-submit" type="submit" disabled={authLoading}>{authLoading ? 'Please wait…' : loginMode === 'signup' ? 'Create account' : 'Sign in'} <span aria-hidden="true">→</span></button>
            </form>
          </> : <form onSubmit={submitStaffAuth}>
            <label>Email address<input type="email" required autoComplete="username" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></label>
            <label>Password<input type="password" required autoComplete="current-password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Enter your password" /></label>
            {loginNotice && <p className="login-notice" role="status">{loginNotice}</p>}
            <button className="search-button dialog-submit" type="submit" disabled={authLoading}>{authLoading ? 'Please wait…' : 'Sign in'} <span aria-hidden="true">→</span></button>
          </form>}
        </section>
      </div>}

      <main>{isAboutPage ? <AboutPage /> : isGalleryPage ? <GalleryPage /> : isOperationsPage ? <OperationsPage account={account} onLogin={openStaffLogin} /> : <>
        <section id="home" className="hero hero-photo">
          <div className="hero-copy">
            <p className="hero-kicker">SSRAM TRAVELS · SOUTH INDIA</p>
            <h1>Your journey,<br />our <em>road.</em></h1>
            <p className="hero-note">Find your next ride and travel with comfort.</p>
          </div>
          <span className="bus-brand-overlay" aria-label="SSRAM Travels coach">SSRAM TRAVELS</span>
        </section>

        <section id="manage-bookings" className="search-panel" aria-label="Search bus trips">
          <form className="search-form" onSubmit={searchTrips}>
            <label className="field"><span>FROM</span><div className="select-input-wrap"><select aria-label="Origin" value={origin} onChange={(event) => setOrigin(event.target.value)} required><option value="" disabled>Select origin</option>{locations.map((location) => <option key={location.value} value={location.value} disabled={location.value === destination}>{location.label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div></label>
            <button className="swap-button" type="button" title="Swap cities" aria-label="Swap origin and destination" onClick={() => { setOrigin(destination); setDestination(origin) }}><ArrowLeftRight size={18} strokeWidth={1.8} /></button>
            <label className="field"><span>TO</span><div className="select-input-wrap"><select aria-label="Destination" value={destination} onChange={(event) => setDestination(event.target.value)} required><option value="" disabled>Select destination</option>{locations.map((location) => <option key={location.value} value={location.value} disabled={location.value === origin}>{location.label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div></label>
            <label className="field date-field"><span>TRAVEL DATE</span><div className="date-input-wrap"><CalendarDays size={16} aria-hidden="true" /><input aria-label="Travel date" type="date" value={travelDate} min={dateValue(today)} onChange={(event) => setTravelDate(event.target.value)} required /></div></label>
            <button className="search-button" type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'} <Search size={16} strokeWidth={2} aria-hidden="true" /></button>
          </form>
        </section>

        <section id="popular-routes" className="featured-section routes-section" aria-labelledby="popular-routes-title">
          <div className="featured-heading"><p className="eyebrow">FIND YOUR NEXT JOURNEY</p><h2 id="popular-routes-title">POPULAR ROUTES</h2></div>
          <Marquee className="routes-marquee">
            {featuredRoutes.map((route) => <button className="route-card" key={route.title} type="button" style={{ backgroundImage: `linear-gradient(90deg, #102c29dc, #102c2959 70%, #102c2912), url('${route.image}')` }} onClick={() => searchFeaturedRoute(route.origin, route.destination)}><span>{route.title}</span><strong>BOOK NOW <ArrowRight size={15} /></strong></button>)}
          </Marquee>
        </section>

        <section id="gallery" className="featured-section destinations-section" aria-labelledby="top-destinations-title">
          <div className="featured-heading"><p className="eyebrow">SEE THE BEST OF KARNATAKA</p><h2 id="top-destinations-title">TOP DESTINATIONS</h2></div>
          <Marquee className="destinations-marquee">
            {featuredDestinations.map((destinationCard) => <article className="destination-card" key={destinationCard.city}>
              <button type="button" className="destination-image-button" onClick={() => searchFeaturedRoute(destinationCard.routeOrigin, destinationCard.routeDestination)} aria-label={`Find trips to ${destinationCard.city}`}>
                <img src={destinationCard.image} alt={destinationCard.alt} loading="lazy" />
                <span className="destination-name">{destinationCard.city}</span>
                <span className="destination-arrow"><ArrowRight size={18} /></span>
              </button>
              <a className="photo-credit" href={destinationCard.source} target="_blank" rel="noreferrer">Photo: {destinationCard.credit} · {destinationCard.license}</a>
            </article>)}
          </Marquee>
        </section>

        <section id="about" className="about-section" aria-labelledby="about-title">
          <div className="about-visual">
            <img src="/ssram-bus.jpg" alt="A SSRAM Travels coach ready for a road journey" loading="lazy" />
            <div className="about-image-caption"><span>SSRAM TRAVELS</span><strong>Make the miles<br />feel shorter.</strong></div>
            <span className="about-image-index">S / 01</span>
          </div>
          <div className="about-copy">
            <p className="eyebrow">A BETTER WAY TO GET THERE</p>
            <h2 id="about-title">The journey<br />is part of the <em>destination.</em></h2>
            <p>SSRAM Travels makes it easier to discover bus routes across Karnataka and South India, compare scheduled trips, and choose the seat that suits your journey.</p>
            <p>From the first search to the final stop, we keep your travel plans simple and clear.</p>
            <a className="about-link" href="#manage-bookings">Plan your next trip <ArrowRight size={16} /></a>
          </div>
        </section>

        <section className="amenities-section" aria-labelledby="amenities-title">
          <div className="amenities-heading"><div><p className="eyebrow">THE LITTLE THINGS MATTER</p><h2 id="amenities-title">AMENITIES ON THE ROAD</h2></div><p>Look out for these comforts on select trips.</p></div>
          <div className="amenities-list">{amenities.map(({ name, Icon }, index) => <div className="amenity-item" key={name}><span className="amenity-icon"><Icon size={25} strokeWidth={1.7} /></span><span className="amenity-number">0{index + 1}</span><strong>{name}</strong></div>)}</div>
          <p className="amenities-note">Amenities vary by bus operator and selected trip.</p>
        </section>

        <section className="salient-section" aria-labelledby="salient-title">
          <div className="salient-heading"><p className="eyebrow">TRAVEL MADE SIMPLE</p><h2 id="salient-title">SALIENT FEATURES</h2></div>
          <div className="salient-grid">{salientFeatures.map(({ title, description, Icon, status }) => <article className="salient-item" key={title}>
            <span className="salient-icon"><Icon size={27} strokeWidth={1.7} /></span>
            <div className="salient-copy"><div className="salient-title-row"><h3>{title}</h3><span>{status}</span></div><p>{description}</p></div>
          </article>)}</div>
        </section>

        <section className="gallery-section" aria-labelledby="travel-gallery-title">
          <div className="gallery-heading"><div><p className="eyebrow">ON THE ROAD WITH SSRAM</p><h2 id="travel-gallery-title">TRAVEL IN PICTURES</h2></div><span className="gallery-counter">{String(galleryIndex + 1).padStart(2, '0')} <i /> {String(gallerySlides.length).padStart(2, '0')}</span></div>
          <div className="gallery-stage">
            <button className="gallery-arrow gallery-previous" type="button" aria-label="Previous image" onClick={() => showGallerySlide(galleryIndex - 1)}><ChevronLeft size={22} /></button>
            <figure className="gallery-figure" key={gallerySlides[galleryIndex].image}>
              <img src={gallerySlides[galleryIndex].image} alt={gallerySlides[galleryIndex].alt} />
              <figcaption><span>{gallerySlides[galleryIndex].title}</span><strong>{gallerySlides[galleryIndex].caption}</strong>{gallerySlides[galleryIndex].source && <a href={gallerySlides[galleryIndex].source} target="_blank" rel="noreferrer">Photo: {gallerySlides[galleryIndex].credit}</a>}</figcaption>
            </figure>
            <button className="gallery-arrow gallery-next" type="button" aria-label="Next image" onClick={() => showGallerySlide(galleryIndex + 1)}><ChevronRight size={22} /></button>
          </div>
          <div className="gallery-diamonds" role="group" aria-label="Choose a gallery image">{gallerySlides.map((slide, index) => <button key={slide.image} className={galleryIndex === index ? 'diamond-button diamond-active' : 'diamond-button'} type="button" aria-label={`Show image ${index + 1}: ${slide.title}`} aria-pressed={galleryIndex === index} onClick={() => showGallerySlide(index)}><span /></button>)}</div>
        </section>

        {resultsOpen && <div className="results-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setResultsOpen(false) }}>
        <section id="trip-results" className="results-section results-dialog" role="dialog" aria-modal="true" aria-labelledby="trip-results-title" onClick={(event) => event.stopPropagation()}>
          <button className="results-close" type="button" aria-label="Close bus results" autoFocus onClick={() => setResultsOpen(false)}><X size={19} /></button>
          <div className="section-heading">
            <div><p className="eyebrow">YOUR ROUTE, YOUR CALL</p><h2 id="trip-results-title">{trips.length ? `${trips.length} trips to choose from` : 'Ready when you are'}</h2></div>
            {trips.length > 0 && <span className="result-date">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${travelDate}T00:00:00`))}</span>}
          </div>
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          {message && <div className="notice notice-success" role="status">{message}{booking && <strong> Booking reference: {booking.reference}</strong>}</div>}
          {!trips.length && !loading && !error && <div className="empty-state"><span className="empty-number">01</span><div><h3>{hasSearched ? 'No buses found for this route and date.' : 'Searching available buses…'}</h3><p>{hasSearched ? 'Try another city pair or travel date.' : 'Trips will appear as soon as they are loaded.'}</p></div></div>}
          <div className="trip-list">
            {trips.map((trip) => (
              <article className={`trip-row ${selectedTrip?.id === trip.id ? 'trip-row-active' : ''}`} key={trip.id}>
                <div className="trip-operator"><span className="bus-glyph">▰</span><div><strong>{trip.operator}</strong><span>{trip.busType}</span></div></div>
                <div className="trip-times"><div><strong>{time(trip.departureAt)}</strong><span>{displayLocation(trip.origin)}</span></div><div className="trip-duration"><span>DIRECT</span><i /></div><div><strong>{time(trip.arrivalAt)}</strong><span>{displayLocation(trip.destination)}</span></div></div>
                <div className="trip-fare"><strong>{money(trip.fare)}</strong><span>{trip.availableSeats} seats left</span></div>
                <button className="outline-button" type="button" onClick={() => chooseTrip(trip)}>{selectedTrip?.id === trip.id ? 'Selected' : 'View seats'}</button>
              </article>
            ))}
          </div>

          {selectedTrip && <section className="booking-panel" aria-label="Seat selection and passenger details">
            <div className="booking-title"><div><p className="eyebrow">STEP 2 · MAKE IT YOURS</p><h2>Choose your seats</h2></div><span className="seat-legend"><i /> Available <i className="legend-selected" /> Selected <i className="legend-taken" /> Taken</span></div>
            {loading && !seats.length ? <p className="loading-copy">Loading seats…</p> : <form className="booking-grid" onSubmit={bookSeats}>
              <div className="seat-area"><div className="seat-front">FRONT OF BUS <span>▱</span></div><div className="seat-grid">{seats.map((seat) => <button key={seat.seatNumber} type="button" disabled={!seat.available} aria-pressed={selectedSeats.includes(seat.seatNumber)} className={`seat ${!seat.available ? 'seat-taken' : selectedSeats.includes(seat.seatNumber) ? 'seat-selected' : ''}`} onClick={() => toggleSeat(seat.seatNumber)}>{seat.seatNumber}</button>)}</div><p className="seat-footnote">Select one or more available seats</p></div>
              <div className="passenger-form"><label>Passenger name<input value={passengerName} onChange={(event) => setPassengerName(event.target.value)} required minLength={2} placeholder="Full name" /></label><label>Email for confirmation<input type="email" value={passengerEmail} onChange={(event) => setPassengerEmail(event.target.value)} required placeholder="you@example.com" /></label><div className="fare-summary"><span>{selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} × {money(selectedTrip.fare)}</span><strong>{money(selectedTrip.fare * selectedSeats.length)}</strong></div><button className="search-button pay-button" type="submit" disabled={loading || !selectedSeats.length}>{loading ? 'Processing…' : 'Reserve & pay'} <span aria-hidden="true">→</span></button><p className="mock-note">Local demo checkout · no real payment is taken</p></div>
            </form>}
          </section>}
        </section>
        </div>}
      </>}</main>
      <section className="thankyou-section" aria-labelledby="thankyou-title">
        <Handshake className="thankyou-icon" size={52} strokeWidth={1.8} aria-hidden="true" />
        <p>SSRAM TRAVELS THANKS YOU FOR TRAVELLING WITH US</p>
        <h2 id="thankyou-title">WISH YOU A HAPPY AND<br />COMFORTABLE JOURNEY</h2>
      </section>
      <footer id="contact" className="footer">
        <div className="footer-main">
          <section className="footer-column footer-contact" aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title">CONTACT</h2>
            <p className="footer-location"><MapPin size={18} /><span>SSRAM Travels<br />Serving Karnataka and South India</span></p>
            <a href="tel:1234567890"><Phone size={15} /><span>1234567890</span></a>
            <a href="mailto:abc.test@gmail.com"><Mail size={15} /><span>abc.test@gmail.com</span></a>
          </section>
          <nav className="footer-column footer-quick-links" aria-labelledby="footer-quick-title">
            <h2 id="footer-quick-title">QUICK LINKS</h2>
            <div className="quick-link-grid">
              <a href="/#manage-bookings"><ArrowRight size={14} />Search buses</a>
              <a href="/#popular-routes"><ArrowRight size={14} />Popular routes</a>
              <a href="/gallery"><ArrowRight size={14} />Gallery</a>
              <a href="/about"><ArrowRight size={14} />About us</a>
              <a href="/#salient-title"><ArrowRight size={14} />Salient features</a>
              <a href="/#amenities-title"><ArrowRight size={14} />Amenities</a>
              {account ? <button type="button" onClick={logoutAccount}><ArrowRight size={14} />Sign out</button> : <>
                <button type="button" onClick={openCustomerLogin}><ArrowRight size={14} />Customer login</button>
                <button type="button" onClick={() => openStaffLogin('operator')}><ArrowRight size={14} />Operator login</button>
                <button type="button" onClick={() => openStaffLogin('admin')}><ArrowRight size={14} />Admin / owner login</button>
              </>}
            </div>
          </nav>
          <section className="footer-column footer-social" aria-labelledby="footer-social-title">
            <h2 id="footer-social-title">FOLLOW US</h2>
            <div className="social-marks" aria-hidden="true"><span>f</span><span>▶</span><span>X</span><span>in</span><span>◎</span></div>
            <p>Social profiles coming soon.</p>
          </section>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} SSRAM Travels. All rights reserved.</span><span>Travel well. Arrive safely.</span></div>
      </footer>
    </div>
  )
}

export default App
