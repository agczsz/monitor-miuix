import { useCallback, useEffect, useMemo, useState } from "react"
import { api, groupsOf, useNodes, type Me, type Node, type History } from "./lib/api"
import { loadConfig } from "./lib/config"
import { demoHistory } from "./lib/demo"
import { bytes, cycle, elapsed, money, percent, rate, relativeDate, uptime } from "./lib/format"

type IconName = "grid" | "server" | "network" | "moon" | "sun" | "search" | "arrow" | "external" | "back" | "refresh" | "cpu" | "memory" | "disk" | "traffic" | "location" | "clock" | "spark" | "chevron" | "menu" | "check" | "close"
function Icon({ name, size = 18, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  const shared = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const }
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    server: <><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 17.5h.01M11 7.5h6M11 17.5h6"/></>,
    network: <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m8.7 10.7 6.6-3.4M8.7 13.3l6.6 3.4"/></>,
    moon: <path d="M20.5 15.8A8.5 8.5 0 0 1 8.2 3.5 8.5 8.5 0 1 0 20.5 15.8Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.2 4.2"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    external: <><path d="M14 3h7v7M10 14 21 3"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></>,
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4.9 9a7.5 7.5 0 0 1 12.4-2.8L20 9M4 17v-5h5"/><path d="M19.1 15a7.5 7.5 0 0 1-12.4 2.8L4 15"/></>,
    cpu: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/></>,
    memory: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h2v4H7zm5 0h2v4h-2zm5 0h2v4h-2zM7 3v3m5-3v3m5-3v3m-10 12v3m5-3v3m5-3v3"/></>,
    disk: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/><path d="M16 18h.01"/></>,
    traffic: <><path d="M12 3v18m0-18 4 4m-4-4L8 7m4 14 4-4m-4 4-4-4"/></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.2 2.2L22 17l-1.8.8L19 20l-1.1-2.2L16 17l1.9-.8L19 14Z"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  }
  return <svg {...shared}>{paths[name]}</svg>
}

const DARK_MEDIA = window.matchMedia("(prefers-color-scheme: dark)")
function useTheme() {
  const [dark, setDark] = useState(() => {
    try { const saved = localStorage.getItem("miuix-theme"); return saved ? saved === "dark" : DARK_MEDIA.matches }
    catch { return DARK_MEDIA.matches }
  })
  useEffect(() => {
    const system = () => {
      try { if (!localStorage.getItem("miuix-theme")) setDark(DARK_MEDIA.matches) } catch { setDark(DARK_MEDIA.matches) }
    }
    DARK_MEDIA.addEventListener("change", system)
    document.documentElement.dataset.theme = dark ? "dark" : "light"
    return () => DARK_MEDIA.removeEventListener("change", system)
  }, [dark])
  const toggle = () => setDark((value) => {
    const next = !value
    try { localStorage.setItem("miuix-theme", next ? "dark" : "light") } catch { /* Storage may be disabled. */ }
    return next
  })
  return [dark, toggle] as const
}

function useNodeRoute() {
  const read = () => Number(/^\/node\/(\d+)/.exec(location.pathname)?.[1]) || null
  const [id, setId] = useState(read)
  useEffect(() => { const update = () => setId(read()); addEventListener("popstate", update); return () => removeEventListener("popstate", update) }, [])
  const go = useCallback((next: number | null) => {
    const basePath = next ? `/node/${next}` : "/"
    const path = `${basePath}${location.search}`
    if (location.pathname + location.search !== path) history.pushState({}, "", path)
    setId(next); scrollTo({ top: 0, behavior: "smooth" })
  }, [])
  return [id, go] as const
}

function useEnvironment(demo: boolean) {
  const [me, setMe] = useState<Me | null>(demo ? { authed: false, site_name: "Miuix Cloud", public_page: true, history_days: 30 } : null)
  const [meError, setMeError] = useState("")
  const [config, setConfig] = useState<Record<string, unknown> | null>(demo ? { show_summary: true, notice: "欢迎来到 Miuix Cloud · 所有节点运行状态实时更新" } : null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (demo) return
    let active = true
    api<Me>("/me").then((value) => { if (active) { setMe(value); setMeError("") } }).catch((e: unknown) => { if (active) setMeError(e instanceof Error ? e.message : "无法连接 Monitor") })
    void loadConfig().then((value) => { if (active) setConfig(value) })
    return () => { active = false }
  }, [demo, version])
  const retry = () => { setMe(null); setConfig(null); setVersion((v) => v + 1) }
  return { me, meError, config, retry }
}

