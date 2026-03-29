import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Plan</Text>
          <Text style={styles.itemValue}>Free</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Wallets</Text>
          <Text style={styles.itemValue}>1 / 1</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Deadline Reminders</Text>
          <Text style={styles.itemValue}>7d, 3d, 1d</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>New Campaigns</Text>
          <Text style={styles.itemValue}>On</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Version</Text>
          <Text style={styles.itemValue}>0.1.0</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Data Source</Text>
          <Text style={styles.itemValue}>Claudex</Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        DYOR (Do Your Own Research) - This app does not provide financial advice.
        All airdrop information is for reference only.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  item: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLabel: { color: colors.text, fontSize: fontSize.sm },
  itemValue: { color: colors.textSecondary, fontSize: fontSize.sm },
  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.xl,
  },
});
