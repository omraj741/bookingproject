import { useEffect, useState } from 'react'
import './Dashboard.css'
import StatCard from './StatCard'
import BookingTable from './BookingTable'
import { apiRequest } from '../api'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadStats = async () => {
      try {
        const result = await apiRequest('/api/bookings/stats')
        if (isMounted) {
          setStats(result)
          setError('')
        }
      } catch (fetchError) {
        if (isMounted) setError(fetchError.message || 'Could not load booking statistics.')
      }
    }

    loadStats()
    const intervalId = window.setInterval(loadStats, 15000)
    window.addEventListener('booking-changed', loadStats)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('booking-changed', loadStats)
    }
  }, [])

  return (
    <div className="dashboard-content">
      <h2 className="page-title">Dashboard</h2>
      <section className="stats-grid" aria-label="Booking summary">
        <StatCard title="Bookings" value={stats?.total ?? '...'} />
        <StatCard title="Confirmed" value={stats?.confirmed ?? '...'} />
        <StatCard title="Pending" value={stats?.pending ?? '...'} />
        <StatCard title="Cancelled" value={stats?.cancelled ?? '...'} />
      </section>
      {error && <p className="page-message" role="alert">{error}</p>}
      <section className="recent-bookings">
        <h2 className="section-title">Recent Bookings</h2>
        <BookingTable />
      </section>
    </div>
  )
}

export default Dashboard
