import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// Add global error detection
window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 [UNHANDLED PROMISE REJECTION]:', e.reason)
  console.error('🚨 [UNHANDLED PROMISE REJECTION] Stack:', e.reason?.stack)
  console.trace()
})

window.addEventListener('error', (e) => {
  console.error('🚨 [UNHANDLED ERROR]:', e.error)
  console.error('🚨 [UNHANDLED ERROR] Message:', e.message)
  console.error('🚨 [UNHANDLED ERROR] Filename:', e.filename)
  console.error('🚨 [UNHANDLED ERROR] Lineno:', e.lineno)
  console.trace()
})

// Add page refresh detection
window.addEventListener('beforeunload', () => {
  console.log('🔄 [PAGE REFRESH] Browser is about to reload/navigate!')
  console.log('🔄 [PAGE REFRESH] Stack trace:')
  console.trace()
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)