import { useCallback, useEffect, useState } from "react"
import type { Me, MetricsHistoryResponse, Node } from "@/types/monitor"
import { normalizeMetricsHistory } from "@/lib/metrics-history"
import { DEMO_NODES, generateDemoMetricsHistory } from "@/lib/mock"

const API_BASE = "/api"
const REQUEST_TIMEOUT_MS = 20000
const GZIP = typeof DecompressionStream === "function" ? "?gzip" : ""
const METRIC_FIELDS = [
  "uptime", "cpu", "mem_total", "mem_used", "swap_total", "swap_used", "disk_total", "disk_used",
  "net_rx", "net_tx", "total_rx", "total_tx", "month_rx", "month_tx", "tcp", "udp", "procs",
] as const
const validNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0
const hasGzipSignature = (value: ArrayBuffer | ArrayBufferView) => {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new DOMException("请求超时", "TimeoutError")), REQUEST_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort(signal?.reason)
  if (signal?.aborted) abortFromCaller()
  else signal?.addEventListener("abort", abortFromCaller, { once: true })

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json() as T
  } catch (error) {
    if (controller.signal.reason?.name === "TimeoutError") throw new Error("请求超时，请稍后重试")
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener("abort", abortFromCaller)
  }
}

export async function fetchMe(signal?: AbortSignal): Promise<Me | null> {
  try {
    return await fetchJson<Me>("/me", signal)
  } catch (error) {
    if (signal?.aborted) throw error
    return null
  }
}

export async function fetchNodesList(signal?: AbortSignal): Promise<Node[]> {
  const data = await fetchJson<{ nodes?: Node[] } | Node[]>("/nodes", signal)
  const nodes = Array.isArray(data) ? data : data && Array.isArray(data.nodes) ? data.nodes : null
  if (!nodes) throw new Error("节点接口返回格式无效")
  return safeNodes(nodes)
}

/** Keep malformed metrics from breaking otherwise usable node records. */
export function safeNodes(nodes: Node[]): Node[] {
  return nodes.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object" || !Number.isSafeInteger(candidate.id) || candidate.id < 0 || typeof candidate.name !== "string") return []
    if (typeof candidate.public !== "boolean" || typeof candidate.online !== "boolean") return []
    const node = candidate as Node
    const metrics = node.metrics
    if (!metrics || typeof metrics !== "object") return [{ ...node, metrics: null }]

    // Runtime fields can differ between Agent versions; only validate recognized values when supplied.
    const copy = { ...metrics } as unknown as Record<string, unknown>
    for (const key of METRIC_FIELDS) {
      if (key in copy && (copy[key] === null || !validNumber(copy[key]))) delete copy[key]
    }
    if (typeof copy.cpu === "number" && copy.cpu > 100) delete copy.cpu
    if ("load" in copy && (!Array.isArray(copy.load) || copy.load.length !== 3 || copy.load.some((value) => value !== null && value !== undefined && !validNumber(value)))) delete copy.load
    if ("cpu" in copy && typeof copy.cpu !== "number") delete copy.cpu
    return [{ ...node, metrics: copy as unknown as Node["metrics"] }]
  })
}

export async function fetchNodeMetricsHistory(
  nodeId: number,
  hours = 6,
  isDemo = false,
  signal?: AbortSignal,
  series: "metrics" | "ping" | "all" = "all",
): Promise<MetricsHistoryResponse> {
  if (isDemo) return generateDemoMetricsHistory(nodeId, hours)
  const query = new URLSearchParams({ hours: String(hours), points: "120" })
  if (series !== "all") query.set("series", series)
  const raw = await fetchJson<unknown>(`/nodes/${nodeId}/metrics?${query}`, signal)
  return normalizeMetricsHistory(raw)
}

