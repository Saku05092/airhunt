/**
 * Claudex API client for AirHunt.
 *
 * Fetches airdrop campaign data from the Claudex API server.
 * Falls back to bundled sample data if API is unavailable.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

// In dev: mobile needs LAN IP, web can use localhost
function getApiBase(): string {
  if (!__DEV__) return "https://api.claudex.app"; // Production URL TBD

  // Use env var if set
  const envUrl = Constants.expoConfig?.extra?.claudexApiUrl
    ?? process.env.EXPO_PUBLIC_CLAUDEX_API_URL;
  if (envUrl) return envUrl;

  // Web can use localhost, mobile needs LAN IP
  if (Platform.OS === "web") return "http://localhost:3001";

  // Try to get host from Expo dev server URL
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (debuggerHost) return `http://${debuggerHost}:3001`;

  return "http://localhost:3001";
}

const API_BASE = getApiBase();

export interface ApiCampaign {
  readonly id: string;
  readonly name: string;
  readonly ticker: string;
  readonly category: string;
  readonly chain: string;
  readonly tier: "S" | "A" | "B" | "C";
  readonly status: "active" | "upcoming" | "ended";
  readonly tgeCompleted: boolean;
  readonly description: string;
  readonly tasks: readonly { title: string; description: string }[];
  readonly estimatedValue: string;
  readonly fundingRaised: string;
  readonly backers: readonly string[];
  readonly website: string;
  readonly twitter: string;
  readonly referralLink: string;
  readonly referralReward: string;
  readonly riskLevel: "low" | "medium" | "high";
  readonly deadline: string;
  readonly addedAt: string;
}

interface CampaignsResponse {
  readonly count: number;
  readonly campaigns: readonly ApiCampaign[];
  readonly updatedAt: string;
}

interface HealthResponse {
  readonly status: string;
  readonly service: string;
  readonly campaigns: number;
  readonly activeCampaigns: number;
}

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchActiveCampaigns(): Promise<readonly ApiCampaign[]> {
  try {
    const data = await fetchJson<CampaignsResponse>("/api/campaigns");
    return data.campaigns;
  } catch (error) {
    console.warn("[AirHunt API] Failed to fetch campaigns, using fallback:", error);
    return [];
  }
}

export async function fetchAllCampaigns(): Promise<readonly ApiCampaign[]> {
  try {
    const data = await fetchJson<CampaignsResponse>("/api/campaigns/all");
    return data.campaigns;
  } catch (error) {
    console.warn("[AirHunt API] Failed to fetch all campaigns:", error);
    return [];
  }
}

export async function fetchCampaign(id: string): Promise<ApiCampaign | null> {
  try {
    return await fetchJson<ApiCampaign>(`/api/campaigns/${id}`);
  } catch {
    return null;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const data = await fetchJson<HealthResponse>("/api/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Convert API campaign to the internal Campaign type used by the store
 */
export function apiCampaignToInternal(api: ApiCampaign) {
  return {
    id: api.id,
    name: api.name,
    ticker: api.ticker,
    category: api.category,
    chain: api.chain,
    tier: api.tier,
    status: api.status,
    tgeCompleted: api.tgeCompleted,
    description: api.description,
    estimatedValue: api.estimatedValue,
    fundingRaised: api.fundingRaised,
    backers: api.backers,
    website: api.website,
    twitter: api.twitter,
    referralLink: api.referralLink,
    referralReward: api.referralReward,
    deadline: api.deadline,
    riskLevel: api.riskLevel,
    tasks: api.tasks.map((t, i) => ({
      id: `${api.id}-${i}`,
      campaignId: api.id,
      title: t.title,
      description: t.description,
      sortOrder: i,
      isTemplate: true,
    })),
  };
}

// ---------------------------------------------------------------------------
// Rust API Client (port 3002)
// ---------------------------------------------------------------------------

function getRustApiBase(): string {
  if (!__DEV__) return "https://api-rust.airhunt.app"; // Production TBD
  const envUrl = Constants.expoConfig?.extra?.airhuntRustApiUrl
    ?? process.env.EXPO_PUBLIC_RUST_API_URL;
  if (envUrl) return envUrl;
  if (Platform.OS === "web") return "http://localhost:3002";
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (debuggerHost) return `http://${debuggerHost}:3002`;
  return "http://localhost:3002";
}

const RUST_API_BASE = getRustApiBase();

async function fetchRustJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${RUST_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Rust API error: ${response.status}`);
    }
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Sybil Analysis
export async function analyzeSybil(addresses: string[], chains: string[]): Promise<import("./types").SybilRiskResult> {
  return fetchRustJson("/api/sybil/analyze", { addresses, chains });
}

// Value Estimator
export async function estimateValue(params: {
  campaign_id: string; tier: string; category: string;
  funding_raised: string; user_tx_count: number;
}): Promise<import("./types").AirdropEstimate> {
  return fetchRustJson("/api/estimate", params);
}

// Portfolio
export async function fetchPortfolio(addresses: { address: string; chain: string }[]): Promise<import("./types").PortfolioSummary> {
  return fetchRustJson("/api/portfolio", { addresses });
}

// Export CSV
export async function fetchExportCsv(addresses: { address: string; chain: string }[], dateRange?: { start: string; end: string }): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${RUST_API_BASE}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses, date_range: dateRange || null, format: "csv" }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Export error: ${response.status}`);
    return response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}
