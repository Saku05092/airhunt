/**
 * On-chain data fetching library for AirHunt.
 *
 * Fetches on-chain activity for a wallet address using free public APIs.
 * No API keys required for the initial implementation.
 *
 * Supported chains:
 * - Ethereum (Etherscan)
 * - Arbitrum (Arbiscan)
 * - Optimism (Optimistic Etherscan)
 * - Base (Basescan)
 * - Polygon (Polygonscan)
 * - Solana (JSON-RPC) [placeholder]
 */

import type { Chain, ProtocolInteraction, OnchainActivity, WalletSummary } from "./types";

// Re-export types from canonical source
export type { ProtocolInteraction, OnchainActivity, WalletSummary };

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

// OnchainActivity fields (used internally for construction, canonical type in types.ts)
type OnchainActivityFields = {
  readonly address: string;
  readonly chain: string;
  readonly totalTransactions: number;
  readonly firstActivity: string | null;
  readonly lastActivity: string | null;
  readonly uniqueContracts: number;
  readonly totalGasUsedETH: string;
  readonly bridgeTransactions: number;
  readonly swapTransactions: number;
  readonly nftMints: number;
  readonly protocols: readonly ProtocolInteraction[];
  readonly fetchedAt: string;
};

// ---------------------------------------------------------------------------
// Chain configuration
// ---------------------------------------------------------------------------

interface EVMChainConfig {
  readonly baseUrl: string;
  readonly nativeSymbol: string;
  readonly nativeDecimals: number;
}

const EVM_CHAIN_CONFIG: Record<string, EVMChainConfig> = {
  ethereum: {
    baseUrl: "https://api.etherscan.io/api",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
  },
  arbitrum: {
    baseUrl: "https://api.arbiscan.io/api",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
  },
  optimism: {
    baseUrl: "https://api-optimistic.etherscan.io/api",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
  },
  base: {
    baseUrl: "https://api.basescan.org/api",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
  },
  polygon: {
    baseUrl: "https://api.polygonscan.com/api",
    nativeSymbol: "MATIC",
    nativeDecimals: 18,
  },
};

const EVM_CHAINS: readonly Chain[] = [
  "ethereum",
  "arbitrum",
  "optimism",
  "base",
  "polygon",
];

// ---------------------------------------------------------------------------
// Known protocol addresses (lowercase)
// ---------------------------------------------------------------------------

const KNOWN_PROTOCOLS: Readonly<Record<string, string>> = {
  // Bridges
  "0x3154cf16ccdb4c6d922629664174b904d80f2c35": "Arbitrum Bridge",
  "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1": "Optimism Bridge",
  "0x49048044d57e1c92a77f79988d21fa8faf74e97e": "Base Bridge",
  "0x2a3dd3eb832af982ec71669e178424b10dca2ede": "Polygon Bridge",
  // DEX Routers
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap V3",
  "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b": "Uniswap Universal",
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Uniswap Universal V2",
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f": "SushiSwap",
  "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch V5",
  "0x1111111254fb6c44bac0bed2854e76f90643097d": "1inch V4",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Protocol",
  // Lending
  "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": "Aave V2",
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": "Aave V3",
  "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b": "Compound",
};

const BRIDGE_ADDRESSES: ReadonlySet<string> = new Set([
  "0x3154cf16ccdb4c6d922629664174b904d80f2c35",
  "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1",
  "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
  "0x2a3dd3eb832af982ec71669e178424b10dca2ede",
]);

const DEX_ADDRESSES: ReadonlySet<string> = new Set([
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b",
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f",
  "0x1111111254eeb25477b68fb85ed929f73a960582",
  "0x1111111254fb6c44bac0bed2854e76f90643097d",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
]);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const lastCallTimestamps: Record<string, number> = {};

async function rateLimit(chain: string): Promise<void> {
  const now = Date.now();
  const last = lastCallTimestamps[chain] ?? 0;
  const elapsed = now - last;
  const minInterval = 200;

  if (elapsed < minInterval) {
    await sleep(minInterval - elapsed);
  }

  lastCallTimestamps[chain] = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Internal fetch helpers
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface EtherscanTx {
  readonly hash: string;
  readonly from: string;
  readonly to: string;
  readonly timeStamp: string;
  readonly gasUsed: string;
  readonly gasPrice: string;
  readonly isError: string;
  readonly contractAddress: string;
}

interface EtherscanResponse {
  readonly status: string;
  readonly message: string;
  readonly result: readonly EtherscanTx[] | string;
}

async function fetchEtherscanEndpoint(
  baseUrl: string,
  chain: string,
  params: Record<string, string>,
): Promise<readonly EtherscanTx[]> {
  await rateLimit(chain);

  const searchParams = new URLSearchParams(params);
  const url = `${baseUrl}?${searchParams.toString()}`;

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as EtherscanResponse;

    if (data.status !== "1" || !Array.isArray(data.result)) {
      return [];
    }

    return data.result as readonly EtherscanTx[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Address validation
// ---------------------------------------------------------------------------

function isValidEVMAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// ---------------------------------------------------------------------------
// Gas calculation helpers
// ---------------------------------------------------------------------------

function computeTotalGasETH(txs: readonly EtherscanTx[]): string {
  let totalWei = BigInt(0);

  for (const tx of txs) {
    try {
      const gasUsed = BigInt(tx.gasUsed || "0");
      const gasPrice = BigInt(tx.gasPrice || "0");
      totalWei += gasUsed * gasPrice;
    } catch {
      // Skip invalid entries
    }
  }

  // Convert BigInt wei to ETH string without Number precision loss
  return bigintWeiToEth(totalWei);
}

function bigintWeiToEth(wei: bigint): string {
  const divisor = BigInt("1000000000000000000"); // 1e18
  const whole = wei / divisor;
  const remainder = wei % divisor;
  // Pad remainder to 18 digits, take first 6 for display
  const remainderStr = remainder.toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${remainderStr}`;
}

// ---------------------------------------------------------------------------
// Protocol detection helpers
// ---------------------------------------------------------------------------

function buildProtocolInteractions(
  txs: readonly EtherscanTx[],
): readonly ProtocolInteraction[] {
  const protocolMap = new Map<
    string,
    { readonly name: string; txCount: number; lastTimestamp: number }
  >();

  for (const tx of txs) {
    const to = (tx.to ?? "").toLowerCase();
    const protocolName = KNOWN_PROTOCOLS[to];

    if (protocolName !== undefined) {
      const existing = protocolMap.get(to);
      const ts = Number(tx.timeStamp) * 1000;

      if (existing !== undefined) {
        protocolMap.set(to, {
          ...existing,
          txCount: existing.txCount + 1,
          lastTimestamp: Math.max(existing.lastTimestamp, ts),
        });
      } else {
        protocolMap.set(to, {
          name: protocolName,
          txCount: 1,
          lastTimestamp: ts,
        });
      }
    }
  }

  const result: ProtocolInteraction[] = [];
  for (const [address, info] of protocolMap.entries()) {
    result.push({
      address,
      name: info.name,
      txCount: info.txCount,
      lastInteraction: new Date(info.lastTimestamp).toISOString(),
    });
  }

  return result.sort((a, b) => b.txCount - a.txCount);
}

function countBridgeTx(txs: readonly EtherscanTx[]): number {
  let count = 0;
  for (const tx of txs) {
    if (BRIDGE_ADDRESSES.has((tx.to ?? "").toLowerCase())) {
      count += 1;
    }
  }
  return count;
}

function countSwapTx(txs: readonly EtherscanTx[]): number {
  let count = 0;
  for (const tx of txs) {
    if (DEX_ADDRESSES.has((tx.to ?? "").toLowerCase())) {
      count += 1;
    }
  }
  return count;
}

function countUniqueContracts(txs: readonly EtherscanTx[]): number {
  const addresses = new Set<string>();
  for (const tx of txs) {
    const to = (tx.to ?? "").toLowerCase();
    if (to !== "" && to !== ZERO_ADDRESS) {
      addresses.add(to);
    }
  }
  return addresses.size;
}

function txTimestampToISO(ts: string): string | null {
  const num = Number(ts);
  if (Number.isNaN(num) || num === 0) return null;
  return new Date(num * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Public API: EVM Activity
// ---------------------------------------------------------------------------

export async function fetchEVMActivity(
  address: string,
  chain: Chain,
): Promise<OnchainActivity> {
  const empty: OnchainActivity = {
    address,
    chain,
    totalTransactions: 0,
    firstActivity: null,
    lastActivity: null,
    uniqueContracts: 0,
    totalGasUsedETH: "0.000000",
    bridgeTransactions: 0,
    swapTransactions: 0,
    nftMints: 0,
    protocols: [],
    fetchedAt: new Date().toISOString(),
  };

  if (!isValidEVMAddress(address)) {
    return empty;
  }

  const config = EVM_CHAIN_CONFIG[chain];
  if (config === undefined) {
    return empty;
  }

  const txs = await fetchEtherscanEndpoint(config.baseUrl, chain, {
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
    page: "1",
    offset: "100",
  });

  if (txs.length === 0) {
    return empty;
  }

  // Transactions come sorted desc; last element is earliest
  const lastTx = txs[0];
  const firstTx = txs[txs.length - 1];

  return {
    address,
    chain,
    totalTransactions: txs.length,
    firstActivity: txTimestampToISO(firstTx.timeStamp),
    lastActivity: txTimestampToISO(lastTx.timeStamp),
    uniqueContracts: countUniqueContracts(txs),
    totalGasUsedETH: computeTotalGasETH(txs),
    bridgeTransactions: countBridgeTx(txs),
    swapTransactions: countSwapTx(txs),
    nftMints: 0, // populated by fetchEVMNFTTransfers
    protocols: buildProtocolInteractions(txs),
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API: EVM Token Transfers
// ---------------------------------------------------------------------------

export interface TokenTransferSummary {
  readonly totalTransfers: number;
  readonly uniqueTokens: number;
}

export async function fetchEVMTokenTransfers(
  address: string,
  chain: Chain,
): Promise<TokenTransferSummary> {
  const empty: TokenTransferSummary = {
    totalTransfers: 0,
    uniqueTokens: 0,
  };

  if (!isValidEVMAddress(address)) {
    return empty;
  }

  const config = EVM_CHAIN_CONFIG[chain];
  if (config === undefined) {
    return empty;
  }

  const txs = await fetchEtherscanEndpoint(config.baseUrl, chain, {
    module: "account",
    action: "tokentx",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
    page: "1",
    offset: "100",
  });

  const uniqueTokens = new Set<string>();
  for (const tx of txs) {
    const contractAddr = (tx.contractAddress ?? "").toLowerCase();
    if (contractAddr !== "") {
      uniqueTokens.add(contractAddr);
    }
  }

  return {
    totalTransfers: txs.length,
    uniqueTokens: uniqueTokens.size,
  };
}

// ---------------------------------------------------------------------------
// Public API: EVM NFT Transfers (mint detection)
// ---------------------------------------------------------------------------

export async function fetchEVMNFTTransfers(
  address: string,
  chain: Chain,
): Promise<number> {
  if (!isValidEVMAddress(address)) {
    return 0;
  }

  const config = EVM_CHAIN_CONFIG[chain];
  if (config === undefined) {
    return 0;
  }

  const txs = await fetchEtherscanEndpoint(config.baseUrl, chain, {
    module: "account",
    action: "tokennfttx",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
    page: "1",
    offset: "100",
  });

  // A mint is when from is the zero address
  let mintCount = 0;
  for (const tx of txs) {
    if ((tx.from ?? "").toLowerCase() === ZERO_ADDRESS) {
      mintCount += 1;
    }
  }

  return mintCount;
}

// ---------------------------------------------------------------------------
// Public API: Full chain activity (combines tx + NFT data)
// ---------------------------------------------------------------------------

export async function fetchFullChainActivity(
  address: string,
  chain: Chain,
): Promise<OnchainActivity> {
  const activity = await fetchEVMActivity(address, chain);
  const nftMints = await fetchEVMNFTTransfers(address, chain);

  return {
    ...activity,
    nftMints,
  };
}

// ---------------------------------------------------------------------------
// Public API: Wallet Summary
// ---------------------------------------------------------------------------

// Approximate prices - updated periodically
// TODO: Replace with live price feed (CoinGecko API)
const CHAIN_NATIVE_PRICES_USD: Record<string, number> = {
  ethereum: 3500,
  arbitrum: 3500,
  optimism: 3500,
  base: 3500,
  polygon: 0.5,
  solana: 150,
};

export function setChainPrice(chain: string, price: number): void {
  CHAIN_NATIVE_PRICES_USD[chain] = price;
}

export async function fetchWalletSummary(
  address: string,
  chains: readonly Chain[] = EVM_CHAINS,
): Promise<WalletSummary> {
  const chainActivities: OnchainActivity[] = [];

  // Fetch each chain sequentially to respect rate limits
  for (const chain of chains) {
    if (chain === "solana") {
      // Solana support is a placeholder for now
      continue;
    }

    try {
      const activity = await fetchFullChainActivity(address, chain);
      chainActivities.push(activity);
    } catch {
      // Skip chains that fail; return partial data
    }
  }

  const totalTxAcrossChains = chainActivities.reduce(
    (sum, a) => sum + a.totalTransactions,
    0,
  );

  const activeChains = chainActivities.filter(
    (a) => a.totalTransactions > 0,
  ).length;

  let estimatedGasUSD = 0;
  for (const activity of chainActivities) {
    const gasETH = parseFloat(activity.totalGasUsedETH);
    const priceUSD = CHAIN_NATIVE_PRICES_USD[activity.chain] ?? 0;
    estimatedGasUSD += gasETH * priceUSD;
  }

  return {
    address,
    chains: chainActivities,
    totalTxAcrossChains,
    activeChains,
    estimatedGasSpentUSD: estimatedGasUSD.toFixed(2),
  };
}
