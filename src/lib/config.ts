import manifest from "../../theme.json"

type Field = { key: string; type: string; default: unknown; min?: number; max?: number; options?: { value: string }[] }
const fields = (manifest.config as Field[]).filter((field) => field.type !== "title")

function fits(field: Field, value: unknown): boolean {
  if (field.type === "boolean") return typeof value === "boolean"
  if (field.type === "number") return typeof value === "number" && Number.isFinite(value) && value >= (field.min ?? -Infinity) && value <= (field.max ?? Infinity)
  if (field.type === "select") return !!field.options?.some((option) => option.value === value)
  return typeof value === "string"
}

export async function loadConfig(): Promise<Record<string, unknown>> {
  let saved: Record<string, unknown> = {}
  try {
    const response = await fetch(`/api/themes/${manifest.short}/config`)
    if (response.ok) saved = await response.json() as Record<string, unknown>
  } catch { /* Defaults are still useful when config is unavailable. */ }
  return Object.fromEntries(fields.map((field) => [field.key, fits(field, saved[field.key]) ? saved[field.key] : field.default]))
}
