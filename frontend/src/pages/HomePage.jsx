import { Link, useNavigate } from 'react-router-dom'
import { useMultiAuth } from '../hooks/useMultiAuth.js'
import { useLanguage } from '../contexts/LanguageContext'
import { Star, TrendingUp, Shield, Zap } from 'lucide-react'
import logo from '../assets/logo.svg'

const HomePage = () => {
  const { isAuthenticated } = useMultiAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-4 rounded-2xl">
                <img src={logo} alt="Stellar Stake House" className="h-12 w-12" />
              </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {t('home.hero.title')}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> {t('home.hero.titleHighlight')}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
                >
                  <span className="relative z-10">{t('home.hero.accessDashboard')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
                  >
                    <span className="relative z-10">{t('home.hero.startNow')}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold rounded-xl text-lg transition-all duration-300 hover:border-purple-500 hover:text-white hover:bg-purple-500/10"
                  >
                    {t('home.hero.connectWallet')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl w-fit mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{t('home.features.multiToken.title')}</h3>
              <p className="text-gray-400 leading-relaxed">
                {t('home.features.multiToken.description')}
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-3 rounded-xl w-fit mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{t('home.features.secureDelegation.title')}</h3>
              <p className="text-gray-400 leading-relaxed">
                {t('home.features.secureDelegation.description')}
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl w-fit mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{t('home.features.reflectorOracle.title')}</h3>
              <p className="text-gray-400 leading-relaxed">
                {t('home.features.reflectorOracle.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">2</div>
              <div className="text-gray-400 text-lg">{t('home.stats.supportedTokens')}</div>
              <div className="text-sm text-gray-500 mt-1">{t('home.stats.kaleXlm')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">12.5%</div>
              <div className="text-gray-400 text-lg">{t('home.stats.apyKale')}</div>
              <div className="text-sm text-gray-500 mt-1">8.2% {t('home.stats.apyXlm')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-400 text-lg">{t('home.stats.security')}</div>
              <div className="text-sm text-gray-500 mt-1">{t('home.stats.tokensInWallet')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400 text-lg">{t('home.stats.availability')}</div>
              <div className="text-sm text-gray-500 mt-1">{t('home.stats.stellarNetwork')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            {t('home.cta.subtitle')}
          </p>
          
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="group relative px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
            >
              <span className="relative z-10">{t('home.cta.button')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage