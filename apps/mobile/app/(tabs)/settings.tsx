import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsSection title="PLAN">
        <SettingsRow label="Current Plan" value="Free" />
        <SettingsRow label="Wallet Limit" value="1" />
        <SettingsRow label="Upgrade" value="Pro - $9.99/mo" />
      </SettingsSection>

      <SettingsSection title="NOTIFICATIONS">
        <SettingsRow label="Deadline Alerts" value="7d, 3d, 1d" />
        <SettingsRow label="New Campaigns" value="On" />
      </SettingsSection>

      <SettingsSection title="DATA">
        <SettingsRow label="Campaign Source" value="Claudex" />
        <SettingsRow label="Last Sync" value="Just now" />
      </SettingsSection>

      <SettingsSection title="APP">
        <SettingsRow label="Version" value="0.1.0" />
        <SettingsRow label="Build" value="MVP" />
      </SettingsSection>

      <Text style={styles.disclaimer}>
        AirHunt | DYOR - NFA{"\n"}
        All information is for reference only.{"\n"}
        Powered by Claudex
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  section: { marginBottom: spacing.xxl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: fontSize.md },
  rowValue: { color: colors.textMuted, fontSize: fontSize.sm },

  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.xl,
  },
});
