import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../lib/store";
import { colors, spacing, fontSize, borderRadius, tierColor } from "../../lib/theme";

export default function CampaignsScreen() {
  const router = useRouter();
  const { campaigns, userCampaignIds, addUserCampaign, removeUserCampaign } = useStore();

  const tracked = campaigns.filter((c) => userCampaignIds.includes(c.id));
  const available = campaigns.filter((c) => !userCampaignIds.includes(c.id) && !c.tgeCompleted);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRACKING ({tracked.length})</Text>
        {tracked.map((c) => (
          <Pressable
            key={c.id}
            style={styles.card}
            onPress={() => router.push(`/campaign/${c.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.tierBadge, { backgroundColor: tierColor(c.tier) + "20" }]}>
                <Text style={[styles.tierText, { color: tierColor(c.tier) }]}>{c.tier}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{c.name} {c.ticker ? `($${c.ticker})` : ""}</Text>
                <Text style={styles.cardMeta}>{c.category} | {c.chain} | {c.estimatedValue}</Text>
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => removeUserCampaign(c.id)}
              >
                <Text style={styles.removeBtnText}>-</Text>
              </Pressable>
            </View>
            {c.deadline && (
              <View style={styles.deadlineBadge}>
                <Text style={styles.deadlineText}>Deadline: {c.deadline}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {available.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AVAILABLE</Text>
          {available.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.tierBadge, { backgroundColor: tierColor(c.tier) + "20" }]}>
                  <Text style={[styles.tierText, { color: tierColor(c.tier) }]}>{c.tier}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{c.name}</Text>
                  <Text style={styles.cardMeta}>{c.category} | {c.chain}</Text>
                </View>
                <Pressable
                  style={styles.addBtn}
                  onPress={() => addUserCampaign(c.id)}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { marginTop: spacing.md, paddingHorizontal: spacing.md },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tierText: { fontSize: fontSize.xs, fontWeight: "700" },
  cardName: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  cardMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  deadlineBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent + "15",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  deadlineText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: "600" },
  addBtn: {
    backgroundColor: colors.primary + "20",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: "700" },
  removeBtn: {
    backgroundColor: colors.danger + "20",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: colors.danger, fontSize: fontSize.lg, fontWeight: "700" },
});
