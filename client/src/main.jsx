import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import brandLogoSrc from './images/DELXTA_NO_BACKGROUND.jpg'

const faviconLink =
  document.querySelector("link[rel='icon']") ?? document.createElement('link')
faviconLink.setAttribute('rel', 'icon')
faviconLink.setAttribute('type', 'image/jpeg')
faviconLink.setAttribute('href', brandLogoSrc)

if (!faviconLink.parentNode) {
  document.head.appendChild(faviconLink)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
