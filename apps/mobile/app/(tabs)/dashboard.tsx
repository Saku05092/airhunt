import { View, Text, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useRef, useEffect } from "react";
import { useStore } from "../../lib/store";
import { colors, spacing, fontSize, borderRadius, tierColor } from "../../lib/theme";
import type { Campaign, CampaignTask } from "../../lib/types";

const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };
const MAX_PRIORITY_ITEMS = 5;
const URGENT_DAYS = 7;

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface PriorityTask {
  readonly campaign: Campaign;
  readonly task: CampaignTask;
  readonly walletLabel: string;
  readonly daysRemaining: number;
}

function usePriorityTasks(): readonly PriorityTask[] {
  const { campaigns, userCampaignIds, wallets, getTaskStatus } = useStore();

  return useMemo(() => {
    const items: PriorityTask[] = [];

    const trackedCampaigns = campaigns.filter((c) =>
      userCampaignIds.includes(c.id)
    );

    for (const campaign of trackedCampaigns) {
      const days = daysUntil(campaign.deadline);
      if (days === null || days < 0 || days > URGENT_DAYS) continue;

      for (const task of campaign.tasks) {
        const walletsNeedingTask = wallets.filter(
          (w) => !getTaskStatus(w.id, task.id)
        );
        if (walletsNeedingTask.length === 0) continue;

        const walletLabel =
          walletsNeedingTask.length === wallets.length
            ? "All wallets"
            : walletsNeedingTask.length === 1
              ? walletsNeedingTask[0].label
              : `${walletsNeedingTask.length} wallets`;

        items.push({
          campaign,
          task,
          walletLabel,
          daysRemaining: days,
        });
      }
    }

    return [...items].sort((a, b) => {
      const daysDiff = a.daysRemaining - b.daysRemaining;
      if (daysDiff !== 0) return daysDiff;
      return (TIER_ORDER[a.campaign.tier] ?? 4) - (TIER_ORDER[b.campaign.tier] ?? 4);
    });
  }, [campaigns, userCampaignIds, wallets, getTaskStatus]);
}

