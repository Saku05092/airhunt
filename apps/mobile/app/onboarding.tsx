import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_KEY = "airhunt_onboarded";

interface OnboardingSlide {
  readonly title: string;
  readonly subtitle: string;
}

const SLIDES: readonly OnboardingSlide[] = [
  {
    title: "Track Every Airdrop",
    subtitle:
      "Browse S/A/B/C tier campaigns. Never miss a high-value opportunity.",
  },
  {
    title: "Tasks Per Wallet",
    subtitle:
      "Know exactly what to do, for each wallet, for each campaign.",
  },
  {
    title: "Never Miss a Deadline",
    subtitle:
      "Get notified 7 days, 3 days, and 1 day before TGE dates.",
  },
] as const;

export async function checkOnboarded(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

async function markOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Silently fail - user can still proceed
  }
}

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      setActiveIndex(index);
    },
    []
  );

  const handleComplete = useCallback(async () => {
    await markOnboarded();
    router.replace("/(tabs)");
  }, [router]);

  const handleSkip = useCallback(async () => {
    await markOnboarded();
    router.replace("/(tabs)");
  }, [router]);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <View style={styles.topBar}>
        {!isLastSlide ? (
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.slideContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>
                  {index === 0 ? "S" : index === 1 ? "W" : "!"}
                </Text>
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom: dots + button */}
      <View style={styles.bottomSection}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {isLastSlide && (
          <>
            <Pressable style={styles.getStartedBtn} onPress={handleComplete}>
              <Text style={styles.getStartedText}>Get Started</Text>
            </Pressable>
            <Pressable
              style={styles.discordLink}
              onPress={() => Linking.openURL("https://discord.gg/airhunt").catch(() => {})}
            >
              <Text style={styles.discordLinkText}>Join our Discord community</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxxl,
  },
  slideContent: {
    alignItems: "center",
    gap: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconText: {
    color: colors.primary,
    fontSize: fontSize.hero,
    fontWeight: "900",
  },
  slideTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  bottomSection: {
    paddingBottom: 60,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    gap: spacing.xxl,
  },
  dotsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  dotInactive: {
    backgroundColor: colors.surfaceElevated,
  },
  getStartedBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    width: "100%",
    alignItems: "center",
  },
  getStartedText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  discordLink: {
    paddingVertical: spacing.sm,
  },
  discordLinkText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
