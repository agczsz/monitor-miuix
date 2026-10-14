import type { MetricPoint, MetricsHistoryResponse, PingPoint } from "../types/monitor.ts"

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

/** Validate and normalize the exact history payload exposed by Monitor. */
export function normalizeMetricsHistory(input: unknown): MetricsHistoryResponse {
  const raw = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const metrics: MetricPoint[] = Array.isArray(raw.metrics) ? raw.metrics.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const row = item as Record<string, unknown>
    if (!finite(row.ts)) return []
    return [{
      ts: row.ts,
      cpu: finite(row.cpu) ? Math.min(100, Math.max(0, row.cpu)) : 0,
      cpu_max: finite(row.cpu_max) ? Math.min(100, Math.max(0, row.cpu_max)) : undefined,
      mem_used: finite(row.mem_used) ? Math.max(0, row.mem_used) : 0,
      disk_used: finite(row.disk_used) ? Math.max(0, row.disk_used) : 0,
      net_rx: finite(row.net_rx) ? Math.max(0, row.net_rx) : 0,
      net_tx: finite(row.net_tx) ? Math.max(0, row.net_tx) : 0,
      net_rx_max: finite(row.net_rx_max) ? Math.max(0, row.net_rx_max) : undefined,
      net_tx_max: finite(row.net_tx_max) ? Math.max(0, row.net_tx_max) : undefined,
      minutes: finite(row.minutes) ? row.minutes : undefined,
      swap_used: finite(row.swap_used) ? row.swap_used : undefined,
      tcp: finite(row.tcp) ? row.tcp : undefined,
      udp: finite(row.udp) ? row.udp : undefined,
      procs: finite(row.procs) ? row.procs : undefined,
    }]
  }) : []
  const taskOrder = new Map<number, number>()
  const ping: PingPoint[] = Array.isArray(raw.ping) ? raw.ping.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const row = item as Record<string, unknown>
    if (!finite(row.ts) || !finite(row.task_id)) return []
    if (!taskOrder.has(row.task_id)) taskOrder.set(row.task_id, taskOrder.size)
    const band = Array.isArray(row.band) && row.band.length === 2 && finite(row.band[0]) && finite(row.band[1]) && row.band[0] >= 0 && row.band[1] >= 0
      ? [row.band[0], row.band[1]] as [number, number]
      : undefined
    return [{
      task_id: row.task_id,
      ts: row.ts,
      latency: row.latency === null ? null : finite(row.latency) && row.latency >= 0 ? row.latency : null,
      band,
      loss: finite(row.loss) ? Math.min(100, Math.max(0, row.loss)) : undefined,
    }]
  }) : []
  const rawProbes = raw.probes && typeof raw.probes === "object" && !Array.isArray(raw.probes) ? raw.probes as Record<string, unknown> : {}
  const probes = Object.fromEntries(Object.entries(rawProbes).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
  const rawLoss = raw.loss && typeof raw.loss === "object" && !Array.isArray(raw.loss) ? raw.loss as Record<string, unknown> : {}
  const loss = Object.fromEntries(Object.entries(rawLoss).flatMap(([key, value]) => finite(value) ? [[key, Math.min(1, Math.max(0, value))]] : []))
  return {
    metrics: metrics.sort((a, b) => a.ts - b.ts),
    ping: ping.sort((a, b) => (taskOrder.get(a.task_id) ?? Number.MAX_SAFE_INTEGER) - (taskOrder.get(b.task_id) ?? Number.MAX_SAFE_INTEGER) || a.ts - b.ts),
    probes,
    loss,
    step: finite(raw.step) && raw.step > 0 ? raw.step : 60,
    empty: raw.empty === true || (raw.metrics === undefined && raw.ping === undefined),
  }
}
