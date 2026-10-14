const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"]
export function bytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B"
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), UNITS.length - 1)
  const amount = value / 1024 ** index
  return `${index === 0 ? Math.round(amount) : amount.toFixed(1)} ${UNITS[index]}`
}
export function percent(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round(value / total * 1000) / 10))
}
export function rate(value: number): string {
  return `${bytes(value)}/s`
}
export type FormatLocale = "zh-CN" | "en-US"

export function uptime(seconds: number, locale: FormatLocale = "zh-CN"): string {
  const value = Math.max(0, Math.floor(seconds))
  const days = Math.floor(value / 86400)
  const hours = Math.floor(value % 86400 / 3600)
  const minutes = Math.floor(value % 3600 / 60)
  if (locale === "en-US") {
    if (days) return `${days}d ${hours}h`
    if (hours) return minutes ? `${hours}h ${minutes}m` : `${hours}h`
    return `${minutes}m`
  }
  if (days) return `${days} 天 ${hours} 小时`
  if (hours) return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`
  return `${minutes} 分钟`
}
export function elapsed(seconds: number | null | undefined, locale: FormatLocale = "zh-CN"): string {
  if (locale === "en-US") {
    if (seconds == null) return "Never online"
    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }
  if (seconds == null) return "从未上线"
  if (seconds < 60) return "刚刚"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`
  return `${Math.floor(seconds / 86400)} 天前`
}
export function money(amount: number, currency: string, locale: FormatLocale = "zh-CN"): string {
  if (!amount) return locale === "zh-CN" ? "免费" : "Free"
  try { return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount) }
  catch { return `${currency} ${amount.toFixed(2)}` }
}
export function cycle(value: string, locale: FormatLocale = "zh-CN"): string {
  const labels: Record<string, string> = locale === "zh-CN"
    ? { monthly: "月", quarterly: "季", semiannual: "半年", yearly: "年", biennial: "两年", triennial: "三年", once: "一次性" }
    : { monthly: "month", quarterly: "quarter", semiannual: "half-year", yearly: "year", biennial: "2 years", triennial: "3 years", once: "one-time" }
  if (labels[value]) return labels[value]
  const months = /^(\d+)m$/.exec(value)?.[1]
  return months ? (locale === "zh-CN" ? `${months} 个月` : `${months} months`) : value
}
export function relativeDate(value: number | null | undefined, locale: FormatLocale = "zh-CN"): string {
  if (locale === "en-US") {
    if (value == null) return "No expiry"
    if (value < 0) return `Expired ${-value}d ago`
    if (value === 0) return "Expires today"
    return `Expires in ${value}d`
  }
  if (value == null) return "长期有效"
  if (value < 0) return `已过期 ${-value} 天`
  if (value === 0) return "今天到期"
  return `${value} 天后到期`
}
