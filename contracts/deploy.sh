#!/bin/bash

# Script para deploy dos contratos Stellar na testnet
# Certifique-se de ter o Stellar CLI instalado e configurado

set -e

echo "🚀 Iniciando deploy dos contratos Stellar na testnet..."

# Verificar se o Stellar CLI está instalado
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI não encontrado. Instale com:"
    echo "cargo install --locked stellar-cli"
    exit 1
fi

# Configurar rede testnet
echo "📡 Configurando rede testnet..."
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Verificar se a identidade existe, se não, criar uma
echo "🔑 Verificando identidade..."
if ! stellar keys show deployer &> /dev/null; then
    echo "Criando nova identidade 'deployer'..."
    stellar keys generate --global deployer --network testnet
else
    echo "Identidade 'deployer' já existe."
fi

# Obter endereço da conta
DEPLOYER_ADDRESS=$(stellar keys address deployer)
echo "📍 Endereço do deployer: $DEPLOYER_ADDRESS"

# Financiar conta na testnet (se necessário)
echo "💰 Verificando saldo da conta..."
stellar keys fund deployer --network testnet || echo "Conta já financiada ou erro no funding"

# Navegar para o diretório do contrato
cd pool_rewards

echo "🔨 Compilando contrato pool_rewards..."
# Compilar o contrato
stellar contract build

echo "📦 Fazendo deploy do contrato pool_rewards..."
# Deploy do contrato
CONTRAT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pool_rewards.wasm \
  --source deployer \
  --network testnet)

echo "✅ Contrato pool_rewards deployado com sucesso!"
echo "📋 Contract ID: $CONTRAT_ID"

# Salvar o contract ID em um arquivo
echo "$CONTRAT_ID" > ../contract_id.txt
echo "💾 Contract ID salvo em contract_id.txt"

# Inicializar o contrato
echo "🔧 Inicializando contrato..."
stellar contract invoke \
  --id $CONTRAT_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin $DEPLOYER_ADDRESS

echo "✅ Contrato inicializado com sucesso!"

# Criar um exemplo de pool para teste
echo "🎯 Criando pool de exemplo para teste..."

# Endereço de token fictício para teste (KALE)
TOKEN_ADDRESS="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN4YU"

POOL_ID=$(stellar contract invoke \
  --id $CONTRAT_ID \
  --source deployer \
  --network testnet \
  -- \
  create_pool \
  --owner $DEPLOYER_ADDRESS \
  --token_address $TOKEN_ADDRESS \
  --total_rewards 1000000000000 \
  --max_apy 1500 \
  --distribution_days 30)

echo "✅ Pool de exemplo criada com ID: $POOL_ID"

# Salvar informações de deploy
cat > ../deployment_info.json << EOF
{
  "network": "testnet",
  "contract_id": "$CONTRAT_ID",
  "deployer_address": "$DEPLOYER_ADDRESS",
  "example_pool_id": $POOL_ID,
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "rpc_url": "https://soroban-testnet.stellar.org:443",
  "network_passphrase": "Test SDF Network ; September 2015"
}
EOF

echo "📄 Informações de deploy salvas em deployment_info.json"

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   Contract ID: $CONTRAT_ID"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo "   Pool de exemplo: $POOL_ID"
echo "   Rede: Stellar Testnet"
echo ""
echo "🔗 Para interagir com o contrato:"
echo "   stellar contract invoke --id $CONTRAT_ID --source deployer --network testnet -- <function_name> <args>"
echo ""
echo "📚 Funções disponíveis:"
echo "   - create_pool: Criar nova pool de recompensas"
echo "   - delegate_to_pool: Delegar tokens para uma pool"
echo "   - claim_rewards: Reivindicar recompensas"
echo "   - get_pool: Obter informações de uma pool"
echo "   - get_active_pools: Listar pools ativas"
echo "   - calculate_pending_rewards: Calcular recompensas pendentes"
echo ""
echo "🧪 Para testar na aplicação, use o Contract ID: $CONTRAT_ID"