import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  FiCalendar,
  FiGrid,
  FiHome,
  FiMenu,
  FiPhone,
  FiShoppingBag,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
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

const pageTitles = {
  '/': 'Home',
  '/menu': 'Menu',
  '/order': 'Your Order',
  '/reservations': 'Reservations',
  '/about': 'About Delxta',
  '/contact': 'Contact',
  '/login': 'Welcome Back',
  '/register': 'Create Account',
  '/verify-email': 'Verify Email',
  '/profile': 'Profile',
  '/profile/edit': 'Edit Profile',
}

function Header() {
  const [open, setOpen] = useState(false)
  const [logoLoadFailed, setLogoLoadFailed] = useState(false)
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const location = useLocation()
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  })
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const currentTitle = pageTitles[location.pathname] || 'Delxta'
  const mobileTabs = [
    { label: 'Home', path: '/', icon: FiHome },
    { label: 'Menu', path: '/menu', icon: FiGrid },
    { label: 'Reserve', path: '/reservations', icon: FiCalendar },
    { label: 'Order', path: '/order', icon: FiShoppingBag },
    { label: user ? 'Profile' : 'Login', path: user ? '/profile' : '/login', icon: FiUser },
  ]

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`

  const tabClass = ({ isActive }) =>
    `mobile-tab-link ${isActive ? 'active' : ''}`

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPromptEvent(event)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPromptEvent) return
    await installPromptEvent.prompt()
    await installPromptEvent.userChoice
    setInstallPromptEvent(null)
  }

  const canInstall = !isInstalled && Boolean(installPromptEvent)

  return (
    <header className="header">
      <div className="container nav">
        <div className="nav-branding">
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
          <div className="mobile-page-summary" aria-live="polite">
            <span className="mobile-page-label">Delxta app</span>
            <strong>{currentTitle}</strong>
          </div>
        </div>
        <nav className="nav-links" aria-label="Primary">
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
          {canInstall && (
            <button type="button" className="btn btn-outline install-btn" onClick={handleInstall}>
              Install App
            </button>
          )}
          <Link to="/reservations" className="btn btn-outline">
            Reserve
          </Link>
          <button
            className="nav-toggle"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            aria-controls="mobile-navigation-sheet"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu-shell">
          <div className="mobile-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="container mobile-menu" id="mobile-navigation-sheet">
            <div className="mobile-menu-header">
              <div>
                <span className="mobile-page-label">Quick access</span>
                <strong>{currentTitle}</strong>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <FiX />
              </button>
            </div>

            <div className="mobile-menu-grid">
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
              <NavLink to="/order" className={linkClass} onClick={() => setOpen(false)}>
                Order ({itemCount})
              </NavLink>
              <NavLink to="/contact" className={linkClass} onClick={() => setOpen(false)}>
                <FiPhone aria-hidden="true" />
                Contact
              </NavLink>
              {user ? (
                <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                  Profile
                </NavLink>
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
            </div>

            <div className="mobile-menu-actions">
              <Link to="/reservations" className="btn" onClick={() => setOpen(false)}>
                Reserve Now
              </Link>
              {canInstall && (
                <button
                  type="button"
                  className="btn btn-outline install-btn"
                  onClick={async () => {
                    await handleInstall()
                    setOpen(false)
                  }}
                >
                  Install App
                </button>
              )}
              {user && (
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
              )}
            </div>
          </div>
        </div>
      )}
      <nav className="mobile-tabbar" aria-label="Mobile primary">
        {mobileTabs.map((item) => {
          const Icon = item.icon

          return (
            <NavLink key={item.path} to={item.path} className={tabClass}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </header>
  )
}

export default Header
