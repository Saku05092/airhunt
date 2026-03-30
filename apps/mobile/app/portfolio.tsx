import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useStore } from "../lib/store";
import { fetchPortfolio } from "../lib/api";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

export default function PortfolioScreen() {
  const {
    wallets,
    portfolioSummary,
    isLoadingPortfolio,
    setPortfolioSummary,
    setLoadingPortfolio,
  } = useStore();

  async function handleLoad() {
    if (wallets.length === 0) return;
    setLoadingPortfolio(true);
    try {
      const addresses = wallets.map((w) => ({ address: w.address, chain: w.chain }));
      const summary = await fetchPortfolio(addresses);
      setPortfolioSummary(summary);
    } catch {
      setPortfolioSummary(null);
    } finally {
      setLoadingPortfolio(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Stats */}
      {portfolioSummary && (
        <View style={styles.headerCard}>
          <Text style={styles.headerValue}>
            ${portfolioSummary.totalGasSpentUsd.toFixed(2)}
          </Text>
          <Text style={styles.headerLabel}>Total Gas Spent (USD)</Text>
          <Text style={styles.headerMeta}>
            {portfolioSummary.totalWallets} wallet{portfolioSummary.totalWallets !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Load Button */}
      <Pressable
        style={[styles.loadBtn, isLoadingPortfolio && styles.btnDisabled]}
        onPress={() => {
          if (!isLoadingPortfolio) {
            handleLoad();
          }
        }}
      >
        {isLoadingPortfolio ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.loadBtnText}>
            {portfolioSummary ? "Refresh Portfolio" : "Load Portfolio"}
          </Text>
        )}
      </Pressable>

      {isLoadingPortfolio && !portfolioSummary && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading portfolio data...</Text>
        </View>
      )}

      {/* Wallet Cards */}
      {portfolioSummary && portfolioSummary.walletPortfolios.map((wp) => (
        <View key={`${wp.address}-${wp.chain}`} style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletInfo}>
              <Text style={styles.walletLabel}>{wp.label || "Wallet"}</Text>
              <Text style={styles.walletAddress}>{wp.address}</Text>
            </View>
            <View style={styles.chainBadge}>
              <Text style={styles.chainBadgeText}>{wp.chain.toUpperCase()}</Text>
            </View>
          </View>

          {/* Gas Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{wp.gasSpentEth} ETH</Text>
              <Text style={styles.statLabel}>Gas Spent</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>${wp.gasSpentUsd.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Gas (USD)</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{wp.nativeBalance}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>

          {/* Token List */}
          {wp.tokens.length > 0 && (
            <View style={styles.tokenSection}>
              <Text style={styles.tokenSectionTitle}>TOKENS</Text>
              {wp.tokens.map((token) => (
                <View key={token.contractAddress} style={styles.tokenRow}>
                  <View style={styles.tokenInfo}>
                    <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                    <Text style={styles.tokenName}>{token.name}</Text>
                  </View>
                  <Text style={styles.tokenBalance}>{token.balance}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Empty State */}
      {!portfolioSummary && !isLoadingPortfolio && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No portfolio data</Text>
          <Text style={styles.emptyDesc}>
            Tap "Load Portfolio" to fetch gas usage and token balances for your wallets.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  // Header
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  headerValue: { color: colors.text, fontSize: fontSize.hero, fontWeight: "900" },
  headerLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: "600" },
  headerMeta: { color: colors.textMuted, fontSize: fontSize.xxs, marginTop: spacing.xs },

  // Load Button
  loadBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  btnDisabled: { opacity: 0.6 },
  loadBtnText: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },

  loadingCard: { alignItems: "center", paddingVertical: 40, gap: spacing.lg },
  loadingText: { color: colors.textMuted, fontSize: fontSize.sm },

  // Wallet Card
  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletInfo: { flex: 1, gap: spacing.xxs },
  walletLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  walletAddress: { color: colors.textMuted, fontSize: fontSize.xxs, fontFamily: "monospace" },
  chainBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  chainBadgeText: { color: colors.textSecondary, fontSize: fontSize.xxs, fontWeight: "700" },

  // Stats
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCell: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: "center",
  },
  statValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xxs, marginTop: spacing.xxs },

  // Tokens
  tokenSection: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  tokenSectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  tokenInfo: { flex: 1, gap: spacing.xxs },
  tokenSymbol: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  tokenName: { color: colors.textMuted, fontSize: fontSize.xxs },
  tokenBalance: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: "600", fontFamily: "monospace" },

  // Empty
  emptyCard: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.sm },
  emptyDesc: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: "center", lineHeight: 22, maxWidth: 280 },
});
