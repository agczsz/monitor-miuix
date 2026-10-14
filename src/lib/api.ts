import { useEffect, useState } from "react"
import { DEMO_NODES } from "./demo"

export type Metrics = {
  uptime: number; cpu: number; load: [number, number, number]
  mem_total: number; mem_used: number; swap_total: number; swap_used: number
  disk_total: number; disk_used: number; net_rx: number; net_tx: number
  total_rx: number; total_tx: number; month_rx: number; month_tx: number
  tcp: number; udp: number; procs: number
}

export type Node = {
  id: number; name: string; sort: number; public: boolean; online: boolean
  country: string; group?: string; last_seen: number; last_seen_ago?: number | null
  metrics: Metrics | null; os: string; kernel: string; arch: string; virt: string
  cpu_name: string; cpu_cores: number; mem_total: number; swap_total: number; disk_total: number
  agent_version: string; price: number; currency: string; billing_cycle: string
  expires_at: string | null; expires_in?: number | null; traffic_limit: number
  traffic_mode: string; traffic_reset_day: number; total_rx: number; total_tx: number
  month_rx: number; month_tx: number; month_used?: number; month_start: string
  day_rx: number; day_tx: number; public_remark?: string
}

export type Me = { authed: boolean; github?: boolean; site_name: string; public_page: boolean; history_days?: number }
export type Point = { ts: number; cpu: number; mem_used: number; disk_used: number; net_rx: number; net_tx: number; net_rx_max?: number; net_tx_max?: number }
export type PingPoint = { task_id: number; ts: number; latency: number | null; band?: [number, number]; loss?: number }
export type History = { step: number; metrics: Point[]; ping: PingPoint[]; probes: Record<string, string>; loss?: Record<string, number> }

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "ApiError" }
}

export async function api<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (!response.ok) {
    const detail = response.headers.get("content-type")?.includes("text/plain") ? (await response.text()).trim() : ""
    throw new ApiError(detail || `接口请求失败 (${response.status})`, response.status)
  }
  return response.json() as Promise<T>
}

export function groupsOf(nodes: Node[]): string[] {
  return [...new Set(nodes.map((node) => node.group ?? "").filter(Boolean))]
}

export function useNodes(demo = false) {
  const [nodes, setNodes] = useState<Node[] | null>(null)
  const [error, setError] = useState("")
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    let socket: WebSocket | null = null
    let poll: ReturnType<typeof setInterval> | undefined
    let retry: ReturnType<typeof setTimeout> | undefined
    let dead = false
    let serial = Promise.resolve()
    let watchdog: ReturnType<typeof setTimeout> | undefined

    const receive = (next: Node[]) => {
      if (dead) return
      // The theme is a public status page, not an authenticated panel: hide anything the hub marked private.
      setNodes(next.filter((node) => node.public).sort((a, b) => a.sort - b.sort || a.id - b.id))
      setError("")
      setClosed(false)
    }
    const fetchNodes = async () => {
      if (demo) { receive(DEMO_NODES); return }
      try {
        const data = await api<{ nodes: Node[] }>("/nodes")
        receive(data.nodes)
      } catch (e) {
        if (dead) return
        const error = e instanceof Error ? e.message : "读取节点失败"
        setError(error)
        if (e instanceof ApiError && e.status === 401) setClosed(true)
      }
    }
    const startPoll = () => {
      if (!poll) poll = setInterval(() => void fetchNodes(), 5000)
    }
    const connect = () => {
      if (dead || demo || document.hidden) return
      const gzip = typeof DecompressionStream === "function" ? "?gzip" : ""
      let opened: WebSocket
      try {
        opened = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/ws${gzip}`)
        socket = opened
      } catch { startPoll(); return }
      const armWatchdog = () => {
        if (watchdog) clearTimeout(watchdog)
        watchdog = setTimeout(() => {
          if (opened.readyState === WebSocket.OPEN) opened.close()
        }, 12000)
      }
      armWatchdog()
      opened.onmessage = (event) => {
        serial = serial.then(async () => {
          const text = typeof event.data === "string"
            ? event.data
            : await new Response((event.data as Blob).stream().pipeThrough(new DecompressionStream("gzip"))).text()
          const frame = JSON.parse(text) as { nodes: Node[] }
          if (opened.readyState !== WebSocket.OPEN || socket !== opened) return
          armWatchdog()
          receive(frame.nodes)
          if (poll) { clearInterval(poll); poll = undefined }
        }).catch((e: unknown) => console.warn("Miuix live frame dropped", e))
      }
      opened.onerror = () => opened.close()
      opened.onclose = () => {
        if (socket !== opened) return
        if (watchdog) { clearTimeout(watchdog); watchdog = undefined }
        if (dead) return
        startPoll()
        retry = setTimeout(connect, 5000)
      }
    }
    const pause = () => {
      if (socket) { socket.onclose = null; socket.close(); socket = null }
      if (poll) { clearInterval(poll); poll = undefined }
      if (retry) { clearTimeout(retry); retry = undefined }
      if (watchdog) { clearTimeout(watchdog); watchdog = undefined }
    }
    const resume = () => {
      if (dead || document.hidden) return
      void fetchNodes()
      if (demo) return
      pause()
      connect()
    }
    const visibility = () => document.hidden ? pause() : resume()
    document.addEventListener("visibilitychange", visibility)
    resume()

    return () => {
      dead = true
      document.removeEventListener("visibilitychange", visibility)
      if (poll) clearInterval(poll)
      if (retry) clearTimeout(retry)
      socket?.close()
    }
  }, [demo])

  return { nodes, error, closed }
}
