import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors, fontSize } from "../lib/theme";

export default function RootLayout() {
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="campaign/[id]"
          options={{ title: "", presentation: "card" }}
        />
      </Stack>
    </>
  );
}
