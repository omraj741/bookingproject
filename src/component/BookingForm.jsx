import { useState } from 'react'

const BookingForm = () => {
  const [booking, setBooking] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  async function onSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const rawGuestName = new FormData(form).get('guestName')
    const guestName = typeof rawGuestName === 'string' ? rawGuestName.trim() : ''
    if (!/^[A-Za-z\s]+$/.test(guestName)) {
      setSubmitError('Guest name should contain letters only, without numbers or special characters.')
      return
    }
    const formData = Object.fromEntries(new FormData(form))
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/bookings', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...formData, guestName }), 
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not save booking. Is the API running?')
      setBooking(result)
      form.reset()
      window.dispatchEvent(new Event('booking-changed'))
    } 
    catch (error) {
      setSubmitError(error.message || 'Could not connect to the server.')
    } 
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="booking-form" onSubmit={onSubmit}> 
      <div className="form-field">
        <label htmlFor="guestName">Guest name</label>
        <input
          id="guestName"
          name="guestName"
          autoComplete="name"
          minLength="2"
          maxLength="20"
          pattern="[A-Za-z\s]+"
          title="Guest name should contain letters only, without numbers or special characters."
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="bookingDate">Booking date</label>
        <input
          id="bookingDate"
          name="bookingDate"
          type="date"
          required
        />
      </div>

      <button className="form-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Add booking'}
      </button>
      {submitError && <p className="field-error" role="alert">{submitError}</p>}
      {booking && <p className="form-confirmation" role="status">Booking added for {booking.guestName}.</p>}
    </form>
  )
}

export default BookingForm
