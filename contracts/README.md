# Contratos Inteligentes Stellar - Pool de Recompensas

Este diretório contém os contratos inteligentes Soroban para o sistema de pools de recompensas da plataforma Stellar Stake House.

## 📋 Visão Geral

O sistema permite que donos de projetos criem pools de recompensas onde usuários podem delegar seus tokens e receber recompensas proporcionais distribuídas automaticamente.

### Funcionalidades Principais

- ✅ **Criação de Pools**: Donos de projetos podem criar pools com parâmetros personalizados
- ✅ **Delegação Segura**: Usuários delegam tokens mantendo controle total
- ✅ **Distribuição Automática**: Recompensas calculadas e distribuídas proporcionalmente
- ✅ **APY Flexível**: Cada pool pode ter seu próprio APY máximo
- ✅ **Controle de Tempo**: Pools têm início e fim definidos
- ✅ **Gestão de Estado**: Pools podem ser pausadas/reativadas pelo dono

## 🏗️ Arquitetura

### Pool Rewards Contract (`pool_rewards`)

Contrato principal que gerencia:
- Criação e gestão de pools de recompensas
- Delegação de tokens por usuários
- Cálculo e distribuição de recompensas
- Controle de acesso e segurança

#### Estruturas de Dados

```rust
// Pool de recompensas
struct Pool {
    id: u64,                    // ID único da pool
    owner: Address,             // Dono da pool
    token_address: Address,     // Endereço do token de recompensa
    total_rewards: i128,        // Total de tokens para distribuir
    max_apy: u32,              // APY máximo em pontos base (1500 = 15%)
    distribution_days: u32,     // Período de distribuição em dias
    daily_distribution: i128,   // Distribuição diária calculada
    distributed_amount: i128,   // Quantidade já distribuída
    start_time: u64,           // Timestamp de início
    end_time: u64,             // Timestamp de fim
    is_active: bool,           // Status da pool
}

// Delegação de usuário
struct Delegation {
    user: Address,              // Endereço do usuário
    pool_id: u64,              // ID da pool
    amount: i128,              // Quantidade delegada
    timestamp: u64,            // Timestamp da delegação
    last_claim: u64,           // Último resgate de recompensas
}
```

## 🚀 Deploy e Configuração

### Pré-requisitos

1. **Rust e Cargo** instalados
2. **Stellar CLI** instalado:
   ```bash
   cargo install --locked stellar-cli
   ```
3. **Conta na Stellar Testnet** com XLM para fees

### Deploy Automático

1. Torne o script executável:
   ```bash
   chmod +x deploy.sh
   ```

2. Execute o deploy:
   ```bash
   ./deploy.sh
   ```

O script irá:
- Configurar a rede testnet
- Criar/verificar identidade do deployer
- Financiar a conta na testnet
- Compilar o contrato
- Fazer deploy na testnet
- Inicializar o contrato
- Criar uma pool de exemplo
- Salvar informações de deploy

### Deploy Manual

1. **Configurar rede**:
   ```bash
   stellar network add \
     --global testnet \
     --rpc-url https://soroban-testnet.stellar.org:443 \
     --network-passphrase "Test SDF Network ; September 2015"
   ```

2. **Criar identidade**:
   ```bash
   stellar keys generate --global deployer --network testnet
   ```

3. **Financiar conta**:
   ```bash
   stellar keys fund deployer --network testnet
   ```

4. **Compilar contrato**:
   ```bash
   cd pool_rewards
   stellar contract build
   ```

5. **Deploy**:
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/pool_rewards.wasm \
     --source deployer \
     --network testnet
   ```

6. **Inicializar**:
   ```bash
   stellar contract invoke \
     --id <CONTRACT_ID> \
     --source deployer \
     --network testnet \
     -- \
     initialize \
     --admin <DEPLOYER_ADDRESS>
   ```

## 🔧 Uso dos Contratos

### Criar Pool de Recompensas

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <OWNER_ACCOUNT> \
  --network testnet \
  -- \
  create_pool \
  --owner <OWNER_ADDRESS> \
  --token_address <TOKEN_CONTRACT_ADDRESS> \
  --total_rewards 1000000000000 \
  --max_apy 1500 \
  --distribution_days 30
```

### Delegar Tokens para Pool

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <USER_ACCOUNT> \
  --network testnet \
  -- \
  delegate_to_pool \
  --user <USER_ADDRESS> \
  --pool_id 1 \
  --amount 10000000000
```

### Resgatar Recompensas

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <USER_ACCOUNT> \
  --network testnet \
  -- \
  claim_rewards \
  --user <USER_ADDRESS> \
  --pool_id 1
```

### Consultar Pool

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ANY_ACCOUNT> \
  --network testnet \
  -- \
  get_pool \
  --pool_id 1
```

### Listar Pools Ativas

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ANY_ACCOUNT> \
  --network testnet \
  -- \
  get_active_pools
```

## 🧪 Testes

Executar testes unitários:

```bash
cd pool_rewards
cargo test
```

Executar testes com logs:

```bash
cargo test -- --nocapture
```

## 🔗 Integração com Frontend

### Configuração

1. Copie o `contract_config.js` para o diretório `src/config/` do frontend
2. Atualize o `.env` com o Contract ID:
   ```env
   REACT_APP_POOL_REWARDS_CONTRACT_ID=<CONTRACT_ID_FROM_DEPLOY>
   ```

### Exemplo de Uso

```javascript
import { getNetworkConfig, CONTRACT_FUNCTIONS } from './config/contract_config'

// Obter configuração da rede
const config = getNetworkConfig('testnet')

// Criar pool
const createPool = async (poolData) => {
  const result = await stellar.contract.invoke({
    contractId: config.contracts.poolRewards,
    method: CONTRACT_FUNCTIONS.poolRewards.write.createPool,
    args: [
      poolData.owner,
      poolData.tokenAddress,
      poolData.totalRewards,
      poolData.maxAPY,
      poolData.distributionDays
    ]
  })
  return result
}
```

## 📊 Monitoramento

Após o deploy, você pode monitorar as transações em:
- **Stellar Expert Testnet**: https://stellar.expert/explorer/testnet
- **StellarChain Testnet**: https://testnet.stellarchain.io

## 🔒 Segurança

### Considerações Importantes

1. **Controle de Acesso**: Apenas o dono da pool pode pausar/despausar
2. **Validações**: Todas as entradas são validadas antes da execução
3. **Overflow Protection**: Proteção contra overflow em cálculos
4. **Emergency Pause**: Administrador pode pausar em emergências
5. **Time Bounds**: Pools têm tempo de vida limitado

### Auditoria

Antes de usar em produção:
- [ ] Revisar código por especialistas em Soroban
- [ ] Executar testes de stress
- [ ] Verificar cálculos de recompensas
- [ ] Testar cenários de edge cases
- [ ] Validar integração com tokens reais

## 📝 Logs e Debugging

Para debug, use:

```bash
# Logs detalhados do Stellar CLI
STELLAR_CLI_LOG=debug stellar contract invoke ...

# Verificar transação específica
stellar transaction hash <TX_HASH> --network testnet
```

## 🤝 Contribuição

Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Adicione testes para novas funcionalidades
4. Execute todos os testes
5. Submeta um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para suporte:
- Abra uma issue no GitHub
- Consulte a documentação oficial do Soroban
- Participe da comunidade Stellar no Discord

---

**⚠️ Aviso**: Este é um ambiente de teste. Não use em produção sem auditoria completa de segurança.