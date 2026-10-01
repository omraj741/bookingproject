import './Navbar.css'
const Navbar = () => {
  return (
    <header className="topbar">
      <h1 className="brand">Booking Dashboard</h1>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <span aria-hidden="true">🔔</span>
        </button>
        <button className="profile-button" type="button" aria-label="Open profile">OM</button>
      </div>
    </header>
  )
  }

export default Navbar

