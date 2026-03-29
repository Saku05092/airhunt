import { create } from "zustand";
import type { Campaign, Wallet, WalletTaskStatus, DashboardStats } from "./types";

// Sample data for MVP development
const SAMPLE_CAMPAIGNS: Campaign[] = [
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
      { id: "edgex-1", campaignId: "edgex", title: "XP登録を完了", description: "3/30までに登録", sortOrder: 0, isTemplate: true },
      { id: "edgex-2", campaignId: "edgex", title: "edgeXで取引してXPを獲得", description: "取引量に応じてXP付与", sortOrder: 1, isTemplate: true },
      { id: "edgex-3", campaignId: "edgex", title: "リファーラルで友人招待", description: "1/5ポイント+30%手数料還元", sortOrder: 2, isTemplate: true },
      { id: "edgex-4", campaignId: "edgex", title: "Pre-TGE Seasonに参加", description: "XPが1:1でEDGEトークンに変換", sortOrder: 3, isTemplate: true },
    ],
  },
  {
    id: "opensea",
    name: "OpenSea",
    ticker: "SEA",
    category: "NFT",
    chain: "Ethereum",
    tier: "S",
    status: "active",
    tgeCompleted: false,
    description: "最大手NFTマーケットプレイス。SEAトークン50%コミュニティ配布予定。TGE延期中。",
    estimatedValue: "$500-5,000",
    fundingRaised: "$423M",
    backers: ["a16z", "Paradigm", "Coatue"],
    website: "https://opensea.io",
    twitter: "@opensea",
    referralLink: "",
    referralReward: "",
    deadline: "",
    riskLevel: "low",
    tasks: [
      { id: "os-1", campaignId: "opensea", title: "OpenSeaでNFT取引", description: "複数カテゴリで取引実績を作る", sortOrder: 0, isTemplate: true },
      { id: "os-2", campaignId: "opensea", title: "リワードプログラム参加", description: "公式のリワードプログラムに登録", sortOrder: 1, isTemplate: true },
      { id: "os-3", campaignId: "opensea", title: "延期中だが活動実績を積む", description: "TGE日は未定だがアクティビティを継続", sortOrder: 2, isTemplate: true },
    ],
  },
  {
    id: "linea",
    name: "Linea",
    ticker: "",
    category: "L2",
    chain: "Ethereum L2",
    tier: "A",
    status: "active",
    tgeCompleted: false,
    description: "ConsenSys開発のzkEVM L2。LXPポイントプログラム進行中。MetaMask Rewards連携。",
    estimatedValue: "$200-1,500",
    fundingRaised: "ConsenSys ($725M)",
    backers: ["ConsenSys", "Microsoft", "SoftBank"],
    website: "https://linea.build",
    twitter: "@LineaBuild",
    referralLink: "",
    referralReward: "",
    deadline: "",
    riskLevel: "low",
    tasks: [
      { id: "linea-1", campaignId: "linea", title: "Lineaにブリッジ", description: "ETHをLineaにブリッジ", sortOrder: 0, isTemplate: true },
      { id: "linea-2", campaignId: "linea", title: "エコシステムDAppsを利用", description: "DEX、レンディング等を利用", sortOrder: 1, isTemplate: true },
      { id: "linea-3", campaignId: "linea", title: "MetaMask Rewardsポイント獲得", description: "MetaMaskでスワップしてポイント取得", sortOrder: 2, isTemplate: true },
    ],
  },
];

interface AppState {
  // Campaigns
  readonly campaigns: readonly Campaign[];
  readonly userCampaignIds: readonly string[];
  addUserCampaign: (campaignId: string) => void;
  removeUserCampaign: (campaignId: string) => void;

  // Wallets
  readonly wallets: readonly Wallet[];
  addWallet: (wallet: Wallet) => void;
  removeWallet: (walletId: string) => void;

  // Task completion
  readonly taskStatuses: readonly WalletTaskStatus[];
  toggleTask: (walletId: string, taskId: string) => void;

  // Computed
  getDashboardStats: () => DashboardStats;
  getTaskStatus: (walletId: string, taskId: string) => boolean;
  getCampaignProgress: (campaignId: string, walletId: string) => { completed: number; total: number };
}

export const useStore = create<AppState>((set, get) => ({
  campaigns: SAMPLE_CAMPAIGNS,
  userCampaignIds: ["edgex", "opensea", "linea"],

  wallets: [
    { id: "w1", address: "0x0000...0000", chain: "ethereum", label: "Main", isPrimary: true },
  ],

  taskStatuses: [],

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
      (c) => c.deadline && new Date(c.deadline).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000
    ).length;

    return {
      totalCampaigns: tracked.length,
      completedTasks,
      totalTasks,
      upcomingDeadlines,
    };
  },
}));
