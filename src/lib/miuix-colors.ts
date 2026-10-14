/**
 * Exact Color Scheme tokens ported from compose-miuix-ui/miuix:
 * miuix-ui/src/commonMain/kotlin/top/yukonga/miuix/kmp/theme/Colors.kt
 */

export interface MiuixColorTokens {
  primary: string
  onPrimary: string
  primaryVariant: string
  onPrimaryVariant: string
  primaryContainer: string
  onPrimaryContainer: string
  secondary: string
  onSecondary: string
  secondaryVariant: string
  onSecondaryVariant: string
  secondaryContainer: string
  onSecondaryContainer: string
  tertiaryContainer: string
  onTertiaryContainer: string
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string
  disabledPrimary: string
  disabledOnPrimary: string
  background: string
  onBackground: string
  onBackgroundVariant: string
  surface: string
  onSurface: string
  surfaceVariant: string
  onSurfaceSecondary: string
  onSurfaceVariantSummary: string
  onSurfaceVariantActions: string
  disabledOnSurface: string
  surfaceContainer: string
  onSurfaceContainer: string
  onSurfaceContainerVariant: string
  surfaceContainerHigh: string
  onSurfaceContainerHigh: string
  surfaceContainerHighest: string
  onSurfaceContainerHighest: string
  outline: string
  dividerLine: string
  windowDimming: string
  sliderKeyPoint: string
  sliderKeyPointForeground: string
  sliderBackground: string
}

/** Default lightColorScheme() from compose-miuix-ui/miuix */
export const MIUIX_LIGHT_COLORS: MiuixColorTokens = {
  primary: "#3482FF",
  onPrimary: "#FFFFFF",
  primaryVariant: "#3482FF",
  onPrimaryVariant: "#AECDFF",
  primaryContainer: "#5D9BFF",
  onPrimaryContainer: "#FFFFFF",
  secondary: "#E6E6E6",
  onSecondary: "#FFFFFF",
  secondaryVariant: "#F0F0F0",
  onSecondaryVariant: "#303030",
  secondaryContainer: "#F0F0F0",
  onSecondaryContainer: "#A9A9A9",
  tertiaryContainer: "#EAF2FF",
  onTertiaryContainer: "#3482FF",
  error: "#E94634",
  onError: "#FFFFFF",
  errorContainer: "#FDF6F4",
  onErrorContainer: "#410002",
  disabledPrimary: "#C2D9FF",
  disabledOnPrimary: "#F3F8FF",
  background: "#FFFFFF",
  onBackground: "#000000",
  onBackgroundVariant: "#8C93B0",
  surface: "#F7F7F7",
  onSurface: "#000000",
  surfaceVariant: "#FFFFFF",
  onSurfaceSecondary: "rgba(0, 0, 0, 0.8)",
  onSurfaceVariantSummary: "rgba(0, 0, 0, 0.6)",
  onSurfaceVariantActions: "rgba(0, 0, 0, 0.4)",
  disabledOnSurface: "#B2B2B2",
  surfaceContainer: "#FFFFFF",
  onSurfaceContainer: "#000000",
  onSurfaceContainerVariant: "#959595",
  surfaceContainerHigh: "#E8E8E8",
  onSurfaceContainerHigh: "#A2A2A2",
  surfaceContainerHighest: "#E8E8E8",
  onSurfaceContainerHighest: "#000000",
  outline: "#D9D9D9",
  dividerLine: "#E0E0E0",
  windowDimming: "rgba(0, 0, 0, 0.3)",
  sliderKeyPoint: "rgba(163, 179, 205, 0.3)",
  sliderKeyPointForeground: "#6EB5FF",
  sliderBackground: "rgba(0, 0, 0, 0.06)",
}

