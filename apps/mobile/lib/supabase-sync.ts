import { supabase, isSupabaseConfigured } from "./supabase";
import type { Campaign, Wallet, WalletTaskStatus, CampaignTask } from "./types";

function guardConfigured(): boolean {
  if (!isSupabaseConfigured()) {
    console.warn("[Supabase Sync] Supabase not configured, skipping sync");
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export interface SyncResult {
  readonly wallets: readonly Wallet[];
  readonly userCampaignIds: readonly string[];
  readonly taskStatuses: readonly WalletTaskStatus[];
  readonly customTasks: readonly CampaignTask[];
}

export async function syncFromSupabase(userId: string): Promise<SyncResult | null> {
  if (!guardConfigured()) return null;
  const [walletsRes, campaignsRes, customTasksRes, walletTasksRes] =
    await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId),
      supabase.from("user_campaigns").select("campaign_id").eq("user_id", userId),
      supabase.from("custom_tasks").select("*").eq("user_id", userId),
      supabase.from("wallet_tasks").select("*").eq("user_id", userId),
    ]);

  if (walletsRes.error) throw new Error(`Failed to load wallets: ${walletsRes.error.message}`);
  if (campaignsRes.error) throw new Error(`Failed to load campaigns: ${campaignsRes.error.message}`);
  if (customTasksRes.error) throw new Error(`Failed to load custom tasks: ${customTasksRes.error.message}`);
  if (walletTasksRes.error) throw new Error(`Failed to load wallet tasks: ${walletTasksRes.error.message}`);

  const wallets: readonly Wallet[] = (walletsRes.data ?? []).map((row) => ({
    id: row.id as string,
    address: row.address as string,
    chain: (row.chain as string).toLowerCase() as Wallet["chain"],
    label: (row.label as string) ?? "",
    isPrimary: (row.is_primary as boolean) ?? false,
  }));

  const userCampaignIds: readonly string[] = (campaignsRes.data ?? []).map(
    (row) => row.campaign_id as string,
  );

  const taskStatuses: readonly WalletTaskStatus[] = (walletTasksRes.data ?? []).map((row) => ({
    walletId: row.wallet_id as string,
    taskId: row.task_id as string,
    completed: (row.completed as boolean) ?? false,
    completedAt: (row.completed_at as string) ?? null,
    notes: (row.notes as string) ?? "",
  }));

  const customTasks: readonly CampaignTask[] = (customTasksRes.data ?? []).map((row) => ({
    id: row.id as string,
    campaignId: row.campaign_id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    sortOrder: (row.sort_order as number) ?? 0,
    isTemplate: false,
  }));

  return { wallets, userCampaignIds, taskStatuses, customTasks };
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

export async function saveWallet(userId: string, wallet: Wallet): Promise<void> {
  if (!guardConfigured()) return;
  const { error } = await supabase.from("wallets").upsert(
    {
      id: wallet.id,
      user_id: userId,
      address: wallet.address,
      chain: wallet.chain.toUpperCase(),
      label: wallet.label,
      is_primary: wallet.isPrimary,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`Failed to save wallet: ${error.message}`);
}

export async function removeWalletFromDb(userId: string, walletId: string): Promise<void> {
  if (!guardConfigured()) return;
  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", walletId)
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to remove wallet: ${error.message}`);
}

export async function saveTrackedCampaign(userId: string, campaignId: string): Promise<void> {
  if (!guardConfigured()) return;
  const { error } = await supabase.from("user_campaigns").upsert(
    {
      user_id: userId,
      campaign_id: campaignId,
    },
    { onConflict: "user_id,campaign_id" },
  );
  if (error) throw new Error(`Failed to save tracked campaign: ${error.message}`);
}

export async function removeTrackedCampaign(userId: string, campaignId: string): Promise<void> {
  if (!guardConfigured()) return;
  const { error } = await supabase
    .from("user_campaigns")
    .delete()
    .eq("user_id", userId)
    .eq("campaign_id", campaignId);
  if (error) throw new Error(`Failed to remove tracked campaign: ${error.message}`);
}

export async function saveTaskCompletion(
  userId: string,
  walletId: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  if (!guardConfigured()) return;
  const { error } = await supabase.from("wallet_tasks").upsert(
    {
      user_id: userId,
      wallet_id: walletId,
      task_id: taskId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "wallet_id,task_id" },
  );
  if (error) throw new Error(`Failed to save task completion: ${error.message}`);
}

export async function saveCustomTask(
  userId: string,
  campaignId: string,
  title: string,
  description: string,
): Promise<void> {
  if (!guardConfigured()) return;
  const { error } = await supabase.from("custom_tasks").insert({
    user_id: userId,
    campaign_id: campaignId,
    title,
    description,
  });
  if (error) throw new Error(`Failed to save custom task: ${error.message}`);
}

export async function getUserProfile(
  userId: string,
): Promise<{ plan: string; walletLimit: number } | null> {
  if (!guardConfigured()) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, wallet_limit")
    .eq("id", userId)
    .single();
  if (error) return null;
  if (!data) return null;
  return {
    plan: (data.plan as string) ?? "FREE",
    walletLimit: (data.wallet_limit as number) ?? 1,
  };
}
