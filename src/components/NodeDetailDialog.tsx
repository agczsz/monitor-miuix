import React, { useEffect, useMemo, useState } from "react"
import { MetricsHistoryResponse, Node, PingPoint } from "@/types/monitor"
import { normalizeMetricsHistory } from "@/lib/metrics-history"
import { fetchNodeMetricsHistory } from "@/lib/api"
import { Flag } from "@/components/Flag"
import { ResourceIcon } from "@/components/ResourceIcon"
import { countryToName, formatBytes, formatPercent, formatSpeed, formatUptime } from "@/lib/format"

interface NodeDetailDialogProps {
  node: Node | null
  isDemo: boolean
  historyDays?: number
  onClose: () => void
}

function getHoursOptions(maxHours: number) {
  const standard = [1, 6, 24, 168, 720, 2160].filter((hours) => hours * 1.25 <= maxHours)
  const values = [...new Set([...standard, maxHours])].sort((a, b) => a - b)
  return values.map((hours) => ({
    hours,
    label: hours % 24 === 0 ? `${hours / 24} 天` : `${hours} 小时`,
  }))
}
const COLORS = ["#3482FF", "#16B767", "#FF9500", "#A855F7", "#EC4899", "#06B6D4", "#EAB308", "#EF4444"]
const CHART = { left: 70, right: 22, top: 22, bottom: 44 }
const xPosition = (ts: number, minTs: number, maxTs: number, width: number) => {
  const inner = width - CHART.left - CHART.right
  return CHART.left + (maxTs > minTs ? (ts - minTs) / (maxTs - minTs) : 1) * inner
}
const yPosition = (value: number, max: number, height: number) => {
  const inner = height - CHART.top - CHART.bottom
  return CHART.top + (1 - Math.min(max, Math.max(0, value)) / max) * inner
}
const linePath = (values: Array<{ ts: number; value: number }>, minTs: number, maxTs: number, max: number, width: number, height: number) =>
  values.map((point, index) => `${index ? "L" : "M"}${xPosition(point.ts, minTs, maxTs, width).toFixed(1)},${yPosition(point.value, max, height).toFixed(1)}`).join(" ")
const timeLabel = (ts: number) => new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", month: "2-digit", day: "2-digit" }).format(new Date(ts * 1000))

function clampHours(value: number, maximum: number) {
  return Math.min(Math.floor(maximum), Math.max(1, Math.floor(value)))
}

function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      const width = Math.max(240, Math.round(rect.width - 36))
      setSize((current) => current.width === width ? current : { width, height: Math.max(180, Math.min(350, Math.round(width * 0.34))) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return [setElement, size] as const
}

export const NodeDetailDialog: React.FC<NodeDetailDialogProps> = ({ node, isDemo, historyDays = 7, onClose }) => {
  const safeHistoryDays = Number.isFinite(historyDays) ? Math.min(365, Math.max(1, historyDays)) : 7
  const maxHours = safeHistoryDays * 24
  const options = useMemo(() => getHoursOptions(maxHours), [maxHours])
  const [hours, setHours] = useState(6)
  const activeHours = Math.min(hours, maxHours)
  const [history, setHistory] = useState<MetricsHistoryResponse | null>(null)
  const [historyError, setHistoryError] = useState("")
  const [chartTab, setChartTab] = useState<"load" | "ping" | "net">("load")
  const fetchSeries = chartTab === "ping" ? "ping" : "metrics"
  useEffect(() => { setHours(6); setChartTab("load") }, [node?.id])
  const [chartContainerRef, plotBounds] = useElementSize<HTMLDivElement>()
  const chartWidth = Math.max(240, Math.min(960, plotBounds.width || 760))
  const chartHeight = Math.max(180, Math.min(350, Math.round(chartWidth * 0.34)))
  const lineWidth = chartWidth - CHART.left - CHART.right
  const columnCount = Math.max(1, Math.floor(lineWidth / 140))
  const timeTicks = Array.from({ length: columnCount + 1 }, (_, index) => index)
  const svgId = `history-plot-${node?.id ?? "none"}-${chartTab}`

  useEffect(() => {
    if (!node) return
    let cancelled = false
    const controller = new AbortController()
    setHistory(null)
    setHistoryError("")
    fetchNodeMetricsHistory(node.id, activeHours, isDemo, controller.signal, fetchSeries)
      .then((res) => { if (!cancelled) {
        const normalized = normalizeMetricsHistory(res)
        if (normalized.empty) setHistoryError("此节点没有可用的历史数据。")
        else setHistory(normalized)
      } })
      .catch((error: unknown) => {
        if (!cancelled) setHistoryError(error instanceof Error ? error.message : "读取历史数据失败")
      })
    return () => { cancelled = true; controller.abort() }
  }, [node?.id, activeHours, isDemo, chartTab])

  const chartData = useMemo(() => {
    if (!history) return null
    const rows = [...(history.metrics ?? [])].filter((point) => Number.isFinite(point.ts)).sort((a, b) => a.ts - b.ts)
    const pingRows = [...(history.ping ?? [])].filter((point) => Number.isFinite(point.ts))
    const points = chartTab === "ping" ? [...pingRows].sort((a, b) => a.ts - b.ts) : rows
    const newest = points.length ? points[points.length - 1].ts : Math.floor(Date.now() / 1000)
    const oldest = points.length ? points[0].ts : newest - activeHours * 3600
    const minTs = Math.min(oldest, newest - activeHours * 3600)
    const maxTs = Math.max(newest, minTs + 1)
    const memTotal = node?.metrics?.mem_total || node?.mem_total || 0
    const loadPoints = [
      { name: "CPU 使用率", color: "var(--miuix-primary)", data: rows.map((point) => ({ ts: point.ts, value: clampPercent(point.cpu) })) },
      { name: "内存占用率", color: "var(--miuix-success)", data: rows.map((point) => ({ ts: point.ts, value: memTotal > 0 ? clampPercent(point.mem_used / memTotal * 100) : 0 })) },
    ]
    const netPoints = [
      { name: "下行速率 (RX)", color: "var(--miuix-primary)", data: rows.map((point) => ({ ts: point.ts, value: Math.max(0, point.net_rx || 0) })) },
      { name: "上行速率 (TX)", color: "var(--miuix-success)", data: rows.map((point) => ({ ts: point.ts, value: Math.max(0, point.net_tx || 0) })) },
    ]
    const pingByTask = new Map<number, PingPoint[]>()
    for (const point of history.ping ?? []) {
      const series = pingByTask.get(point.task_id) ?? []
      series.push(point)
      pingByTask.set(point.task_id, series)
    }
    const ping = [...pingByTask.entries()].map(([id, points], index) => ({
      id,
      name: history.probes?.[String(id)] || `监控 ${id}`,
      color: COLORS[index % COLORS.length],
      points,
    }))
    return { rows, minTs, maxTs, loadPoints, netPoints, ping }
  }, [history, activeHours, node?.mem_total, node?.metrics?.mem_total])

  if (!node) return null
  const m = node.metrics

  const renderSvgChart = () => {
    if (historyError) return <div className="chart-empty" role="status">{historyError}</div>
    if (!history || !chartData) return <div className="chart-empty" role="status">正在加载历史趋势图表…</div>

    const maxValue = chartTab === "load"
      ? 100
      : chartTab === "ping"
        ? niceMax(Math.max(0, ...chartData.ping.flatMap((series) => series.points.map((point) => Math.max(point.latency ?? 0, point.band?.[1] ?? 0)))))
        : niceMax(Math.max(0, ...chartData.netPoints.flatMap((series) => series.data.map((point) => point.value))))
    const ticks = chartTab === "load" ? [0, 25, 50, 75, 100] : chartTab === "ping" ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxValue * ratio) : netTicks(maxValue)
    const pingWindowLoss = history.loss ?? {}
    const activeSeries = chartTab === "load" ? chartData.loadPoints : chartData.netPoints

    return (
      <div className="history-chart-wrap">
        {chartTab === "ping" && chartData.ping.length === 0 && <div className="chart-empty">当前时间范围内没有延迟监控数据。</div>}
        {chartTab !== "ping" && chartData.rows.length === 0 && <div className="chart-empty">当前时间范围内没有系统指标数据。</div>}
        {chartTab === "ping" && chartData.ping.length > 0 && chartData.ping.every((series) => series.points.every((point) => point.latency === null)) && <div className="chart-empty chart-empty-overlay">监控均无成功响应；下方标记表示连续超时。</div>}
        {(chartTab === "ping" ? chartData.ping.length > 0 : chartData.rows.length > 0) && (
          <svg className="history-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={chartTab === "load" ? "CPU 和内存历史趋势" : chartTab === "ping" ? "各延迟监控的响应时间与丢包率" : "网络吞吐历史趋势"}>
            <defs><clipPath id={`${svgId}-clip`}><rect x={CHART.left} y={CHART.top} width={chartWidth - CHART.left - CHART.right} height={chartHeight - CHART.top - CHART.bottom} /></clipPath></defs>
            {ticks.map((tick, index) => {
              const ratio = chartTab === "load" ? tick / 100 : tick / maxValue
              const y = CHART.top + (1 - ratio) * (chartHeight - CHART.top - CHART.bottom)
              const label = chartTab === "load" ? `${Math.round(tick)}%` : chartTab === "ping" ? `${Number.isInteger(tick) ? tick.toFixed(0) : tick.toPrecision(2)} ms` : formatSpeed(tick)
              return <g key={`${tick}-${index}`}><line x1={CHART.left} y1={y} x2={chartWidth - CHART.right} y2={y} stroke="var(--miuix-divider)" strokeDasharray="4 5"/><text x={CHART.left - 8} y={y + 4} fontSize="10" textAnchor="end" fill="var(--miuix-on-surface-summary)">{label}</text></g>
            })}
            <g clipPath={`url(#${svgId}-clip)`}>
              {chartTab === "ping" ? chartData.ping.map((series) => {
                const answered = series.points.filter((point) => point.latency !== null).map((point) => ({ ts: point.ts, value: Math.max(0, point.latency ?? 0) }))
                const markerPoints = series.points.filter((point) => point.latency !== null || (point.loss ?? 0) > 0)
                const segments = series.points.reduce<PingPoint[][]>((all, point) => {
                  if (point.latency === null) return all
                  const last = all[all.length - 1]
                  if (last?.length && point.ts - last[last.length - 1].ts <= Math.max(history.step * 2, 120)) last.push(point)
                  else all.push([point])
                  return all
                }, [])
                return <g key={series.id}>
                  {segments.map((segment, segmentIndex) => segment.length === 1 ? <circle key={`${series.id}-segment-${segmentIndex}`} cx={xPosition(segment[0].ts, chartData.minTs, chartData.maxTs, chartWidth)} cy={yPosition(segment[0].latency ?? 0, maxValue, chartHeight)} r="2.5" fill={series.color}/> : <path key={`${series.id}-segment-${segmentIndex}`} d={linePath(segment.map((point) => ({ ts: point.ts, value: point.latency ?? 0 })), chartData.minTs, chartData.maxTs, maxValue, chartWidth, chartHeight)} fill="none" stroke={series.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/>)}
                  {markerPoints.filter((point) => (point.loss ?? 0) > 0).map((point) => {
                    const cx = xPosition(point.ts, chartData.minTs, chartData.maxTs, chartWidth)
                    const cy = yPosition(point.latency ?? maxValue, maxValue, chartHeight)
                    const radius = 3 + Math.min(4, Math.sqrt(point.loss ?? 0))
                    return <circle key={`${series.id}-${point.ts}`} cx={cx} cy={cy} r={radius} fill={point.latency === null ? "var(--miuix-error)" : series.color} stroke="var(--miuix-surface)" strokeWidth="1.5"><title>{`${series.name} · ${point.loss}% 丢包 · ${point.latency ?? "无响应"} ms`}</title></circle>
                  })}
                  {answered.length === 1 && <circle cx={xPosition(answered[0].ts, chartData.minTs, chartData.maxTs, chartWidth)} cy={yPosition(answered[0].value, maxValue, chartHeight)} r="2.5" fill={series.color}/>}
                </g>
              }) : activeSeries.map((series) => <g key={series.name}>{series.data.length === 1 ? <circle cx={xPosition(series.data[0].ts, chartData.minTs, chartData.maxTs, chartWidth)} cy={yPosition(series.data[0].value, maxValue, chartHeight)} r="3" fill={series.color}/> : <path d={linePath(series.data, chartData.minTs, chartData.maxTs, maxValue, chartWidth, chartHeight)} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>}</g>)}
            </g>
            {timeTicks.map((i) => {
              const ts = chartData.minTs + (chartData.maxTs - chartData.minTs) * i / Math.max(1, timeTicks.length - 1)
              const x = xPosition(ts, chartData.minTs, chartData.maxTs, chartWidth)
              return <g key={i}><line x1={x} y1={chartHeight - CHART.bottom} x2={x} y2={chartHeight - CHART.bottom + 4} stroke="var(--miuix-divider)"/><text x={x} y={chartHeight - 12} fontSize="10" textAnchor="middle" fill="var(--miuix-on-surface-summary)">{timeLabel(ts)}</text></g>
            })}
          </svg>
        )}
        {chartTab === "ping" && chartData.ping.length > 0 ? (
          <div className="chart-legend">
            {chartData.ping.map((series) => {
              const last = [...series.points].sort((a, b) => a.ts - b.ts).at(-1)
              const loss = Math.min(100, Math.max(0, (pingWindowLoss[String(series.id)] ?? 0) * 100))
              const lastLoss = last?.loss ?? 0
              return <div key={series.id} className="chart-legend-item"><i style={{ backgroundColor: series.color }}/><span>{series.name}</span><b>{last?.latency == null ? "无响应" : `${last.latency} ms`} · 当前桶丢包 {formatSmallPercent(lastLoss)}% · 区间丢包 {formatSmallPercent(loss)}%</b></div>
            })}
            <small className="chart-note">圆点表示采样桶发生丢包，红色圆点代表该桶内全部探测超时；点越大表示该桶丢包越多。图例按监控任务顺序排列，另显示整个时间窗口的加权丢包率。</small>
          </div>
        ) : chartData.rows.length > 0 ? (
          <div className="chart-legend">
            {activeSeries.map((series) => {
              const last = series.data[series.data.length - 1]
              const value = last?.value ?? 0
              return <div key={series.name} className="chart-legend-item"><i style={{ backgroundColor: series.color }}/><span>{series.name}</span><b>{last ? (chartTab === "load" ? `${value.toFixed(1)}%` : formatSpeed(value)) : "暂无数据"}</b></div>
            })}
            {chartTab === "net" && <small className="chart-note">按节点历史数据记录的平均吞吐速率（字节/秒）。</small>}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="miuix-dialog-backdrop" onClick={onClose}>
      <div className="miuix-dialog-surface" onClick={(event) => event.stopPropagation()} style={{ padding: "24px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Flag country={node.country} size="large" />
            <div>
              <h2 className="miuix-title3">{node.name}</h2>
              <p className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)" }}>
                {countryToName(node.country)} · {node.group || "默认分组"} · Agent v{node.agent_version || "1.4.1"}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="关闭详情" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "var(--miuix-surface-container-high)", color: "var(--miuix-on-surface)", cursor: "pointer", fontSize: "16px", fontWeight: 600 }}>✕</button>
        </div>

        <div className="node-detail-spec-grid">
          <div className="node-detail-spec"><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}><ResourceIcon name="cpu" size={14} /> 处理器与虚拟化</div><div className="miuix-body2" style={{ fontWeight: 600, marginTop: "4px" }}>{node.cpu_name || "Cloud vCPU"} ({node.cpu_cores || 2} Cores)</div><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>架构: {node.arch || "x86_64"} · 虚拟化: {(node.virt || "kvm").toUpperCase()}</div></div>
          <div className="node-detail-spec"><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}>操作系统与内核</div><div className="miuix-body2" style={{ fontWeight: 600, marginTop: "4px" }}>{node.os || "Linux"}</div><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>Kernel: {node.kernel || "6.6-generic"} · 运行 {formatUptime(m?.uptime)}</div></div>
          <div className="node-detail-spec"><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}><ResourceIcon name="network" size={14} /> 活跃连接与进程</div><div className="miuix-body2 miuix-mono" style={{ fontWeight: 600, marginTop: "4px" }}>TCP {m?.tcp ?? 0} · UDP {m?.udp ?? 0} · Procs {m?.procs ?? 0}</div><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>Swap: {formatBytes(m?.swap_used)} / {formatBytes(m?.swap_total || node.swap_total)} ({formatPercent(m?.swap_used, m?.swap_total || node.swap_total)}%)</div></div>
          <div className="node-detail-spec"><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}><ResourceIcon name="disk" size={14} /> 内存与存储</div><div className="miuix-body2 miuix-mono" style={{ fontWeight: 600, marginTop: "4px" }}>{formatBytes(m?.mem_used)} / {formatBytes(m?.mem_total || node.mem_total)}</div><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>磁盘 {formatBytes(m?.disk_used)} / {formatBytes(m?.disk_total || node.disk_total)}</div></div>
        </div>

        <div className="history-panel" ref={chartContainerRef}>
          <div className="history-toolbar">
            <div className="miuix-tab-row" role="tablist" aria-label="历史图表">
              <button className={`miuix-tab-item ${chartTab === "load" ? "active" : ""}`} onClick={() => setChartTab("load")} role="tab" aria-selected={chartTab === "load"}>CPU 与内存趋势</button>
              <button className={`miuix-tab-item ${chartTab === "ping" ? "active" : ""}`} onClick={() => setChartTab("ping")} role="tab" aria-selected={chartTab === "ping"}>三网延迟与丢包 (Ping)</button>
              <button className={`miuix-tab-item ${chartTab === "net" ? "active" : ""}`} onClick={() => setChartTab("net")} role="tab" aria-selected={chartTab === "net"}>网络吞吐曲线</button>
            </div>
            <div className="miuix-tab-row" aria-label="历史时间范围">
              {options.map((option) => <button key={option.hours} className={`miuix-tab-item ${hours === option.hours ? "active" : ""}`} onClick={() => setHours(clampHours(option.hours, maxHours))} aria-pressed={hours === option.hours}>{option.label}</button>)}
            </div>
          </div>
          {renderSvgChart()}
        </div>
      </div>
    </div>
  )
}

function clampPercent(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
}
function niceMax(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}
function netTicks(max: number) {
  const min = Math.min(1024, max)
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(min, 1)))
  const candidates = [1, 2, 5, 10].map((multiple) => multiple * magnitude).filter((tick) => tick > 0 && tick < max)
  const ticks = [...new Set([0, min, ...candidates, max])].sort((a, b) => a - b)
  return ticks.length > 6 ? [ticks[0], ...ticks.slice(2, -1).filter((_, index) => index % 2 === 0), ticks[ticks.length - 1]] : ticks
}
function formatSmallPercent(value: number) {
  return value < 0.1 && value > 0 ? value.toFixed(2) : value.toFixed(1)
}
