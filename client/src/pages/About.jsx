import { motion } from 'framer-motion'
import { coreValues, team } from '../data/content'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function About() {
  return (
    <>
      <section className="section">
        <div className="container split">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible">
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              Our Story
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              Founded with a passion for culinary excellence, Delxta bridges the
              gap between traditional Nigerian flavors and modern international
              cuisine. Every dish tells a story of culture, innovation, and the
              finest ingredients sourced both locally and globally.
            </p>
            <p>
              Our journey began in the heart of Lagos, where we sought to create
              a dining experience that honors our roots while embracing global
              tastes.
            </p>
          </motion.div>
          <motion.div className="image-card" variants={fadeUp} initial="hidden" whileInView="visible">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
              alt="Delxta kitchen"
            />
            <div className="image-card-body">
              <p className="price">15+ Years of Excellence</p>
              <p>Celebrating refined hospitality and culinary craft.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-compact">
        <div className="container panel">
          <h2 className="section-title">Our Core Values</h2>
          <div className="feature-grid">
            {coreValues.map((value) => (
              <motion.div
                key={value.title}
                className="feature-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h4>{value.title}</h4>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">The Faces Behind the Flavor</h2>
          <div className="team-grid">
            {team.map((member) => (
              <motion.div
                key={member.name}
                className="image-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <img src={member.image} alt={member.name} />
                <div className="image-card-body">
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default About