function MetricPill({ label, value, icon, tone = "blue", hint }: { label: string; value: string; icon: IconName; tone?: string; hint?: string }) {
  return <div className="metric-pill"><span className={`metric-icon ${tone}`}><Icon name={icon} size={16}/></span><span className="metric-copy"><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong>{hint && <span className="metric-hint">{hint}</span>}</span></div>
}

function Header({ siteName, dark, toggle, openCount, onSearch }: { siteName: string; dark: boolean; toggle: () => void; openCount: number; onSearch: () => void }) {
  return <header className="site-header"><div className="header-inner"><a className="brand" href="/" onClick={(e) => { e.preventDefault(); history.pushState({}, "", `/${location.search}`); dispatchEvent(new PopStateEvent("popstate")) }}><span className="brand-mark"><span/><span/><span/><span/></span><span className="brand-text">{siteName}<small>MONITORING DASHBOARD</small></span></a><nav className="header-nav"><a className="nav-link active" href="#overview"><Icon name="grid" size={16}/>Overview</a><a className="nav-link" href="#nodes"><Icon name="server" size={16}/>Nodes <span className="nav-count">{openCount}</span></a></nav><div className="header-actions"><button className="icon-button search-shortcut" title="Search nodes" onClick={onSearch}><Icon name="search" size={17}/><span>Search</span><kbd>⌘ K</kbd></button><span className="header-divider"/><span className="live-pill"><i/>LIVE</span><button className="icon-button theme-button" aria-label="切换主题" title="切换主题" onClick={toggle}><Icon name={dark ? "sun" : "moon"}/></button><a href="/admin/" className="avatar-button" title="登录或进入后台">A</a></div></div></header>
}

function MiniBars({ values, color = "var(--accent)" }: { values: number[]; color?: string }) {
  return <svg className="mini-bars" viewBox="0 0 104 30" preserveAspectRatio="none" aria-hidden="true">{values.map((value, index) => <rect key={index} x={index * 7.8 + .8} y={30 - value * 26} width="4.8" height={value * 26} rx="2.4" fill={color} opacity={.32 + value * .58}/>)}</svg>
}

function Overview({ nodes }: { nodes: Node[] }) {
  const online = nodes.filter((node) => node.online).length
  const cpu = nodes.filter((node) => node.online && node.metrics).reduce((sum, node) => sum + (node.metrics?.cpu ?? 0), 0) / Math.max(online, 1)
  const totals = nodes.reduce((sum, node) => ({ rx: sum.rx + (node.total_rx ?? 0), tx: sum.tx + (node.total_tx ?? 0) }), { rx: 0, tx: 0 })
  const speed = nodes.reduce((sum, node) => ({ rx: sum.rx + (node.online ? node.metrics?.net_rx ?? 0 : 0), tx: sum.tx + (node.online ? node.metrics?.net_tx ?? 0 : 0) }), { rx: 0, tx: 0 })
  const regions = new Set(nodes.map((node) => node.country).filter(Boolean)).size
  const onlineRatio = nodes.length ? Math.round(online / nodes.length * 100) : 0
  const allHealthy = online === nodes.length
  return <section className="overview-card" id="overview"><div className="overview-heading"><div><span className="eyebrow"><Icon name="spark" size={13}/> YOUR INFRASTRUCTURE</span><h2>Everything, <em>in view.</em></h2><p>A quiet little corner of the internet, running just right.</p></div><div className="uptime-chip"><span className="uptime-glyph"><Icon name="network" size={18}/></span><span><strong>{onlineRatio}%</strong><small>NODES ONLINE</small></span><span className="uptime-status"><i/>{online === nodes.length ? "All healthy" : "Needs a look"}</span></div></div><div className="metrics-row"><MetricPill label="Online nodes" value={`${online} / ${nodes.length}`} icon="server" tone="mint" hint={allHealthy ? "All systems go" : `${nodes.length - online} need attention`}/><MetricPill label="Fleet CPU" value={`${cpu.toFixed(1)}%`} icon="cpu" tone="lavender" hint="Average utilization"/><MetricPill label="Network traffic" value={`${bytes(totals.rx + totals.tx)}`} icon="traffic" tone="peach" hint={`${rate(speed.rx + speed.tx)} now`}/><MetricPill label="Regions" value={String(regions).padStart(2,"0")} icon="location" tone="sky" hint="Across the globe"/></div><div className="overview-footer"><div className="footer-note"><span className="status-check"><Icon name="check" size={13}/></span><span>{allHealthy ? "All services operational" : `${nodes.length - online} node${nodes.length - online === 1 ? "" : "s"} need attention`}</span><span className="footer-dot"/>Updated just now</div><div className="footer-chart"><span>NETWORK ACTIVITY <b>24H</b></span><MiniBars values={[.2,.32,.24,.5,.36,.44,.28,.63,.51,.7,.46,.58,.35,.72,.64,.82,.52,.68,.47,.61,.76,.48,.7,.55,.83,.64,.72,.92,.68,.78,.56,.73,.86,.59,.72,.98,.76,.83,.65,.8]}/></div></div></section>
}

function GroupFilters({ groups, selected, onSelect, nodes }: { groups: string[]; selected: string | null; onSelect: (value: string | null) => void; nodes: Node[] }) {
  return <div className="group-tabs" role="group" aria-label="节点分组"><button className={`group-tab ${selected === null ? "selected" : ""}`} aria-pressed={selected === null} onClick={() => onSelect(null)}>All nodes <span>{nodes.length}</span></button>{groups.map((group) => <button key={group} className={`group-tab ${selected === group ? "selected" : ""}`} aria-pressed={selected === group} onClick={() => onSelect(group)}>{group}<span>{nodes.filter((node) => node.group === group).length}</span></button>)}{nodes.some((node) => !node.group) && <button className={`group-tab ${selected === "" ? "selected" : ""}`} aria-pressed={selected === ""} onClick={() => onSelect("")}>Unassigned <span>{nodes.filter((node) => !node.group).length}</span></button>}</div>
}

function Meter({ label, value, total, accent = "blue", foot }: { label: string; value: number; total: number; accent?: string; foot: string }) {
  const pct = percent(value, total)
  return <div className="meter"><div className="meter-head"><span>{label}</span><strong>{pct.toFixed(0)}<small>%</small></strong></div><div className={`meter-track ${accent}`}><span style={{ width: `${pct}%` }}/></div><span className="meter-foot">{foot}</span></div>
}

