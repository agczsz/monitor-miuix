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
const formatLatency = (value: number) => `${Number.isInteger(value) ? value.toFixed(0) : value.toPrecision(2)} ms`
const CHART = { left: 70, right: 22, top: 22, bottom: 44 }
const xPosition = (ts: number, minTs: number, maxTs: number, width: number) => {
  const inner = width - CHART.left - CHART.right
  return CHART.left + (maxTs > minTs ? (ts - minTs) / (maxTs - minTs) : 1) * inner
}
const yPosition = (value: number, max: number, height: number) => {
  const inner = height - CHART.top - CHART.bottom
  return CHART.top + (1 - Math.min(max, Math.max(0, value)) / max) * inner
}
const timeLabel = (ts: number) => new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", month: "2-digit", day: "2-digit" }).format(new Date(ts * 1000))

function smoothLinePath(values: Array<{ ts: number; value: number }>, minTs: number, maxTs: number, max: number, width: number, height: number) {
  const points = values.map((point) => ({
    x: xPosition(point.ts, minTs, maxTs, width),
    y: yPosition(point.value, max, height),
  }))
  if (points.length < 3) return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")
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

interface TrendPoint {
  ts: number
  value: number | null
  loss?: number
  band?: [number, number]
}

interface TrendSeries {
  name: string
  color: string
  points: TrendPoint[]
  currentValue?: number
  showMarkers?: boolean
  maxGapSeconds?: number
}

interface TrendHistoryChartProps {
  title: string
  series: TrendSeries[]
  minTs: number
  maxTs: number
  maxValue: number
  axisFormatter: (value: number) => string
  ariaLabel: string
  id: string
  width: number
  height: number
  valueText?: string
}

const TrendHistoryChart: React.FC<TrendHistoryChartProps> = ({ title, series, minTs, maxTs, maxValue, axisFormatter, ariaLabel, id, width, height, valueText }) => {
  const effectiveMax = Math.max(1, maxValue)
  const bottom = height - CHART.bottom
  const ticks = Array.from(new Set([0, effectiveMax / 2, effectiveMax]))
  const timeTicks = Array.from({ length: 5 }, (_, index) => minTs + (maxTs - minTs) * index / 4)
  const makeSegments = (points: TrendPoint[], maxGapSeconds = Infinity) => {
    const segments: TrendPoint[][] = []
    let current: TrendPoint[] | undefined
    for (const point of points) {
      if (point.value === null || !Number.isFinite(point.value)) {
        current = undefined
        continue
      }
      if (current?.length && point.ts - current[current.length - 1].ts <= maxGapSeconds) current.push(point)
      else {
        current = [point]
        segments.push(current)
      }
    }
    return segments
  }

  return (
    <section className="node-detail-metric-card node-detail-trend-card" aria-label={title}>
      <header className="node-detail-metric-header">
        <span>{title}</span>
        {valueText && <strong>{valueText}</strong>}
      </header>
      {series.some((item) => item.points.length > 0) ? (
        <svg className="node-detail-metric-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
          <defs>{series.map((item, index) => <linearGradient key={item.name} id={`${id}-fill-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={item.color} stopOpacity="0.24"/><stop offset="100%" stopColor={item.color} stopOpacity="0.015"/></linearGradient>)}</defs>
          {ticks.map((tick) => {
            const y = yPosition(tick, effectiveMax, height)
            return <g key={tick}><line x1={CHART.left} y1={y} x2={width - CHART.right} y2={y} stroke="var(--miuix-divider)" strokeDasharray="4 5"/><text x={CHART.left - 8} y={y + 4} fontSize="10" textAnchor="end" fill="var(--miuix-on-surface-summary)">{axisFormatter(tick)}</text></g>
          })}
          {series.map((item) => item.points.flatMap((point) => point.band ? [{ ts: point.ts, low: point.band[0], high: point.band[1] }] : []).map((band, index) => <rect key={`${item.name}-band-${index}`} x={xPosition(band.ts, minTs, maxTs, width) - 3} y={yPosition(band.high, effectiveMax, height)} width="6" height={Math.max(1, yPosition(band.low, effectiveMax, height) - yPosition(band.high, effectiveMax, height))} fill={item.color} opacity="0.12"/>))}
          {series.map((item, index) => {
            const segments = makeSegments(item.points, item.maxGapSeconds)
            const latestPoint = [...item.points].reverse().find((point) => point.value !== null)
            const latestValue = item.currentValue ?? latestPoint?.value ?? undefined
            const latestY = latestValue === undefined ? bottom : yPosition(latestValue, effectiveMax, height)
            const latestX = xPosition(item.currentValue !== undefined ? maxTs : (latestPoint?.ts ?? maxTs), minTs, maxTs, width)
            return <g key={item.name}>
              {segments.map((segment, segmentIndex) => {
                const path = smoothLinePath(segment.map((point) => ({ ts: point.ts, value: point.value ?? 0 })), minTs, maxTs, effectiveMax, width, height)
                const first = segment[0]
                const last = segment[segment.length - 1]
                const areaPath = `${path} L${xPosition(last.ts, minTs, maxTs, width).toFixed(1)},${bottom} L${xPosition(first.ts, minTs, maxTs, width).toFixed(1)},${bottom} Z`
                return <g key={`${item.name}-segment-${segmentIndex}`}>
                  <path d={areaPath} fill={`url(#${id}-fill-${index})`}/>
                  {segment.length === 1
                    ? <circle cx={xPosition(first.ts, minTs, maxTs, width)} cy={yPosition(first.value ?? 0, effectiveMax, height)} r="3" fill={item.color}/>
                    : <path d={path} fill="none" stroke={item.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>}
                </g>
              })}
              {item.currentValue !== undefined && <path d={`M${CHART.left},${latestY} L${width - CHART.right},${latestY}`} stroke={item.color} strokeDasharray="4 4" strokeOpacity="0.45"><title>当前值 {item.currentValue}</title></path>}
              {latestValue !== undefined && <circle cx={latestX} cy={latestY} r="3.5" fill={item.color} stroke="var(--miuix-surface-container)" strokeWidth="2"><title>{item.name} 最新值 {latestValue}</title></circle>}
              {item.showMarkers && item.points.map((point, pointIndex) => {
                const isTimeout = point.value === null
                const cy = yPosition(point.value ?? effectiveMax, effectiveMax, height)
                const radius = isTimeout ? 3.5 : 2.2 + Math.min(3.5, Math.sqrt(point.loss ?? 0))
                return <circle key={`${item.name}-marker-${pointIndex}`} cx={xPosition(point.ts, minTs, maxTs, width)} cy={cy} r={radius} fill={isTimeout ? "var(--miuix-error)" : item.color} stroke="var(--miuix-surface)" strokeWidth="1.5"><title>{`${item.name} · ${isTimeout ? "超时" : point.loss === undefined ? "已响应" : `${point.loss}% 丢包`} · ${point.value ?? "无响应"}`}</title></circle>
              })}
            </g>
          })}
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
  const chartWidth = 760
  const chartHeight = 260
  const metricChartWidth = 520
  const metricChartHeight = 220
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
      const recentLatency = orderedPoints[orderedPoints.length - 1]?.latency ?? null
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

    const isPing = chartTab === "ping"
    const activeSeries: TrendSeries[] = isPing
      ? chartData.ping.map((series) => ({
          name: series.name,
          color: series.color,
          points: series.points.map((point) => ({ ts: point.ts, value: point.latency, loss: point.loss, band: point.band })),
          showMarkers: true,
          maxGapSeconds: Math.max(history.step * 2, 120),
        }))
      : chartData.netPoints.map((series) => ({ name: series.name, color: series.color, points: series.data, currentValue: series.data.at(-1)?.value }))
    const maxValue = isPing
      ? niceMax(Math.max(0, ...chartData.ping.flatMap((series) => series.points.map((point) => Math.max(point.latency ?? 0, point.band?.[1] ?? 0)))))
      : niceMax(Math.max(0, ...chartData.netPoints.flatMap((series) => series.data.map((point) => point.value))))

    return (
      <div className="history-chart-wrap">
        {isPing && chartData.ping.length === 0 ? (
          <div className="chart-empty">当前时间范围内没有延迟监控数据。</div>
        ) : isPing ? (
          <>
            <div className="node-detail-ping-charts">
              {activeSeries.map((series) => {
                const last = series.points.at(-1)
                const valueText = !last || last.value === null ? "无响应" : `${last.value.toFixed(0)} ms`
                return <TrendHistoryChart key={series.name} title={series.name} series={[series]} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={maxValue} axisFormatter={formatLatency} ariaLabel={`${series.name}延迟和丢包历史`} id={`${svgId}-probe-${series.name.replace(/[^a-zA-Z0-9_-]/g, "-")}`} width={metricChartWidth} height={metricChartHeight} valueText={valueText} />
              })}
            </div>
            <div className="chart-legend">
              {chartData.ping.filter((series) => node.online || series.latest !== null).map((series) => (
                <div key={series.id} className="node-detail-ping-card" style={{ opacity: series.latest === null ? 0.55 : 1 }}>
                  <div className="node-detail-ping-card-title"><i style={{ backgroundColor: series.color }}/><span>{series.name}</span></div>
                  <div className="node-detail-ping-card-values"><span><small>最新采样</small><b>{series.latest === null ? "无响应" : `${series.latest.toFixed(0)} ms`}</b></span><span><small>区间平均延迟</small><b>{series.average === null ? "—" : `${series.average.toFixed(0)} ms`}</b></span><span><small>时间段丢包率</small><b>{series.lossPercent === undefined ? "—" : `${formatSmallPercent(series.lossPercent)}%`}</b></span></div>
                </div>
              ))}
              <small className="chart-note">平均延迟按成功响应采样计算；丢包率优先采用服务端窗口统计，没有窗口统计时根据各采样桶的丢包率计算。</small>
            </div>
          </>
        ) : chartData.rows.length > 0 ? (
          <>
            <TrendHistoryChart title="网络吞吐" series={activeSeries} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={maxValue} axisFormatter={(value) => formatSpeed(value)} ariaLabel="网络吞吐历史趋势" id={svgId} width={chartWidth} height={chartHeight} valueText={activeSeries.map((series) => `${series.name}: ${formatSpeed(series.points.at(-1)?.value ?? 0)}`).join(" · ")} />
            <div className="chart-legend">
              {activeSeries.map((series) => {
                const last = series.points.at(-1)
                return <div key={series.name} className="chart-legend-item"><i style={{ backgroundColor: series.color }}/><span>{series.name}</span><b>{last ? formatSpeed(last.value ?? 0) : "暂无数据"}</b></div>
              })}
              <small className="chart-note">按节点历史数据记录的平均吞吐速率（字节/秒）。</small>
            </div>
          </>
        ) : <div className="chart-empty">当前时间范围内没有网络吞吐历史数据。</div>}
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

        <div className="history-panel">
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
                <TrendHistoryChart title="CPU" ariaLabel="CPU 使用率历史曲线" id={`${svgId}-cpu-fill`} series={[{ name: "CPU", color: "#FF6B6B", points: chartData.cpuPoints, currentValue: chartData.cpuCurrent }]} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={100} axisFormatter={(value) => `${Math.round(value)}%`} width={metricChartWidth} height={metricChartHeight} valueText={chartData.cpuCurrent === undefined ? "—" : `${chartData.cpuCurrent.toFixed(1)}%`} />
                <TrendHistoryChart title="内存" ariaLabel="内存使用量历史曲线" id={`${svgId}-memory-fill`} series={[{ name: "内存", color: "#FF6B6B", points: chartData.memoryPoints, currentValue: chartData.memoryCurrent }]} minTs={chartData.minTs} maxTs={chartData.maxTs} maxValue={niceMax(Math.max(chartData.memTotal, ...chartData.memoryPoints.map((point) => point.value)))} axisFormatter={formatBytes} width={metricChartWidth} height={metricChartHeight} valueText={chartData.memoryCurrent === undefined ? "—" : `${formatBytes(chartData.memoryCurrent)} / ${formatBytes(chartData.memTotal)}`} />
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
function formatSmallPercent(value: number) {
  return value < 0.1 && value > 0 ? value.toFixed(2) : value.toFixed(1)
}
