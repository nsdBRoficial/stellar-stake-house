# 🚀 Guia Completo: Deploy de Contratos Stellar e Testes via Albedo

## ✅ **STATUS: CONTRATO JÁ DEPLOYADO E FUNCIONAL**

**Contract ID**: `CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY`  
**Network**: Testnet  
**Explorer**: https://stellar.expert/explorer/testnet/contract/CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY

## 📋 Pré-requisitos

- ✅ Rust instalado (versão 1.70+)
- ✅ Stellar CLI instalado
- ✅ Carteira Stellar configurada (Freighter ou Albedo)
- ✅ Fundos de teste na testnet
- ✅ Target WebAssembly configurado (`wasm32-unknown-unknown`)

### 1. Instalação do Stellar CLI
```bash
# Windows (PowerShell como Administrador)
winget install --id Stellar.StellarCLI

# Ou baixar diretamente:
# https://github.com/stellar/stellar-cli/releases
```

### 2. Verificar Instalação
```bash
stellar --version
# Deve mostrar: stellar 21.x.x
```

### 3. Configurar Rede Testnet
```bash
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

---

## 🔑 Configuração de Identidades

### 1. Criar Identidade para Deploy
```bash
# Gerar nova identidade
stellar keys generate --global deployer --network testnet

# Ou usar identidade existente (se tiver)
stellar keys add deployer --secret-key SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --global
```

### 2. Obter Endereço Público
```bash
stellar keys address deployer
# Anote o endereço: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Financiar Conta na Testnet
```bash
# Financiar com XLM de teste
stellar keys fund deployer --network testnet

# Verificar saldo
stellar account --account deployer --network testnet
```

---

## 🏗️ Deploy do Contrato

### 1. Navegar para Diretório de Contratos
```bash
cd c:\Users\Usuário\Documents\GitHub\stellar-stake-house\contracts\pool_rewards
```

### 2. Compilar Contrato
```bash
# Compilar para WASM
stellar contract build

# Verificar se foi gerado o arquivo .wasm
ls target/wasm32-unknown-unknown/release/
# Deve mostrar: pool_rewards.wasm
```

### 3. Deploy do Contrato
```bash
# Deploy na testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pool_rewards.wasm \
  --source deployer \
  --network testnet

# Anote o CONTRACT_ID retornado:
# Exemplo: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 4. Inicializar Contrato
```bash
# Substituir CONTRACT_ID pelo ID real do contrato
stellar contract invoke \
  --id CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin deployer
```

---

## 🧪 Testes Básicos via CLI

### 1. Criar Pool de Teste
```bash
# Criar uma pool de exemplo
stellar contract invoke \
  --id CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  create_pool \
  --owner deployer \
  --token_symbol "KALE" \
  --total_rewards "100000000000" \
  --max_apy "1500" \
  --distribution_days "30"

# Anote o POOL_ID retornado (geralmente 0 para primeira pool)
```

### 2. Verificar Pool Criada
```bash
stellar contract invoke \
  --id CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  get_pool \
  --pool_id "0"
```

### 3. Listar Pools Ativas
```bash
stellar contract invoke \
  --id CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  get_active_pools
```

---

## 🌐 Configuração para Frontend

### 1. Atualizar Variáveis de Ambiente
```bash
# Adicionar no backend/.env
POOL_REWARDS_CONTRACT_ID=CONTRACT_ID_AQUI
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Adicionar no frontend/.env
VITE_POOL_REWARDS_CONTRACT_ID=CONTRACT_ID_AQUI
VITE_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

### 2. Atualizar Arquivo de Configuração
```javascript
// contracts/contract_config.js
module.exports = {
  networks: {
    testnet: {
      horizonUrl: 'https://horizon-testnet.stellar.org',
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org:443',
      networkPassphrase: 'Test SDF Network ; September 2015',
      contracts: {
        poolRewards: 'CONTRACT_ID_AQUI' // Substituir pelo ID real
      }
    }
  }
}
```

---

## 🔗 Testes via Albedo Wallet

### 1. Configurar Albedo
1. **Instalar Extensão**: https://albedo.link/
2. **Criar/Importar Conta**: Use uma conta de teste
3. **Conectar à Testnet**: Configurações → Network → Testnet
4. **Financiar Conta**: https://laboratory.stellar.org/#account-creator

### 2. Conectar Frontend ao Albedo
```javascript
// Exemplo de conexão no frontend
import albedo from '@albedo-link/intent'

// Conectar carteira
const connectWallet = async () => {
  try {
    const result = await albedo.publicKey({
      token: 'stellar-stake-house',
      callback: 'postMessage'
    })
    console.log('Conectado:', result.pubkey)
    return result.pubkey
  } catch (error) {
    console.error('Erro ao conectar:', error)
  }
}
```

