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

function smoothLinePath(values: Array<{ ts: number; value: number }>, minTs: number, maxTs: number, max: number, width: number, height: number) {
  const points = values.map((point) => ({
    x: xPosition(point.ts, minTs, maxTs, width),
    y: yPosition(point.value, max, height),
  }))
  if (points.length < 3) return linePath(values, minTs, maxTs, max, width, height)
  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`
    const previous = points[index - 1]
    const before = points[Math.max(0, index - 2)]
    const after = points[Math.min(points.length - 1, index + 1)]
    const control1 = { x: previous.x + (point.x - before.x) / 6, y: previous.y + (point.y - before.y) / 6 }
    const control2 = { x: point.x - (after.x - previous.x) / 6, y: point.y - (after.y - previous.y) / 6 }
    return `${path} C${control1.x.toFixed(1)},${control1.y.toFixed(1)} ${control2.x.toFixed(1)},${control2.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`
  }, "")
}

interface MetricHistoryChartProps {
  title: string
  points: Array<{ ts: number; value: number }>
  minTs: number
  maxTs: number
  maxValue: number
  color: string
  valueText: string
  valueFormatter: (value: number) => string
  axisFormatter: (value: number) => string
  ariaLabel: string
  id: string
  currentValue?: number
}

const MetricHistoryChart: React.FC<MetricHistoryChartProps> = ({ title, points, minTs, maxTs, maxValue, color, valueText, valueFormatter, axisFormatter, ariaLabel, id, currentValue }) => {
  const width = 520
  const height = 220
  const effectiveMax = Math.max(1, maxValue)
  const bottom = height - CHART.bottom
  const path = smoothLinePath(points, minTs, maxTs, effectiveMax, width, height)
  const areaPath = points.length ? `${path} L${xPosition(points[points.length - 1].ts, minTs, maxTs, width).toFixed(1)},${bottom} L${xPosition(points[0].ts, minTs, maxTs, width).toFixed(1)},${bottom} Z` : ""
  const ticks = Array.from(new Set([0, effectiveMax / 2, effectiveMax]))
  const timeTicks = Array.from({ length: 5 }, (_, index) => minTs + (maxTs - minTs) * index / 4)
  const latestValue = currentValue ?? points[points.length - 1]?.value
  const safeLatestY = latestValue === undefined ? bottom : yPosition(latestValue, effectiveMax, height)
  const latestX = xPosition(maxTs, minTs, maxTs, width)
  const hasLatestValue = latestValue !== undefined && (currentValue !== undefined || points.length > 0)

  return (
    <section className="node-detail-metric-card" aria-label={title}>
      <header className="node-detail-metric-header">
        <span>{title}</span>
        <strong>{valueText}</strong>
      </header>
      {points.length ? (
        <svg className="node-detail-metric-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.24"/><stop offset="100%" stopColor={color} stopOpacity="0.015"/></linearGradient></defs>
          {ticks.map((tick) => {
            const y = yPosition(tick, effectiveMax, height)
            return <g key={tick}><line x1={CHART.left} y1={y} x2={width - CHART.right} y2={y} stroke="var(--miuix-divider)" strokeDasharray="4 5"/><text x={CHART.left - 8} y={y + 4} fontSize="10" textAnchor="end" fill="var(--miuix-on-surface-summary)">{axisFormatter(tick)}</text></g>
          })}
          <path d={areaPath} fill={`url(#${id})`}/>
          {currentValue !== undefined && latestValue !== undefined && <path d={`M${CHART.left},${safeLatestY} L${width - CHART.right},${safeLatestY}`} stroke={color} strokeDasharray="4 4" strokeOpacity="0.45"><title>当前值 {valueFormatter(latestValue)}</title></path>}
          {points.length === 1
            ? <circle cx={xPosition(points[0].ts, minTs, maxTs, width)} cy={yPosition(points[0].value, effectiveMax, height)} r="3" fill={color}><title>{valueFormatter(points[0].value)}</title></circle>
            : points.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><title>{`${title}: ${valueFormatter(points[points.length - 1].value)}`}</title></path>}
          {hasLatestValue && <circle cx={latestX} cy={safeLatestY} r="3.5" fill={color} stroke="var(--miuix-surface-container)" strokeWidth="2"><title>当前值 {valueFormatter(latestValue!)}</title></circle>}
          {timeTicks.map((ts, index) => {
            const x = xPosition(ts, minTs, maxTs, width)
            return <text key={index} x={x} y={height - 12} fontSize="9" textAnchor="middle" fill="var(--miuix-on-surface-summary)">{timeLabel(ts)}</text>
          })}
        </svg>
      ) : <div className="node-detail-metric-empty">暂无历史数据</div>}
    </section>
  )
}

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
  const [chartTab, setChartTab] = useState<"metrics" | "ping" | "net">("metrics")
  const fetchSeries = chartTab === "ping" ? "ping" : "metrics"
  useEffect(() => { setHours(6); setChartTab("metrics") }, [node?.id])
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
        if (normalized.empty && chartTab === "ping") setHistoryError("当前时间范围内没有延迟监控数据。")
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
    const cpuPoints = rows.map((point) => ({ ts: point.ts, value: clampPercent(point.cpu) }))
    const memoryPoints = rows.map((point) => ({ ts: point.ts, value: Math.max(0, point.mem_used || 0) }))
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
    const ping = [...pingByTask.entries()].map(([id, points], index) => {
      const orderedPoints = [...points].sort((a, b) => a.ts - b.ts)
      const answered = orderedPoints.filter((point) => point.latency !== null).map((point) => point.latency as number)
      const lossFraction = history.loss?.[String(id)]
      const hasBucketLoss = orderedPoints.some((point) => point.loss !== undefined)
      const lossPercent = typeof lossFraction === "number"
        ? Math.min(100, Math.max(0, lossFraction * 100))
        : hasBucketLoss
          ? orderedPoints.reduce((sum, point) => sum + (point.loss ?? 0), 0) / Math.max(1, orderedPoints.length)
          : undefined
      const recentLatency = [...orderedPoints].reverse().find((point) => point.latency !== null)?.latency ?? null
      return {
        id,
        name: history.probes?.[String(id)] || `监控 ${id}`,
        color: COLORS[index % COLORS.length],
        points: orderedPoints,
        latest: recentLatency,
        average: answered.length ? answered.reduce((sum, latency) => sum + latency, 0) / answered.length : null,
        lossPercent,
      }
    })
    const cpuCurrent = node?.online ? node.metrics?.cpu : undefined
    const memoryCurrent = node?.online ? node.metrics?.mem_used : undefined
    const loadCurrent = node?.online ? node.metrics?.load : undefined
    return { rows, minTs, maxTs, cpuPoints, memoryPoints, netPoints, ping, cpuCurrent, memoryCurrent, loadCurrent, memTotal }
  }, [history, activeHours, node?.online, node?.mem_total, node?.metrics?.cpu, node?.metrics?.load, node?.metrics?.mem_total, node?.metrics?.mem_used])

  if (!node) return null
  const m = node.metrics

  const renderSvgChart = () => {
    if (historyError) return <div className="chart-empty" role="status">{historyError}</div>
    if (!history || !chartData) return <div className="chart-empty" role="status">正在加载历史趋势图表…</div>

    const maxValue = chartTab === "ping"
      ? niceMax(Math.max(0, ...chartData.ping.flatMap((series) => series.points.map((point) => Math.max(point.latency ?? 0, point.band?.[1] ?? 0)))))
      : niceMax(Math.max(0, ...chartData.netPoints.flatMap((series) => series.data.map((point) => point.value))))
    const ticks = chartTab === "ping" ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxValue * ratio) : netTicks(maxValue)
    const activeSeries = chartData.netPoints

    return (
      <div className="history-chart-wrap">
        {chartTab === "ping" && chartData.ping.length === 0 && <div className="chart-empty">当前时间范围内没有延迟监控数据。</div>}
        {chartTab !== "metrics" && (chartTab === "ping" ? chartData.ping.length > 0 : chartData.rows.length > 0) && (
          <svg className="history-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={chartTab === "ping" ? "各延迟监控的响应时间与丢包率" : "网络吞吐历史趋势"}>
            <defs><clipPath id={`${svgId}-clip`}><rect x={CHART.left} y={CHART.top} width={chartWidth - CHART.left - CHART.right} height={chartHeight - CHART.top - CHART.bottom} /></clipPath></defs>
            {ticks.map((tick, index) => {
              const ratio = tick / maxValue
              const y = CHART.top + (1 - ratio) * (chartHeight - CHART.top - CHART.bottom)
              const label = chartTab === "ping" ? `${Number.isInteger(tick) ? tick.toFixed(0) : tick.toPrecision(2)} ms` : formatSpeed(tick)
              return <g key={`${tick}-${index}`}><line x1={CHART.left} y1={y} x2={chartWidth - CHART.right} y2={y} stroke="var(--miuix-divider)" strokeDasharray="4 5"/><text x={CHART.left - 8} y={y + 4} fontSize="10" textAnchor="end" fill="var(--miuix-on-surface-summary)">{label}</text></g>
            })}
            <g clipPath={`url(#${svgId}-clip)`}>
              {chartTab === "ping" ? chartData.ping.map((series) => {
                const answered = series.points.filter((point) => point.latency !== null).map((point) => ({ ts: point.ts, value: Math.max(0, point.latency ?? 0) }))
                const markerPoints = series.points
                const segments = series.points.reduce<PingPoint[][]>((all, point) => {
                  if (point.latency === null) return all
                  const last = all[all.length - 1]
                  if (last?.length && point.ts - last[last.length - 1].ts <= Math.max(history.step * 2, 120)) last.push(point)
                  else all.push([point])
                  return all
                }, [])
                return <g key={series.id}>
                  {segments.map((segment, segmentIndex) => segment.length === 1 ? <circle key={`${series.id}-segment-${segmentIndex}`} cx={xPosition(segment[0].ts, chartData.minTs, chartData.maxTs, chartWidth)} cy={yPosition(segment[0].latency ?? 0, maxValue, chartHeight)} r="2.5" fill={series.color}/> : <path key={`${series.id}-segment-${segmentIndex}`} d={linePath(segment.map((point) => ({ ts: point.ts, value: point.latency ?? 0 })), chartData.minTs, chartData.maxTs, maxValue, chartWidth, chartHeight)} fill="none" stroke={series.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/>)}
                  {markerPoints.map((point) => {
                    const cx = xPosition(point.ts, chartData.minTs, chartData.maxTs, chartWidth)
                    const cy = yPosition(point.latency ?? maxValue, maxValue, chartHeight)
                    const radius = point.latency === null ? 3.5 : 2.2 + Math.min(3.5, Math.sqrt(point.loss ?? 0))
                    const lossText = point.latency === null ? "超时" : point.loss === undefined ? "已响应" : `${point.loss}% 丢包`
                    return <circle key={`${series.id}-${point.ts}`} cx={cx} cy={cy} r={radius} fill={point.latency === null ? "var(--miuix-error)" : series.color} stroke="var(--miuix-surface)" strokeWidth="1.5"><title>{`${series.name} · ${lossText} · ${point.latency ?? "无响应"} ms`}</title></circle>
                  })}
                  {answered.length === 1 && <circle cx={xPosition(answered[0].ts, chartData.minTs, chartData.maxTs, chartWidth)} cy={yPosition(answered[0].value, maxValue, chartHeight)} r="2.5" fill={series.color}/>}
                </g>
              }) : activeSeries.map((series) => <g key={series.name}>{series.data.length === 1 ? <circle cx={xPosition(series.data[0].ts, chartData.minTs, chartData.maxTs, chartWidth)} cy={yPosition(series.data[0].value, maxValue, chartHeight)} r="3" fill={series.color}/> : <path d={smoothLinePath(series.data, chartData.minTs, chartData.maxTs, maxValue, chartWidth, chartHeight)} fill="none" stroke={series.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>}</g>)}
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
            {chartData.ping.filter((series) => node.online || series.latest !== null).map(({ id, name, color, latest, average, lossPercent }) => ({ id, name, color, latest, average, lossPercent })).map((series) => (
              <div key={series.id} className="node-detail-ping-card" style={{ opacity: series.latest === null ? 0.55 : 1 }}>
                <div className="node-detail-ping-card-title"><i style={{ backgroundColor: series.color }}/><span>{series.name}</span></div>
                <div className="node-detail-ping-card-values"><span><small>最新采样</small><b>{series.latest === null ? "无响应" : `${series.latest.toFixed(0)} ms`}</b></span><span><small>区间平均延迟</small><b>{series.average === null ? "—" : `${series.average.toFixed(0)} ms`}</b></span><span><small>时间段丢包率</small><b>{series.lossPercent === undefined ? "—" : `${formatSmallPercent(series.lossPercent)}%`}</b></span></div>
              </div>
            ))}
            <small className="chart-note">平均延迟按成功响应采样计算；丢包率优先采用服务端窗口统计，没有窗口统计时根据各采样桶的丢包率计算。</small>
          </div>
        ) : chartTab === "metrics" ? (
          <div className="node-detail-metrics-grid">
            <MetricHistoryChart title="CPU" ariaLabel="CPU 使用率历史曲线" id={`${svgId}-cpu-fill`} points={chartData.cpuPoints} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={100} color="#FF6B6B" valueText={chartData.cpuCurrent === undefined ? "—" : `${chartData.cpuCurrent.toFixed(1)}%`} currentValue={chartData.cpuCurrent} valueFormatter={(value) => `${value.toFixed(1)}%`} axisFormatter={(value) => `${Math.round(value)}%`} />
            <MetricHistoryChart title="内存" ariaLabel="内存使用量历史曲线" id={`${svgId}-memory-fill`} points={chartData.memoryPoints} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={niceMax(Math.max(chartData.memTotal, ...chartData.memoryPoints.map((point) => point.value)))} color="#FF6B6B" valueText={chartData.memoryCurrent === undefined ? "—" : `${formatBytes(chartData.memoryCurrent)} / ${formatBytes(chartData.memTotal)}`} currentValue={chartData.memoryCurrent} valueFormatter={formatBytes} axisFormatter={formatBytes} />
            {chartData.loadCurrent && <div className="node-detail-load-summary"><b>系统负载</b><span>{chartData.loadCurrent.map((value) => value.toFixed(2)).join(" · ")}</span></div>}

          </div>
        ) : chartData.rows.length > 0 ? (
          <div className="chart-legend">
            {activeSeries.map((series) => {
              const last = series.data[series.data.length - 1]
              const value = last?.value ?? 0
              return <div key={series.name} className="chart-legend-item"><i style={{ backgroundColor: series.color }}/><span>{series.name}</span><b>{last ? formatSpeed(value) : "暂无数据"}</b></div>
            })}
            <small className="chart-note">按节点历史数据记录的平均吞吐速率（字节/秒）。</small>
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
          <div className="node-detail-spec"><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}>操作系统与内核</div><div className="miuix-body2" style={{ fontWeight: 600, marginTop: "4px" }}>{node.os || "Linux"}</div><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>Kernel: {node.kernel || "6.6-generic"} · 运行 {m?.uptime !== undefined ? formatUptime(m.uptime) : "—"}</div></div>
          <div className="node-detail-spec"><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}><ResourceIcon name="network" size={14} /> 活跃连接与进程</div><div className="miuix-body2 miuix-mono" style={{ fontWeight: 600, marginTop: "4px" }}>TCP {m?.tcp ?? 0} · UDP {m?.udp ?? 0} · Procs {m?.procs ?? 0}</div><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>Swap: {formatBytes(m?.swap_used)} / {formatBytes(m?.swap_total || node.swap_total)} ({formatPercent(m?.swap_used, m?.swap_total || node.swap_total)}%)</div></div>
          <div className="node-detail-spec"><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}><ResourceIcon name="disk" size={14} /> 内存与存储</div><div className="miuix-body2 miuix-mono" style={{ fontWeight: 600, marginTop: "4px" }}>{formatBytes(m?.mem_used)} / {formatBytes(m?.mem_total || node.mem_total)}</div><div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>磁盘 {formatBytes(m?.disk_used)} / {formatBytes(m?.disk_total || node.disk_total)}</div></div>
        </div>

        <div className="history-panel" ref={chartContainerRef}>
          <div className="history-toolbar">
            <div className="miuix-tab-row" role="tablist" aria-label="历史图表">
              <button className={`miuix-tab-item ${chartTab === "metrics" ? "active" : ""}`} onClick={() => setChartTab("metrics")} role="tab" aria-selected={chartTab === "metrics"}>CPU 与内存趋势</button>
              <button className={`miuix-tab-item ${chartTab === "ping" ? "active" : ""}`} onClick={() => setChartTab("ping")} role="tab" aria-selected={chartTab === "ping"}>三网延迟与丢包 (Ping)</button>
              <button className={`miuix-tab-item ${chartTab === "net" ? "active" : ""}`} onClick={() => setChartTab("net")} role="tab" aria-selected={chartTab === "net"}>网络吞吐曲线</button>
            </div>
            <div className="miuix-tab-row" aria-label="历史时间范围">
              {options.map((option) => <button key={option.hours} className={`miuix-tab-item ${hours === option.hours ? "active" : ""}`} onClick={() => setHours(clampHours(option.hours, maxHours))} aria-pressed={hours === option.hours}>{option.label}</button>)}
            </div>
          </div>
          {chartTab === "metrics" ? (
            <>
              {historyError ? <div className="chart-empty" role="status">{historyError}</div> : !history || !chartData ? <div className="chart-empty" role="status">正在加载历史趋势图表…</div> : <div className="node-detail-metrics-grid">
                <MetricHistoryChart title="CPU" ariaLabel="CPU 使用率历史曲线" id={`${svgId}-cpu-fill`} points={chartData.cpuPoints} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={100} color="#FF6B6B" valueText={chartData.cpuCurrent === undefined ? "—" : `${chartData.cpuCurrent.toFixed(1)}%`} currentValue={chartData.cpuCurrent} valueFormatter={(value) => `${value.toFixed(1)}%`} axisFormatter={(value) => `${Math.round(value)}%`} />
                <MetricHistoryChart title="内存" ariaLabel="内存使用量历史曲线" id={`${svgId}-memory-fill`} points={chartData.memoryPoints} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={niceMax(Math.max(chartData.memTotal, ...chartData.memoryPoints.map((point) => point.value)))} color="#FF6B6B" valueText={chartData.memoryCurrent === undefined ? "—" : `${formatBytes(chartData.memoryCurrent)} / ${formatBytes(chartData.memTotal)}`} currentValue={chartData.memoryCurrent} valueFormatter={formatBytes} axisFormatter={formatBytes} />
                {chartData.loadCurrent && <div className="node-detail-load-summary"><b>系统负载（1 / 5 / 15 分钟）</b><span>{chartData.loadCurrent.map((value) => value.toFixed(2)).join(" · ")}</span></div>}
              </div>}
            </>
          ) : renderSvgChart()}
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
