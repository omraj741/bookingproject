import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

const statusOptions = ['pending', 'confirmed', 'cancelled']

const BookingTable = () => {
    const [bookings, setBookings] = useState([])
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState(null)

    useEffect(() => {
        const loadBookings = () => {
            apiRequest('/api/bookings')
                .then((data) => {
                    setBookings(data)
                    setError('')
                })
                .catch((fetchError) => setError(fetchError.message))
        }

        loadBookings()
        window.addEventListener('booking-changed', loadBookings)
        return () => window.removeEventListener('booking-changed', loadBookings)
    }, [])

    const updateBookingStatus = async (bookingId, nextStatus) => {
        setBusyId(bookingId)
        try {
            await apiRequest(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
            })

            window.dispatchEvent(new Event('booking-changed'))
        } catch (fetchError) {
            setError(fetchError.message || 'Could not update booking status.')
        } finally {
            setBusyId(null)
        }
    }

    const deleteBooking = async (bookingId) => {
        setBusyId(bookingId)
        try {
            await apiRequest(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
            })

            window.dispatchEvent(new Event('booking-changed'))
        } catch (fetchError) {
            setError(fetchError.message || 'Could not delete booking.')
        } finally {
            setBusyId(null)
        }
    }

    if (error) return <p className="page-message" role="alert">{error}</p>
    if (bookings.length === 0) return <p className="page-message">No bookings yet.</p>

    return (
        <table className="booking-table">
            <thead>
                <tr>
                    <th>Guest</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {bookings.map((booking) => (
                    <tr key={booking._id}>
                        <td>{booking.guestName}</td>
                        <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                        <td>
                            <select
                                className="status-select"
                                value={booking.status}
                                onChange={(event) => updateBookingStatus(booking._id, event.target.value)}
                                disabled={busyId === booking._id}
                                aria-label={`Update status for ${booking.guestName}`}
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td className="table-actions">
                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteBooking(booking._id)}
                                disabled={busyId === booking._id}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default BookingTable