### 3. Testar Criação de Pool via Frontend
1. **Abrir Frontend**: http://localhost:3000
2. **Fazer Login**: Conectar com Albedo
3. **Ir para Projetos**: Clicar na aba "Meus Projetos"
4. **Tornar-se Dono**: Clicar em "Tornar-se Dono de Projeto"
5. **Criar Pool**: Clicar em "Criar Nova Pool"
6. **Preencher Dados**:
   - Nome: "Pool Teste Albedo"
   - Token: KALE
   - Total Recompensas: 10000
   - APY: 15%
   - Dias: 30
7. **Confirmar**: Albedo abrirá para assinar transação

### 4. Testar Delegação via Frontend
1. **Ver Pools Ativas**: Na seção "Pools Ativas"
2. **Delegar Tokens**: Clicar em "Delegar" em uma pool
3. **Inserir Quantidade**: Ex: 1000 KALE
4. **Confirmar**: Assinar transação no Albedo

---

## 📊 Verificação e Monitoramento

### 1. Explorer Stellar Testnet
- **Horizon**: https://horizon-testnet.stellar.org/
- **Laboratory**: https://laboratory.stellar.org/
- **StellarExpert**: https://stellar.expert/explorer/testnet

### 2. Verificar Transações
```bash
# Ver histórico da conta
stellar account --account deployer --network testnet

# Ver detalhes de uma transação específica
curl "https://horizon-testnet.stellar.org/transactions/TRANSACTION_HASH"
```

### 3. Logs do Contrato
```bash
# Ver eventos do contrato
stellar contract invoke \
  --id CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  get_pool_events \
  --pool_id "0"
```

---

## 🧪 Casos de Teste Completos

### Teste 1: Fluxo Completo de Pool
```bash
# 1. Criar pool
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- create_pool --owner deployer --token_symbol "KALE" --total_rewards "100000000000" --max_apy "1500" --distribution_days "30"

# 2. Verificar pool criada
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- get_pool --pool_id "0"

# 3. Delegar para pool
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- delegate_to_pool --pool_id "0" --user deployer --amount "10000000000"

# 4. Verificar delegação
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- get_user_delegations --user deployer

# 5. Calcular recompensas pendentes
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- calculate_pending_rewards --pool_id "0" --user deployer

# 6. Reivindicar recompensas
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- claim_rewards --pool_id "0" --user deployer
```

### Teste 2: Gestão de Pool
```bash
# 1. Pausar pool
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- toggle_pool_status --pool_id "0" --owner deployer

# 2. Verificar status
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- get_pool --pool_id "0"

# 3. Reativar pool
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- toggle_pool_status --pool_id "0" --owner deployer
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Compilação
```bash
# Limpar cache e recompilar
cargo clean
stellar contract build
```

#### 2. Erro de Deploy
```bash
# Verificar saldo da conta
stellar account --account deployer --network testnet

# Financiar novamente se necessário
stellar keys fund deployer --network testnet
```

#### 3. Erro de Invocação
```bash
# Verificar se contrato foi inicializado
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- get_admin
```

#### 4. Albedo Não Conecta
- Verificar se está na rede testnet
- Limpar cache do navegador
- Recarregar extensão

### Logs Úteis
```bash
# Ver logs detalhados
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet --verbose -- FUNCTION_NAME

# Ver estrutura do contrato
stellar contract inspect --wasm target/wasm32-unknown-unknown/release/pool_rewards.wasm
```

---

## 📝 Checklist de Testes

### ✅ Deploy e Configuração
- [ ] Stellar CLI instalado e configurado
- [ ] Identidade criada e financiada
- [ ] Contrato compilado com sucesso
- [ ] Contrato deployado na testnet
- [ ] Contrato inicializado
- [ ] Variáveis de ambiente atualizadas

### ✅ Testes via CLI
- [ ] Pool criada com sucesso
- [ ] Pool listada em pools ativas
- [ ] Delegação realizada
- [ ] Recompensas calculadas
- [ ] Recompensas reivindicadas
- [ ] Status da pool alterado

### ✅ Testes via Frontend + Albedo
- [ ] Albedo conectado ao frontend
- [ ] Login realizado com sucesso
- [ ] Pool criada via interface
- [ ] Delegação realizada via interface
- [ ] Analytics exibindo dados corretos
- [ ] Transações confirmadas no explorer

### ✅ Verificação Final
- [ ] Todas as transações visíveis no explorer
- [ ] Logs do contrato funcionando
- [ ] Frontend sincronizado com blockchain
- [ ] Documentação atualizada

---

## 🎯 Próximos Passos

Após completar todos os testes:

1. **Documentar Resultados**: Anotar CONTRACT_ID e transações importantes
2. **Atualizar Configurações**: Garantir que todas as variáveis estão corretas
3. **Testes de Stress**: Criar múltiplas pools e delegações
4. **Preparar Mainnet**: Quando pronto para produção

---

**🚀 Contrato deployado e testado com sucesso na Stellar Testnet!**

*Última atualização: Janeiro 2024*