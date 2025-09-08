import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useMultiAuth } from '../hooks/useMultiAuth.js'

const MainLayout = () => {
  const { isTestMode } = useMultiAuth()
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner de Modo de Teste */}
      {isTestMode && isTestMode() && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-2 text-center relative">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">🧪</span>
            <span className="font-medium">MODO TESTE/DEMO ATIVO</span>
            <span className="text-lg">🧪</span>
          </div>
          <p className="text-xs mt-1 opacity-90">
            Você está usando dados fictícios para demonstração. Nenhuma transação real será executada.
          </p>
        </div>
      )}
      
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout