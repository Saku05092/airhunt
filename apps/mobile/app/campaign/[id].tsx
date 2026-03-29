import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useStore } from "../../lib/store";
import { colors, spacing, fontSize, borderRadius, tierColor, tierBgColor } from "../../lib/theme";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { campaigns, wallets, getTaskStatus, toggleTask, userCampaignIds, addUserCampaign } = useStore();

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textMuted }}>Campaign not found</Text>
      </View>
    );
  }

  const isTracked = userCampaignIds.includes(campaign.id);
  const days = daysUntil(campaign.deadline);
  const tColor = tierColor(campaign.tier);
  const tBg = tierBgColor(campaign.tier);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Card */}
      <View style={[styles.heroCard, { borderTopColor: tColor }]}>
        <View style={styles.heroTop}>
          <View style={[styles.tierPill, { backgroundColor: tBg }]}>
            <Text style={[styles.tierText, { color: tColor }]}>Tier {campaign.tier}</Text>
          </View>
          {campaign.riskLevel && (
            <View style={[styles.riskPill, {
              backgroundColor: campaign.riskLevel === "low" ? colors.successBg :
                campaign.riskLevel === "high" ? colors.dangerBg : colors.accentBg
            }]}>
              <Text style={[styles.riskText, {
                color: campaign.riskLevel === "low" ? colors.success :
                  campaign.riskLevel === "high" ? colors.danger : colors.accent
              }]}>
                {campaign.riskLevel.toUpperCase()} RISK
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.heroName}>
          {campaign.name}
          {campaign.ticker ? ` ($${campaign.ticker})` : ""}
        </Text>

        <View style={styles.chipRow}>
          <View style={styles.chip}><Text style={styles.chipText}>{campaign.category}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>{campaign.chain}</Text></View>
        </View>

        <Text style={styles.heroDesc}>{campaign.description}</Text>

        {days !== null && days >= 0 && (
          <View style={[styles.deadlineBanner, days <= 3 && styles.deadlineBannerUrgent]}>
            <Text style={[styles.deadlineBannerText, days <= 3 && styles.deadlineBannerTextUrgent]}>
              Deadline: {campaign.deadline} ({days} days remaining)
            </Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Est. Value</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{campaign.estimatedValue}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Funding</Text>
          <Text style={styles.statValue}>{campaign.fundingRaised}</Text>
        </View>
      </View>

      {/* Backers */}
      {campaign.backers.length > 0 && campaign.backers[0] !== "" && (
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

      {/* Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TASKS</Text>

        {!isTracked && (
          <Pressable
            style={styles.trackPrompt}
            onPress={() => addUserCampaign(campaign.id)}
          >
            <Text style={styles.trackPromptText}>Start tracking to manage tasks per wallet</Text>
            <Text style={styles.trackPromptBtn}>Start Tracking</Text>
          </Pressable>
        )}

        {isTracked && wallets.map((wallet) => (
          <View key={wallet.id} style={styles.walletSection}>
            <View style={styles.walletHeader}>
              <Text style={styles.walletLabel}>{wallet.label}</Text>
              <Text style={styles.walletAddr}>{wallet.address}</Text>
            </View>
            {campaign.tasks.map((task) => {
              const completed = getTaskStatus(wallet.id, task.id);
              return (
                <Pressable
                  key={task.id}
                  style={styles.taskRow}
                  onPress={() => toggleTask(wallet.id, task.id)}
                >
                  <View style={[styles.checkbox, completed && styles.checkboxDone]} />
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, completed && styles.taskTitleDone]}>
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text style={styles.taskDesc}>{task.description}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        {campaign.referralLink ? (
          <Pressable
            style={styles.ctaPrimary}
            onPress={() => Linking.openURL(campaign.referralLink)}
          >
            <Text style={styles.ctaPrimaryText}>Register via Referral</Text>
            <Text style={styles.prBadge}>PR</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.ctaSecondary}
            onPress={() => Linking.openURL(campaign.website)}
          >
            <Text style={styles.ctaSecondaryText}>Visit Official Site</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.disclaimer}>DYOR - NFA. All information is for reference only.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderTopWidth: 3,
    gap: spacing.md,
  },
  heroTop: { flexDirection: "row", gap: spacing.sm },
  tierPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm },
  tierText: { fontSize: fontSize.xs, fontWeight: "800" },
  riskPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm },
  riskText: { fontSize: fontSize.xxs, fontWeight: "700" },
  heroName: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800" },
  chipRow: { flexDirection: "row", gap: spacing.xs },
  chip: { backgroundColor: colors.surfaceElevated, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm },
  chipText: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: "500" },
  heroDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 22 },
  deadlineBanner: {
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  deadlineBannerUrgent: { backgroundColor: colors.dangerBg },
  deadlineBannerText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: "600", textAlign: "center" },
  deadlineBannerTextUrgent: { color: colors.danger },

  // Stats
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginHorizontal: spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: "600", textTransform: "uppercase" },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700", marginTop: spacing.xxs },

  // Section
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: "700", letterSpacing: 1.5, marginBottom: spacing.md },

  backerRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  backerChip: { backgroundColor: colors.surfaceElevated, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  backerText: { color: colors.textSecondary, fontSize: fontSize.xs },

  // Track prompt
  trackPrompt: {
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  trackPromptText: { color: colors.textSecondary, fontSize: fontSize.sm },
  trackPromptBtn: { color: colors.primary, fontSize: fontSize.md, fontWeight: "700" },

  // Tasks
  walletSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  walletHeader: { marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  walletLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "700" },
  walletAddr: { color: colors.textMuted, fontSize: fontSize.xxs, fontFamily: "monospace", marginTop: spacing.xxs },
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.sm },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.borderLight,
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  taskContent: { flex: 1 },
  taskTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: "500" },
  taskTitleDone: { textDecorationLine: "line-through", color: colors.textMuted },
  taskDesc: { color: colors.textMuted, fontSize: fontSize.xxs, marginTop: spacing.xxs },

  // CTA
  ctaSection: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  ctaPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  ctaPrimaryText: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },
  prBadge: {
    color: colors.accent,
    fontSize: fontSize.xxs,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  ctaSecondaryText: { color: colors.textSecondary, fontWeight: "600", fontSize: fontSize.md },

  disclaimer: { color: colors.textMuted, fontSize: fontSize.xxs, textAlign: "center", padding: spacing.xl },
});
