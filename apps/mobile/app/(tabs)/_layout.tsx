import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? colors.primary : colors.textMuted}
      />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 16,
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: colors.background,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "Discover",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "compass" : "compass-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          headerTitle: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "grid" : "grid-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          headerTitle: "Wallets",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "wallet" : "wallet-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerTitle: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "settings" : "settings-outline"} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
