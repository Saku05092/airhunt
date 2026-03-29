export const colors = {
  // Core
  primary: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryDark: "#5B21B6",
  primaryBg: "rgba(124, 58, 237, 0.08)",

  // Accent
  accent: "#F59E0B",
  accentBg: "rgba(245, 158, 11, 0.10)",

  // Status
  success: "#10B981",
  successBg: "rgba(16, 185, 129, 0.10)",
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.10)",
  info: "#3B82F6",
  infoBg: "rgba(59, 130, 246, 0.10)",

  // Background
  background: "#09090B",
  surface: "#18181B",
  surfaceElevated: "#27272A",
  surfaceHover: "#3F3F46",

  // Border
  border: "#27272A",
  borderLight: "#3F3F46",

  // Text
  text: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  textInverse: "#09090B",

  // Tier
  tierS: "#F59E0B",
  tierSBg: "rgba(245, 158, 11, 0.12)",
  tierA: "#A78BFA",
  tierABg: "rgba(167, 139, 250, 0.12)",
  tierB: "#60A5FA",
  tierBBg: "rgba(96, 165, 250, 0.12)",
  tierC: "#71717A",
  tierCBg: "rgba(113, 113, 122, 0.12)",

  // Gradient endpoints
  gradientStart: "#7C3AED",
  gradientEnd: "#EC4899",
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  hero: 34,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export function tierColor(tier: string): string {
  switch (tier) {
    case "S": return colors.tierS;
    case "A": return colors.tierA;
    case "B": return colors.tierB;
    case "C": return colors.tierC;
    default: return colors.textMuted;
  }
}

export function tierBgColor(tier: string): string {
  switch (tier) {
    case "S": return colors.tierSBg;
    case "A": return colors.tierABg;
    case "B": return colors.tierBBg;
    case "C": return colors.tierCBg;
    default: return colors.surfaceElevated;
  }
}
