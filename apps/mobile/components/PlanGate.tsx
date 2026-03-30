import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { useStore } from "../lib/store";
import { hasAccess, FEATURES, type FeatureId } from "../lib/plan-gate";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

interface PlanGateProps {
  feature: FeatureId;
  children: React.ReactNode;
}

export function PlanGate({ feature, children }: PlanGateProps) {
  const userPlan = useStore((s) => s.userPlan);
  const config = FEATURES[feature];

  if (hasAccess(userPlan, config.requiredPlan)) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockIcon}>
        <Text style={styles.lockText}>L</Text>
      </View>
      <Text style={styles.title}>{config.label}</Text>
      <Text style={styles.description}>{config.description}</Text>
      <Text style={styles.planRequired}>
        Requires {config.requiredPlan.charAt(0).toUpperCase() + config.requiredPlan.slice(1)} plan
      </Text>
      <Pressable
        style={styles.upgradeBtn}
        onPress={() => {
          // Open web pricing page
          Linking.openURL("https://claudex.app/#/pricing").catch(() => {});
        }}
      >
        <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  lockText: { color: colors.textMuted, fontSize: 20, fontWeight: "700" },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700" },
  description: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  planRequired: { color: colors.primary, fontSize: fontSize.xs, fontWeight: "600" },
  upgradeBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
  },
  upgradeBtnText: { color: colors.text, fontWeight: "700", fontSize: fontSize.sm },
});
