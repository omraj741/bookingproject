import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './component/Navbar'
import Sidebar from './component/Sidebar'
import Dashboard from './component/Dashboard'
import BookingTable from './component/BookingTable'
import BookingForm from './component/BookingForm'

const BookingsPage = () => (
  <section>
    <h2 className="page-title">Bookings</h2>
    <h3 className="section-title">Add Booking</h3>
    <BookingForm />
    <h3 className="section-title bookings-list-title">All Bookings</h3>
    <BookingTable />
  </section>
)

const UsersPage = () => (
  <section>
    <h2 className="page-title">Users</h2>
    <p className="page-message">User management will be available here.</p>
  </section>
)

const SettingsPage = () => (
  <section>
    <h2 className="page-title">Settings</h2>
    <p className="page-message">Booking and account settings will be available here.</p>
  </section>
)

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App
