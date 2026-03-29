import { create } from "zustand";
import type { Campaign, Wallet, WalletTaskStatus, DashboardStats } from "./types";
import { fetchActiveCampaigns, apiCampaignToInternal } from "./api";

// Fallback sample data (used when API is unavailable)
const FALLBACK_CAMPAIGNS: Campaign[] = [
  {
    id: "edgex",
    name: "edgeX",
    ticker: "EDGE",
    category: "Perp DEX",
    chain: "Ethereum",
    tier: "S",
    status: "active",
    tgeCompleted: false,
    description: "Amber Group支援の高性能Perp DEX。TGE 3/31。コミュニティに20-35%配布。XP 1:1トークン変換。",
    estimatedValue: "$500-3,000+",
    fundingRaised: "Amber Group",
    backers: ["Amber Group"],
    website: "https://www.edgex.exchange",
    twitter: "@edgex_exchange",
    referralLink: "",
    referralReward: "1/5 of referee points + 30% fee rebate",
    deadline: "2026-03-31",
    riskLevel: "low",
    tasks: [
      { id: "edgex-0", campaignId: "edgex", title: "XP登録を完了", description: "3/30までに登録", sortOrder: 0, isTemplate: true },
      { id: "edgex-1", campaignId: "edgex", title: "edgeXで取引してXPを獲得", description: "", sortOrder: 1, isTemplate: true },
      { id: "edgex-2", campaignId: "edgex", title: "リファーラルで友人招待", description: "", sortOrder: 2, isTemplate: true },
    ],
  },
];

interface AppState {
  // Data
  readonly campaigns: readonly Campaign[];
  readonly userCampaignIds: readonly string[];
  readonly wallets: readonly Wallet[];
  readonly taskStatuses: readonly WalletTaskStatus[];
  readonly isLoading: boolean;
  readonly lastSyncAt: string | null;

  // Actions
  syncCampaigns: () => Promise<void>;
  addUserCampaign: (campaignId: string) => void;
  removeUserCampaign: (campaignId: string) => void;
  addWallet: (wallet: Wallet) => void;
  removeWallet: (walletId: string) => void;
  toggleTask: (walletId: string, taskId: string) => void;
  addCustomTask: (campaignId: string, title: string, description: string) => void;

  // Computed
  getDashboardStats: () => DashboardStats;
  getTaskStatus: (walletId: string, taskId: string) => boolean;
  getCampaignProgress: (campaignId: string, walletId: string) => { completed: number; total: number };
}

export const useStore = create<AppState>((set, get) => ({
  campaigns: FALLBACK_CAMPAIGNS,
  userCampaignIds: [],
  wallets: [
    { id: "w1", address: "0x0000...0000", chain: "ethereum", label: "Main", isPrimary: true },
  ],
  taskStatuses: [],
  isLoading: false,
  lastSyncAt: null,

  syncCampaigns: async () => {
    set({ isLoading: true });
    try {
      const apiCampaigns = await fetchActiveCampaigns();
      if (apiCampaigns.length > 0) {
        const campaigns = apiCampaigns.map(apiCampaignToInternal);
        set({
          campaigns,
          isLoading: false,
          lastSyncAt: new Date().toISOString(),
        });
        console.log(`[AirHunt] Synced ${campaigns.length} campaigns from Claudex`);
      } else {
        set({ isLoading: false });
        console.log("[AirHunt] No campaigns from API, using fallback data");
      }
    } catch (error) {
      set({ isLoading: false });
      console.warn("[AirHunt] Sync failed:", error);
    }
  },

  addUserCampaign: (campaignId) =>
    set((state) => ({
      userCampaignIds: [...state.userCampaignIds, campaignId],
    })),

  removeUserCampaign: (campaignId) =>
    set((state) => ({
      userCampaignIds: state.userCampaignIds.filter((id) => id !== campaignId),
    })),

  addWallet: (wallet) =>
    set((state) => ({
      wallets: [...state.wallets, wallet],
    })),

  removeWallet: (walletId) =>
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== walletId),
    })),

  toggleTask: (walletId, taskId) =>
    set((state) => {
      const existing = state.taskStatuses.find(
        (s) => s.walletId === walletId && s.taskId === taskId
      );
      if (existing) {
        return {
          taskStatuses: state.taskStatuses.map((s) =>
            s.walletId === walletId && s.taskId === taskId
              ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date().toISOString() : null }
              : s
          ),
        };
      }
      return {
        taskStatuses: [
          ...state.taskStatuses,
          { walletId, taskId, completed: true, completedAt: new Date().toISOString(), notes: "" },
        ],
      };
    }),

  addCustomTask: (campaignId, title, description) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              tasks: [
                ...c.tasks,
                {
                  id: `${campaignId}-custom-${Date.now()}`,
                  campaignId,
                  title,
                  description,
                  sortOrder: c.tasks.length,
                  isTemplate: false,
                },
              ],
            }
          : c
      ),
    })),

  getTaskStatus: (walletId, taskId) => {
    const status = get().taskStatuses.find(
      (s) => s.walletId === walletId && s.taskId === taskId
    );
    return status?.completed ?? false;
  },

  getCampaignProgress: (campaignId, walletId) => {
    const campaign = get().campaigns.find((c) => c.id === campaignId);
    if (!campaign) return { completed: 0, total: 0 };
    const total = campaign.tasks.length;
    const completed = campaign.tasks.filter((t) =>
      get().getTaskStatus(walletId, t.id)
    ).length;
    return { completed, total };
  },

  getDashboardStats: () => {
    const state = get();
    const tracked = state.campaigns.filter((c) =>
      state.userCampaignIds.includes(c.id)
    );
    const totalTasks = tracked.reduce((sum, c) => sum + c.tasks.length * state.wallets.length, 0);
    const completedTasks = state.taskStatuses.filter((s) => s.completed).length;
    const upcomingDeadlines = tracked.filter(
      (c) => c.deadline && new Date(c.deadline).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000 && new Date(c.deadline).getTime() > Date.now()
    ).length;

    return {
      totalCampaigns: tracked.length,
      completedTasks,
      totalTasks,
      upcomingDeadlines,
    };
  },
}));
