import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../lib/store";
import { colors, spacing, fontSize, borderRadius, tierColor, tierBgColor } from "../../lib/theme";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardScreen() {
  const router = useRouter();
  const { campaigns, userCampaignIds, wallets, getDashboardStats, getCampaignProgress } = useStore();
  const stats = getDashboardStats();

  const trackedCampaigns = campaigns
    .filter((c) => userCampaignIds.includes(c.id))
    .sort((a, b) => {
      // Deadline soon first, then by tier
      if (a.deadline && b.deadline) {
        const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (diff !== 0) return diff;
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      const tierOrder = { S: 0, A: 1, B: 2, C: 3 };
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

  const wallet = wallets[0];

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
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(pct * 100, 2)}%`, backgroundColor: pct === 1 ? colors.success : tColor },
                  ]}
                />
              </View>
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

  footer: { color: colors.textMuted, fontSize: fontSize.xxs, textAlign: "center", marginTop: spacing.xl },
});
