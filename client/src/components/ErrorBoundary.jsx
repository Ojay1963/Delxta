import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('UI Error Boundary', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="section">
          <div className="container panel">
            <h2>Something went wrong.</h2>
            <p>Refresh the page or try again later.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
