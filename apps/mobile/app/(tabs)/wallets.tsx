import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { useState } from "react";
import { useStore } from "../../lib/store";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";
import type { Chain } from "../../lib/types";

const CHAINS: { id: Chain; label: string }[] = [
  { id: "ethereum", label: "Ethereum" },
  { id: "arbitrum", label: "Arbitrum" },
  { id: "optimism", label: "Optimism" },
  { id: "base", label: "Base" },
  { id: "polygon", label: "Polygon" },
  { id: "solana", label: "Solana" },
];

export default function WalletsScreen() {
  const { wallets, addWallet, removeWallet, campaigns, userCampaignIds, getCampaignProgress } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [chain, setChain] = useState<Chain>("ethereum");

  const trackedCampaigns = campaigns.filter((c) => userCampaignIds.includes(c.id));

  function handleAdd() {
    if (!address.trim()) {
      Alert.alert("Error", "Please enter a wallet address");
      return;
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallets ({wallets.length})</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>{showAdd ? "Cancel" : "+ Add"}</Text>
        </Pressable>
      </View>

      {showAdd && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Wallet address (0x...)"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Label (optional)"
            placeholderTextColor={colors.textMuted}
            value={label}
            onChangeText={setLabel}
          />
          <View style={styles.chainSelector}>
            {CHAINS.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.chainChip, chain === c.id && styles.chainChipActive]}
                onPress={() => setChain(c.id)}
              >
                <Text style={[styles.chainChipText, chain === c.id && styles.chainChipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitBtnText}>Add Wallet</Text>
          </Pressable>
        </View>
      )}

      {wallets.map((wallet) => (
        <View key={wallet.id} style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletLabel}>
                {wallet.label} {wallet.isPrimary ? "(Primary)" : ""}
              </Text>
              <Text style={styles.walletAddress}>{wallet.address}</Text>
              <Text style={styles.walletChain}>{wallet.chain}</Text>
            </View>
            {!wallet.isPrimary && (
              <Pressable onPress={() => removeWallet(wallet.id)}>
                <Text style={{ color: colors.danger, fontSize: fontSize.sm }}>Remove</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.walletProgress}>
            {trackedCampaigns.map((c) => {
              const progress = getCampaignProgress(c.id, wallet.id);
              const pct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
              return (
                <View key={c.id} style={styles.progressRow}>
                  <Text style={styles.progressName}>{c.name}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressPct}>{progress.completed}/{progress.total}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700" },
  addBtn: { backgroundColor: colors.primary + "20", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  addBtnText: { color: colors.primary, fontWeight: "600" },
  addForm: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.sm,
  },
  chainSelector: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chainChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  chainChipActive: { backgroundColor: colors.primary },
  chainChipText: { color: colors.textMuted, fontSize: fontSize.xs },
  chainChipTextActive: { color: colors.text },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.sm, padding: spacing.md, alignItems: "center" },
  submitBtnText: { color: colors.text, fontWeight: "700" },
  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  walletLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  walletAddress: { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: "monospace", marginTop: 2 },
  walletChain: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  walletProgress: { marginTop: spacing.md, gap: spacing.sm },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  progressName: { color: colors.textSecondary, fontSize: fontSize.xs, width: 70 },
  progressBarBg: { flex: 1, height: 4, backgroundColor: colors.surfaceLight, borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
  progressPct: { color: colors.textMuted, fontSize: fontSize.xs, width: 30, textAlign: "right" },
});
