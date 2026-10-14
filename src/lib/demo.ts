import type { Node, Metrics, History, Point } from "./api"

function metrics(seed: number, online: boolean): Metrics | null {
  if (!online) return null
  const wave = Math.sin(seed * 7) * 0.5 + 0.5
  return {
    uptime: (3 + seed % 43) * 86400 + 1732, cpu: 8 + wave * 55, load: [0.16 + wave, 0.12 + wave * .7, 0.09 + wave * .4],
    mem_total: 8 * 1024 ** 3, mem_used: (2.5 + wave * 3.6) * 1024 ** 3, swap_total: 2 * 1024 ** 3, swap_used: wave * 512 * 1024 ** 2,
    disk_total: 80 * 1024 ** 3, disk_used: (18 + wave * 35) * 1024 ** 3, net_rx: 12000 + wave * 800000, net_tx: 5500 + wave * 420000,
    total_rx: 320 * 1024 ** 3, total_tx: 96 * 1024 ** 3, month_rx: 34 * 1024 ** 3, month_tx: 11 * 1024 ** 3, tcp: 124 + seed, udp: 18, procs: 142 + seed,
  }
}
const definitions = [
  ["Tokyo · Sakura", "JP", "Edge", "Ubuntu 24.04", true],
  ["Singapore · Marina", "SG", "Edge", "Debian 12", true],
  ["Frankfurt · Mitte", "DE", "Core", "Debian 12", true],
  ["Los Angeles · West", "US", "Core", "Ubuntu 22.04", true],
  ["Helsinki · Aurora", "FI", "Storage", "AlmaLinux 9", true],
  ["Taipei · Breeze", "TW", "Edge", "Ubuntu 24.04", true],
  ["Amsterdam · Canal", "NL", "Core", "Debian 12", false],
  ["Sydney · Harbour", "AU", "Storage", "Rocky Linux 9", true],
] as const
export const DEMO_NODES: Node[] = definitions.map(([label, country, group, os, online], index) => {
  const seed = index + 1
  const m = metrics(seed, online)
  return {
    id: seed, name: label, sort: seed, public: true, online, country, group, last_seen: Math.floor(Date.now() / 1000) - (online ? 8 : 1820), last_seen_ago: online ? 8 : 1820,
    metrics: m, os, kernel: "6.8.0-generic", arch: "x86_64", virt: "KVM", cpu_name: "AMD EPYC 7B13", cpu_cores: 4,
    mem_total: 8 * 1024 ** 3, swap_total: 2 * 1024 ** 3, disk_total: 80 * 1024 ** 3, agent_version: "1.4.2", price: 5.5, currency: "USD", billing_cycle: "monthly",
    expires_at: "2026-08-15", expires_in: seed === 5 ? -2 : 41 + seed, traffic_limit: 2 * 1024 ** 4, traffic_mode: "sum", traffic_reset_day: 1,
    total_rx: m?.total_rx ?? 320 * 1024 ** 3, total_tx: m?.total_tx ?? 96 * 1024 ** 3, month_rx: m?.month_rx ?? 34 * 1024 ** 3, month_tx: m?.month_tx ?? 11 * 1024 ** 3,
    month_used: 45 * 1024 ** 3 + seed * 9000000000, month_start: "2026-07-01", day_rx: 4 * 1024 ** 3, day_tx: 1.2 * 1024 ** 3,
    public_remark: seed === 1 ? "主力入口 · 东京三区，晚高峰表现稳定" : "",
  }
})

export function demoHistory(id: number): History {
  const now = Math.floor(Date.now() / 1000)
  const metrics: Point[] = Array.from({ length: 50 }, (_, i) => {
    const wave = Math.sin(i * .38 + id) * 8 + Math.sin(i * .13) * 12 + 24
    return { ts: now - (49 - i) * 720, cpu: Math.max(3, wave), mem_used: 3.5 * 1024 ** 3 + Math.sin(i * .18) * 400 * 1024 ** 2, disk_used: (20 + i * .04) * 1024 ** 3, net_rx: 180000 + Math.cos(i * .35) * 110000, net_tx: 90000 + Math.sin(i * .46) * 60000 }
  })
  const ping = Array.from({ length: 50 }, (_, i) => ({ task_id: 1, ts: now - (49 - i) * 720, latency: Math.round(28 + Math.sin(i * .3 + id) * 7 + Math.cos(i * .13) * 3) }))
  return { step: 720, metrics, ping, probes: { "1": "东京 · Cloudflare" } }
}