function NodeCard({ node, onOpen, index }: { node: Node; onOpen: () => void; index: number }) {
  const m = node.metrics
  const hue = ["blue", "violet", "mint", "orange", "rose", "cyan"][index % 6]
  const usage = typeof node.month_used === "number" ? node.month_used : node.month_rx + node.month_tx
  const down = node.online ? null : node.last_seen_ago
  return <article className={`node-card accent-${hue} ${!node.online ? "is-offline" : ""}`} onClick={onOpen} tabIndex={0} role="button" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen() } }}>
    <div className="node-card-top"><div className="node-location"><span className="flag-chip">{node.country || "—"}</span><span className="location-meta"><strong title={node.name}>{node.name}</strong><small>{node.group || "Unassigned"} <i/> {node.country || "Unknown"}</small></span></div><span className={`status-badge ${node.online ? "online" : "offline"}`}><i/>{node.online ? "Online" : m || node.cpu_cores ? "Offline" : "Not connected"}</span></div>
    {node.public_remark && <div className="node-remark"><span className="remark-spark">✳</span>{node.public_remark}</div>}
    <div className="node-spec"><span><Icon name="cpu" size={13}/>{node.cpu_cores || "—"} vCPU</span><span><Icon name="memory" size={13}/>{bytes(node.mem_total)}</span><span><Icon name="disk" size={13}/>{bytes(node.disk_total)}</span></div>
    <div className="node-meters"><Meter label="CPU" value={m?.cpu ?? 0} total={100} accent="blue" foot={m ? `Load ${m.load.map((v) => v.toFixed(2)).join(" · ")}` : "Awaiting heartbeat"}/><Meter label="Memory" value={m?.mem_used ?? 0} total={m?.mem_total || node.mem_total} accent="violet" foot={m ? `${bytes(m.mem_used)} / ${bytes(m.mem_total)}` : bytes(node.mem_total)}/><Meter label="Disk" value={m?.disk_used ?? 0} total={m?.disk_total || node.disk_total} accent="mint" foot={m ? `${bytes(m.disk_used)} / ${bytes(m.disk_total)}` : bytes(node.disk_total)}/></div>
    <div className="node-traffic"><div className="traffic-stat"><span><Icon name="traffic" size={13}/>In</span><strong>{m ? rate(m.net_rx) : "—"}</strong></div><div className="traffic-stat"><span><Icon name="traffic" size={13}/>Out</span><strong>{m ? rate(m.net_tx) : "—"}</strong></div><div className="traffic-total"><span>Monthly usage</span><div className="traffic-total-line"><strong>{bytes(usage)}</strong><span>{node.traffic_limit > 0 ? `/ ${bytes(node.traffic_limit)}` : "Unlimited"}</span></div><div className="traffic-track"><span style={{ width: `${node.traffic_limit > 0 ? percent(usage, node.traffic_limit) : 9}%` }}/></div></div></div>
    <div className="node-card-bottom"><span className="node-age"><Icon name="clock" size={13}/>{node.online ? `Up ${uptime(m?.uptime ?? 0)}` : elapsed(down)}</span><span className={`expiry ${node.expires_in != null && node.expires_in < 8 ? "soon" : ""}`}>{relativeDate(node.expires_in)}<Icon name="chevron" size={13}/></span></div>
  </article>
}

