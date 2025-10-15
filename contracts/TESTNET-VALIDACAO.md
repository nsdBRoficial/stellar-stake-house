# ✅ Validação na Testnet: PoolRewards (delegação sem transferência)

Este guia valida e testa as novas funções do contrato `PoolRewardsContract` na Stellar Testnet: `create_pool`, `opt_in`, `deposit_rewards`, `sync_delegation`, `calculate_pending_rewards` e `claim_rewards`.

## Pré-requisitos

- `stellar` CLI instalado e configurado
- Conta(s) financiadas via Friendbot
- Contrato compilado e deployado (ou use o ID existente)
- Contratos de token (stake e recompensa) disponíveis na testnet

## 1) Configurar rede e identidades

```powershell
# Adicionar rede testnet
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Criar identidade do deployer (se necessário)
stellar keys generate --global deployer --network testnet

# Criar um usuário de teste
stellar keys generate --global user1 --network testnet

# Financiar contas
stellar keys fund deployer --network testnet
stellar keys fund user1 --network testnet

# Ver endereços
stellar keys address deployer
stellar keys address user1
```

## 2) Build e Deploy do contrato

```powershell
# Ir ao diretório do contrato
cd contracts/pool_rewards

# Compilar
stellar contract build

# Deploy (retorna o Contract ID iniciado com 'C')
$CONTRACT_ID = stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pool_rewards.wasm \
  --source deployer \
  --network testnet

# Inicializar
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin deployer
```

Observação: você também pode usar o script `contracts/deploy.sh` (Git Bash/WSL).

## 3) Tokens de stake e recompensa

Você precisa de dois contratos de token (SEP-41 compatível):

- `STAKE_TOKEN_ADDRESS`: define a participação (ex: KALE)
- `REWARD_TOKEN_ADDRESS`: token usado para pagar recompensas (ex: USDC/USDT)

Opções:

- Usar tokens já deployados na testnet (endereços existentes)
- Deployar um token de exemplo e inicializar com `initialize --admin --decimal --name --symbol` e depois `mint` para o `deployer`

Exemplo genérico de inicialização de token (após deploy do wasm do token):

```powershell
stellar contract invoke \
  --id <TOKEN_CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin deployer \
  --decimal 7 \
  --name "KALE Token" \
  --symbol "KALE"

# Mint de recompensa para o owner (deployer)
stellar contract invoke \
  --id <REWARD_TOKEN_CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- mint \
  --to deployer \
  --amount 10000000000
```

## 4) Criar a pool

```powershell
# Substitua os endereços abaixo pelos seus contratos de token
$STAKE_TOKEN = CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN4YU
$REWARD_TOKEN = CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN4YU

# Criar a pool
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- create_pool \
  --owner deployer \
  --stake_token $STAKE_TOKEN \
  --reward_token $REWARD_TOKEN \
  --total_rewards 1000000000000 \
  --max_apy 1500 \
  --distribution_days 30
```

Anote o `pool_id` retornado.

## 5) Opt-in do usuário

```powershell
# user1 opta por participar
stellar contract invoke \
  --id $CONTRACT_ID \
  --source user1 \
  --network testnet \
  -- opt_in \
  --user user1 \
  --pool_id 1
```

## 6) Depositar recompensas na pool (owner)

```powershell
# Depositar recompensas (transfer do owner -> contrato via interface do token)
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- deposit_rewards \
  --owner deployer \
  --pool_id 1 \
  --amount 50000000000
```

## 7) Sincronizar delegação com saldo do token de stake (on-chain)

```powershell
# user1 sincroniza sua delegação com o saldo atual
stellar contract invoke \
  --id $CONTRACT_ID \
  --source user1 \
  --network testnet \
  -- sync_delegation \
  --user user1 \
  --pool_id 1
```

## 8) Calcular recompensas pendentes

```powershell
stellar contract invoke \
  --id $CONTRACT_ID \
  --source user1 \
  --network testnet \
  -- calculate_pending_rewards \
  --user user1 \
  --pool_id 1
```

## 9) Claim de recompensas (pagamento on-chain)

```powershell
stellar contract invoke \
  --id $CONTRACT_ID \
  --source user1 \
  --network testnet \
  -- claim_rewards \
  --user user1 \
  --pool_id 1
```

## 10) Verificações e Explorer

- Ver histórico de contas: `stellar account --account user1 --network testnet`
- Conferir transações no Stellar Expert: `https://stellar.expert/explorer/testnet`
- Obter detalhes de transação via Horizon: `curl https://horizon-testnet.stellar.org/transactions/<TX_HASH>`

## Dicas de Debug

```powershell
# Verbose
stellar contract invoke --id $CONTRACT_ID --source deployer --network testnet --verbose -- get_pool --pool_id 1

# Inspeção do wasm
stellar contract inspect --wasm target/wasm32-unknown-unknown/release/pool_rewards.wasm
```

## Critérios de Validação

- Deploy e `initialize` executados sem erro
- `create_pool` retorna `pool_id` válido
- `opt_in` grava o consentimento (sem erro)
- `deposit_rewards` aumenta `total_rewards`
- `sync_delegation` atualiza a delegação do usuário
- `calculate_pending_rewards` retorna valor positivo após tempo decorrido
- `claim_rewards` reduz `total_rewards` e registra a transferência via token

## Observações

- Os endereços de token devem seguir a interface SEP-41
- O `deployer` precisa possuir saldo no token de recompensa para depósitos
- Em caso de erro de autorização, valide `--source` e argumentos