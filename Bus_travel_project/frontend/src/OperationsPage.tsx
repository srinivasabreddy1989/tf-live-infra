import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, BusFront, CalendarPlus, CircleOff, Plus, ShieldCheck } from 'lucide-react'
import { request } from './api'
import './OperationsPage.css'

type OperationsAccount = { id: number; fullName: string; role: string }
type LoginRole = 'operator' | 'admin'
type Bus = { id: number; registrationNumber: string; busType: string; totalSeats: number }
type Trip = {
  id: number
  busId: number
  registrationNumber: string
  busType: string
  origin: string
  destination: string
  departureAt: string
  arrivalAt: string
  fare: number
  status: string
  blockedSeats: string
}
type Props = { account: OperationsAccount | null; onLogin: (role: LoginRole) => void }

const formatTime = (value: string) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value))

export function OperationsPage({ account, onLogin }: Props) {
  const [buses, setBuses] = useState<Bus[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [operatorForm, setOperatorForm] = useState({ operatorName: '', fullName: '', email: '', password: '', contactDetails: '' })
  const [busForm, setBusForm] = useState({ registrationNumber: '', busType: '', totalSeats: '24' })
  const [scheduleForm, setScheduleForm] = useState({ busId: '', origin: '', destination: '', departureAt: '', arrivalAt: '', fare: '' })
  const [seatNumbers, setSeatNumbers] = useState<Record<number, string>>({})
  const [seatReasons, setSeatReasons] = useState<Record<number, string>>({})

  async function loadOperatorData() {
    const [nextBuses, nextTrips] = await Promise.all([
      request<Bus[]>('/operations/buses'),
      request<Trip[]>('/operations/trips'),
    ])
    setBuses(nextBuses)
    setTrips(nextTrips)
  }

  useEffect(() => {
    if (account?.role !== 'OPERATOR') return
    let active = true
    void Promise.all([
      request<Bus[]>('/operations/buses'),
      request<Trip[]>('/operations/trips'),
    ]).then(([nextBuses, nextTrips]) => {
      if (active) {
        setBuses(nextBuses)
        setTrips(nextTrips)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load operator data.')
    })
    return () => { active = false }
  }, [account?.id, account?.role])

  async function submitOperator(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const created = await request<{ operatorName: string; email: string }>('/operations/operators', {
        method: 'POST', body: JSON.stringify(operatorForm),
      })
      setNotice(`Operator account created for ${created.operatorName} (${created.email}).`)
      setOperatorForm({ operatorName: '', fullName: '', email: '', password: '', contactDetails: '' })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create operator account.')
    } finally {
      setSaving(false)
    }
  }

  async function submitBus(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const created = await request<Bus>('/operations/buses', {
        method: 'POST', body: JSON.stringify({ ...busForm, totalSeats: Number(busForm.totalSeats) }),
      })
      setNotice(`Bus ${created.registrationNumber} added with ${created.totalSeats} seats.`)
      setBusForm({ registrationNumber: '', busType: '', totalSeats: '24' })
      await loadOperatorData()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add bus.')
    } finally {
      setSaving(false)
    }
  }

  async function submitSchedule(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const created = await request<{ tripId: number }>('/operations/trips', {
        method: 'POST', body: JSON.stringify({ ...scheduleForm, busId: Number(scheduleForm.busId), fare: Number(scheduleForm.fare) }),
      })
      setNotice(`Trip #${created.tripId} scheduled.`)
      setScheduleForm({ busId: '', origin: '', destination: '', departureAt: '', arrivalAt: '', fare: '' })
      await loadOperatorData()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not schedule trip.')
    } finally {
      setSaving(false)
    }
  }

  async function cancelTrip(trip: Trip) {
    if (!window.confirm(`Cancel ${trip.origin} to ${trip.destination}?`)) return
    setError('')
    setNotice('')
    try {
      await request<void>(`/operations/trips/${trip.id}/cancel`, { method: 'PATCH' })
      setNotice(`Trip #${trip.id} cancelled.`)
      await loadOperatorData()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not cancel trip.')
    }
  }

  async function updateSeatBlock(trip: Trip, block: boolean) {
    const seatNumber = seatNumbers[trip.id]?.trim()
    if (!seatNumber) {
      setError('Enter a seat number first.')
      return
    }
    setError('')
    setNotice('')
    try {
      const path = `/operations/trips/${trip.id}/blocked-seats`
      if (block) {
        await request<void>(path, {
          method: 'POST', body: JSON.stringify({ seatNumber, reason: seatReasons[trip.id] ?? '' }),
        })
      } else {
        await request<void>(`${path}?${new URLSearchParams({ seatNumber })}`, { method: 'DELETE' })
      }
      setNotice(block ? `Seat ${seatNumber} blocked on trip #${trip.id}.` : `Seat ${seatNumber} unblocked on trip #${trip.id}.`)
      setSeatNumbers((current) => ({ ...current, [trip.id]: '' }))
      await loadOperatorData()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update seat block.')
    }
  }

  return <div className="operations-page">
    <header className="operations-heading">
      <div><p className="eyebrow">SSRAM TRAVELS · OPERATIONS</p><h1>Operations desk</h1><p>Manage operator access, buses, departures, and seat availability.</p></div>
      <span className="operations-role"><ShieldCheck size={16} />{account?.role === 'ADMIN' ? 'OWNER' : account?.role === 'OPERATOR' ? 'OPERATOR' : 'SIGN IN'}</span>
    </header>
    {notice && <p className="operations-notice" role="status">{notice}</p>}
    {error && <p className="operations-error" role="alert">{error}</p>}

    {!account && <section className="operations-gate"><h2>Choose a secure sign-in</h2><p>Operator accounts are issued by the owner.</p><div><button type="button" onClick={() => onLogin('operator')}>Operator login <ArrowRight size={15} /></button><button type="button" onClick={() => onLogin('admin')}>Admin / owner login <ArrowRight size={15} /></button></div></section>}
    {account?.role === 'CUSTOMER' && <section className="operations-gate"><h2>Operations access required</h2><p>This workspace is available to operators and the owner.</p></section>}

    {account?.role === 'ADMIN' && <section className="operations-section" aria-labelledby="create-operator-title">
      <div className="operations-section-heading"><span className="operations-icon"><Plus size={18} /></span><div><p>OWNER ACCESS</p><h2 id="create-operator-title">Create an operator account</h2></div></div>
      <form className="operations-form operations-form-grid" onSubmit={submitOperator}>
        <label>Operator / company name<input value={operatorForm.operatorName} onChange={(event) => setOperatorForm({ ...operatorForm, operatorName: event.target.value })} required maxLength={120} /></label>
        <label>Operator contact<input value={operatorForm.contactDetails} onChange={(event) => setOperatorForm({ ...operatorForm, contactDetails: event.target.value })} maxLength={255} /></label>
        <label>Account holder name<input value={operatorForm.fullName} onChange={(event) => setOperatorForm({ ...operatorForm, fullName: event.target.value })} required maxLength={120} /></label>
        <label>Login email<input type="email" value={operatorForm.email} onChange={(event) => setOperatorForm({ ...operatorForm, email: event.target.value })} required maxLength={254} autoComplete="email" /></label>
        <label>Temporary password<input type="password" value={operatorForm.password} onChange={(event) => setOperatorForm({ ...operatorForm, password: event.target.value })} required minLength={12} maxLength={72} autoComplete="new-password" /></label>
        <button className="operations-submit" type="submit" disabled={saving}>Create operator account <ArrowRight size={16} /></button>
      </form>
    </section>}

    {account?.role === 'OPERATOR' && <>
      <section className="operations-section" aria-labelledby="add-bus-title">
        <div className="operations-section-heading"><span className="operations-icon"><BusFront size={18} /></span><div><p>FLEET</p><h2 id="add-bus-title">Add a bus</h2></div></div>
        <form className="operations-form operations-form-grid" onSubmit={submitBus}>
          <label>Registration number<input value={busForm.registrationNumber} onChange={(event) => setBusForm({ ...busForm, registrationNumber: event.target.value })} required maxLength={30} /></label>
          <label>Bus type<input value={busForm.busType} onChange={(event) => setBusForm({ ...busForm, busType: event.target.value })} required maxLength={60} placeholder="AC sleeper" /></label>
          <label>Total seats<input type="number" value={busForm.totalSeats} onChange={(event) => setBusForm({ ...busForm, totalSeats: event.target.value })} required min={1} max={100} /></label>
          <button className="operations-submit" type="submit" disabled={saving}>Add bus <Plus size={16} /></button>
        </form>
        <div className="operations-list-heading"><h3>Your buses</h3><span>{buses.length}</span></div>
        {buses.length ? <div className="operations-bus-list">{buses.map((bus) => <div className="operations-bus-row" key={bus.id}><strong>{bus.registrationNumber}</strong><span>{bus.busType}</span><span>{bus.totalSeats} seats</span></div>)}</div> : <p className="operations-empty">No buses have been added yet.</p>}
      </section>

      <section className="operations-section" aria-labelledby="schedule-title">
        <div className="operations-section-heading"><span className="operations-icon"><CalendarPlus size={18} /></span><div><p>SERVICE PLAN</p><h2 id="schedule-title">Schedule a trip</h2></div></div>
        <form className="operations-form operations-form-grid" onSubmit={submitSchedule}>
          <label>Bus<select value={scheduleForm.busId} onChange={(event) => setScheduleForm({ ...scheduleForm, busId: event.target.value })} required><option value="">Select a bus</option>{buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.registrationNumber} · {bus.busType}</option>)}</select></label>
          <label>Origin<input value={scheduleForm.origin} onChange={(event) => setScheduleForm({ ...scheduleForm, origin: event.target.value })} required maxLength={100} /></label>
          <label>Destination<input value={scheduleForm.destination} onChange={(event) => setScheduleForm({ ...scheduleForm, destination: event.target.value })} required maxLength={100} /></label>
          <label>Departure (India time)<input type="datetime-local" value={scheduleForm.departureAt} onChange={(event) => setScheduleForm({ ...scheduleForm, departureAt: event.target.value })} required /></label>
          <label>Arrival (India time)<input type="datetime-local" value={scheduleForm.arrivalAt} onChange={(event) => setScheduleForm({ ...scheduleForm, arrivalAt: event.target.value })} required /></label>
          <label>Fare (INR)<input type="number" value={scheduleForm.fare} onChange={(event) => setScheduleForm({ ...scheduleForm, fare: event.target.value })} min={0} step="0.01" required /></label>
          <button className="operations-submit" type="submit" disabled={saving || buses.length === 0}>Create schedule <ArrowRight size={16} /></button>
        </form>
      </section>

      <section className="operations-section" aria-labelledby="trip-list-title">
        <div className="operations-section-heading"><span className="operations-icon"><CircleOff size={18} /></span><div><p>LIVE SERVICES</p><h2 id="trip-list-title">Trips and seat controls</h2></div></div>
        {trips.length ? <div className="operations-trip-list">{trips.map((trip) => <article className="operations-trip" key={trip.id}>
          <div className="operations-trip-header"><div><p>{trip.registrationNumber} · {trip.busType}</p><h3>{trip.origin} <ArrowRight size={15} /> {trip.destination}</h3><span>{formatTime(trip.departureAt)} to {formatTime(trip.arrivalAt)}</span></div><div className="operations-trip-status"><strong>{trip.status}</strong><span>₹{trip.fare}</span></div></div>
          <div className="operations-trip-actions">
            <label>Seat number<input value={seatNumbers[trip.id] ?? ''} onChange={(event) => setSeatNumbers({ ...seatNumbers, [trip.id]: event.target.value })} placeholder="e.g. 1A" maxLength={10} disabled={trip.status !== 'SCHEDULED'} /></label>
            <label>Reason<input value={seatReasons[trip.id] ?? ''} onChange={(event) => setSeatReasons({ ...seatReasons, [trip.id]: event.target.value })} placeholder="Optional" maxLength={160} disabled={trip.status !== 'SCHEDULED'} /></label>
            <button type="button" className="operations-secondary" onClick={() => void updateSeatBlock(trip, true)} disabled={trip.status !== 'SCHEDULED'}>Block seat</button>
            <button type="button" className="operations-secondary" onClick={() => void updateSeatBlock(trip, false)} disabled={trip.status !== 'SCHEDULED'}>Unblock</button>
            {trip.status === 'SCHEDULED' && <button type="button" className="operations-cancel" onClick={() => void cancelTrip(trip)}>Cancel trip</button>}
          </div>
          <p className="operations-blocked">Blocked seats: {trip.blockedSeats || 'None'}</p>
        </article>)}</div> : <p className="operations-empty">No scheduled trips yet. Add a bus and create a schedule to get started.</p>}
      </section>
    </>}
  </div>
}
