import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "../../lib/store";
import { colors, spacing, fontSize, borderRadius, tierColor } from "../../lib/theme";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { campaigns, wallets, getTaskStatus, toggleTask } = useStore();

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Campaign not found</Text>
      </View>
    );
  }

  const days = daysUntil(campaign.deadline);
  const tColor = tierColor(campaign.tier);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderLeftColor: tColor }]}>
        <View style={styles.headerTop}>
          <View style={[styles.tierBadge, { backgroundColor: tColor + "20" }]}>
            <Text style={[styles.tierText, { color: tColor }]}>Tier {campaign.tier}</Text>
          </View>
          {days !== null && days >= 0 && (
            <View style={[styles.deadlineBadge, { backgroundColor: days <= 3 ? colors.danger + "20" : colors.accent + "20" }]}>
              <Text style={[styles.deadlineText, { color: days <= 3 ? colors.danger : colors.accent }]}>
                {days}d left
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{campaign.name} {campaign.ticker ? `($${campaign.ticker})` : ""}</Text>
        <Text style={styles.meta}>{campaign.category} | {campaign.chain}</Text>
        <Text style={styles.description}>{campaign.description}</Text>
      </View>

      {/* Key Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Est. Value</Text>
          <Text style={styles.infoValue}>{campaign.estimatedValue}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Funding</Text>
          <Text style={styles.infoValue}>{campaign.fundingRaised}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Risk</Text>
          <Text style={[styles.infoValue, {
            color: campaign.riskLevel === "low" ? colors.success : campaign.riskLevel === "high" ? colors.danger : colors.accent
          }]}>{campaign.riskLevel.toUpperCase()}</Text>
        </View>
        {campaign.deadline && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Deadline</Text>
            <Text style={styles.infoValue}>{campaign.deadline}</Text>
          </View>
        )}
      </View>

      {/* Backers */}
      {campaign.backers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BACKERS</Text>
          <View style={styles.backerRow}>
            {campaign.backers.map((b, i) => (
              <View key={i} style={styles.backerChip}>
                <Text style={styles.backerText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tasks per Wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TASKS</Text>
        {wallets.map((wallet) => (
          <View key={wallet.id} style={styles.walletTaskSection}>
            <Text style={styles.walletLabel}>{wallet.label} ({wallet.address})</Text>
            {campaign.tasks.map((task) => {
              const completed = getTaskStatus(wallet.id, task.id);
              return (
                <Pressable
                  key={task.id}
                  style={styles.taskRow}
                  onPress={() => toggleTask(wallet.id, task.id)}
                >
                  <View style={[styles.checkbox, completed && styles.checkboxDone]}>
                    {completed && <Text style={styles.checkmark}>v</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, completed && styles.taskTitleDone]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={styles.taskDesc}>{task.description}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* CTA */}
      {campaign.referralLink ? (
        <Pressable
          style={styles.ctaPrimary}
          onPress={() => Linking.openURL(campaign.referralLink)}
        >
          <Text style={styles.ctaText}>Register via Referral  [PR]</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.ctaSecondary}
          onPress={() => Linking.openURL(campaign.website)}
        >
          <Text style={styles.ctaTextSecondary}>Visit Official Site</Text>
        </Pressable>
      )}

      <Text style={styles.disclaimer}>DYOR - NFA. All information is for reference only.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: "center", marginTop: 60 },
  header: {
    padding: spacing.lg,
    borderLeftWidth: 4,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  headerTop: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  tierText: { fontSize: fontSize.xs, fontWeight: "700" },
  deadlineBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  deadlineText: { fontSize: fontSize.xs, fontWeight: "700" },
  name: { color: colors.text, fontSize: fontSize.xl, fontWeight: "700" },
  meta: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  description: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    minWidth: "45%",
    flex: 1,
  },
  infoLabel: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: "uppercase" },
  infoValue: { color: colors.text, fontSize: fontSize.md, fontWeight: "600", marginTop: 2 },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: "700", letterSpacing: 1, marginBottom: spacing.sm },
  backerRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  backerChip: { backgroundColor: colors.surfaceLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6 },
  backerText: { color: colors.textSecondary, fontSize: fontSize.xs },
  walletTaskSection: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm },
  walletLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: "600", marginBottom: spacing.sm },
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingVertical: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkmark: { color: colors.text, fontSize: 12, fontWeight: "700" },
  taskTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: "500" },
  taskTitleDone: { textDecorationLine: "line-through", color: colors.textMuted },
  taskDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  ctaPrimary: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  ctaText: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  ctaTextSecondary: { color: colors.primary, fontWeight: "700", fontSize: fontSize.md },
  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    padding: spacing.lg,
  },
});
