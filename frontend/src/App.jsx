import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { MultiAuthProvider } from './contexts/MultiAuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { useMultiAuth } from './hooks/useMultiAuth.js'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MultiLoginPage from './pages/MultiLoginPage.jsx'
import DashboardPage from './pages/DashboardPage'
import StakingPage from './pages/StakingPage'
import RewardsPage from './pages/RewardsPage'
import HistoryPage from './pages/HistoryPage'

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useMultiAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Componente para redirecionar usuários autenticados
const PublicRoute = ({ children, forceLogout = false }) => {
  const { isAuthenticated, isLoading, disconnect } = useMultiAuth()

  // Se forceLogout for true, desconectar automaticamente
  React.useEffect(() => {
    if (forceLogout && isAuthenticated) {
      disconnect()
    }
  }, [forceLogout, isAuthenticated, disconnect])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">Carregando...</div>
  }

  // Para MVP: não redirecionar automaticamente se forceLogout for true
  if (isAuthenticated && !forceLogout) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Rotas de login */}
      <Route path="/login" element={
        <PublicRoute>
          <MultiLoginPage />
        </PublicRoute>
      } />
      <Route path="/login/legacy" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      {/* Rotas principais */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={
          <PublicRoute forceLogout={true}>
            <HomePage />
          </PublicRoute>
        } />
        
        <Route path="dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="staking" element={
          <ProtectedRoute>
            <StakingPage />
          </ProtectedRoute>
        } />
        
        <Route path="rewards" element={
          <ProtectedRoute>
            <RewardsPage />
          </ProtectedRoute>
        } />
        
        <Route path="history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App