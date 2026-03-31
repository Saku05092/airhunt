import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useStore } from "../../lib/store";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { PlanGate } from "../../components/PlanGate";
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
  const router = useRouter();
  const userPlan = useStore((s) => s.userPlan);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  const planLabel = userPlan === "free" ? "Free" : userPlan === "pro" ? "Pro" : "Unlimited";
  const walletLimit = userPlan === "free" ? "1" : userPlan === "pro" ? "10" : "50+";

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserEmail(null);
    } catch {
      Alert.alert("Error", "Failed to sign out");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account */}
      <SettingsSection title="ACCOUNT">
        {isLoggedIn ? (
          <>
            <SettingsRow label="Email" value={userEmail ?? ""} />
            <SettingsRow label="Status" value="Logged in" />
            <Pressable style={styles.actionRow} onPress={handleLogout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <SettingsRow label="Status" value="Not logged in" />
            <Pressable
              style={styles.actionRow}
              onPress={() => router.push("/auth/login" as never)}
            >
              <Text style={styles.loginText}>Sign In / Create Account</Text>
            </Pressable>
          </>
        )}
      </SettingsSection>

      {/* Plan */}
      <SettingsSection title="PLAN">
        <SettingsRow label="Current Plan" value={planLabel} />
        <SettingsRow label="Wallet Limit" value={walletLimit} />
        <SettingsRow label="Upgrade" value="Pro - $9.99/mo" />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="NOTIFICATIONS">
        <SettingsRow label="Deadline Alerts" value="7d, 3d, 1d" />
        <SettingsRow label="New Campaigns" value="On" />
      </SettingsSection>

      {/* Community */}
      <SettingsSection title="COMMUNITY">
        <Pressable style={styles.actionRow} onPress={() => Linking.openURL("https://discord.gg/airhunt").catch(() => {})}>
          <Text style={styles.rowLabel}>Discord</Text>
          <Text style={styles.rowValue}>Join Community</Text>
        </Pressable>
        <Pressable style={styles.actionRow} onPress={() => Linking.openURL("https://x.com/mochi_d3fi").catch(() => {})}>
          <Text style={styles.rowLabel}>Twitter/X</Text>
          <Text style={styles.rowValue}>@mochi_d3fi</Text>
        </Pressable>
      </SettingsSection>

      {/* Data */}
      <SettingsSection title="DATA">
        <SettingsRow label="Campaign Source" value="Claudex" />
        <SettingsRow label="Last Sync" value="Just now" />
        <PlanGate feature="exportReport">
          <Pressable
            style={styles.exportRow}
            onPress={() => router.push("/export" as never)}
          >
            <Text style={styles.rowLabel}>Export / Tax Report</Text>
            <Text style={styles.exportArrow}>{">"}</Text>
          </Pressable>
        </PlanGate>
      </SettingsSection>

      {/* App */}
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

  actionRow: {
    padding: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  loginText: { color: colors.primary, fontSize: fontSize.md, fontWeight: "700" },
  logoutText: { color: colors.danger, fontSize: fontSize.md, fontWeight: "600" },

  exportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  exportArrow: { color: colors.textMuted, fontSize: fontSize.md },

  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.xl,
  },
});
