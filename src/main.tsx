import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { prefetchTemplate } from './app/deck/template'
import { rehydrateLogos } from './app/data/assets'
import './app/styles.css'

// Warm the 11 MB template off the critical path so the first "Compile & check"
// is not also the first download.
prefetchTemplate()
void rehydrateLogos()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