function ActivityChart({ history, memoryTotal }: { history: History; memoryTotal: number }) {
  const data = history.metrics
  const width = 760, height = 190, padX = 8, padY = 14
  const max = 100
  const xAt = (index: number) => padX + index / Math.max(data.length - 1, 1) * (width - padX * 2)
  const yAt = (value: number) => padY + (height - padY * 2) * (1 - Math.max(0, Math.min(100, value)) / max)
  const coords = data.map((point, index) => ({ x: xAt(index), y: yAt(point.cpu) }))
  const memoryCoords = data.map((point, index) => ({ x: xAt(index), y: yAt(point.mem_used / Math.max(memoryTotal, 1) * 100) }))
  const pathFor = (points: {x:number;y:number}[]) => points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")
  const path = pathFor(coords)
  const memoryPath = pathFor(memoryCoords)
  const area = `${path} L${width - padX},${height} L${padX},${height} Z`
  return <div className="activity-chart"><div className="chart-legend"><span><i className="legend-blue"/>CPU usage</span><span><i className="legend-violet"/>Memory</span><span className="chart-legend-note">Last 6 hours <Icon name="chevron" size={12}/></span></div><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="CPU and memory utilization over time"><defs><linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".24"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>{[.2,.4,.6,.8].map((value) => <g key={value}><line x1="0" x2={width} y1={height * value} y2={height * value} className="chart-grid"/><text x="0" y={height * value - 4} className="chart-axis-label">{Math.round((1-value)*100)}%</text></g>)}<path d={area} fill="url(#chartGradient)"/><path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/><path d={memoryPath} fill="none" stroke="#a797f2" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>{coords.filter((_, index) => index % 10 === 0).map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke"/>)}</svg><div className="chart-times"><span>6 hours ago</span><span>4 hours ago</span><span>2 hours ago</span><span>Now</span></div></div>
}

function Detail({ node, demo, historyDays, onBack }: { node: Node; demo: boolean; historyDays: number; onBack: () => void }) {
  const [history, setHistory] = useState<History | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [range, setRange] = useState(Math.min(6, Math.max(1, historyDays * 24)))
  const [tab, setTab] = useState<"resources" | "latency">("resources")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setHistory(null); setError("")
    if (demo) { setHistory(demoHistory(node.id)); return () => { active = false } }
    setBusy(true)
    api<History>(`/nodes/${node.id}/metrics?hours=${range}&points=${Math.round(innerWidth * (devicePixelRatio || 1))}&series=${tab === "latency" ? "ping" : "metrics"}`).then((data) => { if (active) setHistory(data) }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "历史数据读取失败") }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [demo, node.id, range, tab, attempt])
  const ranges = useMemo(() => {
    const whole = Math.max(1, historyDays) * 24
    const options = [1, 6, 24, 168, 720, 2160].filter((value) => value * 1.25 <= whole)
    options.push(whole)
    return [...new Set(options)]
  }, [historyDays])
  const m = node.metrics
  return <div className="detail-page"><button className="back-link" onClick={onBack}><Icon name="back" size={16}/> All nodes</button><section className="detail-hero"><div className="detail-ident"><span className="detail-orb"><Icon name="server" size={25}/></span><div><span className="eyebrow">NODE / {String(node.id).padStart(3,"0")}</span><h1>{node.name}</h1><p>{node.group || "Unassigned"} <i/> {node.country || "Unknown"} <i/> {node.os || "Awaiting first report"}</p></div></div><span className={`status-badge large ${node.online ? "online" : "offline"}`}><i/>{node.online ? "Operational" : "Offline"}</span></section><div className="detail-metrics"><MetricPill label="CPU usage" value={`${(m?.cpu ?? 0).toFixed(1)}%`} icon="cpu" tone="blue" hint={`${node.cpu_cores} vCPU`}/><MetricPill label="Memory" value={bytes(m?.mem_used ?? 0)} icon="memory" tone="lavender" hint={`of ${bytes(node.mem_total)}`}/><MetricPill label="Inbound" value={rate(m?.net_rx ?? 0)} icon="traffic" tone="mint" hint="Current speed"/><MetricPill label="Uptime" value={uptime(m?.uptime ?? 0)} icon="clock" tone="peach" hint={node.online ? "Since last restart" : elapsed(node.last_seen_ago)}/></div><section className="detail-panel"><div className="panel-heading"><div><span className="eyebrow">PERFORMANCE</span><h2>Resource history</h2></div><button className="icon-button" title="Refresh history" onClick={() => { setHistory(null); setAttempt((value) => value + 1) }}><Icon name="refresh" size={16}/></button></div><div className="chart-controls"><div className="segmented">{([ ["resources","Resources"], ["latency","Network latency"] ] as const).map(([key,label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</div><div className="range-tabs">{ranges.map((value) => <button key={value} className={range === value ? "active" : ""} onClick={() => setRange(value)}>{value < 24 ? `${value}h` : value % 24 === 0 ? `${value / 24}d` : `${value}h`}</button>)}</div></div>{busy || !history ? <div className="chart-placeholder">{error ? <><span>{error}</span><button className="chart-retry" onClick={() => { setHistory(null); setAttempt((value) => value + 1) }}>Retry</button></> : <><span className="spinner"/>Loading history…</>}</div> : tab === "resources" ? <ActivityChart history={history} memoryTotal={node.mem_total}/> : <div className="latency-plot"><div className="latency-head"><span>Probe</span><strong>{history.probes["1"] || Object.values(history.probes)[0] || "Network probe"}</strong><span>Median latency</span><strong>{history.ping.at(-1)?.latency ?? "—"} ms</strong></div><div className="latency-bars">{history.ping.map((point,index) => <span key={`${point.ts}-${index}`} style={{ height: `${Math.max(8, Math.min(100, (point.latency ?? 0) * 1.8))}%` }} title={`${point.latency} ms`}/>)}</div><div className="chart-times"><span>{range}h ago</span><span>Now</span></div></div>}<div className="history-foot"><span><i className="green-dot"/> Data refreshed every 2 seconds</span><span>History retained for {historyDays} days</span></div></section><div className="detail-bottom-grid"><section className="detail-panel"><div className="panel-heading"><div><span className="eyebrow">MACHINE</span><h2>System information</h2></div></div><div className="info-grid"><Info label="Operating system" value={node.os}/><Info label="Kernel" value={node.kernel}/><Info label="Processor" value={`${node.cpu_name || "CPU"} · ${node.cpu_cores} cores`}/><Info label="Architecture" value={node.arch}/><Info label="Virtualization" value={node.virt}/><Info label="Agent version" value={node.agent_version}/></div></section><section className="detail-panel"><div className="panel-heading"><div><span className="eyebrow">BILLING</span><h2>Plan & usage</h2></div></div><div className="billing-amount">{money(node.price,node.currency)} <small>/ {cycle(node.billing_cycle)}</small></div><Meter label="Monthly traffic" value={node.month_used ?? node.month_rx + node.month_tx} total={node.traffic_limit} accent="blue" foot={`${bytes(node.month_used ?? node.month_rx + node.month_tx)} used of ${bytes(node.traffic_limit)}`}/><div className="billing-expiry"><span>Subscription</span><strong>{relativeDate(node.expires_in)}</strong></div></section></div><footer className="page-footer"><span>MIUIX <i>×</i> MONITOR</span><span>Made for the things you keep online.</span></footer></div>
}
function Info({ label, value }: { label: string; value?: string }) { return <div className="info-item"><span>{label}</span><strong>{value || "—"}</strong></div> }

function SearchDialog({ nodes, onClose, onOpen }: { nodes: Node[]; onClose: () => void; onOpen: (id: number) => void }) {
  const [query, setQuery] = useState("")
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey) }, [onClose])
  const results = nodes.filter((node) => `${node.name} ${node.country} ${node.group} ${node.os}`.toLowerCase().includes(query.toLowerCase())).slice(0,6)
  return <div className="search-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="search-dialog"><div className="search-input-wrap"><Icon name="search"/><input autoFocus placeholder="Search nodes, regions, operating systems…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && results[0]) { onOpen(results[0].id); onClose() } }}/><kbd>ESC</kbd></div><div className="search-results">{results.length ? results.map((node) => <button key={node.id} className="search-result" onClick={() => { onOpen(node.id); onClose() }}><span className="result-flag">{node.country || "—"}</span><span><strong>{node.name}</strong><small>{node.group || "Unassigned"} · {node.os || "Not connected"}</small></span><span className={`result-state ${node.online ? "up" : "down"}`}><i/>{node.online ? "Online" : "Offline"}</span><Icon name="chevron" size={15}/></button>) : <div className="empty-search">No nodes match “{query}”</div>}</div><div className="search-dialog-foot"><span>Navigate your infrastructure</span><span><kbd>↵</kbd> to open <kbd>ESC</kbd> to close</span></div></div></div>
}

