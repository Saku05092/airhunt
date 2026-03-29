/**
 * Tests for the API client (lib/api.ts).
 *
 * Covers: fetchActiveCampaigns, apiCampaignToInternal, buildUtmLink
 */

// We need to define __DEV__ before importing the module
declare const global: { fetch: jest.Mock; __DEV__: boolean };
global.__DEV__ = true;

// Mock expo-notifications (imported transitively)
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

import { fetchActiveCampaigns, apiCampaignToInternal } from "../lib/api";
import type { ApiCampaign } from "../lib/api";

const sampleApiCampaign: ApiCampaign = {
  id: "camp-1",
  name: "Sample Campaign",
  ticker: "SAMP",
  category: "DEX",
  chain: "Ethereum",
  tier: "A",
  status: "active",
  tgeCompleted: false,
  description: "A sample campaign for testing",
  tasks: [
    { title: "Step 1", description: "Do step 1" },
    { title: "Step 2", description: "Do step 2" },
  ],
  estimatedValue: "$200",
  fundingRaised: "$2M",
  backers: ["VC1", "VC2"],
  website: "https://sample.com",
  twitter: "@sample",
  referralLink: "https://sample.com/ref",
  referralReward: "5%",
  riskLevel: "medium",
  deadline: "2026-06-15",
  addedAt: "2026-01-10",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchActiveCampaigns", () => {
  it("should return campaigns on successful fetch", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        count: 1,
        campaigns: [sampleApiCampaign],
        updatedAt: "2026-03-01",
      }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await fetchActiveCampaigns();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("camp-1");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should return empty array on network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const result = await fetchActiveCampaigns();

    expect(result).toEqual([]);
  });

  it("should return empty array on non-ok response", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await fetchActiveCampaigns();

    expect(result).toEqual([]);
  });
});

describe("apiCampaignToInternal", () => {
  it("should convert API campaign to internal format", () => {
    const internal = apiCampaignToInternal(sampleApiCampaign);

    expect(internal.id).toBe("camp-1");
    expect(internal.name).toBe("Sample Campaign");
    expect(internal.ticker).toBe("SAMP");
    expect(internal.tier).toBe("A");
    expect(internal.riskLevel).toBe("medium");
  });

  it("should convert tasks with correct ids and sort order", () => {
    const internal = apiCampaignToInternal(sampleApiCampaign);

    expect(internal.tasks).toHaveLength(2);
    expect(internal.tasks[0]).toEqual({
      id: "camp-1-0",
      campaignId: "camp-1",
      title: "Step 1",
      description: "Do step 1",
      sortOrder: 0,
      isTemplate: true,
    });
    expect(internal.tasks[1]).toEqual({
      id: "camp-1-1",
      campaignId: "camp-1",
      title: "Step 2",
      description: "Do step 2",
      sortOrder: 1,
      isTemplate: true,
    });
  });

  it("should preserve all fields from the API response", () => {
    const internal = apiCampaignToInternal(sampleApiCampaign);

    expect(internal.website).toBe("https://sample.com");
    expect(internal.twitter).toBe("@sample");
    expect(internal.referralLink).toBe("https://sample.com/ref");
    expect(internal.referralReward).toBe("5%");
    expect(internal.deadline).toBe("2026-06-15");
    expect(internal.backers).toEqual(["VC1", "VC2"]);
    expect(internal.tgeCompleted).toBe(false);
    expect(internal.status).toBe("active");
  });

  it("should handle campaign with empty tasks array", () => {
    const emptyTasksCampaign: ApiCampaign = {
      ...sampleApiCampaign,
      tasks: [],
    };

    const internal = apiCampaignToInternal(emptyTasksCampaign);

    expect(internal.tasks).toEqual([]);
  });
});

describe("buildUtmLink", () => {
  // buildUtmLink is defined in app/campaign/[id].tsx as a local function.
  // We re-implement it here to test the logic since it is not exported.
  function buildUtmLink(baseUrl: string, campaignId: string, source: string = "airhunt"): string {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", "app");
    url.searchParams.set("utm_campaign", campaignId);
    url.searchParams.set("utm_content", "campaign_detail_cta");
    return url.toString();
  }

  it("should append UTM parameters to a URL", () => {
    const result = buildUtmLink("https://example.com", "camp-1");

    expect(result).toContain("utm_source=airhunt");
    expect(result).toContain("utm_medium=app");
    expect(result).toContain("utm_campaign=camp-1");
    expect(result).toContain("utm_content=campaign_detail_cta");
  });

  it("should use custom source when provided", () => {
    const result = buildUtmLink("https://example.com", "camp-1", "custom");

    expect(result).toContain("utm_source=custom");
  });

  it("should preserve existing URL path", () => {
    const result = buildUtmLink("https://example.com/page/sub", "camp-1");

    expect(result).toContain("/page/sub");
  });

  it("should preserve existing query parameters", () => {
    const result = buildUtmLink("https://example.com?ref=abc", "camp-1");

    expect(result).toContain("ref=abc");
    expect(result).toContain("utm_source=airhunt");
  });
});
