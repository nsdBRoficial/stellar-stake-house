import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Wallet, AlertCircle, Loader2, CheckCircle, ExternalLink } from 'lucide-react';

const LoginPage = () => {
  const { connectFreighter, isAuthenticated, isLoading, error, isFreighterInstalled } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [freighterAvailable, setFreighterAvailable] = useState(null);

  // Verificar se Freighter está disponível
  useEffect(() => {
    const checkFreighter = async () => {
      const available = await isFreighterInstalled();
      setFreighterAvailable(available);
    };
    checkFreighter();
  }, [isFreighterInstalled]);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleConnectFreighter = async () => {
    try {
      setIsConnecting(true);
      await connectFreighter();
      // A navegação será feita automaticamente pelo useEffect acima
    } catch (error) {
      console.error('Erro ao conectar:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Stellar Stake House</h1>
          <p className="text-blue-200">Marketplace de delegação multi-token</p>
          <p className="text-blue-300 text-sm mt-1">Conecte sua carteira Stellar para acessar KALE e XLM</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {/* Status do Freighter */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${
                  freighterAvailable === null 
                    ? 'bg-gray-400 animate-pulse' 
                    : freighterAvailable 
                    ? 'bg-green-400' 
                    : 'bg-red-400'
                }`} />
                <span className="text-white font-medium">Freighter Wallet</span>
              </div>
              {freighterAvailable === false && (
                <a 
                  href="https://freighter.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            
            {freighterAvailable === false && (
              <p className="text-sm text-red-300 mt-2">
                Freighter não detectado. 
                <a 
                  href="https://freighter.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-red-200"
                >
                  Instale a extensão
                </a> para continuar.
              </p>
            )}
          </div>

          {/* Botão de Conexão */}
          <button
            onClick={handleConnectFreighter}
            disabled={!freighterAvailable || isConnecting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
              !freighterAvailable || isConnecting
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
            }`}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                <span>Conectar com Freighter</span>
              </>
            )}
          </button>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Informações sobre Segurança */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Delegação Segura</p>
                <p>Seus tokens NUNCA saem da sua carteira. Você apenas assina contratos de delegação mantendo controle total dos seus ativos KALE e XLM.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 text-center">
          <p className="text-blue-200 text-sm">
            Não tem uma carteira Stellar? 
            <a 
              href="https://freighter.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline ml-1"
            >
              Instale o Freighter
            </a>
          </p>
        </div>

        {/* Recursos */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-blue-200">
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs">Delegação Segura</p>
          </div>
          <div className="text-blue-200">
            <div className="text-2xl mb-1">🪙</div>
            <p className="text-xs">Multi-Token</p>
          </div>
          <div className="text-blue-200">
            <div className="text-2xl mb-1">🌟</div>
            <p className="text-xs">Powered by Reflector</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;