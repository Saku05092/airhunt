import { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../../lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        Alert.alert("Check your email", "We sent you a confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        router.replace("/(tabs)");
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert("Error", err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Sign in with an OAuth provider (Google or Apple).
   *
   * TODO: Configure Google and Apple OAuth providers in the Supabase dashboard:
   *   - Google: Add Google Client ID and Secret in Authentication > Providers > Google
   *   - Apple: Add Apple Services ID and Secret in Authentication > Providers > Apple
   *   - Set the redirect URL in both provider configs to match the app scheme
   */
  async function signInWithOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: "airhunt" });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        if (result.type === "success") {
          const url = result.url;
          const params = new URLSearchParams(url.split("#")[1]);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            router.replace("/(tabs)");
          }
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert("Error", err.message ?? `${provider} sign-in failed`);
    } finally {
      setOauthLoading(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.brandSection}>
          <Text style={styles.brandName}>AirHunt</Text>
          <Text style={styles.brandTagline}>Never miss a drop.</Text>
        </View>

        {/* OAuth Buttons */}
        <View style={styles.oauthSection}>
          <Pressable
            style={[styles.oauthBtn, styles.googleBtn, oauthLoading === "google" && styles.submitBtnDisabled]}
            onPress={() => signInWithOAuth("google")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "google" ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.oauthBtn, styles.appleBtn, oauthLoading === "apple" && styles.submitBtnDisabled]}
            onPress={() => signInWithOAuth("apple")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "apple" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.appleBtnText}>Continue with Apple</Text>
            )}
          </Pressable>
        </View>

        {/* Separator */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>or</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
            </Text>
          </Pressable>

          <Pressable onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Already have an account? Sign In"
                : "New here? Create Account"}
            </Text>
          </Pressable>
        </View>

        {/* Skip for now */}
        <Pressable
          style={styles.skipBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.skipText}>Skip for now (use offline)</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          By continuing, you agree to DYOR.{"\n"}
          AirHunt does not provide financial advice.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },

  oauthSection: { gap: spacing.md, marginBottom: spacing.lg },
  oauthBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  googleBtnText: {
    color: "#1F1F1F",
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  appleBtn: {
    backgroundColor: "#000000",
  },
  appleBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
  },

  brandSection: { alignItems: "center", marginBottom: spacing.xxxl },
  brandName: {
    fontSize: fontSize.hero,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.text, fontWeight: "800", fontSize: fontSize.md },
  toggleText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    textAlign: "center",
    fontWeight: "600",
  },

  skipBtn: {
    marginTop: spacing.xl,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  skipText: { color: colors.textMuted, fontSize: fontSize.sm },

  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