/** Default darkColorScheme() from compose-miuix-ui/miuix */
export const MIUIX_DARK_COLORS: MiuixColorTokens = {
  primary: "#277AF7",
  onPrimary: "#FFFFFF",
  primaryVariant: "#0073DD",
  onPrimaryVariant: "#99C7F1",
  primaryContainer: "#338FE4",
  onPrimaryContainer: "#FFFFFF",
  secondary: "#505050",
  onSecondary: "#FFFFFF",
  secondaryVariant: "#434343",
  onSecondaryVariant: "#D9D9D9",
  secondaryContainer: "#434343",
  onSecondaryContainer: "#7C7C7C",
  tertiaryContainer: "#2B3B54",
  onTertiaryContainer: "#4788FF",
  error: "#F12522",
  onError: "#FFFFFF",
  errorContainer: "#2E0603",
  onErrorContainer: "#FFDAD6",
  disabledPrimary: "#253E64",
  disabledOnPrimary: "#677893",
  background: "#242424",
  onBackground: "rgba(255, 255, 255, 0.9)",
  onBackgroundVariant: "#787E96",
  surface: "#000000",
  onSurface: "#F2F2F2",
  surfaceVariant: "#242424",
  onSurfaceSecondary: "rgba(255, 255, 255, 0.8)",
  onSurfaceVariantSummary: "rgba(255, 255, 255, 0.5)",
  onSurfaceVariantActions: "rgba(255, 255, 255, 0.4)",
  disabledOnSurface: "#666666",
  surfaceContainer: "#242424",
  onSurfaceContainer: "rgba(255, 255, 255, 0.9)",
  onSurfaceContainerVariant: "#737373",
  surfaceContainerHigh: "#242424",
  onSurfaceContainerHigh: "#666666",
  surfaceContainerHighest: "#2D2D2D",
  onSurfaceContainerHighest: "#E9E9E9",
  outline: "#404040",
  dividerLine: "#393939",
  windowDimming: "rgba(0, 0, 0, 0.6)",
  sliderKeyPoint: "rgba(122, 138, 166, 0.3)",
  sliderKeyPointForeground: "#5DAAFF",
  sliderBackground: "rgba(255, 255, 255, 0.15)",
}

export interface MonetPreset {
  name: string
  label: string
  hex: string
}

export const MIUIX_MONET_PRESETS: MonetPreset[] = [
  { name: "hyperBlue", label: "澎湃蓝 (Miuix 默认)", hex: "#3482FF" },
  { name: "cyanLake", label: "碧海青 (HyperCyan)", hex: "#00B4AA" },
  { name: "emeraldGreen", label: "翡翠绿 (Mi Green)", hex: "#16B767" },
  { name: "miOrange", label: "科技橙 (Mi Orange)", hex: "#FF6900" },
  { name: "nebulaPurple", label: "星云紫 (Nebula)", hex: "#7C4DFF" },
  { name: "coralRose", label: "珊瑚红 (Coral)", hex: "#F43F5E" },
]

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim()
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16)
  if (Number.isNaN(num)) return [217, 100, 60]
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = Math.max(0, Math.min(100, s)) / 100
  const lNorm = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2
  let r = 0, g = 0, b = 0
  if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0").toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Generates Miuix color tokens from a seed `keyColor` (simulating Miuix ThemeController ColorSchemeMode.MonetSystem)
 */
