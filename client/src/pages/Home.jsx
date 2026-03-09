/* eslint-disable no-unused-vars */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa'
import { features, chefSelections, atmosphere, reviews } from '../data/content'
import resturantHero from '../images/Resturant-hero.jpg'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

function Home() {
  const [isMapOpen, setIsMapOpen] = useState(false)
  const spotlightStats = [
    ['Cuisine', 'Nigerian soul with global polish'],
    ['Location', 'Victoria Island, Lagos'],
    ['Experience', 'Reservations, events, and fast ordering'],
  ]

  return (
    <>
      <section
        className="hero"
        style={{
          '--hero-image': `url(${resturantHero})`,
        }}
      >
        <div className="container">
          <div className="hero-layout">
            <motion.div
              className="hero-content"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <span className="pill">Welcome to</span>
              <h1>DELXTA</h1>
              <p>
                Where Nigerian heritage meets modern hospitality, with a richer dining room,
                sharper service flow, and a cleaner ordering experience.
              </p>
              <div className="hero-actions">
                <Link className="btn" to="/reservations">
                  Reserve a Table
                </Link>
                <Link className="btn btn-outline" to="/menu">
                  Explore Menu
                </Link>
                <a className="btn btn-muted" href="#watch-video">
                  Watch Video
                </a>
              </div>
            </motion.div>

            <motion.aside
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
            </motion.aside>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section video-section" id="watch-video">
        <div className="container">
          <h2 className="section-title">Watch the Experience</h2>
          <p className="section-subtitle">
            A quick look at Delxta's ambiance and signature moments.
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
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              Visit Us in Lagos
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              We're positioned for easy access from the heart of Victoria Island.
            </p>
            <div className="address-card">
              <strong>Delxta Restaurant</strong>
              <p>Block 12, Plot 4 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria</p>
              <div className="address-meta">
                <span className="pill">Open for reservations</span>
                <span className="pill">Order pickup available</span>
              </div>
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
            </div>
          </motion.div>
          <motion.div
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
          </motion.div>
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
              <motion.div
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <motion.div
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
          </motion.div>
          <motion.div
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
          </motion.div>
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
              <motion.div
                key={review.name}
                className="review-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>"{review.quote}"</p>
                <div className="review-meta">
                  <img src={review.avatar} alt={review.name} />
                  <div>
                    <strong>{review.name}</strong>
                    <div style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>
                      {review.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Ready to Experience Delxta?</h2>
          <p>Reserve your table, start an order, or speak to the team about a more curated dining plan.</p>
          <div className="cta-actions">
            <Link className="btn btn-muted" to="/reservations">
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
                ×
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
