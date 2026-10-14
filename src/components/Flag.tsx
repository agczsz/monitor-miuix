import React from "react"
import { countryCode, countryToName } from "@/lib/format"

interface FlagProps {
  country?: string | null
  size?: "small" | "medium" | "large"
}

/** Bundled flag-icons SVG flags render consistently even when the host lacks emoji fonts. */
export const Flag: React.FC<FlagProps> = ({ country, size = "medium" }) => {
  const code = countryCode(country)
  if (!code) {
    return <span className={`node-flag node-flag-${size} node-flag-fallback`} role="img" aria-label="未知地区" title="未知地区">🌐</span>
  }
  return <span
    className={`fi fi-${code.toLowerCase()} node-flag node-flag-${size}`}
    role="img"
    aria-label={countryToName(code)}
    title={countryToName(code)}
  />
}
