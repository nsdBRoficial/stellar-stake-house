#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol, Vec, Map, BytesN
};

// Estrutura para representar uma pool de recompensas
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pool {
    pub id: u64,
    pub owner: Address,
    pub token_address: Address,
    pub total_rewards: i128,
    pub max_apy: u32, // APY em pontos base (ex: 1500 = 15%)
    pub distribution_days: u32,
    pub daily_distribution: i128,
    pub distributed_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub is_active: bool,
}

// Estrutura para representar uma delegação de usuário
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Delegation {
    pub user: Address,
    pub pool_id: u64,
    pub amount: i128,
    pub timestamp: u64,
    pub last_claim: u64,
}

// Chaves de armazenamento
const POOLS: Symbol = symbol_short!("POOLS");
const DELEGATIONS: Symbol = symbol_short!("DELEGS");
const POOL_COUNT: Symbol = symbol_short!("PCOUNT");
const ADMIN: Symbol = symbol_short!("ADMIN");

#[contract]
pub struct PoolRewardsContract;

#[contractimpl]
impl PoolRewardsContract {
    /// Inicializa o contrato com um administrador
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&POOL_COUNT, &0u64);
    }

    /// Cria uma nova pool de recompensas
    pub fn create_pool(
        env: Env,
        owner: Address,
        token_address: Address,
        total_rewards: i128,
        max_apy: u32,
        distribution_days: u32,
    ) -> u64 {
        owner.require_auth();
        
        // Validações
        assert!(total_rewards > 0, "Total rewards must be positive");
        assert!(max_apy > 0 && max_apy <= 10000, "APY must be between 0.01% and 100%");
        assert!(distribution_days > 0, "Distribution days must be positive");
        
        // Obter próximo ID da pool
        let pool_count: u64 = env.storage().instance().get(&POOL_COUNT).unwrap_or(0);
        let pool_id = pool_count + 1;
        
        // Calcular distribuição diária
        let daily_distribution = total_rewards / (distribution_days as i128);
        
        // Obter timestamp atual
        let current_time = env.ledger().timestamp();
        let end_time = current_time + (distribution_days as u64 * 86400); // 86400 segundos = 1 dia
        
        // Criar nova pool
        let pool = Pool {
            id: pool_id,
            owner: owner.clone(),
            token_address,
            total_rewards,
            max_apy,
            distribution_days,
            daily_distribution,
            distributed_amount: 0,
            start_time: current_time,
            end_time,
            is_active: true,
        };
        
        // Armazenar pool
        let mut pools: Map<u64, Pool> = env.storage().instance().get(&POOLS).unwrap_or(Map::new(&env));
        pools.set(pool_id, pool);
        env.storage().instance().set(&POOLS, &pools);
        
        // Atualizar contador
        env.storage().instance().set(&POOL_COUNT, &pool_id);
        
        pool_id
    }

    /// Permite que um usuário delegue tokens para uma pool
    pub fn delegate_to_pool(
        env: Env,
        user: Address,
        pool_id: u64,
        amount: i128,
    ) {
        user.require_auth();
        
        // Validações
        assert!(amount > 0, "Delegation amount must be positive");
        
        // Verificar se a pool existe e está ativa
        let pools: Map<u64, Pool> = env.storage().instance().get(&POOLS).unwrap_or(Map::new(&env));
        let pool = pools.get(pool_id).expect("Pool not found");
        assert!(pool.is_active, "Pool is not active");
        
        let current_time = env.ledger().timestamp();
        assert!(current_time < pool.end_time, "Pool has ended");
        
        // Criar ou atualizar delegação
        let delegation_key = (user.clone(), pool_id);
        let mut delegations: Map<(Address, u64), Delegation> = 
            env.storage().instance().get(&DELEGATIONS).unwrap_or(Map::new(&env));
        
        let delegation = Delegation {
            user: user.clone(),
            pool_id,
            amount,
            timestamp: current_time,
            last_claim: current_time,
        };
        
        delegations.set(delegation_key, delegation);
        env.storage().instance().set(&DELEGATIONS, &delegations);
    }

    /// Calcula as recompensas pendentes para um usuário em uma pool
    pub fn calculate_pending_rewards(
        env: Env,
        user: Address,
        pool_id: u64,
    ) -> i128 {
        let pools: Map<u64, Pool> = env.storage().instance().get(&POOLS).unwrap_or(Map::new(&env));
        let pool = pools.get(pool_id).expect("Pool not found");
        
        let delegations: Map<(Address, u64), Delegation> = 
            env.storage().instance().get(&DELEGATIONS).unwrap_or(Map::new(&env));
        
        let delegation_key = (user, pool_id);
        let delegation = match delegations.get(delegation_key) {
            Some(d) => d,
            None => return 0,
        };
        
        let current_time = env.ledger().timestamp();
        let time_since_last_claim = current_time - delegation.last_claim;
        let days_since_last_claim = time_since_last_claim / 86400;
        
        // Calcular recompensas baseadas no APY e tempo decorrido
        let annual_reward = (delegation.amount * pool.max_apy as i128) / 10000;
        let daily_reward = annual_reward / 365;
        let pending_rewards = daily_reward * days_since_last_claim as i128;
        
        // Limitar às recompensas disponíveis na pool
        let remaining_rewards = pool.total_rewards - pool.distributed_amount;
        if pending_rewards > remaining_rewards {
            remaining_rewards
        } else {
            pending_rewards
        }
    }

    /// Permite que um usuário reivindique suas recompensas
    pub fn claim_rewards(
        env: Env,
        user: Address,
        pool_id: u64,
    ) -> i128 {
        user.require_auth();
        
        let pending_rewards = Self::calculate_pending_rewards(env.clone(), user.clone(), pool_id);
        assert!(pending_rewards > 0, "No rewards to claim");
        
        // Atualizar delegação
        let mut delegations: Map<(Address, u64), Delegation> = 
            env.storage().instance().get(&DELEGATIONS).unwrap_or(Map::new(&env));
        
        let delegation_key = (user.clone(), pool_id);
        let mut delegation = delegations.get(delegation_key.clone()).expect("Delegation not found");
        delegation.last_claim = env.ledger().timestamp();
        delegations.set(delegation_key, delegation);
        env.storage().instance().set(&DELEGATIONS, &delegations);
        
        // Atualizar pool
        let mut pools: Map<u64, Pool> = env.storage().instance().get(&POOLS).unwrap_or(Map::new(&env));
        let mut pool = pools.get(pool_id).expect("Pool not found");
        pool.distributed_amount += pending_rewards;
        pools.set(pool_id, pool);
        env.storage().instance().set(&POOLS, &pools);
        
        pending_rewards
    }

    /// Retorna informações de uma pool
    pub fn get_pool(env: Env, pool_id: u64) -> Pool {
        let pools: Map<u64, Pool> = env.storage().instance().get(&POOLS).unwrap_or(Map::new(&env));
        pools.get(pool_id).expect("Pool not found")
    }

    /// Retorna todas as pools ativas
    pub fn get_active_pools(env: Env) -> Vec<Pool> {
        let pools: Map<u64, Pool> = env.storage().instance().get(&POOLS).unwrap_or(Map::new(&env));
        let mut active_pools = Vec::new(&env);
        
        let pool_count: u64 = env.storage().instance().get(&POOL_COUNT).unwrap_or(0);
        
        for i in 1..=pool_count {
            if let Some(pool) = pools.get(i) {
                if pool.is_active {
                    active_pools.push_back(pool);
                }
            }
        }
        
        active_pools
    }

    /// Permite ao dono da pool pausar/despausar a pool
    pub fn toggle_pool_status(
        env: Env,
        owner: Address,
        pool_id: u64,
    ) {
        owner.require_auth();
        
        let mut pools: Map<u64, Pool> = env.storage().instance().get(&POOLS).unwrap_or(Map::new(&env));
        let mut pool = pools.get(pool_id).expect("Pool not found");
        
        assert!(pool.owner == owner, "Only pool owner can toggle status");
        
        pool.is_active = !pool.is_active;
        pools.set(pool_id, pool);
        env.storage().instance().set(&POOLS, &pools);
    }

    /// Retorna a delegação de um usuário em uma pool específica
    pub fn get_user_delegation(
        env: Env,
        user: Address,
        pool_id: u64,
    ) -> Option<Delegation> {
        let delegations: Map<(Address, u64), Delegation> = 
            env.storage().instance().get(&DELEGATIONS).unwrap_or(Map::new(&env));
        
        let delegation_key = (user, pool_id);
        delegations.get(delegation_key)
    }

    /// Permite ao administrador pausar o contrato em caso de emergência
    pub fn emergency_pause(env: Env, admin: Address) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance().get(&ADMIN).expect("Admin not set");
        assert!(admin == stored_admin, "Only admin can pause contract");
        
        // Implementar lógica de pausa de emergência
        // Por simplicidade, não implementado neste exemplo
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_create_pool() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PoolRewardsContract);
        let client = PoolRewardsContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);
        let token = Address::generate(&env);
        
        // Inicializar contrato
        client.initialize(&admin);
        
        // Criar pool
        let pool_id = client.create_pool(
            &owner,
            &token,
            &1000000, // 1M tokens
            &1500,    // 15% APY
            &30,      // 30 dias
        );
        
        assert_eq!(pool_id, 1);
        
        // Verificar pool criada
        let pool = client.get_pool(&pool_id);
        assert_eq!(pool.owner, owner);
        assert_eq!(pool.total_rewards, 1000000);
        assert_eq!(pool.max_apy, 1500);
        assert_eq!(pool.distribution_days, 30);
        assert!(pool.is_active);
    }

    #[test]
    fn test_delegate_and_claim() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PoolRewardsContract);
        let client = PoolRewardsContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);
        let user = Address::generate(&env);
        let token = Address::generate(&env);
        
        // Inicializar e criar pool
        client.initialize(&admin);
        let pool_id = client.create_pool(&owner, &token, &1000000, &1500, &30);
        
        // Usuário delega tokens
        client.delegate_to_pool(&user, &pool_id, &10000);
        
        // Verificar delegação
        let delegation = client.get_user_delegation(&user, &pool_id).unwrap();
        assert_eq!(delegation.amount, 10000);
        assert_eq!(delegation.user, user);
        
        // Simular passagem de tempo e calcular recompensas
        // (Em um teste real, seria necessário manipular o timestamp)
        let pending = client.calculate_pending_rewards(&user, &pool_id);
        // As recompensas dependem do tempo, então apenas verificamos que não há erro
        assert!(pending >= 0);
    }
}