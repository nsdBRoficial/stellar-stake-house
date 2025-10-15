// Serviço simples para integrar com o Horizon (sem SDK pesado)
// Lê a rede de `import.meta.env.VITE_STELLAR_NETWORK` e resolve a base URL

const NETWORK = (import.meta?.env?.VITE_STELLAR_NETWORK || 'testnet').toLowerCase()

function getHorizonBaseUrl() {
  return NETWORK === 'public'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org'
}

/**
 * Busca dados da conta no Horizon
 * @param {string} publicKey
 * @returns {Promise<object>} account json
 */
export async function fetchAccount(publicKey) {
  const base = getHorizonBaseUrl()
  const url = `${base}/accounts/${publicKey}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Horizon account error ${res.status}: ${text}`)
  }
  return res.json()
}

/**
 * Busca pagamentos recentes da conta
 * @param {string} publicKey
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
export async function fetchRecentPayments(publicKey, limit = 10) {
  const base = getHorizonBaseUrl()
  const url = `${base}/accounts/${publicKey}/payments?order=desc&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Horizon payments error ${res.status}: ${text}`)
  }
  const data = await res.json()
  // Em Horizon v1, a resposta pode ter _embedded.records; em v0, pode ser array
  const records = Array.isArray(data) ? data : (data?._embedded?.records || [])
  return records
}

/**
 * Utilitário para extrair saldo nativo XLM e ativos da conta
 * @param {object} accountJson
 * @returns {{xlm:number, assets:Array<{code:string, issuer:string, balance:number}>}}
 */
export function parseBalances(accountJson) {
  const balances = accountJson?.balances || []
  let xlm = 0
  const assets = []

  for (const b of balances) {
    if (b.asset_type === 'native') {
      xlm = parseFloat(b.balance || '0')
    } else {
      assets.push({
        code: b.asset_code,
        issuer: b.asset_issuer,
        balance: parseFloat(b.balance || '0')
      })
    }
  }
  return { xlm, assets }
}

/**
 * Mapeia pagamentos Horizon em estrutura simples para UI
 */
export function mapPaymentsToTransactions(records) {
  return records.map((r) => {
    const isIncoming = r?.to === r?.account || r?.to === r?.destination
    const amount = parseFloat(r?.amount || '0')
    const assetCode = r?.asset_type === 'native' ? 'XLM' : (r?.asset_code || 'ASSET')
    const createdAt = r?.created_at || r?.timestamp || new Date().toISOString()
    return {
      id: r?.id || r?.paging_token || `${createdAt}-${amount}`,
      type: isIncoming ? 'receive' : 'send',
      token: assetCode,
      amount,
      date: createdAt,
      status: 'completed',
      hash: r?.transaction_hash || r?.id || undefined
    }
  })
}

export function getNetwork() {
  return NETWORK
}