export function formatBytes(bytes?: number | null, decimals = 1): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes) || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
  const val = bytes / Math.pow(k, i)
  return `${val.toFixed(i === 0 ? 0 : decimals)} ${sizes[i]}`
}

export function formatSpeed(bytesPerSec?: number | null): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "0 B/s"
  return `${formatBytes(bytesPerSec, 1)}/s`
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return "0分钟"
  const safeSeconds = Math.floor(seconds)
  const days = Math.floor(safeSeconds / 86400)
  const hours = Math.floor((safeSeconds % 86400) / 3600)
  const mins = Math.floor((safeSeconds % 3600) / 60)
  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${mins}分`
  return `${Math.max(1, mins)}分钟`
}

export function formatUptime(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "离线"
  return formatDuration(seconds)
}

export function formatPercent(used?: number, total?: number): number {
  if (!used || !total || total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((used / total) * 1000) / 10))
}

const COUNTRY_ALIASES: Record<string, string> = {
  UK: "GB",
  EL: "GR",
  "UNITED STATES": "US",
  "UNITED KINGDOM": "GB",
  "SOUTH KOREA": "KR",
  "NORTH KOREA": "KP",
  "HONG KONG": "HK",
  "TAIWAN": "TW",
  "MACAU": "MO",
  "CHINA": "CN",
}

const SUPPORTED_COUNTRIES = new Set([
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ",
  "BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ",
  "CA CC CD CF CG CH CI CK CL CM CN CO CP CR CU CV CW CX CY CZ",
  "DE DJ DK DM DO DZ EC EE EG EH ER ES ET EU FI FJ FK FM FO FR",
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK",
  "HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE",
  "KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV",
  "LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV",
  "MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF",
  "PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC",
  "SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD",
  "TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ",
  "VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW XK",
].join(" ").split(/\s+/))

export function countryCode(value?: string | null): string | null {
  const normalized = value?.trim().toUpperCase()
  if (!normalized) return null
  const code = COUNTRY_ALIASES[normalized] ?? normalized
  return /^[A-Z]{2}$/.test(code) && SUPPORTED_COUNTRIES.has(code) ? code : null
}

export function countryToFlag(code?: string): string {
  const normalized = countryCode(code)
  if (!normalized) return "🌐"
  const offset = 127397
  return String.fromCodePoint(normalized.charCodeAt(0) + offset, normalized.charCodeAt(1) + offset)
}

export function countryToName(code?: string | null): string {
  const normalized = countryCode(code)
  if (!normalized) return "未知区域"
  const map: Record<string, string> = {
    CN: "中国大陆",
    HK: "中国香港",
    TW: "中国台湾",
    MO: "中国澳门",
    JP: "日本",
    SG: "新加坡",
    KR: "韩国",
    US: "美国",
    DE: "德国",
    GB: "英国",
    FR: "法国",
    NL: "荷兰",
    AU: "澳大利亚",
    CA: "加拿大",
    RU: "俄罗斯",
  }
  if (map[normalized]) return map[normalized]
  try {
    const english = new Intl.DisplayNames(["en"], { type: "region" }).of(normalized) || normalized
    const chinese = new Intl.DisplayNames(["zh-CN"], { type: "region" }).of(normalized) || english
    return `${chinese} · ${english}`
  } catch {
    return normalized
  }
}

export function getRemainingDays(expiresAt?: string | number | null): number | null {
  if (!expiresAt) return null
  const ts = typeof expiresAt === "number"
    ? (expiresAt < 1e12 ? expiresAt * 1000 : expiresAt)
    : Date.parse(expiresAt)
  if (Number.isNaN(ts)) return null
  const diff = ts - Date.now()
  return Math.ceil(diff / 86400000)
}
