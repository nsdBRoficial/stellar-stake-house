#!/usr/bin/env node

/**
 * Script de Configuração e Verificação - Stellar Stake House
 * 
 * Este script verifica e configura automaticamente o ambiente
 * para garantir que tudo esteja funcionando corretamente.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green')
    return true
  } else {
    log(`❌ ${description}`, 'red')
    return false
  }
}

function checkEnvVar(envPath, varName, description) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const hasVar = envContent.includes(`${varName}=`)
    if (hasVar) {
      log(`✅ ${description}`, 'green')
      return true
    } else {
      log(`❌ ${description}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Erro ao verificar ${envPath}: ${error.message}`, 'red')
    return false
  }
}

function main() {
  log('🚀 Stellar Stake House - Verificação de Integração', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  let allGood = true
  
  // 1. Verificar estrutura de arquivos
  log('\n📁 Verificando estrutura de arquivos...', 'blue')
  
  const requiredFiles = [
    { path: 'backend/.env', desc: 'Configuração do backend' },
    { path: 'frontend/.env', desc: 'Configuração do frontend' },
    { path: 'database/schema.sql', desc: 'Schema do banco de dados' },
    { path: 'backend/routes/pools.js', desc: 'Rotas de pools' },
    { path: 'frontend/src/components/CreatePoolModal.jsx', desc: 'Modal de criação de pools' },
    { path: 'frontend/src/components/PoolAnalytics.jsx', desc: 'Dashboard de analytics' },
    { path: 'contracts/pool_rewards/src/lib.rs', desc: 'Contrato Soroban' },
    { path: 'contracts/deploy.sh', desc: 'Script de deploy' }
  ]
  
  requiredFiles.forEach(file => {
    if (!checkFile(file.path, file.desc)) {
      allGood = false
    }
  })
  
  // 2. Verificar configurações do backend
  log('\n⚙️ Verificando configurações do backend...', 'blue')
  
  const backendEnvChecks = [
    { var: 'SUPABASE_URL', desc: 'URL do Supabase configurada' },
    { var: 'SUPABASE_KEY', desc: 'Chave anônima do Supabase' },
    { var: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Chave de serviço do Supabase' },
    { var: 'STELLAR_HORIZON_URL', desc: 'URL do Horizon Stellar' },
    { var: 'PORT', desc: 'Porta do servidor backend' }
  ]
  
  backendEnvChecks.forEach(check => {
    if (!checkEnvVar('backend/.env', check.var, check.desc)) {
      allGood = false
    }
  })
  
  // 3. Verificar configurações do frontend
  log('\n🎨 Verificando configurações do frontend...', 'blue')
  
  const frontendEnvChecks = [
    { var: 'VITE_API_URL', desc: 'URL da API configurada' },
    { var: 'VITE_STELLAR_NETWORK', desc: 'Rede Stellar configurada' },
    { var: 'VITE_SUPABASE_URL', desc: 'URL do Supabase no frontend' },
    { var: 'VITE_SUPABASE_ANON_KEY', desc: 'Chave anônima no frontend' }
  ]
  
  frontendEnvChecks.forEach(check => {
    if (!checkEnvVar('frontend/.env', check.var, check.desc)) {
      allGood = false
    }
  })
  
  // 4. Verificar configuração de portas
  log('\n🔌 Verificando configuração de portas...', 'blue')
  
  try {
    const backendEnv = fs.readFileSync('backend/.env', 'utf8')
    const frontendEnv = fs.readFileSync('frontend/.env', 'utf8')
    const viteConfig = fs.readFileSync('frontend/vite.config.js', 'utf8')
    
    const backendPort = backendEnv.match(/PORT=(\d+)/)?.[1]
    const frontendApiUrl = frontendEnv.match(/VITE_API_URL=.*:(\d+)/)?.[1]
    const viteProxyPort = viteConfig.match(/target: 'http:\/\/localhost:(\d+)'/)?.[1]
    
    if (backendPort && frontendApiUrl && viteProxyPort) {
      if (backendPort === frontendApiUrl && backendPort === viteProxyPort) {
        log(`✅ Portas configuradas corretamente (${backendPort})`, 'green')
      } else {
        log(`❌ Conflito de portas: Backend=${backendPort}, Frontend=${frontendApiUrl}, Vite=${viteProxyPort}`, 'red')
        allGood = false
      }
    } else {
      log('❌ Não foi possível verificar configuração de portas', 'red')
      allGood = false
    }
  } catch (error) {
    log(`❌ Erro ao verificar portas: ${error.message}`, 'red')
    allGood = false
  }
  
  // 5. Verificar dependências
  log('\n📦 Verificando dependências...', 'blue')
  
  try {
    // Verificar se node_modules existem
    if (fs.existsSync('backend/node_modules')) {
      log('✅ Dependências do backend instaladas', 'green')
    } else {
      log('❌ Dependências do backend não instaladas', 'red')
      allGood = false
    }
    
    if (fs.existsSync('frontend/node_modules')) {
      log('✅ Dependências do frontend instaladas', 'green')
    } else {
      log('❌ Dependências do frontend não instaladas', 'red')
      allGood = false
    }
  } catch (error) {
    log(`❌ Erro ao verificar dependências: ${error.message}`, 'red')
    allGood = false
  }
  
  // 6. Resumo e próximos passos
  log('\n' + '=' .repeat(60), 'cyan')
  
  if (allGood) {
    log('🎉 TUDO CONFIGURADO CORRETAMENTE!', 'green')
    log('\n✅ Próximos passos:', 'green')
    log('1. Execute o schema SQL no Supabase', 'yellow')
    log('2. Verifique se os servidores estão rodando', 'yellow')
    log('3. Teste a criação de pools', 'yellow')
    log('4. Deploy dos contratos (opcional)', 'yellow')
  } else {
    log('⚠️ PROBLEMAS ENCONTRADOS!', 'red')
    log('\n🔧 Ações necessárias:', 'yellow')
    log('1. Corrija os itens marcados com ❌', 'yellow')
    log('2. Execute este script novamente', 'yellow')
    log('3. Consulte ANALISE-COMPLETA-INTEGRACAO.md', 'yellow')
  }
  
  log('\n📚 Documentação:', 'blue')
  log('- ANALISE-COMPLETA-INTEGRACAO.md - Análise completa', 'cyan')
  log('- GUIA-SUPABASE.md - Configuração do banco', 'cyan')
  log('- contracts/README.md - Deploy dos contratos', 'cyan')
  
  process.exit(allGood ? 0 : 1)
}

if (require.main === module) {
  main()
}

module.exports = { main, checkFile, checkEnvVar }