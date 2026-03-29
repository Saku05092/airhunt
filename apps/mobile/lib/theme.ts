export const colors = {
  primary: "#6366F1",
  primaryLight: "#818CF8",
  accent: "#F59E0B",
  success: "#10B981",
  danger: "#EF4444",
  background: "#0F172A",
  surface: "#1E293B",
  surfaceLight: "#334155",
  border: "#2A3550",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  tierS: "#F59E0B",
  tierA: "#8B5CF6",
  tierB: "#3B82F6",
  tierC: "#6B7280",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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
