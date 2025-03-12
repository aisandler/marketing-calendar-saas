import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Temporarily disable StrictMode to prevent double initialization
// This helps isolate authentication issues that might be caused by double mounting
createRoot(document.getElementById('root')!).render(<App />)
