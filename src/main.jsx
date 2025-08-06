import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initWhiteScreenFix } from './utils/cacheManager.js'

// Initialize white screen fix
initWhiteScreenFix();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
