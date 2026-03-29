import { create } from "zustand";
import type { Campaign, Wallet, WalletTaskStatus, DashboardStats, WalletSummary } from "./types";
import { fetchActiveCampaigns, apiCampaignToInternal } from "./api";
import { scheduleDeadlineReminders, cancelCampaignReminders } from "./notifications";
import {
  syncFromSupabase,
  saveWallet,
  removeWalletFromDb,
  saveTrackedCampaign,
  removeTrackedCampaign,
  saveTaskCompletion,
  saveCustomTask,
} from "./supabase-sync";

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
  readonly walletAnalytics: Readonly<Record<string, WalletSummary>>;
  readonly scanningWallets: readonly string[];
  readonly isLoading: boolean;
  readonly lastSyncAt: string | null;
  readonly userId: string | null;

  // Actions
  setUserId: (id: string) => void;
  loadFromSupabase: () => Promise<void>;
  syncCampaigns: () => Promise<void>;
  addUserCampaign: (campaignId: string) => void;
  removeUserCampaign: (campaignId: string) => void;
  addWallet: (wallet: Wallet) => void;
  removeWallet: (walletId: string) => void;
  toggleTask: (walletId: string, taskId: string) => void;
  addCustomTask: (campaignId: string, title: string, description: string) => void;
  setWalletAnalytics: (walletId: string, summary: WalletSummary) => void;
  setScanningWallet: (walletId: string, scanning: boolean) => void;

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
  walletAnalytics: {},
  scanningWallets: [],
  isLoading: false,
  lastSyncAt: null,
  userId: null,

  setUserId: (id) => set({ userId: id }),

  loadFromSupabase: async () => {
    const { userId } = get();
    if (!userId) return;
    try {
      const result = await syncFromSupabase(userId);
      if (!result) return;

      // Merge custom tasks into campaigns
      const campaigns = get().campaigns.map((campaign) => {
        const extras = result.customTasks.filter((t) => t.campaignId === campaign.id);
        if (extras.length === 0) return campaign;
        const existingIds = new Set(campaign.tasks.map((t) => t.id));
        const newTasks = extras.filter((t) => !existingIds.has(t.id));
        if (newTasks.length === 0) return campaign;
        return { ...campaign, tasks: [...campaign.tasks, ...newTasks] };
      });

      set({
        wallets: result.wallets,
        userCampaignIds: result.userCampaignIds,
        taskStatuses: result.taskStatuses,
        campaigns,
      });
    } catch (error) {
      console.warn("[AirHunt] Failed to load from Supabase:", error);
    }
  },

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
        // Synced successfully
      } else {
        set({ isLoading: false });
        // Using fallback data
      }
    } catch (error) {
      set({ isLoading: false });
      console.warn("[AirHunt] Sync failed:", error);
    }
  },

  addUserCampaign: (campaignId) => {
    const campaign = get().campaigns.find((c) => c.id === campaignId);
    if (campaign?.deadline) {
      scheduleDeadlineReminders(campaign).catch(() => {});
    }
    set((state) => ({
      userCampaignIds: [...state.userCampaignIds, campaignId],
    }));
    const { userId } = get();
    if (userId) {
      saveTrackedCampaign(userId, campaignId).catch((err) =>
        console.warn("[AirHunt] Failed to save tracked campaign:", err),
      );
    }
  },

  removeUserCampaign: (campaignId) => {
    cancelCampaignReminders(campaignId).catch(() => {});
    set((state) => ({
      userCampaignIds: state.userCampaignIds.filter((id) => id !== campaignId),
    }));
    const { userId } = get();
    if (userId) {
      removeTrackedCampaign(userId, campaignId).catch((err) =>
        console.warn("[AirHunt] Failed to remove tracked campaign:", err),
      );
    }
  },

  addWallet: (wallet) => {
    set((state) => ({
      wallets: [...state.wallets, wallet],
    }));
    const { userId } = get();
    if (userId) {
      saveWallet(userId, wallet).catch((err) =>
        console.warn("[AirHunt] Failed to save wallet:", err),
      );
    }
  },

  removeWallet: (walletId) => {
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== walletId),
    }));
    const { userId } = get();
    if (userId) {
      removeWalletFromDb(userId, walletId).catch((err) =>
        console.warn("[AirHunt] Failed to remove wallet:", err),
      );
    }
  },

  toggleTask: (walletId, taskId) => {
    const existing = get().taskStatuses.find(
      (s) => s.walletId === walletId && s.taskId === taskId,
    );
    const newCompleted = existing ? !existing.completed : true;

    set((state) => {
      const found = state.taskStatuses.find(
        (s) => s.walletId === walletId && s.taskId === taskId,
      );
      if (found) {
        return {
          taskStatuses: state.taskStatuses.map((s) =>
            s.walletId === walletId && s.taskId === taskId
              ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date().toISOString() : null }
              : s,
          ),
        };
      }
      return {
        taskStatuses: [
          ...state.taskStatuses,
          { walletId, taskId, completed: true, completedAt: new Date().toISOString(), notes: "" },
        ],
      };
    });

    const { userId } = get();
    if (userId) {
      saveTaskCompletion(userId, walletId, taskId, newCompleted).catch((err) =>
        console.warn("[AirHunt] Failed to save task completion:", err),
      );
    }
  },

  addCustomTask: (campaignId, title, description) => {
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
          : c,
      ),
    }));
    const { userId } = get();
    if (userId) {
      saveCustomTask(userId, campaignId, title, description).catch((err) =>
        console.warn("[AirHunt] Failed to save custom task:", err),
      );
    }
  },

  setWalletAnalytics: (walletId, summary) => {
    set((state) => ({
      walletAnalytics: { ...state.walletAnalytics, [walletId]: summary },
    }));
  },

  setScanningWallet: (walletId, scanning) => {
    set((state) => ({
      scanningWallets: scanning
        ? [...state.scanningWallets, walletId]
        : state.scanningWallets.filter((id) => id !== walletId),
    }));
  },

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
