import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaRegCompass,
  FaWhatsapp,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { atmosphere, chefSelections, features, reviews } from '../data/content'
import resturantHero from '../images/Resturant-hero.jpg'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const Motion = motion

const serviceWindows = [
  { label: 'Lunch service', start: 12, end: 16 },
  { label: 'Dinner service', start: 18, end: 23 },
]

const plannerOptions = {
  occasion: [
    { value: 'date-night', label: 'Date night', request: 'Quiet table for two and a polished date-night setting.' },
    { value: 'birthday', label: 'Birthday dinner', request: 'Celebration-ready table with light birthday setup.' },
    { value: 'business', label: 'Business dinner', request: 'A calm table suited for conversation and hosting.' },
    { value: 'family', label: 'Family outing', request: 'Comfortable seating for a relaxed family meal.' },
  ],
  seating: [
    { value: 'lounge', label: 'Main lounge' },
    { value: 'window', label: 'Window-side' },
    { value: 'private', label: 'Private dining' },
  ],
}

const experienceMoments = [
  {
    title: 'Plan in under a minute',
    description: 'Pick your occasion, guest count, and preferred seating, then jump straight into a prefilled booking flow.',
  },
  {
    title: 'Track service hours instantly',
    description: 'The landing page now shows whether Delxta is serving right now and when the next window opens.',
  },
  {
    title: 'Handle details faster',
    description: 'Copy the address, open directions, or move directly to menu ordering without hunting through the site.',
  },
]

