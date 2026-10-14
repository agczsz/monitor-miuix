import manifest from "../../theme.json"
import type { ColorMode, MiuixThemeSettings, NodeCardAccent, ViewMode } from "@/types/monitor"

const VISITOR_STORAGE_KEY = "miuix_monitor_visitor_prefs_v2"
const ACCENTS = ["blue", "cyan", "green", "orange", "purple"] as const
const COLOR_MODES = ["system", "light", "dark"] as const
const VIEWS = ["grid", "preference", "table"] as const
export const ACCENT_OPTIONS = ACCENTS

export const DEFAULT_SETTINGS: MiuixThemeSettings = {
  color_mode: "system",
  default_view: "grid",
  show_summary: true,
  show_billing: true,
  enable_blur: true,
  enable_squircle: true,
  node_card_accent: "blue",
  monet_key_color: "#3482FF",
  site_subtitle: "极简清晰 · 实时节点状态",
  notice: "",
  history_days: 7,
}

type ManifestField = {
  key?: string
  type: string
  default?: unknown
  options?: Array<string | { value?: unknown }>
  min?: number
  max?: number
}

const fields = (Array.isArray(manifest.config) ? manifest.config : []) as ManifestField[]
const fieldMap = new Map(fields.filter((field) => field.key && field.type !== "title").map((field) => [field.key!, field]))

function fits(field: ManifestField | undefined, value: unknown, defaultValue: unknown): boolean {
  if (!field) return false
  if (field.type === "boolean") return typeof value === "boolean"
  if (field.type === "number") return typeof value === "number" && Number.isFinite(value) && value >= (field.min ?? -Infinity) && value <= (field.max ?? Infinity)
  if (field.type === "select") return Boolean(field.options?.some((option) => (typeof option === "string" ? option : option.value) === value))
  return typeof value === typeof defaultValue
}

export async function loadThemeConfig(): Promise<MiuixThemeSettings> {
  const defaults: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  for (const field of fields) {
    if (field.key && field.type !== "title" && field.default !== undefined) defaults[field.key] = field.default
  }

  let remoteConfig: Record<string, unknown> = {}
  try {
    const response = await fetch(`/api/themes/${manifest.short}/config`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    })
    if (response.ok) {
      const json: unknown = await response.json()
      if (json && typeof json === "object" && !Array.isArray(json)) remoteConfig = json as Record<string, unknown>
    }
  } catch {
    // Request failure means use manifest defaults, without a visitor-facing error.
  }

  const merged: Record<string, unknown> = { ...defaults }
  for (const [key, value] of Object.entries(remoteConfig)) {
    const field = fieldMap.get(key)
    if (fits(field, value, defaults[key])) merged[key] = value
  }

  // The local storage layer is deliberately limited to per-visitor preferences.
  try {
    const raw = JSON.parse(localStorage.getItem(VISITOR_STORAGE_KEY) || "{}") as Record<string, unknown>
    if (COLOR_MODES.includes(raw.color_mode as ColorMode)) merged.color_mode = raw.color_mode
    if (VIEWS.includes(raw.default_view as ViewMode)) merged.default_view = raw.default_view
    if (typeof raw.monet_key_color === "string" && /^#[0-9a-f]{6}$/i.test(raw.monet_key_color)) merged.monet_key_color = raw.monet_key_color
  } catch {
    // Ignore malformed or unavailable local storage.
  }
  if (!ACCENTS.includes(merged.node_card_accent as NodeCardAccent)) merged.node_card_accent = "blue"
  return merged as unknown as MiuixThemeSettings
}

export function saveVisitorSettings(partial: { color_mode?: string; monet_key_color?: string; default_view?: string }) {
  try {
    const previous = JSON.parse(localStorage.getItem(VISITOR_STORAGE_KEY) || "{}") as Record<string, unknown>
    const allowed = Object.fromEntries(Object.entries(partial).filter(([key]) => ["color_mode", "monet_key_color", "default_view"].includes(key)))
    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify({ ...previous, ...allowed }))
  } catch {
    // Ignore storage errors.
  }
}

export function resetVisitorSettings() {
  try { localStorage.removeItem(VISITOR_STORAGE_KEY) } catch { /* Ignore storage errors. */ }
}