async function parseWsPayload(raw: unknown): Promise<unknown> {
  if (typeof raw === "string") return JSON.parse(raw)
  if (raw instanceof Blob) {
    if (!hasGzipSignature(await raw.slice(0, 2).arrayBuffer())) return JSON.parse(await raw.text())
    if (typeof DecompressionStream !== "function") throw new Error("此浏览器不支持解压实时数据")
    const text = await new Response(raw.stream().pipeThrough(new DecompressionStream("gzip"))).text()
    return JSON.parse(text)
  }
  if (raw instanceof ArrayBuffer) {
    if (!hasGzipSignature(raw)) return JSON.parse(new TextDecoder().decode(raw))
    if (typeof DecompressionStream !== "function") throw new Error("此浏览器不支持解压实时数据")
    const blob = new Blob([raw])
    const text = await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).text()
    return JSON.parse(text)
  }
  if (ArrayBuffer.isView(raw)) {
    if (!hasGzipSignature(raw)) return JSON.parse(new TextDecoder().decode(raw))
    if (typeof DecompressionStream !== "function") throw new Error("此浏览器不支持解压实时数据")
    const bytes = new Uint8Array(raw.byteLength)
    bytes.set(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength))
    const blob = new Blob([bytes])
    const text = await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).text()
    return JSON.parse(text)
  }
  return null
}

