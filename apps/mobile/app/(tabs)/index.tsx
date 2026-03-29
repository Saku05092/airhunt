import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../lib/store";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";
import { tierColor } from "../../lib/theme";

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
      const tierOrder = { S: 0, A: 1, B: 2, C: 3 };
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

  const urgentCampaigns = trackedCampaigns.filter((c) => {
    const days = daysUntil(c.deadline);
    return days !== null && days >= 0 && days <= 14;
  });

  return (
    <ScrollView style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalCampaigns}</Text>
          <Text style={styles.statLabel}>Tracking</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedTasks}/{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, stats.upcomingDeadlines > 0 && { color: colors.accent }]}>
            {stats.upcomingDeadlines}
          </Text>
          <Text style={styles.statLabel}>Deadlines</Text>
        </View>
      </View>

      {/* Urgent Deadlines */}
      {urgentCampaigns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING DEADLINES</Text>
          {urgentCampaigns.map((c) => {
            const days = daysUntil(c.deadline);
            return (
              <Pressable
                key={c.id}
                style={styles.deadlineCard}
                onPress={() => router.push(`/campaign/${c.id}`)}
              >
                <View style={styles.deadlineRow}>
                  <View style={[styles.tierBadge, { backgroundColor: tierColor(c.tier) + "20", borderColor: tierColor(c.tier) }]}>
                    <Text style={[styles.tierText, { color: tierColor(c.tier) }]}>{c.tier}</Text>
                  </View>
                  <Text style={styles.deadlineName}>{c.name}</Text>
                  <Text style={[styles.deadlineDays, { color: days !== null && days <= 3 ? colors.danger : colors.accent }]}>
                    {days}d left
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Campaign Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROGRESS</Text>
        {trackedCampaigns.map((c) => {
          const wallet = wallets[0];
          if (!wallet) return null;
          const progress = getCampaignProgress(c.id, wallet.id);
          const pct = progress.total > 0 ? progress.completed / progress.total : 0;

          return (
            <Pressable
              key={c.id}
              style={styles.progressCard}
              onPress={() => router.push(`/campaign/${c.id}`)}
            >
              <View style={styles.progressHeader}>
                <View style={[styles.tierBadgeSmall, { backgroundColor: tierColor(c.tier) + "20" }]}>
                  <Text style={[styles.tierTextSmall, { color: tierColor(c.tier) }]}>{c.tier}</Text>
                </View>
                <Text style={styles.progressName}>{c.name}</Text>
                <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pct * 100}%`, backgroundColor: tierColor(c.tier) }]} />
              </View>
              <Text style={styles.progressDetail}>
                {progress.completed}/{progress.total} tasks | {c.category} | {c.chain}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  statItem: { alignItems: "center" },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  deadlineCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierText: { fontSize: fontSize.xs, fontWeight: "700" },
  deadlineName: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  deadlineDays: { fontSize: fontSize.sm, fontWeight: "700" },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  tierBadgeSmall: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  tierTextSmall: { fontSize: 10, fontWeight: "700" },
  progressName: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  progressPct: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: "600" },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressDetail: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
});
