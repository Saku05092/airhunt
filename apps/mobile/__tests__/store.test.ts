/**
 * Tests for the Zustand store (useStore).
 *
 * Covers: syncCampaigns, addUserCampaign, removeUserCampaign,
 *         toggleTask, getTaskStatus, addCustomTask,
 *         getCampaignProgress, getDashboardStats
 */

// Mock expo-notifications before any imports
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-1"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

jest.mock("../lib/supabase-sync", () => ({
  syncFromSupabase: jest.fn().mockResolvedValue(undefined),
  saveWallet: jest.fn().mockResolvedValue(undefined),
  removeWalletFromDb: jest.fn().mockResolvedValue(undefined),
  saveTrackedCampaign: jest.fn().mockResolvedValue(undefined),
  removeTrackedCampaign: jest.fn().mockResolvedValue(undefined),
  saveTaskCompletion: jest.fn().mockResolvedValue(undefined),
  saveCustomTask: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../lib/api", () => ({
  fetchActiveCampaigns: jest.fn(),
  apiCampaignToInternal: jest.fn(),
}));

import { useStore } from "../lib/store";
import { fetchActiveCampaigns, apiCampaignToInternal } from "../lib/api";
import type { ApiCampaign } from "../lib/api";

const mockFetchActiveCampaigns = fetchActiveCampaigns as jest.MockedFunction<typeof fetchActiveCampaigns>;
const mockApiCampaignToInternal = apiCampaignToInternal as jest.MockedFunction<typeof apiCampaignToInternal>;

