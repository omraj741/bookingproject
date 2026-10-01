import { useState } from 'react'

const BookingForm = () => {
  const [booking, setBooking] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Read the form values and send them to the API.
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
      const response = await fetch('/api/bookings', { //This is the most important backend part and Create a new booking by the help of POST method.
        method: 'POST', //We're creating a booking.
        headers: { 'Content-Type': 'application/json' }, //This tells the backend: The data I'm sending is JSON.
        body: JSON.stringify({ ...formData, guestName }), //This will covert the form data into a JSON string, which is what the backend expects.
      })
      const result = await response.json().catch(() => ({}))//response.json() converts that JSON response into a JavaScript object.
      //This protects against a situation where the server doesn't return valid JSON.

      if (!response.ok) throw new Error(result.message || 'Could not save booking. Is the API running?')
      //if (!response.ok) checks if the response was successful. If not, it throws an error with a message from the server or a default message.
      setBooking(result)//now the returned booking gets stored{booking = {_id: "123",guestName: "Rahul",bookingDate: "2026-09-30"})
      form.reset()//After successful submission, the input fields become empty again.
      window.dispatchEvent(new Event('booking-changed'))//A new booking has been created and the table should refresh.
    } 
    catch (error) {
      setSubmitError(error.message || 'Could not connect to the server.')
    } 
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="booking-form" onSubmit={onSubmit}>   {/* //When the form is submitted, run the onSubmit function */}
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
      {/* Show a message after the booking is saved. */}
      {booking && <p className="form-confirmation" role="status">Booking added for {booking.guestName}.</p>}
    </form>
  )
}

export default BookingForm
