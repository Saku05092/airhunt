import type { Plan } from "./types";

const PLAN_HIERARCHY: Record<Plan, number> = {
  free: 0,
  pro: 1,
  unlimited: 2,
};

export function hasAccess(userPlan: Plan, requiredPlan: Plan): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export type FeatureId = "sybilRiskScore" | "airdropEstimator" | "portfolioDashboard" | "exportReport" | "onchainScanning" | "walletComparison";

export interface FeatureConfig {
  readonly requiredPlan: Plan;
  readonly label: string;
  readonly description: string;
}

export const FEATURES: Record<FeatureId, FeatureConfig> = {
  sybilRiskScore: {
    requiredPlan: "unlimited",
    label: "Sybil Risk Score",
    description: "Analyze wallet patterns to detect Sybil risk",
  },
  airdropEstimator: {
    requiredPlan: "unlimited",
    label: "Value Estimator",
    description: "Estimate expected airdrop value based on historical data",
  },
  portfolioDashboard: {
    requiredPlan: "unlimited",
    label: "Portfolio Dashboard",
    description: "View all wallet holdings and token balances",
  },
  exportReport: {
    requiredPlan: "unlimited",
    label: "Export / Tax Report",
    description: "Export airdrop activity as CSV for tax reporting",
  },
  onchainScanning: {
    requiredPlan: "pro",
    label: "On-chain Scanning",
    description: "Scan wallet on-chain activity across chains",
  },
  walletComparison: {
    requiredPlan: "pro",
    label: "Wallet Comparison",
    description: "Compare progress across multiple wallets",
  },
};
