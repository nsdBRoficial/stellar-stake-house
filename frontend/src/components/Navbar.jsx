import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMultiAuth } from '../hooks/useMultiAuth.js'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'
import logo from '../assets/logo.svg'

const Navbar = () => {
  const { user, isAuthenticated, authenticateWith, disconnect } = useMultiAuth()
  const { t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const toggleConnectModal = () => setIsConnectModalOpen(!isConnectModalOpen)

  const handleConnect = async (walletType) => {
    try {
      await authenticateWith(walletType)
      setIsConnectModalOpen(false)
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao conectar:', error)
    }
  }

  const handleDisconnect = async () => {
    await disconnect()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <img src={logo} alt={t('header.title')} className="h-8 w-8" />
              <span className="text-2xl font-bold text-stellar">{t('header.title')}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
              {t('navigation.home')}
            </Link>
            
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                  {t('navigation.dashboard')}
                </Link>
                <Link to="/staking" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                  {t('navigation.staking')}
                </Link>
                <Link to="/rewards" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                  {t('navigation.rewards')}
                </Link>
                <Link to="/history" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                  {t('navigation.history')}
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex md:items-center">
            <LanguageSelector />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.publicKey?.slice(0, 6)}...{user?.publicKey?.slice(-4)}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-stellar hover:bg-stellar-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar"
                >
                  {t('navigation.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-stellar hover:bg-stellar-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar ml-4"
              >
                {t('header.connectWallet')}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stellar dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <span className="sr-only">Abrir menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('navigation.home')}
          </Link>
          
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.dashboard')}
              </Link>
              <Link
                to="/staking"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.staking')}
              </Link>
              <Link
                to="/rewards"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.rewards')}
              </Link>
              <Link
                to="/history"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stellar hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.history')}
              </Link>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          {isAuthenticated ? (
            <div className="px-4 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.publicKey?.slice(0, 6)}...{user?.publicKey?.slice(-4)}
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-stellar hover:bg-stellar-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar"
              >
                {t('navigation.logout')}
              </button>
            </div>
          ) : (
            <div className="px-4">
              <button
                onClick={toggleConnectModal}
                className="w-full px-4 py-2 rounded-md text-sm font-medium text-white bg-stellar hover:bg-stellar-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar"
              >
                {t('header.connectWallet')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connect Wallet Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={toggleConnectModal}></div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('header.connectWallet')}</h3>
                <button
                  onClick={toggleConnectModal}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleConnect('freighter')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar"
                >
                  <img src="/freighter-logo.svg" alt="Freighter" className="h-5 w-5 mr-2" />
                  {t('wallet.connectFreighter')}
                </button>
                
                <button
                  onClick={() => handleConnect('albedo')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar"
                >
                  <img src="/albedo-logo.svg" alt="Albedo" className="h-5 w-5 mr-2" />
                  {t('wallet.connectAlbedo')}
                </button>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>{t('wallet.termsAgreement')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar