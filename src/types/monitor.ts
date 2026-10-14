export type Metrics = {
  uptime: number
  cpu: number
  load: [number, number, number]
  mem_total: number
  mem_used: number
  swap_total: number
  swap_used: number
  disk_total: number
  disk_used: number
  net_rx: number
  net_tx: number
  total_rx: number
  total_tx: number
  month_rx: number
  month_tx: number
  tcp: number
  udp: number
  procs: number
}

export type Node = {
  id: number
  name: string
  sort: number
  public: boolean
  online: boolean
  /** ISO 3166-1 alpha-2 country code (e.g., "CN", "HK", "JP", "US") */
  country: string
  /** Days until expiration by the hub's local calendar; null means no expiry. */
  expires_in?: number | null
  /** Optional node group name */
  group?: string
  last_seen: number
  /** Seconds since last report according to the hub clock. */
  last_seen_ago?: number | null
  os?: string
  kernel?: string
  arch?: string
  virt?: string
  cpu_name?: string
  cpu_cores?: number
  mem_total?: number
  swap_total?: number
  disk_total?: number
  agent_version?: string
  price?: number
  currency?: string
  billing_cycle?: string
  month_used?: number
  /** Publicly configured operator note. */
  public_remark?: string
  hostname?: string
  ip?: string
  expires_at?: string | number | null
  traffic_limit?: number
  traffic_mode?: string
  traffic_reset_day?: number
  total_rx?: number
  total_tx?: number
  month_rx?: number
  month_tx?: number
  month_start?: string
  day_rx?: number
  day_tx?: number
  metrics?: Metrics | null
  created_at?: number
}

export type Me = {
  id?: number
  username?: string
  title?: string
  site_name?: string
  history_days?: number
  weight?: number
  sub?: string
}

export type MetricPoint = {
  ts: number
  cpu: number
  cpu_max?: number
  mem_used: number
  disk_used: number
  net_rx: number
  net_tx: number
  net_rx_max?: number
  net_tx_max?: number
  minutes?: number
  swap_used?: number
  tcp?: number
  udp?: number
  procs?: number
}

export type PingPoint = {
  task_id: number
  ts: number
  latency: number | null
  band?: [number, number]
  loss?: number
}

/** Exact shape returned by Monitor's GET /api/nodes/{id}/metrics endpoint. */
export type MetricsHistoryResponse = {
  metrics: MetricPoint[]
  ping: PingPoint[]
  probes: Record<string, string>
  loss?: Record<string, number>
  step: number
  empty?: boolean
}

export type ColorMode = "system" | "light" | "dark"
export type ViewMode = "grid" | "preference" | "table"
export type SortField = "sort" | "cpu" | "mem" | "net" | "traffic"

export interface MiuixThemeSettings {
  site_subtitle: string
  color_mode: ColorMode
  default_view: ViewMode
  show_summary: boolean
  show_billing: boolean
  enable_blur: boolean
  enable_squircle: boolean
  monet_key_color: string
  notice: string
  history_days?: number
}