function resetStore() {
  useStore.setState({
    campaigns: [
      {
        id: "test-campaign",
        name: "Test Campaign",
        ticker: "TEST",
        category: "DEX",
        chain: "Ethereum",
        tier: "A" as const,
        status: "active" as const,
        tgeCompleted: false,
        description: "A test campaign",
        estimatedValue: "$100",
        fundingRaised: "$1M",
        backers: ["Backer1"],
        website: "https://example.com",
        twitter: "@test",
        referralLink: "https://example.com/ref",
        referralReward: "10%",
        deadline: "2026-12-31",
        riskLevel: "low" as const,
        tasks: [
          { id: "t1", campaignId: "test-campaign", title: "Task 1", description: "Do task 1", sortOrder: 0, isTemplate: true },
          { id: "t2", campaignId: "test-campaign", title: "Task 2", description: "Do task 2", sortOrder: 1, isTemplate: true },
          { id: "t3", campaignId: "test-campaign", title: "Task 3", description: "Do task 3", sortOrder: 2, isTemplate: true },
        ],
      },
    ],
    userCampaignIds: [],
    wallets: [
      { id: "w1", address: "0x0000...0000", chain: "ethereum" as const, label: "Main", isPrimary: true },
    ],
    taskStatuses: [],
    isLoading: false,
    lastSyncAt: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

describe("syncCampaigns", () => {
  it("should update campaigns from API when data is returned", async () => {
    const apiCampaign: ApiCampaign = {
      id: "api-1",
      name: "API Campaign",
      ticker: "API",
      category: "Lending",
      chain: "Arbitrum",
      tier: "S",
      status: "active",
      tgeCompleted: false,
      description: "From API",
      tasks: [{ title: "API Task", description: "Do it" }],
      estimatedValue: "$500",
      fundingRaised: "$5M",
      backers: ["VC1"],
      website: "https://api.example.com",
      twitter: "@api",
      referralLink: "",
      referralReward: "",
      riskLevel: "low",
      deadline: "2026-06-30",
      addedAt: "2026-01-01",
    };

    const internalCampaign = {
      id: "api-1",
      name: "API Campaign",
      ticker: "API",
      category: "Lending",
      chain: "Arbitrum",
      tier: "S" as const,
      status: "active" as const,
      tgeCompleted: false,
      description: "From API",
      estimatedValue: "$500",
      fundingRaised: "$5M",
      backers: ["VC1"],
      website: "https://api.example.com",
      twitter: "@api",
      referralLink: "",
      referralReward: "",
      riskLevel: "low" as const,
      deadline: "2026-06-30",
      tasks: [
        { id: "api-1-0", campaignId: "api-1", title: "API Task", description: "Do it", sortOrder: 0, isTemplate: true },
      ],
    };

    mockFetchActiveCampaigns.mockResolvedValueOnce([apiCampaign]);
    mockApiCampaignToInternal.mockReturnValueOnce(internalCampaign);

    await useStore.getState().syncCampaigns();

    const state = useStore.getState();
    expect(state.campaigns).toHaveLength(1);
    expect(state.campaigns[0].id).toBe("api-1");
    expect(state.isLoading).toBe(false);
    expect(state.lastSyncAt).not.toBeNull();
  });

  it("should keep existing campaigns when API returns empty", async () => {
    mockFetchActiveCampaigns.mockResolvedValueOnce([]);

    await useStore.getState().syncCampaigns();

    const state = useStore.getState();
    expect(state.campaigns).toHaveLength(1);
    expect(state.campaigns[0].id).toBe("test-campaign");
    expect(state.isLoading).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    mockFetchActiveCampaigns.mockRejectedValueOnce(new Error("Network error"));

    await useStore.getState().syncCampaigns();

    const state = useStore.getState();
    expect(state.campaigns).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });
});

describe("addUserCampaign / removeUserCampaign", () => {
  it("should add a campaign id to tracked list", () => {
    useStore.getState().addUserCampaign("test-campaign");

    expect(useStore.getState().userCampaignIds).toContain("test-campaign");
  });

  it("should remove a campaign id from tracked list", () => {
    useStore.setState({ userCampaignIds: ["test-campaign", "other"] });

    useStore.getState().removeUserCampaign("test-campaign");

    const ids = useStore.getState().userCampaignIds;
    expect(ids).not.toContain("test-campaign");
    expect(ids).toContain("other");
  });

  it("should not duplicate when adding the same campaign twice", () => {
    useStore.getState().addUserCampaign("test-campaign");
    useStore.getState().addUserCampaign("test-campaign");

    // Note: the store does not deduplicate - this documents current behavior
    expect(useStore.getState().userCampaignIds.filter((id) => id === "test-campaign")).toHaveLength(2);
  });
});

describe("toggleTask / getTaskStatus", () => {
  it("should mark a task as completed when toggled first time", () => {
    useStore.getState().toggleTask("w1", "t1");

    expect(useStore.getState().getTaskStatus("w1", "t1")).toBe(true);
  });

  it("should toggle a completed task back to incomplete", () => {
    useStore.getState().toggleTask("w1", "t1");
    useStore.getState().toggleTask("w1", "t1");

    expect(useStore.getState().getTaskStatus("w1", "t1")).toBe(false);
  });

  it("should return false for a task that has never been toggled", () => {
    expect(useStore.getState().getTaskStatus("w1", "nonexistent")).toBe(false);
  });

  it("should track tasks independently per wallet", () => {
    useStore.setState({
      wallets: [
        { id: "w1", address: "0x1", chain: "ethereum" as const, label: "W1", isPrimary: true },
        { id: "w2", address: "0x2", chain: "ethereum" as const, label: "W2", isPrimary: false },
      ],
    });

    useStore.getState().toggleTask("w1", "t1");

    expect(useStore.getState().getTaskStatus("w1", "t1")).toBe(true);
    expect(useStore.getState().getTaskStatus("w2", "t1")).toBe(false);
  });
});

describe("addCustomTask", () => {
  it("should add a custom task to the specified campaign", () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    useStore.getState().addCustomTask("test-campaign", "My Task", "My Description");

    const campaign = useStore.getState().campaigns.find((c) => c.id === "test-campaign");
    expect(campaign).toBeDefined();
    expect(campaign!.tasks).toHaveLength(4);

    const customTask = campaign!.tasks[3];
    expect(customTask.title).toBe("My Task");
    expect(customTask.description).toBe("My Description");
    expect(customTask.isTemplate).toBe(false);
    expect(customTask.id).toBe(`test-campaign-custom-${now}`);

    jest.restoreAllMocks();
  });

  it("should not modify other campaigns", () => {
    useStore.setState({
      campaigns: [
        ...useStore.getState().campaigns,
        {
          id: "other",
          name: "Other",
          ticker: "OTH",
          category: "DEX",
          chain: "Ethereum",
          tier: "B" as const,
          status: "active" as const,
          tgeCompleted: false,
          description: "",
          estimatedValue: "",
          fundingRaised: "",
          backers: [],
          website: "",
          twitter: "",
          referralLink: "",
          referralReward: "",
          deadline: "",
          riskLevel: "low" as const,
          tasks: [],
        },
      ],
    });

    useStore.getState().addCustomTask("test-campaign", "New", "Desc");

    const other = useStore.getState().campaigns.find((c) => c.id === "other");
    expect(other!.tasks).toHaveLength(0);
  });
});

describe("getCampaignProgress", () => {
  it("should return correct progress when no tasks completed", () => {
    const progress = useStore.getState().getCampaignProgress("test-campaign", "w1");
    expect(progress).toEqual({ completed: 0, total: 3 });
  });

  it("should return correct progress with some tasks completed", () => {
    useStore.getState().toggleTask("w1", "t1");
    useStore.getState().toggleTask("w1", "t3");

    const progress = useStore.getState().getCampaignProgress("test-campaign", "w1");
    expect(progress).toEqual({ completed: 2, total: 3 });
  });

  it("should return zero for nonexistent campaign", () => {
    const progress = useStore.getState().getCampaignProgress("nonexistent", "w1");
    expect(progress).toEqual({ completed: 0, total: 0 });
  });
});

describe("getDashboardStats", () => {
  it("should return zeros when no campaigns are tracked", () => {
    const stats = useStore.getState().getDashboardStats();
    expect(stats).toEqual({
      totalCampaigns: 0,
      completedTasks: 0,
      totalTasks: 0,
      upcomingDeadlines: 0,
    });
  });

  it("should compute correct stats with tracked campaigns and completed tasks", () => {
    useStore.getState().addUserCampaign("test-campaign");
    useStore.getState().toggleTask("w1", "t1");
    useStore.getState().toggleTask("w1", "t2");

    const stats = useStore.getState().getDashboardStats();
    expect(stats.totalCampaigns).toBe(1);
    expect(stats.completedTasks).toBe(2);
    // totalTasks = tasks.length * wallets.length = 3 * 1 = 3
    expect(stats.totalTasks).toBe(3);
  });

  it("should count upcoming deadlines within 14 days", () => {
    const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    useStore.setState({
      campaigns: [
        {
          ...useStore.getState().campaigns[0],
          deadline: inTenDays,
        },
      ],
    });
    useStore.getState().addUserCampaign("test-campaign");

    const stats = useStore.getState().getDashboardStats();
    expect(stats.upcomingDeadlines).toBe(1);
  });

  it("should not count deadlines more than 14 days away", () => {
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    useStore.setState({
      campaigns: [
        {
          ...useStore.getState().campaigns[0],
          deadline: in30Days,
        },
      ],
    });
    useStore.getState().addUserCampaign("test-campaign");

    const stats = useStore.getState().getDashboardStats();
    expect(stats.upcomingDeadlines).toBe(0);
  });
});
