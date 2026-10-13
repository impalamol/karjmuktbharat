import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Demo builds answer the backend in the browser; the shim must be in place before Supabase loads.
const ready = import.meta.env.MODE === 'demo' ? import('./demo/mock').then((m) => m.installDemoBackend()) : Promise.resolve()

void ready
  .then(() => import('./App'))
  .then(({ default: App }) =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