export function resolveMiuixPalette(isDark: boolean, keyColor?: string): MiuixColorTokens {
  const base = isDark ? { ...MIUIX_DARK_COLORS } : { ...MIUIX_LIGHT_COLORS }
  const normalizedKey = (keyColor || "#3482FF").toUpperCase()
  if (normalizedKey === "#3482FF" || normalizedKey === "#277AF7") {
    return base
  }
  const [h, s] = hexToHsl(normalizedKey)
  const sat = Math.max(65, s)
  if (!isDark) {
    base.primary = hslToHex(h, sat, 54)
    base.primaryVariant = hslToHex(h, sat, 48)
    base.onPrimaryVariant = hslToHex(h, Math.min(90, sat), 84)
    base.primaryContainer = hslToHex(h, Math.min(95, sat), 65)
    base.tertiaryContainer = hslToHex(h, Math.min(85, sat), 95)
    base.onTertiaryContainer = base.primary
    base.disabledPrimary = hslToHex(h, Math.min(80, sat), 88)
    base.sliderKeyPointForeground = hslToHex(h, Math.min(95, sat), 70)
  } else {
    base.primary = hslToHex(h, Math.min(92, sat), 58)
    base.primaryVariant = hslToHex(h, sat, 46)
    base.onPrimaryVariant = hslToHex(h, Math.min(80, sat), 80)
    base.primaryContainer = hslToHex(h, Math.min(85, sat), 54)
    base.tertiaryContainer = hslToHex(h, 38, 25)
    base.onTertiaryContainer = hslToHex(h, Math.min(95, sat), 66)
    base.disabledPrimary = hslToHex(h, 45, 27)
    base.sliderKeyPointForeground = hslToHex(h, Math.min(95, sat), 68)
  }
  return base
}

export function applyMiuixCssVariables(tokens: MiuixColorTokens, isDark: boolean) {
  const root = document.documentElement
  root.setAttribute("data-theme", isDark ? "dark" : "light")
  const map: Record<string, string> = {
    "--miuix-primary": tokens.primary,
    "--miuix-on-primary": tokens.onPrimary,
    "--miuix-primary-variant": tokens.primaryVariant,
    "--miuix-on-primary-variant": tokens.onPrimaryVariant,
    "--miuix-primary-container": tokens.primaryContainer,
    "--miuix-on-primary-container": tokens.onPrimaryContainer,
    "--miuix-secondary": tokens.secondary,
    "--miuix-secondary-variant": tokens.secondaryVariant,
    "--miuix-on-secondary-variant": tokens.onSecondaryVariant,
    "--miuix-secondary-container": tokens.secondaryContainer,
    "--miuix-on-secondary-container": tokens.onSecondaryContainer,
    "--miuix-tertiary-container": tokens.tertiaryContainer,
    "--miuix-on-tertiary-container": tokens.onTertiaryContainer,
    "--miuix-error": tokens.error,
    "--miuix-on-error": tokens.onError,
    "--miuix-error-container": tokens.errorContainer,
    "--miuix-on-error-container": tokens.onErrorContainer,
    "--miuix-background": tokens.background,
    "--miuix-on-background": tokens.onBackground,
    "--miuix-on-background-variant": tokens.onBackgroundVariant,
    "--miuix-surface": tokens.surface,
    "--miuix-on-surface": tokens.onSurface,
    "--miuix-surface-variant": tokens.surfaceVariant,
    "--miuix-on-surface-secondary": tokens.onSurfaceSecondary,
    "--miuix-on-surface-summary": tokens.onSurfaceVariantSummary,
    "--miuix-on-surface-actions": tokens.onSurfaceVariantActions,
    "--miuix-disabled-on-surface": tokens.disabledOnSurface,
    "--miuix-surface-container": tokens.surfaceContainer,
    "--miuix-on-surface-container": tokens.onSurfaceContainer,
    "--miuix-on-surface-container-variant": tokens.onSurfaceContainerVariant,
    "--miuix-surface-container-high": tokens.surfaceContainerHigh,
    "--miuix-on-surface-container-high": tokens.onSurfaceContainerHigh,
    "--miuix-surface-container-highest": tokens.surfaceContainerHighest,
    "--miuix-on-surface-container-highest": tokens.onSurfaceContainerHighest,
    "--miuix-outline": tokens.outline,
    "--miuix-divider": tokens.dividerLine,
    "--miuix-window-dimming": tokens.windowDimming,
    "--miuix-slider-bg": tokens.sliderBackground,
    "--miuix-slider-fg": tokens.sliderKeyPointForeground,
  }
  for (const [k, v] of Object.entries(map)) {
    root.style.setProperty(k, v)
  }
}