function formatDateInput(date) {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function getServiceStatus(now) {
  const currentHour = now.getHours() + now.getMinutes() / 60

  for (const window of serviceWindows) {
    if (currentHour >= window.start && currentHour < window.end) {
      return {
        isOpen: true,
        label: `${window.label} is live`,
        detail: `Open until ${String(window.end).padStart(2, '0')}:00 today.`,
      }
    }
  }

  const nextWindow = serviceWindows.find((window) => currentHour < window.start)

  if (nextWindow) {
    return {
      isOpen: false,
      label: 'Currently between services',
      detail: `${nextWindow.label} starts at ${String(nextWindow.start).padStart(2, '0')}:00 today.`,
    }
  }

  return {
    isOpen: false,
    label: 'Service resumes tomorrow',
    detail: `Lunch service starts at ${String(serviceWindows[0].start).padStart(2, '0')}:00 tomorrow.`,
  }
}

function Home() {
  const { user } = useAuth()
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [serviceStatus, setServiceStatus] = useState(() => getServiceStatus(new Date()))
  const [planner, setPlanner] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      occasion: 'date-night',
      guests: '2',
      seating: 'window',
      date: formatDateInput(tomorrow),
    }
  })

  const spotlightStats = [
    ['Cuisine', 'Nigerian soul with global polish'],
    ['Location', 'Victoria Island, Lagos'],
    ['Experience', 'Reservations, events, and fast ordering'],
  ]

  const availableDates = useMemo(() => {
    const dates = []
    const start = new Date()

    for (let index = 0; index < 6; index += 1) {
      const nextDate = new Date(start)
      nextDate.setDate(start.getDate() + index + 1)
      dates.push({
        value: formatDateInput(nextDate),
        label: formatDisplayDate(nextDate),
      })
    }

    return dates
  }, [])

  const selectedOccasion = plannerOptions.occasion.find((option) => option.value === planner.occasion)
  const selectedSeating = plannerOptions.seating.find((option) => option.value === planner.seating)
  const plannerSearch = useMemo(() => {
    const params = new URLSearchParams({
      guests: planner.guests,
      date: planner.date,
      requests: `${selectedOccasion?.request || ''} Preferred seating: ${selectedSeating?.label || ''}.`.trim(),
    })

    return params.toString()
  }, [planner.date, planner.guests, selectedOccasion, selectedSeating])

  const plannerLink = `/reservations?${plannerSearch}`

  useEffect(() => {
    if (!copiedAddress) return undefined

    const timeoutId = window.setTimeout(() => setCopiedAddress(false), 1800)

    return () => window.clearTimeout(timeoutId)
  }, [copiedAddress])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setServiceStatus(getServiceStatus(new Date()))
    }, 60000)

    return () => window.clearInterval(intervalId)
  }, [])

  const handlePlannerChange = (field) => (event) => {
    setPlanner((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleCopyAddress = async () => {
    const address = 'Block 12, Plot 4 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria'

    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(true)
    } catch {
      setCopiedAddress(false)
    }
  }

  return (
    <>
      <section
        className="hero hero-home"
        style={{
          '--hero-image': `url(${resturantHero})`,
        }}
      >
        <div className="container">
          <div className="hero-layout hero-layout-expanded">
            <Motion.div
              className="hero-content"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <span className="pill">Welcome to</span>
              <h1>DELXTA</h1>
              <p>
                A sharper Delxta landing experience with richer hospitality cues, clearer service
                flow, and faster paths into reservations, contact, and ordering.
              </p>

              <div className="hero-status-row">
                <div className={`service-status ${serviceStatus.isOpen ? 'open' : ''}`}>
                  <span className="service-status-dot" aria-hidden="true" />
                  <div>
                    <strong>{serviceStatus.label}</strong>
                    <span>{serviceStatus.detail}</span>
                  </div>
                </div>
                <div className="hero-micro-stats">
                  <div>
                    <strong>4.9/5</strong>
                    <span>Guest rating</span>
                  </div>
                  <div>
                    <strong>15 min</strong>
                    <span>Reservation hold</span>
                  </div>
                </div>
              </div>

              <div className="hero-actions">
                <Link className="btn" to={plannerLink}>
                  Reserve a Table
                </Link>
                <Link className="btn btn-outline" to="/menu">
                  Explore Menu
                </Link>
                <a className="btn btn-muted" href="#plan-visit">
                  Plan Your Visit
                </a>
              </div>
            </Motion.div>

            <Motion.aside
              className="hero-spotlight panel"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <p className="profile-eyebrow">Tonight at Delxta</p>
              <h3>Designed for date nights, private dinners, and polished group experiences.</h3>
              <div className="hero-spotlight-list">
                {spotlightStats.map(([label, value]) => (
                  <div key={label}>
                    <span className="profile-meta-label">{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="hero-spotlight-actions">
                <Link className="profile-inline-link profile-inline-action" to="/contact">
                  Ask about private dining
                </Link>
              </div>
            </Motion.aside>
          </div>

          <div className="feature-grid feature-grid-elevated">
            {features.map((feature) => (
              <Motion.div
                key={feature.title}
                className="feature-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-compact" id="plan-visit">
        <div className="container">
          <div className="experience-shell">
            <Motion.div
              className="planner-card panel"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="planner-head">
                <div>
                  <p className="profile-eyebrow">Visit planner</p>
                  <h2 className="section-title" style={{ textAlign: 'left' }}>
                    Build your Delxta plan
                  </h2>
                </div>
                <div className="planner-badge">
                  <FaCalendarAlt aria-hidden="true" />
                  <span>{user ? 'Ready to book' : 'Login required to confirm'}</span>
                </div>
              </div>

              <p className="section-subtitle planner-subtitle" style={{ textAlign: 'left', margin: 0 }}>
                Set the kind of evening you want and jump into a prefilled reservation flow with the
                relevant guest count and request notes already attached.
              </p>

              <div className="planner-grid">
                <label>
                  <span className="form-label">Occasion</span>
                  <select className="select" value={planner.occasion} onChange={handlePlannerChange('occasion')}>
                    {plannerOptions.occasion.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="form-label">Guests</span>
                  <select className="select" value={planner.guests} onChange={handlePlannerChange('guests')}>
                    {[2, 3, 4, 5, 6, 8, 10].map((guestCount) => (
                      <option key={guestCount} value={guestCount}>
                        {guestCount} guests
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="form-label">Seating</span>
                  <select className="select" value={planner.seating} onChange={handlePlannerChange('seating')}>
                    {plannerOptions.seating.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="form-label">Preferred date</span>
                  <select className="select" value={planner.date} onChange={handlePlannerChange('date')}>
                    {availableDates.map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="planner-summary">
                <div>
                  <span className="profile-meta-label">Recommended setup</span>
                  <strong>{selectedOccasion?.label} with {selectedSeating?.label} seating</strong>
                  <p>{selectedOccasion?.request}</p>
                </div>
                <div>
                  <span className="profile-meta-label">Next step</span>
                  <strong>{user ? 'Go straight to reservations' : 'Sign in, then finish your booking'}</strong>
                  <p>Your selection will open with guest count and request notes ready.</p>
                </div>
              </div>

              <div className="planner-actions">
                <Link className="btn" to={plannerLink}>
                  {user ? 'Continue to Reservation' : 'Login to Reserve'}
                </Link>
                <Link className="btn btn-outline" to="/contact">
                  Private Dining Enquiry
                </Link>
              </div>
            </Motion.div>

            <Motion.div
              className="experience-stack"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {experienceMoments.map((item) => (
                <div key={item.title} className="experience-note">
                  <span className="experience-note-icon" aria-hidden="true">
                    <FaCheckCircle />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
              <div className="experience-utility-card">
                <div className="experience-utility-head">
                  <div>
                    <p className="profile-eyebrow">Quick actions</p>
                    <h3>Reach Delxta faster</h3>
                  </div>
                  <FaRegCompass aria-hidden="true" />
                </div>
                <div className="utility-action-list">
                  <button type="button" className="utility-action-btn" onClick={handleCopyAddress}>
                    <FaCopy aria-hidden="true" />
                    <span>{copiedAddress ? 'Address copied' : 'Copy address'}</span>
                  </button>
                  <button type="button" className="utility-action-btn" onClick={() => setIsMapOpen(true)}>
                    <FaArrowRight aria-hidden="true" />
                    <span>Open directions</span>
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        </div>
      </section>

      <section className="section video-section" id="watch-video">
        <div className="container">
          <h2 className="section-title">Watch the Experience</h2>
          <p className="section-subtitle">
            A quick look at Delxta&apos;s ambiance and signature moments.
          </p>
          <div className="video-card">
            <div className="video-frame">
              <iframe
                src="https://www.youtube.com/embed/Fr1ntCGCehA"
                title="Delxta Experience"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split visit-section">
          <Motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              Visit Us in Lagos
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              We&apos;re positioned for easy access from the heart of Victoria Island.
            </p>
            <div className="address-card">
              <strong>Delxta Restaurant</strong>
              <p>Block 12, Plot 4 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria</p>
              <div className="address-meta">
                <span className="pill">Open for reservations</span>
                <span className="pill">Order pickup available</span>
                <span className="pill pill-muted">
                  <FaClock aria-hidden="true" />
                  Lunch and dinner service
                </span>
              </div>
              <div className="address-actions">
                <button
                  type="button"
                  className="direction-btn"
                  onClick={() => setIsMapOpen(true)}
                  aria-label="Get directions to Delxta"
                >
                  <span className="direction-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                      <path
                        d="M12 3l7.5 7.5L12 18 4.5 10.5 12 3zm0 3.2L7.7 10.5 12 14.8l4.3-4.3L12 6.2z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 8.2l3.3 3.3-1.3 1.3L12 10.8l-2 2-1.3-1.3 3.3-3.3z"
                        fill="#ffffff"
                      />
                    </svg>
                  </span>
                  <span className="direction-label">Get Directions</span>
                </button>
                <button type="button" className="profile-inline-link profile-inline-action" onClick={handleCopyAddress}>
                  {copiedAddress ? 'Copied' : 'Copy address'}
                </button>
              </div>
            </div>
          </Motion.div>
          <Motion.div
            className="image-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
              alt="Delxta exterior"
            />
            <div className="image-card-body">
              <h4>Find Us Easily</h4>
              <p>Steps from central VI landmarks and major routes.</p>
            </div>
          </Motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <h2 className="section-title" style={{ textAlign: 'left' }}>Chef&apos;s Selections</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
                Hand-picked favorites that define the Delxta experience.
              </p>
            </div>
            <Link className="btn btn-outline" to="/menu">
              View Full Menu
            </Link>
          </div>
          <div className="selection-grid">
            {chefSelections.map((item) => (
              <Motion.div
                key={item.title}
                className="image-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <img src={item.image} alt={item.title} />
                <div className="image-card-body">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <p className="price">{item.price}</p>
                  <Link className="profile-inline-link profile-inline-action" to="/menu">
                    Order this dish
                  </Link>
                </div>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              An Atmosphere of Luxury
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              At Delxta, dining is an art form. Our interiors transport you to a
              world of elegance and comfort, curated for your pleasure.
            </p>
            <ul className="list">
              {atmosphere.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Motion.div>
          <Motion.div
            className="image-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
              alt="Delxta interior"
            />
            <div className="image-card-body">
              <h4>Signature Cocktails</h4>
              <p>Enjoy craft pairings inspired by global flavors.</p>
            </div>
          </Motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Guest Reviews</h2>
          <p className="section-subtitle">
            Real impressions from guests who came for the food and stayed for the overall experience.
          </p>
          <div className="reviews">
            {reviews.map((review) => (
              <Motion.div
                key={review.name}
                className="review-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>&quot;{review.quote}&quot;</p>
                <div className="review-meta">
                  <img src={review.avatar} alt={review.name} />
                  <div>
                    <strong>{review.name}</strong>
                    <div style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>
                      {review.role}
                    </div>
                  </div>
                </div>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta cta-rich">
        <div className="container">
          <h2>Ready to Experience Delxta?</h2>
          <p>Reserve your table, start an order, or speak to the team about a more curated dining plan.</p>
          <div className="cta-actions">
            <Link className="btn btn-muted" to={plannerLink}>
              Reserve a Table
            </Link>
            <Link className="btn btn-outline" to="/menu">
              Start an Order
            </Link>
          </div>
        </div>
      </section>

      {isMapOpen && (
        <div className="map-modal" role="dialog" aria-modal="true">
          <div className="map-modal-backdrop" onClick={() => setIsMapOpen(false)} />
          <div className="map-modal-card">
            <div className="map-modal-header">
              <div>
                <strong>Delxta Restaurant</strong>
                <div className="map-modal-subtitle">
                  Block 12, Plot 4 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria
                </div>
              </div>
              <button
                type="button"
                className="map-modal-close"
                onClick={() => setIsMapOpen(false)}
                aria-label="Close directions"
              >
                x
              </button>
            </div>
            <div className="map-embed">
              <iframe
                title="Delxta location map"
                src="https://www.google.com/maps?q=Block%2012%2C%20Plot%204%20Admiralty%20Way%2C%20Lekki%20Phase%201%2C%20Lagos%20State%2C%20Nigeria&output=embed"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}

      <a
        className="whatsapp-float"
        href="https://wa.me/2347082206013"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Delxta on WhatsApp"
      >
        <span className="whatsapp-icon" aria-hidden="true">
          <FaWhatsapp />
        </span>
      </a>
    </>
  )
}

export default Home
