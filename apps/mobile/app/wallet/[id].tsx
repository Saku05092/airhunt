import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { useStore } from "../../lib/store";
import { fetchWalletSummary } from "../../lib/onchain";
import { colors, spacing, fontSize, borderRadius, tierColor } from "../../lib/theme";
import type { Chain, OnchainActivity, ProtocolInteraction } from "../../lib/types";

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

function aggregateProtocols(
  chains: readonly OnchainActivity[],
): readonly ProtocolInteraction[] {
  const map = new Map<string, { name: string; txCount: number; lastInteraction: string }>();

  for (const chain of chains) {
    for (const protocol of chain.protocols) {
      const existing = map.get(protocol.address);
      if (existing) {
        map.set(protocol.address, {
          ...existing,
          txCount: existing.txCount + protocol.txCount,
          lastInteraction:
            new Date(protocol.lastInteraction) > new Date(existing.lastInteraction)
              ? protocol.lastInteraction
              : existing.lastInteraction,
        });
      } else {
        map.set(protocol.address, {
          name: protocol.name,
          txCount: protocol.txCount,
          lastInteraction: protocol.lastInteraction,
        });
      }
    }
  }

  const result: ProtocolInteraction[] = [];
  for (const [address, info] of map.entries()) {
    result.push({
      address,
      name: info.name,
      txCount: info.txCount,
      lastInteraction: info.lastInteraction,
    });
  }

  return [...result].sort((a, b) => b.txCount - a.txCount);
}

function deriveFirstActivity(chains: readonly OnchainActivity[]): string | null {
  let earliest: string | null = null;
  for (const chain of chains) {
    if (!chain.firstActivity) continue;
    if (!earliest || new Date(chain.firstActivity) < new Date(earliest)) {
      earliest = chain.firstActivity;
    }
  }
  return earliest;
}

function deriveLastActivity(chains: readonly OnchainActivity[]): string | null {
  let latest: string | null = null;
  for (const chain of chains) {
    if (!chain.lastActivity) continue;
    if (!latest || new Date(chain.lastActivity) > new Date(latest)) {
      latest = chain.lastActivity;
    }
  }
  return latest;
}

function sumField(chains: readonly OnchainActivity[], field: "bridgeTransactions" | "swapTransactions" | "nftMints"): number {
  return chains.reduce((sum, c) => sum + c[field], 0);
}

function sumUniqueContracts(chains: readonly OnchainActivity[]): number {
  return chains.reduce((sum, c) => sum + c.uniqueContracts, 0);
}

