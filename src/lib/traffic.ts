import type { Node } from "@/types/monitor"

function positive(value: number | undefined | null): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0
}

/** Prefer Monitor's authoritative metered total, otherwise apply its traffic_mode. */
export function getTrafficUsed(node: Node): number {
  if (typeof node.month_used === "number" && Number.isFinite(node.month_used)) return Math.max(0, node.month_used)
  const rx = positive(node.metrics?.month_rx ?? node.month_rx ?? node.metrics?.total_rx ?? node.total_rx)
  const tx = positive(node.metrics?.month_tx ?? node.month_tx ?? node.metrics?.total_tx ?? node.total_tx)
  if (node.traffic_mode === "up" || node.traffic_mode === "tx") return tx
  if (node.traffic_mode === "down" || node.traffic_mode === "rx") return rx
  if (node.traffic_mode === "max") return Math.max(rx, tx)
  return rx + tx
}

export function getTrafficModeLabel(mode?: string): string {
  if (mode === "up" || mode === "tx") return "上行计费"
  if (mode === "down" || mode === "rx") return "下行计费"
  if (mode === "max") return "较大方向计费"
  return "双向计费"
}
