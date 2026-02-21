import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="section">
      <div className="container panel" style={{ textAlign: 'center' }}>
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-outline">
          Return Home
        </Link>
      </div>
    </section>
  )
}

export default NotFound
