import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import brandLogoSrc from '../images/DELXTA_NO_BACKGROUND.jpg'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/menu' },
  { label: 'Reservations', path: '/reservations' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const [logoLoadFailed, setLogoLoadFailed] = useState(false)
  const { user, logout } = useAuth()
  const { itemCount } = useCart()

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`

  return (
    <header className="header">
      <div className="container nav">
        <Link to="/" className="logo-text brand-link" aria-label="Delxta home">
          {!logoLoadFailed && (
            <img
              src={brandLogoSrc}
              alt="Delxta"
              className="brand-logo-image"
              onError={() => setLogoLoadFailed(true)}
            />
          )}
          <span className="brand-logo-fallback">Delxta</span>
        </Link>
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
              <button type="button" className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Sign Up
              </NavLink>
            </>
          )}
          <NavLink to="/order" className={linkClass}>
            Order ({itemCount})
          </NavLink>
          <Link to="/reservations" className="btn btn-outline">
            Reserve
          </Link>
          <button
            className="nav-toggle"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="container mobile-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                Profile
              </NavLink>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  logout()
                  setOpen(false)
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>
                Sign Up
              </NavLink>
            </>
          )}
          <NavLink to="/order" className={linkClass} onClick={() => setOpen(false)}>
            Order ({itemCount})
          </NavLink>
        </div>
      )}
    </header>
  )
}

export default Header
