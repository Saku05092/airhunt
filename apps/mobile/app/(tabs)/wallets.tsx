import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useStore } from "../../lib/store";
import { fetchWalletSummary } from "../../lib/onchain";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";
import type { Chain } from "../../lib/types";

const CHAINS: { id: Chain; label: string; short: string }[] = [
  { id: "ethereum", label: "Ethereum", short: "ETH" },
  { id: "arbitrum", label: "Arbitrum", short: "ARB" },
  { id: "optimism", label: "Optimism", short: "OP" },
  { id: "base", label: "Base", short: "BASE" },
  { id: "polygon", label: "Polygon", short: "POLY" },
  { id: "solana", label: "Solana", short: "SOL" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "--";
  }
}

export default function WalletsScreen() {
  const router = useRouter();
  const {
    wallets,
    addWallet,
    removeWallet,
    walletAnalytics,
    scanningWallets,
    setWalletAnalytics,
    setScanningWallet,
  } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [chain, setChain] = useState<Chain>("ethereum");

  function handleAdd() {
    const trimmed = address.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a wallet address");
      return;
    }
    if (chain === "solana") {
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
        Alert.alert("Error", "Invalid Solana address format");
        return;
      }
    } else {
      if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
        Alert.alert("Error", "Invalid EVM address format (expected 0x + 40 hex chars)");
        return;
      }
    }
    addWallet({
      id: `w-${Date.now()}`,
      address: address.trim(),
      chain,
      label: label.trim() || `Wallet ${wallets.length + 1}`,
      isPrimary: wallets.length === 0,
    });
    setAddress("");
    setLabel("");
    setShowAdd(false);
  }

  const handleScan = useCallback(
    async (walletId: string, walletAddress: string, walletChain: Chain) => {
      setScanningWallet(walletId, true);
      try {
        const summary = await fetchWalletSummary(walletAddress, [walletChain]);
        setWalletAnalytics(walletId, summary);
      } catch {
        // Show placeholder data on failure
        setWalletAnalytics(walletId, {
          address: walletAddress,
          chains: [],
          totalTxAcrossChains: 0,
          activeChains: 0,
          estimatedGasSpentUSD: "0.00",
        });
      } finally {
        setScanningWallet(walletId, false);
      }
    },
    [setWalletAnalytics, setScanningWallet],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wallets</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>{showAdd ? "Cancel" : "+ Add"}</Text>
        </Pressable>
      </View>

      {showAdd && (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="0x... or SOL address"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Label</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Main, Sub 1"
              placeholderTextColor={colors.textMuted}
              value={label}
              onChangeText={setLabel}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chain</Text>
            <View style={styles.chainGrid}>
              {CHAINS.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.chainChip, chain === c.id && styles.chainChipActive]}
                  onPress={() => setChain(c.id)}
                >
                  <Text style={[styles.chainChipText, chain === c.id && styles.chainChipTextActive]}>
                    {c.short}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitBtnText}>Add Wallet</Text>
          </Pressable>
        </View>
      )}

      {wallets.length === 0 && !showAdd && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No wallets added</Text>
          <Text style={styles.emptyDesc}>Add your wallet address to track task completion across campaigns.</Text>
        </View>
      )}

      {wallets.map((wallet) => {
        const analytics = walletAnalytics[wallet.id];
        const isScanning = scanningWallets.includes(wallet.id);

        // Derive last activity from chain data
        const lastActivity = analytics
          ? analytics.chains.reduce<string | null>((latest, chain) => {
              if (!chain.lastActivity) return latest;
              if (!latest) return chain.lastActivity;
              return new Date(chain.lastActivity) > new Date(latest) ? chain.lastActivity : latest;
            }, null)
          : null;

        return (
          <View key={wallet.id}>
            <Pressable
              style={styles.walletCard}
              onPress={() => router.push(`/wallet/${wallet.id}`)}
            >
              <View style={styles.walletRow}>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>
                    {wallet.label}
                    {wallet.isPrimary ? " (Primary)" : ""}
                  </Text>
                  <Text style={styles.walletAddress}>{wallet.address}</Text>
                </View>
                <View style={styles.chainBadge}>
                  <Text style={styles.chainBadgeText}>{wallet.chain.toUpperCase()}</Text>
                </View>
              </View>

              {/* Analytics Section */}
              <View style={styles.analyticsSection}>
                <View style={styles.analyticsSectionHeader}>
                  <Text style={styles.analyticsSectionTitle}>ANALYTICS</Text>
                  <Pressable
                    style={[styles.scanBtn, isScanning && styles.scanBtnDisabled]}
                    onPress={() => {
                      if (!isScanning) {
                        handleScan(wallet.id, wallet.address, wallet.chain);
                      }
                    }}
                  >
                    {isScanning ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.scanBtnText}>Scan</Text>
                    )}
                  </Pressable>
                </View>

                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsStat}>
                    <Text style={styles.analyticsValue}>
                      {analytics ? analytics.totalTxAcrossChains : "--"}
                    </Text>
                    <Text style={styles.analyticsLabel}>Transactions</Text>
                  </View>
                  <View style={styles.analyticsStat}>
                    <Text style={styles.analyticsValue}>
                      {analytics ? analytics.activeChains : "--"}
                    </Text>
                    <Text style={styles.analyticsLabel}>Chains</Text>
                  </View>
                  <View style={styles.analyticsStat}>
                    <Text style={styles.analyticsValue}>
                      {formatDate(lastActivity)}
                    </Text>
                    <Text style={styles.analyticsLabel}>Last Active</Text>
                  </View>
                </View>
              </View>

              {!wallet.isPrimary && (
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeWallet(wallet.id)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              )}
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: "800" },
  addBtn: { backgroundColor: colors.primaryBg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  addBtnText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },

  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  inputGroup: { gap: spacing.xs },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "600" },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: fontSize.md,
  },
  chainGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chainChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  chainChipActive: { backgroundColor: colors.primary },
  chainChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: "600" },
  chainChipTextActive: { color: colors.text },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  submitBtnText: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },

  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.sm },
  emptyDesc: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center", lineHeight: 22 },

  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletInfo: { flex: 1 },
  walletLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  walletAddress: { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: "monospace", marginTop: spacing.xxs },
  chainBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  chainBadgeText: { color: colors.textSecondary, fontSize: fontSize.xxs, fontWeight: "700" },

  // Analytics section
  analyticsSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  analyticsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  analyticsSectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  scanBtn: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: "center",
  },
  scanBtnDisabled: {
    opacity: 0.6,
  },
  scanBtnText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  analyticsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  analyticsStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  analyticsValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  analyticsLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    marginTop: spacing.xxs,
  },

  removeBtn: { marginTop: spacing.md, alignSelf: "flex-end" },
  removeBtnText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: "600" },
});