function AnimatedProgressBar({ pct, color }: { pct: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 600,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, pct]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "100%"],
  });

  return (
    <View style={styles.progressBarBg}>
      <Animated.View
        style={[
          styles.progressBarFill,
          { width: widthInterpolated, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function useSortedTrackedCampaigns(): readonly Campaign[] {
  const { campaigns, userCampaignIds } = useStore();

  return useMemo(() => {
    const tracked = campaigns.filter((c) => userCampaignIds.includes(c.id));
    return [...tracked].sort((a, b) => {
      if (a.deadline && b.deadline) {
        const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (diff !== 0) return diff;
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return (TIER_ORDER[a.tier] ?? 4) - (TIER_ORDER[b.tier] ?? 4);
    });
  }, [campaigns, userCampaignIds]);
}

export default function DashboardScreen() {
  const router = useRouter();
  const { wallets, getDashboardStats, getCampaignProgress } = useStore();
  const stats = getDashboardStats();
  const priorityTasks = usePriorityTasks();
  const trackedCampaigns = useSortedTrackedCampaigns();

  const wallet = wallets[0];
  const visiblePriorityTasks = priorityTasks.slice(0, MAX_PRIORITY_ITEMS);
  const hasMoreTasks = priorityTasks.length > MAX_PRIORITY_ITEMS;

  if (trackedCampaigns.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyIcon}>*</Text>
        <Text style={styles.emptyTitle}>No campaigns tracked yet</Text>
        <Text style={styles.emptyDesc}>
          Go to Discover tab to browse airdrop opportunities and start tracking.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Today's Priority */}
      <View style={styles.prioritySection}>
        <Text style={styles.sectionTitle}>TODAY&apos;S PRIORITY</Text>
        {visiblePriorityTasks.length === 0 ? (
          <View style={styles.noUrgentCard}>
            <Text style={styles.noUrgentText}>No urgent tasks</Text>
            <Text style={styles.noUrgentSubtext}>
              No tasks due within {URGENT_DAYS} days. You&apos;re on track.
            </Text>
          </View>
        ) : (
          <>
            {visiblePriorityTasks.map((item) => {
              const tColor = tierColor(item.campaign.tier);
              return (
                <Pressable
                  key={`${item.campaign.id}-${item.task.id}`}
                  style={[styles.priorityCard, { borderLeftColor: tColor }]}
                  onPress={() => router.push(`/campaign/${item.campaign.id}`)}
                >
                  <View style={styles.priorityCardTop}>
                    <View style={styles.priorityCardInfo}>
                      <View style={styles.priorityCampaignRow}>
                        <View style={[styles.tierDotSmall, { backgroundColor: tColor }]} />
                        <Text style={styles.priorityCampaignName}>{item.campaign.name}</Text>
                      </View>
                      <Text style={styles.priorityTaskTitle} numberOfLines={1}>
                        {item.task.title}
                      </Text>
                      <Text style={styles.priorityWallet}>{item.walletLabel}</Text>
                    </View>
                    <View
                      style={[
                        styles.priorityDaysBadge,
                        item.daysRemaining <= 3 && styles.priorityDaysBadgeUrgent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityDaysText,
                          item.daysRemaining <= 3 && styles.priorityDaysTextUrgent,
                        ]}
                      >
                        {item.daysRemaining}d
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {hasMoreTasks && (
              <Pressable style={styles.viewAllLink}>
                <Text style={styles.viewAllText}>
                  View all ({priorityTasks.length} tasks)
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalCampaigns}</Text>
          <Text style={styles.statLabel}>Tracking</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedTasks}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, stats.upcomingDeadlines > 0 && styles.statCardUrgent]}>
          <Text style={[styles.statValue, stats.upcomingDeadlines > 0 && styles.statValueUrgent]}>
            {stats.upcomingDeadlines}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
      </View>

      {/* Campaign Progress Cards */}
      {trackedCampaigns.map((campaign) => {
        const progress = wallet ? getCampaignProgress(campaign.id, wallet.id) : { completed: 0, total: 0 };
        const pct = progress.total > 0 ? progress.completed / progress.total : 0;
        const days = daysUntil(campaign.deadline);
        const tColor = tierColor(campaign.tier);

        return (
          <Pressable
            key={campaign.id}
            style={styles.progressCard}
            onPress={() => router.push(`/campaign/${campaign.id}`)}
          >
            {/* Header */}
            <View style={styles.progressHeader}>
              <View style={[styles.tierDot, { backgroundColor: tColor }]} />
              <Text style={styles.progressName}>{campaign.name}</Text>
              {days !== null && days >= 0 && (
                <View style={[styles.daysBadge, days <= 3 && styles.daysBadgeUrgent]}>
                  <Text style={[styles.daysText, days <= 3 && styles.daysTextUrgent]}>
                    {days}d
                  </Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <AnimatedProgressBar
                pct={pct}
                color={pct === 1 ? colors.success : tColor}
              />
              <Text style={styles.progressPctText}>
                {progress.completed}/{progress.total}
              </Text>
            </View>

            {/* Quick status */}
            <View style={styles.progressMeta}>
              <Text style={styles.progressMetaText}>
                {campaign.category} | {campaign.estimatedValue}
              </Text>
              {pct === 1 ? (
                <Text style={styles.completedBadge}>Complete</Text>
              ) : (
                <Text style={styles.inProgressText}>In Progress</Text>
              )}
            </View>
          </Pressable>
        );
      })}

      {/* Wallet Comparison */}
      {wallets.length >= 2 && trackedCampaigns.length > 0 && (
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>WALLET COMPARISON</Text>
          {trackedCampaigns.map((campaign) => {
            const tColor = tierColor(campaign.tier);
            const walletProgresses = wallets.map((w) => ({
              wallet: w,
              progress: getCampaignProgress(campaign.id, w.id),
            }));
            const maxCompleted = Math.max(
              ...walletProgresses.map((wp) => wp.progress.completed),
            );

            return (
              <View key={campaign.id} style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <View style={[styles.comparisonTierDot, { backgroundColor: tColor }]} />
                  <Text style={[styles.comparisonCampaignName, { color: tColor }]}>
                    {campaign.name}
                  </Text>
                </View>
                {walletProgresses.map((wp) => {
                  const isBehind =
                    wp.progress.completed < maxCompleted && maxCompleted > 0;
                  return (
                    <View key={wp.wallet.id} style={styles.comparisonRow}>
                      <Text
                        style={[
                          styles.comparisonWalletLabel,
                          isBehind && styles.comparisonWalletBehind,
                        ]}
                        numberOfLines={1}
                      >
                        {wp.wallet.label}
                      </Text>
                      <Text
                        style={[
                          styles.comparisonTaskCount,
                          isBehind && styles.comparisonTaskCountBehind,
                        ]}
                      >
                        {wp.progress.completed}/{wp.progress.total} tasks
                      </Text>
                      {isBehind && (
                        <View style={styles.behindBadge}>
                          <Text style={styles.behindBadgeText}>Behind</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.footer}>Tap a campaign to manage tasks per wallet</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  // Empty state
  emptyContainer: { justifyContent: "center", alignItems: "center", padding: spacing.xxxl },
  emptyIcon: { fontSize: 48, color: colors.textMuted, marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: "700", marginBottom: spacing.sm },
  emptyDesc: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center", lineHeight: 22 },

  // Priority section
  prioritySection: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  noUrgentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  noUrgentText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: "700",
    marginBottom: spacing.xxs,
  },
  noUrgentSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  priorityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
  },
  priorityCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priorityCardInfo: {
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.xxs,
  },
  priorityCampaignRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tierDotSmall: { width: 8, height: 8, borderRadius: 4 },
  priorityCampaignName: {
    color: colors.textSecondary,
    fontSize: fontSize.xxs,
    fontWeight: "600",
  },
  priorityTaskTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  priorityWallet: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
  },
  priorityDaysBadge: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    minWidth: 36,
    alignItems: "center",
  },
  priorityDaysBadgeUrgent: { backgroundColor: colors.dangerBg },
  priorityDaysText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: "700" },
  priorityDaysTextUrgent: { color: colors.danger },
  viewAllLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },

  // Stats
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  statCardUrgent: { backgroundColor: colors.dangerBg },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800" },
  statValueUrgent: { color: colors.danger },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xxs, marginTop: spacing.xxs },

  // Progress cards
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  progressName: { flex: 1, color: colors.text, fontSize: fontSize.lg, fontWeight: "700" },
  daysBadge: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  daysBadgeUrgent: { backgroundColor: colors.dangerBg },
  daysText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: "700" },
  daysTextUrgent: { color: colors.danger },

  progressBarContainer: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  progressPctText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: "600", width: 32, textAlign: "right" },

  progressMeta: { flexDirection: "row", justifyContent: "space-between" },
  progressMetaText: { color: colors.textMuted, fontSize: fontSize.xxs },
  completedBadge: { color: colors.success, fontSize: fontSize.xxs, fontWeight: "700" },
  inProgressText: { color: colors.primary, fontSize: fontSize.xxs, fontWeight: "600" },

  // Wallet comparison
  comparisonSection: { marginTop: spacing.xl },
  comparisonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  comparisonTierDot: { width: 8, height: 8, borderRadius: 4 },
  comparisonCampaignName: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.lg,
  },
  comparisonWalletLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: "600",
    flex: 1,
  },
  comparisonWalletBehind: {
    color: colors.accent,
  },
  comparisonTaskCount: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  comparisonTaskCountBehind: {
    color: colors.accent,
  },
  behindBadge: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  behindBadgeText: {
    color: colors.accent,
    fontSize: fontSize.xxs,
    fontWeight: "700",
  },

  footer: { color: colors.textMuted, fontSize: fontSize.xxs, textAlign: "center", marginTop: spacing.xl },
});
