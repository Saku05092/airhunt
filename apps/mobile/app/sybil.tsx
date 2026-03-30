import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useStore } from "../lib/store";
import { analyzeSybil } from "../lib/api";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";
import type { SybilRiskFactor } from "../lib/types";

function scoreColor(score: number): string {
  if (score < 20) return colors.success;
  if (score < 40) return "#EAB308";
  if (score < 60) return "#F97316";
  if (score < 80) return colors.danger;
  return "#991B1B";
}

function severityColor(severity: SybilRiskFactor["severity"]): string {
  switch (severity) {
    case "low": return colors.success;
    case "medium": return "#EAB308";
    case "high": return "#F97316";
    case "critical": return colors.danger;
  }
}

function riskLevelLabel(level: string): string {
  switch (level) {
    case "safe": return "SAFE";
    case "low": return "LOW RISK";
    case "medium": return "MEDIUM RISK";
    case "high": return "HIGH RISK";
    case "critical": return "CRITICAL";
    default: return level.toUpperCase();
  }
}

export default function SybilScreen() {
  const {
    wallets,
    sybilResult,
    isAnalyzingSybil,
    setSybilResult,
    setAnalyzingSybil,
  } = useStore();

  async function handleAnalyze() {
    if (wallets.length < 2) return;
    setAnalyzingSybil(true);
    try {
      const addresses = wallets.map((w) => w.address);
      const chains = wallets.map((w) => w.chain);
      const result = await analyzeSybil(addresses, chains);
      setSybilResult(result);
    } catch (error) {
      setSybilResult(null);
    } finally {
      setAnalyzingSybil(false);
    }
  }

  if (wallets.length < 2) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyTitle}>2+ Wallets Required</Text>
        <Text style={styles.emptyDesc}>
          Sybil analysis compares patterns across multiple wallets. Add at least 2 wallets to use this feature.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Analyze Button */}
      <Pressable
        style={[styles.analyzeBtn, isAnalyzingSybil && styles.btnDisabled]}
        onPress={() => {
          if (!isAnalyzingSybil) {
            handleAnalyze();
          }
        }}
      >
        {isAnalyzingSybil ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.analyzeBtnText}>
            {sybilResult ? "Re-Analyze" : "Analyze"}
          </Text>
        )}
      </Pressable>

      {isAnalyzingSybil && !sybilResult && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing wallet patterns...</Text>
        </View>
      )}

      {sybilResult && (
        <>
          {/* Overall Score */}
          <View style={styles.scoreCard}>
            <Text style={[styles.scoreValue, { color: scoreColor(sybilResult.overallScore) }]}>
              {sybilResult.overallScore}
            </Text>
            <Text style={styles.scoreLabel}>Risk Score</Text>
            <View style={[styles.riskBadge, { backgroundColor: scoreColor(sybilResult.overallScore) }]}>
              <Text style={styles.riskBadgeText}>{riskLevelLabel(sybilResult.riskLevel)}</Text>
            </View>
            <Text style={styles.walletCountText}>
              {sybilResult.walletCount} wallets analyzed
            </Text>
          </View>

          {/* Risk Factors */}
          {sybilResult.factors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>RISK FACTORS</Text>
              {sybilResult.factors.map((factor) => (
                <View key={factor.id} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorName}>{factor.name}</Text>
                    <View style={styles.factorScoreBadge}>
                      <Text style={styles.factorScoreText}>{factor.score}</Text>
                    </View>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: severityColor(factor.severity) }]}>
                    <Text style={styles.severityBadgeText}>{factor.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.factorDesc}>{factor.description}</Text>
                  {factor.recommendation ? (
                    <Text style={styles.factorRec}>{factor.recommendation}</Text>
                  ) : null}
                </View>
              ))}
            </>
          )}

          {/* Recommendations */}
          {sybilResult.recommendations.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>RECOMMENDATIONS</Text>
              <View style={styles.recsCard}>
                {sybilResult.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recRow}>
                    <Text style={styles.recBullet}>-</Text>
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  centered: { justifyContent: "center", alignItems: "center", padding: spacing.xl },

  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800", marginBottom: spacing.md, textAlign: "center" },
  emptyDesc: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center", lineHeight: 22, maxWidth: 280 },

  analyzeBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  btnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },

  loadingCard: { alignItems: "center", paddingVertical: 40, gap: spacing.lg },
  loadingText: { color: colors.textMuted, fontSize: fontSize.sm },

  // Score
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  scoreValue: { fontSize: 72, fontWeight: "900", lineHeight: 80 },
  scoreLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: "600" },
  riskBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  riskBadgeText: { color: colors.textInverse, fontSize: fontSize.xs, fontWeight: "800" },
  walletCountText: { color: colors.textMuted, fontSize: fontSize.xxs, marginTop: spacing.xs },

  // Section
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  // Factor
  factorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  factorName: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700", flex: 1 },
  factorScoreBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  factorScoreText: { color: colors.text, fontSize: fontSize.xs, fontWeight: "700" },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
  },
  severityBadgeText: { color: colors.textInverse, fontSize: fontSize.xxs, fontWeight: "800" },
  factorDesc: { color: colors.textSecondary, fontSize: fontSize.xs, lineHeight: 18 },
  factorRec: { color: colors.primaryLight, fontSize: fontSize.xs, lineHeight: 18, fontStyle: "italic" },

  // Recommendations
  recsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  recRow: { flexDirection: "row", gap: spacing.sm },
  recBullet: { color: colors.primary, fontSize: fontSize.sm, fontWeight: "700" },
  recText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, flex: 1 },
});
