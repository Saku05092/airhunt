import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Animated } from "react-native";
import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useStore } from "../../lib/store";
import { requestPermissions } from "../../lib/notifications";
import { colors, spacing, fontSize, borderRadius, tierColor, tierBgColor } from "../../lib/theme";
import type { Campaign, CampaignTask } from "../../lib/types";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function CampaignCard({ campaign, isTracked, onToggleTrack, index }: {
  campaign: Campaign;
  isTracked: boolean;
  onToggleTrack: () => void;
  index: number;
}) {
  const router = useRouter();
  const days = daysUntil(campaign.deadline);
  const tColor = tierColor(campaign.tier);
  const tBg = tierBgColor(campaign.tier);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}>
    <Pressable
      style={[styles.card, { borderLeftColor: tColor }]}
      onPress={() => router.push(`/campaign/${campaign.id}`)}
    >
      {/* Top row: Tier + Name + Deadline */}
      <View style={styles.cardTop}>
        <View style={[styles.tierPill, { backgroundColor: tBg }]}>
          <Text style={[styles.tierLabel, { color: tColor }]}>
            {campaign.tier}
          </Text>
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{campaign.name}</Text>
          {campaign.ticker ? (
            <Text style={styles.cardTicker}>${campaign.ticker}</Text>
          ) : null}
        </View>
        {days !== null && days >= 0 && (
          <View style={[styles.deadlinePill, days <= 3 && styles.deadlineUrgent]}>
            <Text style={[styles.deadlineText, days <= 3 && styles.deadlineTextUrgent]}>
              {days}d
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.cardDesc} numberOfLines={2}>{campaign.description}</Text>

      {/* Meta chips */}
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{campaign.category}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{campaign.chain}</Text>
        </View>
        <View style={[styles.chip, styles.chipHighlight]}>
          <Text style={[styles.chipText, styles.chipHighlightText]}>{campaign.estimatedValue}</Text>
        </View>
      </View>

      {/* Quick tasks preview */}
      <View style={styles.taskPreview}>
        {campaign.tasks.slice(0, 3).map((task: CampaignTask, i: number) => (
          <View key={i} style={styles.taskPreviewRow}>
            <View style={styles.taskDot} />
            <Text style={styles.taskPreviewText} numberOfLines={1}>{task.title}</Text>
          </View>
        ))}
        {campaign.tasks.length > 3 && (
          <Text style={styles.taskMoreText}>+{campaign.tasks.length - 3} more</Text>
        )}
      </View>

      {/* Action button */}
      <Pressable
        style={[styles.actionBtn, isTracked && styles.actionBtnTracked]}
        onPress={(e) => { e.stopPropagation?.(); onToggleTrack(); }}
      >
        <Text style={[styles.actionBtnText, isTracked && styles.actionBtnTextTracked]}>
          {isTracked ? "Tracking" : "Start Tracking"}
        </Text>
      </Pressable>
    </Pressable>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const { campaigns, userCampaignIds, addUserCampaign, removeUserCampaign, syncCampaigns, isLoading, lastSyncAt } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    syncCampaigns();
    requestPermissions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncCampaigns();
    setRefreshing(false);
  }, [syncCampaigns]);

  const activeCampaigns = campaigns
    .filter((c) => !c.tgeCompleted)
    .sort((a, b) => {
      const tierOrder = { S: 0, A: 1, B: 2, C: 3 };
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      // Deadline sooner first
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Airdrop Opportunities</Text>
        <Text style={styles.heroSub}>
          {activeCampaigns.length} active campaigns{lastSyncAt ? ` | Synced from Claudex` : ""}
        </Text>
        {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}
      </View>

      {/* Campaign Cards */}
      {activeCampaigns.map((campaign, index) => {
        const isTracked = userCampaignIds.includes(campaign.id);
        return (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            isTracked={isTracked}
            index={index}
            onToggleTrack={() =>
              isTracked
                ? removeUserCampaign(campaign.id)
                : addUserCampaign(campaign.id)
            }
          />
        );
      })}

      <Text style={styles.footer}>DYOR - NFA. All information is for reference only.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  header: { marginBottom: spacing.xl },
  heroTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    gap: spacing.md,
  },

  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tierPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  tierLabel: { fontSize: fontSize.xs, fontWeight: "800", letterSpacing: 0.5 },
  cardTitleWrap: { flex: 1, flexDirection: "row", alignItems: "baseline", gap: spacing.xs },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700" },
  cardTicker: { color: colors.textMuted, fontSize: fontSize.sm },

  deadlinePill: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  deadlineUrgent: { backgroundColor: colors.dangerBg },
  deadlineText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: "700" },
  deadlineTextUrgent: { color: colors.danger },

  cardDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  chipText: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: "500" },
  chipHighlight: { backgroundColor: colors.successBg },
  chipHighlightText: { color: colors.success },

  taskPreview: { gap: spacing.xs },
  taskPreviewRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  taskDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted },
  taskPreviewText: { color: colors.textSecondary, fontSize: fontSize.xs, flex: 1 },
  taskMoreText: { color: colors.textMuted, fontSize: fontSize.xxs, paddingLeft: spacing.lg },

  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  actionBtnTracked: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary },
  actionBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  actionBtnTextTracked: { color: colors.primary },

  footer: { color: colors.textMuted, fontSize: fontSize.xxs, textAlign: "center", marginTop: spacing.xl },
});
