import { View, Text, ScrollView, StyleSheet, Pressable, Switch, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { File as ExpoFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useStore } from "../lib/store";
import { fetchExportCsv } from "../lib/api";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

export default function ExportScreen() {
  const { wallets } = useStore();

  const [includeOnchain, setIncludeOnchain] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(wallets.map((w) => w.id)),
  );
  const [isExporting, setIsExporting] = useState(false);

  function toggleWallet(walletId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(walletId)) {
        next.delete(walletId);
      } else {
        next.add(walletId);
      }
      return next;
    });
  }

  async function handleExport() {
    const selected = wallets.filter((w) => selectedIds.has(w.id));
    if (selected.length === 0) {
      Alert.alert("No wallets selected", "Select at least one wallet to export.");
      return;
    }

    setIsExporting(true);
    try {
      const addresses = selected.map((w) => ({ address: w.address, chain: w.chain }));
      const csvData = await fetchExportCsv(addresses);

      const file = new ExpoFile(Paths.cache, `airhunt-export-${Date.now()}.csv`);
      file.create();
      file.write(csvData);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export AirHunt Report",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Export Complete", `File saved to: ${file.uri}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Export Failed", message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Options */}
      <Text style={styles.sectionTitle}>OPTIONS</Text>
      <View style={styles.optionsCard}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Include on-chain data</Text>
          <Switch
            value={includeOnchain}
            onValueChange={setIncludeOnchain}
            trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Include tasks</Text>
          <Switch
            value={includeTasks}
            onValueChange={setIncludeTasks}
            trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      {/* Wallet Selection */}
      <Text style={styles.sectionTitle}>WALLETS</Text>
      <View style={styles.walletsCard}>
        {wallets.map((wallet) => {
          const isSelected = selectedIds.has(wallet.id);
          return (
            <Pressable
              key={wallet.id}
              style={styles.walletRow}
              onPress={() => toggleWallet(wallet.id)}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Text style={styles.checkmark}>ok</Text>}
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>{wallet.label}</Text>
                <Text style={styles.walletAddress}>{wallet.address}</Text>
              </View>
              <View style={styles.chainBadge}>
                <Text style={styles.chainBadgeText}>{wallet.chain.toUpperCase()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Export Button */}
      <Pressable
        style={[styles.exportBtn, isExporting && styles.btnDisabled]}
        onPress={() => {
          if (!isExporting) {
            handleExport();
          }
        }}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.exportBtnText}>Generate & Export</Text>
        )}
      </Pressable>

      {wallets.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No wallets</Text>
          <Text style={styles.emptyDesc}>Add wallets first to generate an export report.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  // Options
  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  optionLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  separator: { height: 1, backgroundColor: colors.surfaceElevated, marginVertical: spacing.md },

  // Wallets
  walletsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: { color: colors.text, fontSize: fontSize.xxs, fontWeight: "800" },
  walletInfo: { flex: 1, gap: spacing.xxs },
  walletLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  walletAddress: { color: colors.textMuted, fontSize: fontSize.xxs, fontFamily: "monospace" },
  chainBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  chainBadgeText: { color: colors.textSecondary, fontSize: fontSize.xxs, fontWeight: "700" },

  // Export Button
  exportBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  btnDisabled: { opacity: 0.6 },
  exportBtnText: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },

  // Empty
  emptyCard: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.sm },
  emptyDesc: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center", lineHeight: 22 },
});
