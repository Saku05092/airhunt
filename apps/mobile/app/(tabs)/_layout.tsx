import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../lib/theme";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 20 }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 80,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerTitle: "AirHunt",
          tabBarIcon: ({ focused }) => <TabIcon label="H" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: "Campaigns",
          tabBarIcon: ({ focused }) => <TabIcon label="C" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: "Wallets",
          tabBarIcon: ({ focused }) => <TabIcon label="W" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon label="S" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