export default function App() {
  const demo = new URLSearchParams(location.search).get("demo") === "1"
  const { me, meError, config, retry } = useEnvironment(demo)
  const { nodes, error, closed } = useNodes(demo)
  const [dark, toggle] = useTheme()
  const [open, go] = useNodeRoute()
  const [group, setGroup] = useState<string | null>(null)
  const [onlyOnline, setOnlyOnline] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState(Date.now())
  const [, setClock] = useState(Date.now())
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => { const handler = (event: KeyboardEvent) => { const target = event.target; const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)); if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen((v) => !v) } else if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) { event.preventDefault(); document.querySelector<HTMLInputElement>(".inline-search input")?.focus() } }; addEventListener("keydown", handler); return () => removeEventListener("keydown", handler) }, [])
  useEffect(() => { if (nodes) setLastSeenAt(Date.now()) }, [nodes])
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const sorted = useMemo(() => [...(nodes ?? [])].sort((a,b) => a.sort - b.sort || a.id - b.id), [nodes])
  const selected = sorted.find((node) => node.id === open)
  const groups = groupsOf(sorted)
  const visible = sorted.filter((node) => (group === null || (group === "" ? !node.group : node.group === group)) && (!onlyOnline || node.online) && `${node.name} ${node.country} ${node.os} ${node.group}`.toLowerCase().includes(query.toLowerCase()))
  const overviewNodes = sorted.filter((node) => group === null || (group === "" ? !node.group : node.group === group))
  const loading = !me || !config || !nodes
  useEffect(() => { if (me) document.title = `${selected?.name ? `${selected.name} · ` : ""}${me.site_name || "Monitor"} — Miuix` }, [me, selected?.name])
  useEffect(() => { if (me && !me.public_page && !me.authed) location.href = "/admin/" }, [me])
  if (!me && meError) return <div className="error-screen"><span className="brand-mark"><span/><span/><span/><span/></span><span className="eyebrow">CONNECTION INTERRUPTED</span><h1>Can't reach your hub.</h1><p>{meError}</p><button className="primary-button" onClick={retry}><Icon name="refresh" size={15}/> Try again</button></div>
  if (!me) return <div className="loading-screen"><span className="spinner large"/><span>Connecting to your hub…</span></div>
  if (closed && !me.authed) return <div className="error-screen"><span className="brand-mark"><span/><span/><span/><span/></span><span className="eyebrow">PRIVATE STATUS PAGE</span><h1>This dashboard is private.</h1><p>Sign in to the control panel to view your nodes.</p><a className="primary-button" href="/admin/">Go to control panel <Icon name="arrow" size={15}/></a></div>
  const siteName = me.site_name || "Monitor"
  return <div className="app-shell"><Header siteName={siteName} dark={dark} toggle={toggle} openCount={sorted.length} onSearch={() => setSearchOpen(true)}/><main className="main-container">{selected ? <Detail node={selected} demo={demo} historyDays={me.history_days ?? 7} onBack={() => go(null)}/> : <><section className="page-intro"><div><span className="eyebrow">{new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(new Date()).toUpperCase()} <i/> YOUR STATUS, AT A GLANCE</span><h1>Good things are <em>running.</em></h1><p>A little clarity for everything happening behind the scenes.</p></div><button className="refresh-button" onClick={() => { if (!demo) location.reload(); else setLastSeenAt(Date.now()) }}><Icon name="refresh" size={15}/> <span>Refresh</span></button></section>{Boolean(config?.notice) && <div className="notice-banner"><span className="notice-icon"><Icon name="spark" size={16}/></span><span>{String(config?.notice)}</span></div>}{Boolean(config?.show_summary) && sorted.length > 0 && <Overview nodes={overviewNodes}/>}<section className="nodes-section" id="nodes"><div className="section-heading"><div><span className="eyebrow">YOUR SERVERS</span><h2>Node directory <span>{sorted.length}</span></h2><p>Every machine, accounted for.</p></div><div className="nodes-actions"><label className="inline-search"><Icon name="search" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a node…"/><kbd>/</kbd></label><button className={`filter-button ${onlyOnline ? "filter-active" : ""}`} aria-pressed={onlyOnline} onClick={() => setOnlyOnline((value) => !value)}><Icon name="grid" size={15}/> Online</button></div></div>{groups.length > 0 && <GroupFilters groups={groups} selected={group} onSelect={setGroup} nodes={sorted}/>}<div className="nodes-meta"><span><i className="green-dot"/> {visible.length} nodes showing</span><span>Sorted by <strong>custom order</strong></span></div>{loading ? <div className="node-grid">{[1,2,3,4,5,6].map((item) => <div className="skeleton-card" key={item}><span/><span/><span/><span/></div>)}</div> : visible.length ? <div className="node-grid">{visible.map((node,index) => <NodeCard key={node.id} node={node} index={index} onOpen={() => go(node.id)}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={22}/></span><h3>{sorted.length ? "No matching nodes" : "Your fleet is waiting"}</h3><p>{sorted.length ? "Try another search or group." : "Add a server from the control panel to see it here."}</p></div>}{error && <div className="inline-error"><span>{error}</span><button onClick={() => !demo && location.reload()}>Retry</button></div>}<footer className="page-footer"><span>MIUIX <i>×</i> MONITOR</span><span><i className="green-dot"/> Live updates · refreshed {Math.max(0,Math.floor((Date.now()-lastSeenAt)/1000))}s ago</span><span>Made for the things you keep online.</span></footer></section></> }</main>{searchOpen && <SearchDialog nodes={sorted} onClose={() => setSearchOpen(false)} onOpen={go}/>}</div>
}