export function useMonitorNodes() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())

  const refreshNodes = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    if (document.hidden || signal?.aborted) return false
    try {
      const list = await fetchNodesList(signal)
      if (document.hidden || signal?.aborted) return false
      // An empty list is a valid response; do not substitute fabricated nodes.
      setNodes(list)
      setIsDemo(false)
      setError("")
      setLoading(false)
      setLastUpdated(Date.now())
      return true
    } catch (cause) {
      if (signal?.aborted) return false
      const message = cause instanceof Error ? cause.message : "读取节点数据失败"
      setError(message)
      setLoading(false)
      return false
    }
  }, [])

  useEffect(() => {
    let disposed = false
    let socket: WebSocket | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let silentTimer: ReturnType<typeof setTimeout> | null = null
    let demoTimer: ReturnType<typeof setInterval> | null = null
    let startupController: AbortController | null = null
    let pollInFlight = false
    const demoRequested = new URLSearchParams(window.location.search).get("demo") === "1"

    const stopTimer = (timer: ReturnType<typeof setTimeout> | null) => {
      if (timer) clearTimeout(timer)
    }
    const pause = () => {
      startupController?.abort()
      startupController = null
      stopTimer(reconnectTimer)
      stopTimer(silentTimer)
      reconnectTimer = null
      silentTimer = null
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = null
      if (demoTimer) clearInterval(demoTimer)
      demoTimer = null
      if (socket) {
        const oldSocket = socket
        socket = null
        oldSocket.onclose = null
        oldSocket.close()
      }
      setWsConnected(false)
    }

    const startDemo = () => {
      if (disposed || document.hidden) return
      setIsDemo(true)
      setError("")
      setNodes(DEMO_NODES)
      setLoading(false)
      demoTimer = setInterval(() => {
        if (disposed || document.hidden) return
        setNodes((previous) => previous.map((node) => {
          if (!node.online || !node.metrics) return node
          const cpu = Math.max(2.5, Math.min(98, Math.round((node.metrics.cpu + (Math.random() - 0.48) * 4.2) * 10) / 10))
          return {
            ...node,
            last_seen: Math.floor(Date.now() / 1000),
            metrics: {
              ...node.metrics,
              uptime: node.metrics.uptime + 2,
              cpu,
              net_rx: Math.round(node.metrics.net_rx * (0.85 + Math.random() * 0.3)),
              net_tx: Math.round(node.metrics.net_tx * (0.85 + Math.random() * 0.3)),
            },
          }
        }))
        setLastUpdated(Date.now())
      }, 2000)
    }

    const poll = () => {
      if (pollTimer || disposed || document.hidden) return
      pollTimer = setInterval(() => {
        if (pollInFlight || document.hidden || disposed) return
        pollInFlight = true
        void refreshNodes().finally(() => { pollInFlight = false })
      }, 5000)
    }

    const connect = () => {
      if (disposed || document.hidden || socket || demoRequested) return
      try {
        const scheme = window.location.protocol === "https:" ? "wss:" : "ws:"
        const candidate = new WebSocket(`${scheme}//${window.location.host}/api/ws${GZIP}`)
        socket = candidate
        const watchForSilence = () => {
          stopTimer(silentTimer)
          silentTimer = setTimeout(() => {
            if (disposed || socket !== candidate || document.hidden) return
            setError("实时数据中断，正在重新连接…")
            candidate.close()
          }, 10000)
        }
        watchForSilence()

        candidate.onopen = () => {
          if (disposed || socket !== candidate) return
          setWsConnected(true)
          if (pollTimer) clearInterval(pollTimer)
          pollTimer = null
        }

        let decoded = Promise.resolve()
        candidate.onmessage = (event) => {
          decoded = decoded.then(async () => {
            const payload = await parseWsPayload(event.data) as Record<string, unknown> | null
            if (!payload || disposed || document.hidden || socket !== candidate || candidate.readyState !== WebSocket.OPEN) return
            let incoming: unknown = payload.nodes
            if (!Array.isArray(incoming) && payload.method === "nodes") incoming = payload.params
            if (!Array.isArray(incoming) && payload.type === "nodes") incoming = payload.data
            if (!Array.isArray(incoming) && payload.event === "nodes") incoming = payload.data ?? payload.nodes
            if (!Array.isArray(incoming) && payload.method === "nodes" && payload.params && typeof payload.params === "object") {
              incoming = (payload.params as { nodes?: unknown }).nodes
            }
            if (!Array.isArray(incoming) && payload.event === "nodes" && payload.data && typeof payload.data === "object") {
              incoming = (payload.data as { nodes?: unknown }).nodes
            }
            if (!Array.isArray(incoming) && payload.type === "node_update" && payload.data && typeof payload.data === "object") {
              const update = payload.data as Node
              setNodes((previous) => safeNodes(previous.map((node) => node.id === update.id ? { ...node, ...update } : node)))
            } else if (Array.isArray(incoming)) {
              setNodes(safeNodes(incoming as Node[]))
            } else {
              return
            }
            setIsDemo(false)
            setError("")
            setLoading(false)
            setLastUpdated(Date.now())
            watchForSilence()
            if (pollTimer) clearInterval(pollTimer)
            pollTimer = null
          }).catch((cause: unknown) => {
            // Keep the decode queue alive; the silence watchdog will recover if every frame is bad.
            console.warn("Monitor live frame was dropped", cause)
          })
        }

        candidate.onerror = () => candidate.close()
        candidate.onclose = () => {
          if (disposed || socket !== candidate) return
          socket = null
          stopTimer(silentTimer)
          silentTimer = null
          setWsConnected(false)
          poll()
          stopTimer(reconnectTimer)
          reconnectTimer = setTimeout(connect, 5000)
        }
      } catch {
        socket = null
        setWsConnected(false)
        poll()
        stopTimer(reconnectTimer)
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    const start = () => {
      if (disposed || document.hidden) return
      if (demoRequested) {
        startDemo()
        return
      }
      startupController = new AbortController()
      const controller = startupController
      void fetchMe(controller.signal).then((value) => {
        if (!disposed && !controller.signal.aborted && value) setMe(value)
      }).catch(() => { /* The public page can use its fallback defaults without /api/me. */ })
      void refreshNodes(controller.signal).then((ok) => {
        if (disposed || controller.signal.aborted || document.hidden) return
        if (!ok && (!socket || socket.readyState !== WebSocket.OPEN)) poll()
      })
      connect()
    }

    const onVisibilityChange = () => {
      if (document.hidden) pause()
      else start()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    start()
    return () => {
      disposed = true
      document.removeEventListener("visibilitychange", onVisibilityChange)
      pause()
    }
  }, [refreshNodes])

  return { nodes, me, loading, wsConnected, isDemo, error, lastUpdated, refreshNodes }
}
