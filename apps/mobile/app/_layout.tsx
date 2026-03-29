import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { colors, fontSize } from "../lib/theme";
import { checkOnboarded } from "./onboarding";
import type { Session } from "@supabase/supabase-js";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const onboarded = await checkOnboarded();
        setHasOnboarded(onboarded);

        if (isSupabaseConfigured()) {
          const { data: { session: s } } = await supabase.auth.getSession();
          setSession(s);
        }
      } catch (error) {
        console.warn("[Layout] Init error:", error);
      } finally {
        setIsReady(true);
      }
    }
    init();

    // Listen for auth changes (only if configured)
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, s) => {
          setSession(s);
        }
      );
      return () => subscription.unsubscribe();
    }
    return undefined;
  }, []);

  if (!isReady) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700", fontSize: fontSize.lg },
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: "Back",
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false }}
          redirect={hasOnboarded}
        />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="campaign/[id]"
          options={{ title: "", presentation: "card" }}
        />
        <Stack.Screen
          name="wallet/[id]"
          options={{ title: "Wallet Details" }}
        />
      </Stack>
    </>
  );
}
