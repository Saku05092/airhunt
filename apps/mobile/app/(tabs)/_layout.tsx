import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize } from "../../lib/theme";

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: colors.background, shadowColor: "transparent", elevation: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700", fontSize: fontSize.lg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "Discover",
          tabBarIcon: ({ focused }) => <TabIcon icon="*" label="Discover" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          headerTitle: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon icon="#" label="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          headerTitle: "Wallets",
          tabBarIcon: ({ focused }) => <TabIcon icon="W" label="Wallets" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerTitle: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon icon="=" label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: "center", gap: 2 },
  tabIcon: { fontSize: 20, color: colors.textMuted },
  tabIconActive: { color: colors.primary },
  tabLabel: { fontSize: fontSize.xxs, color: colors.textMuted, fontWeight: "500" },
  tabLabelActive: { color: colors.primary },
});
