/**
 * Claudex API client for AirHunt.
 *
 * Fetches airdrop campaign data from the Claudex API server.
 * Falls back to bundled sample data if API is unavailable.
 */

const API_BASE = __DEV__
  ? "http://localhost:3001"
  : "https://api.claudex.app"; // Production URL TBD

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
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
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
