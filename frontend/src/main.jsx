import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import MultiAuthProvider from './contexts/MultiAuthContext.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <MultiAuthProvider>
          <App />
        </MultiAuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
)