function sumGasETH(chains: readonly OnchainActivity[]): string {
  const total = chains.reduce((sum, c) => sum + parseFloat(c.totalGasUsedETH), 0);
  return total.toFixed(6);
}

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    wallets,
    walletAnalytics,
    scanningWallets,
    setWalletAnalytics,
    setScanningWallet,
    campaigns,
    userCampaignIds,
    getCampaignProgress,
  } = useStore();

  const wallet = wallets.find((w) => w.id === id);

  const handleScan = useCallback(async () => {
    if (!wallet) return;
    setScanningWallet(wallet.id, true);
    try {
      const summary = await fetchWalletSummary(wallet.address, [wallet.chain]);
      setWalletAnalytics(wallet.id, summary);
    } catch {
      setWalletAnalytics(wallet.id, {
        address: wallet.address,
        chains: [],
        totalTxAcrossChains: 0,
        activeChains: 0,
        estimatedGasSpentUSD: "0.00",
      });
    } finally {
      setScanningWallet(wallet.id, false);
    }
  }, [wallet, setWalletAnalytics, setScanningWallet]);

  if (!wallet) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Wallet not found</Text>
      </View>
    );
  }

  const analytics = walletAnalytics[wallet.id];
  const isScanning = scanningWallets.includes(wallet.id);
  const chains = analytics?.chains ?? [];
  const protocols = aggregateProtocols(chains);
  const trackedCampaigns = campaigns.filter((c) => userCampaignIds.includes(c.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.walletLabel}>{wallet.label}</Text>
        <Text style={styles.walletAddress}>{wallet.address}</Text>
        <View style={styles.chainBadge}>
          <Text style={styles.chainBadgeText}>{wallet.chain.toUpperCase()}</Text>
        </View>
      </View>

      {/* Scan Button */}
      <Pressable
        style={[styles.scanBtn, isScanning && styles.scanBtnDisabled]}
        onPress={() => {
          if (!isScanning) {
            handleScan();
          }
        }}
      >
        {isScanning ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.scanBtnText}>
            {analytics ? "Rescan Wallet" : "Scan Wallet"}
          </Text>
        )}
      </Pressable>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>ON-CHAIN STATS</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>
            {analytics ? analytics.totalTxAcrossChains : "--"}
          </Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>
            {analytics ? sumUniqueContracts(chains) : "--"}
          </Text>
          <Text style={styles.statLabel}>Unique Protocols</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>
            {analytics ? sumGasETH(chains) : "--"}
          </Text>
          <Text style={styles.statLabel}>Gas Spent (ETH)</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>
            {analytics ? `$${analytics.estimatedGasSpentUSD}` : "--"}
          </Text>
          <Text style={styles.statLabel}>Gas Spent (USD)</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>
            {formatDate(deriveFirstActivity(chains))}
          </Text>
          <Text style={styles.statLabel}>First Activity</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>
            {formatDate(deriveLastActivity(chains))}
          </Text>
          <Text style={styles.statLabel}>Last Activity</Text>
        </View>
      </View>

      {/* Activity Breakdown */}
      <Text style={styles.sectionTitle}>ACTIVITY BREAKDOWN</Text>
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Bridge Transactions</Text>
          <Text style={styles.breakdownValue}>
            {analytics ? sumField(chains, "bridgeTransactions") : "--"}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Swap Transactions</Text>
          <Text style={styles.breakdownValue}>
            {analytics ? sumField(chains, "swapTransactions") : "--"}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>NFT Mints</Text>
          <Text style={styles.breakdownValue}>
            {analytics ? sumField(chains, "nftMints") : "--"}
          </Text>
        </View>
      </View>

      {/* Protocol Interactions */}
      {protocols.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>PROTOCOL INTERACTIONS</Text>
          {protocols.map((protocol) => (
            <View key={protocol.address} style={styles.protocolCard}>
              <View style={styles.protocolInfo}>
                <Text style={styles.protocolName}>{protocol.name}</Text>
                <Text style={styles.protocolDate}>
                  Last: {formatDate(protocol.lastInteraction)}
                </Text>
              </View>
              <View style={styles.protocolCountBadge}>
                <Text style={styles.protocolCountText}>{protocol.txCount} tx</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Campaign Progress */}
      {trackedCampaigns.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>CAMPAIGN PROGRESS</Text>
          {trackedCampaigns.map((campaign) => {
            const progress = getCampaignProgress(campaign.id, wallet.id);
            const pct = progress.total > 0 ? progress.completed / progress.total : 0;
            const tColor = tierColor(campaign.tier);

            return (
              <View key={campaign.id} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <View style={[styles.tierDot, { backgroundColor: tColor }]} />
                  <Text style={styles.campaignName}>{campaign.name}</Text>
                  <Text style={styles.campaignProgress}>
                    {progress.completed}/{progress.total}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.round(pct * 100)}%`,
                        backgroundColor: pct === 1 ? colors.success : tColor,
                      },
                    ]}
                  />
                </View>
                {pct === 1 && (
                  <Text style={styles.completeBadge}>Complete</Text>
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  centered: { justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },

  // Header
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  walletLabel: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800" },
  walletAddress: { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: "monospace" },
  chainBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  chainBadgeText: { color: colors.textSecondary, fontSize: fontSize.xxs, fontWeight: "700" },

  // Scan button
  scanBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },

  // Section
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCell: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexGrow: 1,
    flexBasis: "46%",
  },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xxs, marginTop: spacing.xxs },

  // Activity breakdown
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  breakdownValue: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },

  // Protocol interactions
  protocolCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  protocolInfo: { flex: 1, gap: spacing.xxs },
  protocolName: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  protocolDate: { color: colors.textMuted, fontSize: fontSize.xxs },
  protocolCountBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  protocolCountText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: "700" },

  // Campaign progress
  campaignCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  campaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  campaignName: { flex: 1, color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  campaignProgress: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: "600" },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  completeBadge: { color: colors.success, fontSize: fontSize.xxs, fontWeight: "700" },
});
