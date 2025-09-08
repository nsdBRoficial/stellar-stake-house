import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white shadow-inner dark:bg-gray-900 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-xl font-bold text-stellar">
              Stellar Stake House
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Plataforma de staking para tokens KALE na rede Stellar
            </p>
          </div>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Recursos
              </h3>
              <div className="mt-2 space-y-2">
                <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Home
                </Link>
                <Link to="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Dashboard
                </Link>
                <Link to="/staking" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Staking
                </Link>
                <Link to="/rewards" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Recompensas
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Suporte
              </h3>
              <div className="mt-2 space-y-2">
                <Link to="/faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  FAQ
                </Link>
                <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Stellar.org
                </a>
                <a href="https://laboratory.stellar.org" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Stellar Laboratory
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Legal
              </h3>
              <div className="mt-2 space-y-2">
                <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Termos de Serviço
                </Link>
                <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-stellar block">
                  Política de Privacidade
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            &copy; {currentYear} Stellar Stake House. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer