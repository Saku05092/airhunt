export type Tier = "S" | "A" | "B" | "C";
export type CampaignStatus = "active" | "upcoming" | "ended";
export type RiskLevel = "low" | "medium" | "high";
export type Chain = "ethereum" | "arbitrum" | "optimism" | "base" | "polygon" | "solana";
export type Plan = "free" | "pro" | "unlimited";

export interface Campaign {
  readonly id: string;
  readonly name: string;
  readonly ticker: string;
  readonly category: string;
  readonly chain: string;
  readonly tier: Tier;
  readonly status: CampaignStatus;
  readonly tgeCompleted: boolean;
  readonly description: string;
  readonly estimatedValue: string;
  readonly fundingRaised: string;
  readonly backers: readonly string[];
  readonly website: string;
  readonly twitter: string;
  readonly referralLink: string;
  readonly referralReward: string;
  readonly deadline: string;
  readonly riskLevel: RiskLevel;
  readonly tasks: readonly CampaignTask[];
}

export interface CampaignTask {
  readonly id: string;
  readonly campaignId: string;
  readonly title: string;
  readonly description: string;
  readonly sortOrder: number;
  readonly isTemplate: boolean;
}

export interface Wallet {
  readonly id: string;
  readonly address: string;
  readonly chain: Chain;
  readonly label: string;
  readonly isPrimary: boolean;
}

export interface WalletTaskStatus {
  readonly walletId: string;
  readonly taskId: string;
  readonly completed: boolean;
  readonly completedAt: string | null;
  readonly notes: string;
}

export interface DashboardStats {
  readonly totalCampaigns: number;
  readonly completedTasks: number;
  readonly totalTasks: number;
  readonly upcomingDeadlines: number;
}

export interface ProtocolInteraction {
  readonly address: string;
  readonly name: string;
  readonly txCount: number;
  readonly lastInteraction: string;
}

export interface OnchainActivity {
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
}

export interface WalletSummary {
  readonly address: string;
  readonly chains: readonly OnchainActivity[];
  readonly totalTxAcrossChains: number;
  readonly activeChains: number;
  readonly estimatedGasSpentUSD: string;
}
