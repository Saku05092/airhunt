import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, TextInput, Share, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useStore } from "../../lib/store";
import { PlanGate } from "../../components/PlanGate";
import { estimateValue } from "../../lib/api";
import { colors, spacing, fontSize, borderRadius, tierColor, tierBgColor } from "../../lib/theme";

function buildUtmLink(baseUrl: string, campaignId: string, source: string = "airhunt"): string {
  if (!baseUrl) return baseUrl;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", "app");
    url.searchParams.set("utm_campaign", campaignId);
    url.searchParams.set("utm_content", "campaign_detail_cta");
    return url.toString();
  } catch {
    return baseUrl;
  }
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { campaigns, wallets, getTaskStatus, toggleTask, userCampaignIds, addUserCampaign, addCustomTask, airdropEstimates, setAirdropEstimate, walletAnalytics } = useStore();
  const [addingTaskForWallet, setAddingTaskForWallet] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);

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

      {/* Value Estimate */}
      <PlanGate feature="airdropEstimator">
        <View style={styles.estimateSection}>
          <Text style={styles.sectionTitle}>VALUE ESTIMATE</Text>
          {airdropEstimates[campaign.id] ? (
            <View style={styles.estimateCard}>
              <View style={styles.estimateRange}>
                <Text style={styles.estimateLow}>
                  ${airdropEstimates[campaign.id].low.toLocaleString()}
                </Text>
                <Text style={styles.estimateMedian}>
                  ${airdropEstimates[campaign.id].median.toLocaleString()}
                </Text>
                <Text style={styles.estimateHigh}>
                  ${airdropEstimates[campaign.id].high.toLocaleString()}
                </Text>
              </View>
              <View style={styles.estimateLabels}>
                <Text style={styles.estimateRangeLabel}>Low</Text>
                <Text style={styles.estimateRangeLabel}>Median</Text>
                <Text style={styles.estimateRangeLabel}>High</Text>
              </View>
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor:
                      airdropEstimates[campaign.id].confidence === "high"
                        ? colors.successBg
                        : airdropEstimates[campaign.id].confidence === "medium"
                          ? colors.accentBg
                          : colors.dangerBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.confidenceText,
                    {
                      color:
                        airdropEstimates[campaign.id].confidence === "high"
                          ? colors.success
                          : airdropEstimates[campaign.id].confidence === "medium"
                            ? colors.accent
                            : colors.danger,
                    },
                  ]}
                >
                  {airdropEstimates[campaign.id].confidence.toUpperCase()} CONFIDENCE
                </Text>
              </View>
              {airdropEstimates[campaign.id].comparables.length > 0 && (
                <View style={styles.comparablesSection}>
                  <Text style={styles.comparablesTitle}>Comparable Airdrops</Text>
                  {airdropEstimates[campaign.id].comparables.map((comp, idx) => (
                    <View key={idx} style={styles.comparableRow}>
                      <Text style={styles.comparableName}>{comp.name}</Text>
                      <Text style={styles.comparableValue}>
                        ${comp.medianValue.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Pressable
              style={[styles.estimateBtn, isEstimating && styles.estimateBtnDisabled]}
              onPress={async () => {
                if (isEstimating) return;
                setIsEstimating(true);
                try {
                  const primaryWallet = wallets[0];
                  const txCount = primaryWallet && walletAnalytics[primaryWallet.id]
                    ? walletAnalytics[primaryWallet.id].totalTxAcrossChains
                    : 0;
                  const result = await estimateValue({
                    campaign_id: campaign.id,
                    tier: campaign.tier,
                    category: campaign.category,
                    funding_raised: campaign.fundingRaised,
                    user_tx_count: txCount,
                  });
                  setAirdropEstimate(campaign.id, result);
                } catch (error) {
                  const msg = error instanceof Error ? error.message : "Unknown error";
                  Alert.alert("Estimation Failed", msg);
                } finally {
                  setIsEstimating(false);
                }
              }}
            >
              {isEstimating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.estimateBtnText}>Estimate Value</Text>
              )}
            </Pressable>
          )}
        </View>
      </PlanGate>

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

            {addingTaskForWallet === wallet.id ? (
              <View style={styles.addTaskForm}>
                <TextInput
                  style={styles.addTaskInput}
                  placeholder="Task title (required)"
                  placeholderTextColor={colors.textMuted}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
                <TextInput
                  style={styles.addTaskInput}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                />
                <View style={styles.addTaskActions}>
                  <Pressable
                    style={styles.addTaskCancelBtn}
                    onPress={() => {
                      setAddingTaskForWallet(null);
                      setNewTaskTitle("");
                      setNewTaskDescription("");
                    }}
                  >
                    <Text style={styles.addTaskCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.addTaskSubmitBtn, !newTaskTitle.trim() && styles.addTaskSubmitBtnDisabled]}
                    onPress={() => {
                      if (!newTaskTitle.trim()) return;
                      addCustomTask(campaign.id, newTaskTitle.trim(), newTaskDescription.trim());
                      setAddingTaskForWallet(null);
                      setNewTaskTitle("");
                      setNewTaskDescription("");
                    }}
                  >
                    <Text style={styles.addTaskSubmitText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.addTaskBtn}
                onPress={() => {
                  setAddingTaskForWallet(wallet.id);
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                }}
              >
                <Text style={styles.addTaskBtnText}>+ Add Task</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        {campaign.referralLink ? (
          <>
            <Pressable
              style={styles.ctaPrimary}
              onPress={() => { Linking.openURL(buildUtmLink(campaign.referralLink, campaign.id)).catch(() => {}); }}
            >
              <Text style={styles.ctaPrimaryText}>Register via Referral</Text>
              <Text style={styles.prBadge}>PR</Text>
            </Pressable>
            <Text style={styles.rewardDesc}>
              1/5 of referee points + 30% fee rebate
            </Text>
          </>
        ) : (
          <Pressable
            style={styles.ctaSecondary}
            onPress={() => { Linking.openURL(buildUtmLink(campaign.website, campaign.id)).catch(() => {}); }}
          >
            <Text style={styles.ctaSecondaryText}>Visit Official Site</Text>
          </Pressable>
        )}

        {campaign.twitter ? (
          <Pressable
            style={styles.twitterRow}
            onPress={() => { Linking.openURL(`https://x.com/${campaign.twitter.replace(/^@/, "")}`).catch(() => {}); }}
          >
            <Text style={styles.twitterText}>
              Follow on X: @{campaign.twitter.replace(/^@/, "")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Share */}
      <View style={styles.shareSection}>
        <Text style={styles.shareLabel}>Share this opportunity</Text>
        <Pressable
          style={styles.shareButton}
          onPress={() => {
            Share.share({
              message: `${campaign.name} - estimated ${campaign.estimatedValue}\n${campaign.website}`,
            }).catch(() => {});
          }}
        >
          <Text style={styles.shareButtonText}>Share</Text>
        </Pressable>
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

  // Add Task
  addTaskBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    borderStyle: "dashed",
    alignItems: "center",
  },
  addTaskBtnText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: "600" },
  addTaskForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  addTaskInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addTaskActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  addTaskCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  addTaskCancelText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: "500" },
  addTaskSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  addTaskSubmitBtnDisabled: { opacity: 0.4 },
  addTaskSubmitText: { color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },

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
  rewardDesc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  twitterRow: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  twitterText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },

  // Share
  shareSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  shareLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  shareButton: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  shareButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },

  disclaimer: { color: colors.textMuted, fontSize: fontSize.xxs, textAlign: "center", padding: spacing.xl },

  // Value Estimate
  estimateSection: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  estimateCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  estimateRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  estimateLow: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: "600" },
  estimateMedian: { color: colors.success, fontSize: fontSize.xl, fontWeight: "800" },
  estimateHigh: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: "600" },
  estimateLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  estimateRangeLabel: { color: colors.textMuted, fontSize: fontSize.xxs },
  confidenceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  confidenceText: { fontSize: fontSize.xxs, fontWeight: "700" },
  comparablesSection: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  comparablesTitle: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: "700", letterSpacing: 1 },
  comparableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comparableName: { color: colors.textSecondary, fontSize: fontSize.xs },
  comparableValue: { color: colors.text, fontSize: fontSize.xs, fontWeight: "600" },
  estimateBtn: {
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  estimateBtnDisabled: { opacity: 0.6 },
  estimateBtnText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.md },
});
