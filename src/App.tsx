import { useCallback, useEffect, useMemo, useState } from "react"
import { api, groupsOf, useNodes, type Me, type Node, type History } from "./lib/api"
import { loadConfig } from "./lib/config"
import { demoHistory } from "./lib/demo"
import { bytes, cycle, elapsed, money, percent, rate, relativeDate, uptime, type FormatLocale } from "./lib/format"

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

const translations = {
  en: {
    onlineNodes: "Online nodes", fleetCpu: "Fleet CPU", networkTraffic: "Network traffic", regions: "Regions", online: "Online", offline: "Offline", notConnected: "Not connected", unassigned: "Unassigned", allNodes: "All nodes", allHealthy: "All systems operational", avgUtilization: "Average utilization", acrossGlobe: "Regions covered", live: "LIVE", overview: "Overview", nodes: "Nodes", dashboard: "MONITORING DASHBOARD", up: "Up", in: "In", out: "Out", updated: "Live updates", justNow: "just now", ago: "ago", emptyGroup: "Unassigned", usage: "used", searchNo: "No matching nodes", pageRefreshed: (elapsed: string) => `refreshed ${elapsed} ago`, onlineOnly: "Online only", liveUpdated: (seconds: number) => `Live updates · refreshed ${seconds}s ago`, footerTagline: "Made for the things you keep online.",
    nodeDirectory: "Node directory", everyMachine: "Every machine, accounted for.", findNode: "Find a node…", nodesShowing: "nodes showing", sortedBy: "Sorted by", customOrder: "custom order", cpu: "CPU", memory: "Memory", disk: "Disk", load: "Load", awaitingHeartbeat: "Awaiting heartbeat", monthlyUsage: "Monthly usage", unlimited: "Unlimited", operational: "Operational", performance: "PERFORMANCE", resourceHistory: "Resource history", resources: "Resources", latency: "Network latency", lastHours: (hours: number) => `Last ${hours} hours`, hoursAgo: (hours: number) => `${hours} hours ago`, now: "Now", daysAgo: (days: number) => `${days} days ago`, probes: (count: number) => count === 1 ? "probe" : "probes", probe: (id: number) => `#${id}`,
    back: "All nodes", refresh: "Refresh", search: "Search", searchTitle: "Search nodes", searchPlaceholder: "Search nodes, regions, operating systems…", navigateInfra: "Browse infrastructure", toOpen: "to open", toClose: "to close", noMatch: (query: string) => `No nodes match “${query}”`, connectionInterrupted: "CONNECTION INTERRUPTED", cantReach: "Can't reach your hub.", tryAgain: "Try again", connecting: "Connecting to your hub…", privateStatus: "PRIVATE STATUS PAGE", dashboardPrivate: "This dashboard is private.", signInMessage: "Sign in to the control panel to view your nodes.", controlPanel: "Go to control panel", yourServers: "SERVERS", cpuUsage: "CPU usage", inbound: "Inbound", currentSpeed: "Current speed", sinceRestart: "Since last restart", waitingFirstReport: "Awaiting first report", refreshedEvery: "Data refreshes every 5 seconds", historyDays: (days: number) => `History retained for ${days} days`, machine: "MACHINE", systemInfo: "System information", network: "NETWORK", connectivity: "Connectivity", billing: "BILLING", billingInfo: "Billing and traffic", operatingSystem: "Operating system", kernel: "Kernel", processor: "Processor", architecture: "Architecture", virtualization: "Virtualization", agentVersion: "Agent version", memoryCapacity: "Memory capacity", swap: "Swap", diskCapacity: "Disk capacity", totalTraffic: "Total traffic", monthlyTraffic: "Monthly traffic", dailyTraffic: "Daily traffic", transfer: "Transfer", price: "Price", billingCycle: "Billing cycle", expires: "Expires", openControl: "Open control panel", nodeOnline: "NODES ONLINE", everythingHealthy: "All healthy", needsALook: "Needs attention", allServices: "All services operational", serviceNeeds: (count: number) => `${count} node${count === 1 ? "" : "s"} need attention`, onlyOnline: "Online only", noMatchesTitle: "No matching nodes", emptyFleetTitle: "No nodes yet", noMatchesHint: "Try another search or group.", emptyFleetHint: "Add a server from the control panel to see it here.", uptime: "Uptime", noData: "No history data for this period", memoryOf: (total: string) => `of ${total}`, nodeDetails: (id: string) => `NODE / ${id}`,
  },
  zh: {
    onlineNodes: "在线节点", fleetCpu: "平均 CPU", networkTraffic: "网络流量", regions: "地区", online: "在线", offline: "离线", notConnected: "未连接", unassigned: "未分组", allNodes: "全部节点", allHealthy: "所有服务运行正常", avgUtilization: "平均使用率", acrossGlobe: "覆盖地区", live: "实时", overview: "总览", nodes: "节点", dashboard: "监控面板", up: "运行", in: "入", out: "出", updated: "实时更新", justNow: "刚刚", ago: "前", emptyGroup: "未分组", usage: "已用", searchNo: "没有匹配的节点", pageRefreshed: (elapsed: string) => `${elapsed}前更新`, onlineOnly: "仅在线", liveUpdated: (seconds: number) => `实时更新 · ${seconds} 秒前刷新`, footerTagline: "为持续在线的服务而设计。",
    nodeDirectory: "节点列表", everyMachine: "所有设备，一目了然。", findNode: "搜索节点…", nodesShowing: "个节点", sortedBy: "排序方式", customOrder: "自定义顺序", cpu: "CPU", memory: "内存", disk: "磁盘", load: "负载", awaitingHeartbeat: "等待心跳", monthlyUsage: "本月流量", unlimited: "不限量", operational: "运行正常", performance: "性能监控", resourceHistory: "历史资源", resources: "资源用量", latency: "网络延迟", lastHours: (hours: number) => `最近 ${hours} 小时`, hoursAgo: (hours: number) => `${hours} 小时前`, now: "现在", daysAgo: (days: number) => `${days} 天前`, probes: (count: number) => `${count} 个探针`, probe: (id: number) => `探针 #${id}`,
    back: "全部节点", refresh: "刷新", search: "搜索", searchTitle: "搜索节点", searchPlaceholder: "搜索节点、地区或操作系统…", navigateInfra: "浏览基础设施", toOpen: "打开", toClose: "关闭", noMatch: (query: string) => `没有匹配“${query}”的节点`, connectionInterrupted: "连接中断", cantReach: "无法连接到监控服务", tryAgain: "重试", connecting: "正在连接监控服务…", privateStatus: "私有状态页", dashboardPrivate: "此状态页为私有页面", signInMessage: "请登录控制台以查看节点。", controlPanel: "前往控制台", yourServers: "服务器", cpuUsage: "CPU 使用率", inbound: "入站", currentSpeed: "当前速率", sinceRestart: "自上次重启", waitingFirstReport: "等待首次上报", refreshedEvery: "数据每 5 秒刷新", historyDays: (days: number) => `历史保留 ${days} 天`, machine: "设备信息", systemInfo: "系统信息", network: "网络", connectivity: "网络连接", billing: "账单", billingInfo: "账单与流量", operatingSystem: "操作系统", kernel: "内核", processor: "处理器", architecture: "架构", virtualization: "虚拟化", agentVersion: "探针版本", memoryCapacity: "内存容量", swap: "交换空间", diskCapacity: "磁盘容量", totalTraffic: "累计流量", monthlyTraffic: "本月流量", dailyTraffic: "今日流量", transfer: "流量", price: "价格", billingCycle: "计费周期", expires: "到期时间", openControl: "打开控制面板", nodeOnline: "在线节点", everythingHealthy: "运行正常", needsALook: "需要关注", allServices: "所有服务运行正常", serviceNeeds: (count: number) => `${count} 个节点需要关注`, onlyOnline: "仅在线", noMatchesTitle: "没有找到匹配节点", emptyFleetTitle: "暂无节点", noMatchesHint: "请尝试其他搜索词或分组。", emptyFleetHint: "请在控制台中添加服务器，节点将显示在此处。", uptime: "运行时间", noData: "此时间段暂无历史数据", memoryOf: (total: string) => `总计 ${total}`, nodeDetails: (id: string) => `节点 / ${id}`,
  },
} as const

type Locale = keyof typeof translations
function detectLocale(): Locale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  return languages.some((language) => /^zh(?:-|$)/i.test(language)) ? "zh" : "en"
}
function useLocale() {
  const [locale, setLocale] = useState<Locale>(detectLocale)
  useEffect(() => {
    const update = () => setLocale(detectLocale())
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
    window.addEventListener("languagechange", update)
    return () => window.removeEventListener("languagechange", update)
  }, [locale])
  return translations[locale]
}
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
  const [config, setConfig] = useState<Record<string, unknown> | null>(demo ? { show_summary: true } : null)
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

function formatLocale(t: typeof translations[Locale]): FormatLocale { return t === translations.zh ? "zh-CN" : "en-US" }

function MetricPill({ label, value, icon, tone = "blue", hint }: { label: string; value: string; icon: IconName; tone?: string; hint?: string }) {
  return <div className="metric-pill"><span className={`metric-icon ${tone}`}><Icon name={icon} size={16}/></span><span className="metric-copy"><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong>{hint && <span className="metric-hint">{hint}</span>}</span></div>
}

function Header({ siteName, dark, toggle, openCount, onSearch }: { siteName: string; dark: boolean; toggle: () => void; openCount: number; onSearch: () => void }) {
  const t = useLocale()
  return <header className="site-header"><div className="header-inner"><a className="brand" href="/" onClick={(e) => { e.preventDefault(); history.pushState({}, "", `/${location.search}`); dispatchEvent(new PopStateEvent("popstate")) }}><span className="brand-mark"><span/><span/><span/><span/></span><span className="brand-text">{siteName}<small>{t.dashboard}</small></span></a><nav className="header-nav"><a className="nav-link active" href="#overview"><Icon name="grid" size={16}/>{t.overview}</a><a className="nav-link" href="#nodes"><Icon name="server" size={16}/>{t.nodes} <span className="nav-count">{openCount}</span></a></nav><div className="header-actions"><button className="icon-button search-shortcut" title={t.searchTitle} onClick={onSearch}><Icon name="search" size={17}/><span>{t.search}</span><kbd>⌘ K</kbd></button><span className="header-divider"/><span className="live-pill"><i/>{t.live}</span><button className="icon-button theme-button" aria-label="切换主题" title="切换主题" onClick={toggle}><Icon name={dark ? "sun" : "moon"}/></button><a href="/admin/" className="avatar-button" title="登录或进入后台">A</a></div></div></header>
}

function MiniBars({ values, color = "var(--accent)" }: { values: number[]; color?: string }) {
  return <svg className="mini-bars" viewBox="0 0 104 30" preserveAspectRatio="none" aria-hidden="true">{values.map((value, index) => <rect key={index} x={index * 7.8 + .8} y={30 - value * 26} width="4.8" height={value * 26} rx="2.4" fill={color} opacity={.32 + value * .58}/>)}</svg>
}

function Overview({ nodes }: { nodes: Node[] }) {
  const t = useLocale()
  const online = nodes.filter((node) => node.online).length
  const cpu = nodes.filter((node) => node.online && node.metrics).reduce((sum, node) => sum + (node.metrics?.cpu ?? 0), 0) / Math.max(online, 1)
  const totals = nodes.reduce((sum, node) => ({ rx: sum.rx + (node.total_rx ?? 0), tx: sum.tx + (node.total_tx ?? 0) }), { rx: 0, tx: 0 })
  const speed = nodes.reduce((sum, node) => ({ rx: sum.rx + (node.online ? node.metrics?.net_rx ?? 0 : 0), tx: sum.tx + (node.online ? node.metrics?.net_tx ?? 0 : 0) }), { rx: 0, tx: 0 })
  const regions = new Set(nodes.map((node) => node.country).filter(Boolean)).size
  const onlineRatio = nodes.length ? Math.round(online / nodes.length * 100) : 0
  const allHealthy = online === nodes.length
  return <section className="overview-card" id="overview"><div className="overview-heading"><span className="overview-status"><span className="uptime-glyph"><Icon name="network" size={17}/></span><strong>{onlineRatio}%</strong><span>{t.nodeOnline}</span></span><span className={`uptime-status ${allHealthy ? "" : "needs-attention"}`}><i/>{allHealthy ? t.everythingHealthy : t.needsALook}</span></div><div className="metrics-row"><MetricPill label={t.onlineNodes} value={`${online} / ${nodes.length}`} icon="server" tone="mint" hint={allHealthy ? t.allHealthy : t.serviceNeeds(nodes.length - online)}/><MetricPill label={t.fleetCpu} value={`${cpu.toFixed(1)}%`} icon="cpu" tone="lavender" hint={t.avgUtilization}/><MetricPill label={t.networkTraffic} value={bytes(totals.rx + totals.tx)} icon="traffic" tone="peach" hint={`${rate(speed.rx + speed.tx)} ${t === translations.zh ? "当前" : "now"}`}/><MetricPill label={t.regions} value={String(regions).padStart(2,"0")} icon="location" tone="sky" hint={t.acrossGlobe}/></div><div className="overview-footer"><div className="footer-note"><span className="status-check"><Icon name="check" size={13}/></span><span>{allHealthy ? t.allServices : t.serviceNeeds(nodes.length - online)}</span></div><div className="footer-chart"><span>{t.networkTraffic} <b>24H</b></span><MiniBars values={[.2,.32,.24,.5,.36,.44,.28,.63,.51,.7,.46,.58,.35,.72,.64,.82,.52,.68,.47,.61,.76,.48,.7,.55,.83,.64,.72,.92,.68,.78,.56,.73,.86,.59,.72,.98,.76,.83,.65,.8]}/></div></div></section>
}

function GroupFilters({ groups, selected, onSelect, nodes }: { groups: string[]; selected: string | null; onSelect: (value: string | null) => void; nodes: Node[] }) {
  const t = useLocale()
  return <div className="group-tabs" role="group" aria-label={t.nodes}><button className={`group-tab ${selected === null ? "selected" : ""}`} aria-pressed={selected === null} onClick={() => onSelect(null)}>{t.allNodes} <span>{nodes.length}</span></button>{groups.map((group) => <button key={group} className={`group-tab ${selected === group ? "selected" : ""}`} aria-pressed={selected === group} onClick={() => onSelect(group)}>{group}<span>{nodes.filter((node) => node.group === group).length}</span></button>)}{nodes.some((node) => !node.group) && <button className={`group-tab ${selected === "" ? "selected" : ""}`} aria-pressed={selected === ""} onClick={() => onSelect("")}>{t.unassigned} <span>{nodes.filter((node) => !node.group).length}</span></button>}</div>
}

function Meter({ label, value, total, accent = "blue", foot }: { label: string; value: number; total: number; accent?: string; foot: string }) {
  const pct = percent(value, total)
  return <div className="meter"><div className="meter-head"><span>{label}</span><strong>{pct.toFixed(0)}<small>%</small></strong></div><div className={`meter-track ${accent}`}><span style={{ width: `${pct}%` }}/></div><span className="meter-foot">{foot}</span></div>
}

function NodeCard({ node, onOpen, index }: { node: Node; onOpen: () => void; index: number }) {
  const t = useLocale()
  const locale = formatLocale(t)
  const m = node.metrics
  const hue = ["blue", "violet", "mint", "orange", "rose", "cyan"][index % 6]
  const usage = typeof node.month_used === "number" ? node.month_used : node.month_rx + node.month_tx
  const down = node.online ? null : node.last_seen_ago
  return <article className={`node-card accent-${hue} ${!node.online ? "is-offline" : ""}`} onClick={onOpen} tabIndex={0} role="button" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen() } }}>
    <div className="node-card-top"><div className="node-location"><span className="flag-chip">{node.country || "—"}</span><span className="location-meta"><strong title={node.name}>{node.name}</strong><small>{node.group || t.unassigned} <i/> {node.country || (t === translations.zh ? "未知" : "Unknown")}</small></span></div><span className={`status-badge ${node.online ? "online" : "offline"}`}><i/>{node.online ? t.online : m || node.cpu_cores ? t.offline : t.notConnected}</span></div>
    {node.public_remark && <div className="node-remark"><span className="remark-spark">✳</span>{node.public_remark}</div>}
    <div className="node-spec"><span><Icon name="cpu" size={13}/>{node.cpu_cores || "—"} vCPU</span><span><Icon name="memory" size={13}/>{bytes(node.mem_total)}</span><span><Icon name="disk" size={13}/>{bytes(node.disk_total)}</span></div>
    <div className="node-meters"><Meter label={t.cpu} value={m?.cpu ?? 0} total={100} accent="blue" foot={m ? `${t.load} ${m.load.map((v) => v.toFixed(2)).join(" · ")}` : t.awaitingHeartbeat}/><Meter label={t.memory} value={m?.mem_used ?? 0} total={m?.mem_total || node.mem_total} accent="violet" foot={m ? `${bytes(m.mem_used)} / ${bytes(m.mem_total)}` : bytes(node.mem_total)}/><Meter label={t.disk} value={m?.disk_used ?? 0} total={m?.disk_total || node.disk_total} accent="mint" foot={m ? `${bytes(m.disk_used)} / ${bytes(m.disk_total)}` : bytes(node.disk_total)}/></div>
    <div className="node-traffic"><div className="traffic-stat"><span><Icon name="traffic" size={13}/>{t.in}</span><strong>{m ? rate(m.net_rx) : "—"}</strong></div><div className="traffic-stat"><span><Icon name="traffic" size={13}/>{t.out}</span><strong>{m ? rate(m.net_tx) : "—"}</strong></div><div className="traffic-total"><span>{t.monthlyUsage}</span><div className="traffic-total-line"><strong>{bytes(usage)}</strong><span>{node.traffic_limit > 0 ? `/ ${bytes(node.traffic_limit)}` : t.unlimited}</span></div><div className="traffic-track"><span style={{ width: `${node.traffic_limit > 0 ? percent(usage, node.traffic_limit) : 9}%` }}/></div></div></div>
    <div className="node-card-bottom"><span className="node-age"><Icon name="clock" size={13}/>{node.online ? `${t.up} ${uptime(m?.uptime ?? 0, locale)}` : elapsed(down, locale)}</span><span className={`expiry ${node.expires_in != null && node.expires_in < 8 ? "soon" : ""}`}>{relativeDate(node.expires_in, locale)}<Icon name="chevron" size={13}/></span></div>
  </article>
}

function smoothPath(points: { x: number; y: number }[]) {
  if (!points.length) return ""
  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`
    const previous = points[index - 1]
    const mid = (previous.x + point.x) / 2
    return `${path} C${mid.toFixed(1)},${previous.y.toFixed(1)} ${mid.toFixed(1)},${point.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`
  }, "")
}

function ActivityChart({ history, memoryTotal, range }: { history: History; memoryTotal: number; range: number }) {
  const t = useLocale()
  const data = history.metrics
  const width = 960, height = 240, left = 48, right = 12, top = 12, bottom = 22
  const xAt = (index: number) => left + index / Math.max(data.length - 1, 1) * (width - left - right)
  const yAt = (value: number) => top + (height - top - bottom) * (1 - Math.max(0, Math.min(100, value)) / 100)
  const cpuPoints = data.map((point, index) => ({ x: xAt(index), y: yAt(point.cpu) }))
  const memoryPoints = data.map((point, index) => ({ x: xAt(index), y: yAt(point.mem_used / Math.max(memoryTotal, 1) * 100) }))
  const cpuPath = smoothPath(cpuPoints)
  const memoryPath = smoothPath(memoryPoints)
  const cpuArea = cpuPoints.length ? `${cpuPath} L${cpuPoints.at(-1)!.x},${height - bottom} L${cpuPoints[0].x},${height - bottom} Z` : ""
  const memoryArea = memoryPoints.length ? `${memoryPath} L${memoryPoints.at(-1)!.x},${height - bottom} L${memoryPoints[0].x},${height - bottom} Z` : ""
  const hours = Math.max(1, range)
  const labels = [hours, Math.round(hours * 2 / 3), Math.round(hours / 3), 0]
  const ago = (value: number) => value === 0 ? t.now : value >= 24 && value % 24 === 0 ? t.daysAgo(value / 24) : t.hoursAgo(value)
  return <div className="activity-chart"><div className="chart-legend"><span><i className="legend-blue"/>{t.cpuUsage}</span><span><i className="legend-violet"/>{t.memory}</span><span className="chart-legend-note">{t.lastHours(hours)}</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t === translations.zh ? "CPU 与内存使用率变化" : "CPU and memory utilization over time"} preserveAspectRatio="none"><defs><linearGradient id="cpuArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--accent-strong)" stopOpacity=".18"/><stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0"/></linearGradient><linearGradient id="memoryArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a797f2" stopOpacity=".12"/><stop offset="100%" stopColor="#a797f2" stopOpacity="0"/></linearGradient></defs>{[0,25,50,75,100].map((value) => { const y = yAt(value); return <g key={value}><line x1={left} x2={width - right} y1={y} y2={y} className="chart-grid"/><text x={left - 10} y={y + 3} textAnchor="end" className="chart-axis-label">{value}%</text></g>})}<path d={memoryArea} fill="url(#memoryArea)"/><path d={cpuArea} fill="url(#cpuArea)"/><path d={memoryPath} fill="none" stroke="#a797f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/><path d={cpuPath} fill="none" stroke="var(--accent-strong)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/></svg><div className="chart-times">{labels.map((value, index) => <span key={index}>{ago(value)}</span>)}</div></div>
}

const PING_COLORS = ["#30a879", "#7187f3", "#d8954d", "#d96b84", "#29a3b5", "#9877df"]
function LatencyChart({ history, range }: { history: History; range: number }) {
  const t = useLocale()
  const width = 960, height = 250, left = 50, right = 14, top = 18, bottom = 24
  const grouped = new Map<number, typeof history.ping>()
  history.ping.forEach((point) => grouped.set(point.task_id, [...(grouped.get(point.task_id) ?? []), point]))
  const series = [...grouped.entries()].map(([id, points], index) => ({ id, points: [...points].sort((a, b) => a.ts - b.ts), color: PING_COLORS[index % PING_COLORS.length] }))
  const stamps = history.ping.map((point) => point.ts)
  const minTime = stamps.length ? Math.min(...stamps) : 0
  const maxTime = stamps.length ? Math.max(...stamps) : minTime + range * 3600
  const maxLatency = Math.max(50, ...history.ping.map((point) => point.latency ?? 0))
  const axisMax = Math.ceil(maxLatency / 25) * 25 || 50
  const xAt = (ts: number) => left + (maxTime === minTime ? .5 : (ts - minTime) / (maxTime - minTime)) * (width - left - right)
  const yAt = (latency: number) => top + (height - top - bottom) * (1 - Math.max(0, Math.min(axisMax, latency)) / axisMax)
  const pathFor = (points: typeof history.ping) => {
    let path = "", segment: { x: number; y: number }[] = []
    const flush = () => { if (segment.length) path += `${path ? " " : ""}${smoothPath(segment)}`; segment = [] }
    for (const point of points) {
      if (point.latency == null) { flush(); continue }
      segment.push({ x: xAt(point.ts), y: yAt(point.latency) })
    }
    flush()
    return path
  }
  const ranges = [range, Math.round(range * 2 / 3), Math.round(range / 3), 0]
  const label = (hours: number) => hours === 0 ? t.now : hours >= 24 && hours % 24 === 0 ? (t === translations.zh ? `${hours / 24} 天前` : `${hours / 24} days ago`) : t.hoursAgo(hours)
  const latest = (points: typeof history.ping) => [...points].reverse().find((point) => point.latency != null)?.latency
  const hasSamples = series.some(({ points }) => points.some((point) => point.latency != null))
  if (!hasSamples) return <div className="chart-placeholder">{t.noData}</div>
  return <div className="latency-plot"><div className="latency-summary"><strong>{t.latency}</strong><span>{t.probes(series.length)}</span></div><div className="latency-legend">{series.map(({ id, points, color }) => <span key={id}><i style={{ background: color }}/>{history.probes[String(id)] || t.probe(id)}<b>{latest(points) == null ? "—" : `${latest(points)} ms`}</b></span>)}</div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t === translations.zh ? "网络延迟历史折线图" : "Network latency history line chart"} preserveAspectRatio="none">{[0,.25,.5,.75,1].map((fraction) => { const value = axisMax * (1-fraction); const y = yAt(value); return <g key={fraction}><line x1={left} x2={width-right} y1={y} y2={y} className="chart-grid"/><text x={left-10} y={y+3} textAnchor="end" className="chart-axis-label">{Math.round(value)} ms</text></g>})}{series.map(({ id, points, color }) => <path key={id} d={pathFor(points)} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/> )}</svg><div className="chart-times">{ranges.map((value, index) => <span key={index}>{label(value)}</span>)}</div></div>
}

function Detail({ node, demo, historyDays, onBack }: { node: Node; demo: boolean; historyDays: number; onBack: () => void }) {
  const t = useLocale()
  const locale = formatLocale(t)
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
    api<History>(`/nodes/${node.id}/metrics?hours=${range}&points=${Math.min(900, Math.max(240, Math.round(innerWidth * .75)))}&series=${tab === "latency" ? "ping" : "metrics"}`).then((data) => { if (active) setHistory(data) }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "历史数据读取失败") }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [demo, node.id, range, tab, attempt])
  const ranges = useMemo(() => {
    const whole = Math.max(1, historyDays) * 24
    const options = [1, 6, 24, 168, 720, 2160].filter((value) => value * 1.25 <= whole)
    options.push(whole)
    return [...new Set(options)]
  }, [historyDays])
  const m = node.metrics
  return <div className="detail-page"><button className="back-link" onClick={onBack}><Icon name="back" size={16}/>{t.back}</button><section className="detail-hero"><div className="detail-ident"><span className="detail-orb"><Icon name="server" size={25}/></span><div><span className="eyebrow">{t.nodeDetails(String(node.id).padStart(3,"0"))}</span><h1>{node.name}</h1><p>{node.group || t.unassigned} <i/> {node.country || (t === translations.zh ? "未知" : "Unknown")} <i/> {node.os || t.waitingFirstReport}</p></div></div><span className={`status-badge large ${node.online ? "online" : "offline"}`}><i/>{node.online ? t.operational : t.offline}</span></section><div className="detail-metrics"><MetricPill label={t.cpuUsage} value={`${(m?.cpu ?? 0).toFixed(1)}%`} icon="cpu" tone="blue" hint={`${node.cpu_cores} vCPU`}/><MetricPill label={t.memory} value={bytes(m?.mem_used ?? 0)} icon="memory" tone="lavender" hint={t.memoryOf(bytes(node.mem_total))}/><MetricPill label={t.inbound} value={rate(m?.net_rx ?? 0)} icon="traffic" tone="mint" hint={t.currentSpeed}/><MetricPill label={t.uptime} value={uptime(m?.uptime ?? 0, locale)} icon="clock" tone="peach" hint={node.online ? t.sinceRestart : elapsed(node.last_seen_ago, locale)}/></div><section className="detail-panel"><div className="panel-heading"><div><span className="eyebrow">{t.performance}</span><h2>{t.resourceHistory}</h2></div><button className="icon-button" title={t.refresh} aria-label={t.refresh} onClick={() => { setHistory(null); setAttempt((value) => value + 1) }}><Icon name="refresh" size={16}/></button></div><div className="chart-controls"><div className="segmented">{([ ["resources",t.resources], ["latency",t.latency] ] as const).map(([key,label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</div><div className="range-tabs">{ranges.map((value) => <button key={value} className={range === value ? "active" : ""} onClick={() => setRange(value)}>{value < 24 ? `${value}h` : value % 24 === 0 ? `${value / 24}d` : `${value}h`}</button>)}</div></div>{busy || !history ? <div className="chart-placeholder">{error ? <><span>{error}</span><button className="chart-retry" onClick={() => { setHistory(null); setAttempt((value) => value + 1) }}>Retry</button></> : <><span className="spinner"/>Loading history…</>}</div> : tab === "resources" ? <ActivityChart history={history} memoryTotal={node.mem_total} range={range}/> : <LatencyChart history={history} range={range}/>}<div className="history-foot"><span><i className="green-dot"/> {t.refreshedEvery}</span><span>{t.historyDays(historyDays)}</span></div></section><div className="detail-bottom-grid"><section className="detail-panel"><div className="panel-heading"><div><span className="eyebrow">{t.machine}</span><h2>{t.systemInfo}</h2></div></div><div className="info-grid"><Info label={t.operatingSystem} value={node.os}/><Info label={t.kernel} value={node.kernel}/><Info label={t.processor} value={`${node.cpu_name || t.cpu} · ${node.cpu_cores} ${t === translations.zh ? "核心" : "cores"}`}/><Info label={t.architecture} value={node.arch}/><Info label={t.virtualization} value={node.virt}/><Info label={t.agentVersion} value={node.agent_version}/></div></section><section className="detail-panel"><div className="panel-heading"><div><span className="eyebrow">{t.billing}</span><h2>{t.billingInfo}</h2></div></div><div className="billing-amount">{money(node.price,node.currency,locale)} <small>/ {cycle(node.billing_cycle,locale)}</small></div><Meter label={t.monthlyTraffic} value={node.month_used ?? node.month_rx + node.month_tx} total={node.traffic_limit} accent="blue" foot={`${bytes(node.month_used ?? node.month_rx + node.month_tx)} / ${bytes(node.traffic_limit)}`}/><div className="billing-expiry"><span>{t.expires}</span><strong>{relativeDate(node.expires_in, locale)}</strong></div></section></div><footer className="page-footer"><span>MIUIX <i>×</i> MONITOR</span><span>{t.allServices}</span></footer></div>
}
function Info({ label, value }: { label: string; value?: string }) { return <div className="info-item"><span>{label}</span><strong>{value || "—"}</strong></div> }

function SearchDialog({ nodes, onClose, onOpen }: { nodes: Node[]; onClose: () => void; onOpen: (id: number) => void }) {
  const t = useLocale()
  const [query, setQuery] = useState("")
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey) }, [onClose])
  const results = nodes.filter((node) => `${node.name} ${node.country} ${node.group} ${node.os}`.toLowerCase().includes(query.toLowerCase())).slice(0,6)
  return <div className="search-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="search-dialog"><div className="search-input-wrap"><Icon name="search"/><input autoFocus placeholder={t.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && results[0]) { onOpen(results[0].id); onClose() } }}/><kbd>ESC</kbd></div><div className="search-results">{results.length ? results.map((node) => <button key={node.id} className="search-result" onClick={() => { onOpen(node.id); onClose() }}><span className="result-flag">{node.country || "—"}</span><span><strong>{node.name}</strong><small>{node.group || t.unassigned} · {node.os || t.notConnected}</small></span><span className={`result-state ${node.online ? "up" : "down"}`}><i/>{node.online ? t.online : t.offline}</span><Icon name="chevron" size={15}/></button>) : <div className="empty-search">{t.noMatch(query)}</div>}</div><div className="search-dialog-foot"><span>{t.navigateInfra}</span><span><kbd>↵</kbd> {t.toOpen} <kbd>ESC</kbd> {t.toClose}</span></div></div></div>
}

export default function App() {
  const t = useLocale()
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
  if (!me && meError) return <div className="error-screen"><span className="brand-mark"><span/><span/><span/><span/></span><span className="eyebrow">{t.connectionInterrupted}</span><h1>{t.cantReach}</h1><p>{meError}</p><button className="primary-button" onClick={retry}><Icon name="refresh" size={15}/> {t.tryAgain}</button></div>
  if (!me) return <div className="loading-screen"><span className="spinner large"/><span>{t.connecting}</span></div>
  if (closed && !me.authed) return <div className="error-screen"><span className="brand-mark"><span/><span/><span/><span/></span><span className="eyebrow">{t.privateStatus}</span><h1>{t.dashboardPrivate}</h1><p>{t.signInMessage}</p><a className="primary-button" href="/admin/">{t.controlPanel} <Icon name="arrow" size={15}/></a></div>
  const siteName = me.site_name || "Monitor"
  return <div className="app-shell"><Header siteName={siteName} dark={dark} toggle={toggle} openCount={sorted.length} onSearch={() => setSearchOpen(true)}/><main className="main-container">{selected ? <Detail node={selected} demo={demo} historyDays={me.history_days ?? 7} onBack={() => go(null)}/> : <>{Boolean(config?.show_summary) && sorted.length > 0 && <Overview nodes={overviewNodes}/>}<section className="nodes-section" id="nodes"><div className="section-heading"><div><span className="eyebrow">{t.yourServers}</span><h2>{t.nodeDirectory} <span>{sorted.length}</span></h2><p>{t.everyMachine}</p></div><div className="nodes-actions"><label className="inline-search"><Icon name="search" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.findNode}/><kbd>/</kbd></label><button className={`filter-button ${onlyOnline ? "filter-active" : ""}`} aria-pressed={onlyOnline} onClick={() => setOnlyOnline((value) => !value)}><Icon name="grid" size={15}/> {t.onlyOnline}</button></div></div>{groups.length > 0 && <GroupFilters groups={groups} selected={group} onSelect={setGroup} nodes={sorted}/>}<div className="nodes-meta"><span><i className="green-dot"/> {visible.length} {t.nodesShowing}</span><span>{t.sortedBy} <strong>{t.customOrder}</strong></span></div>{loading ? <div className="node-grid">{[1,2,3,4,5,6].map((item) => <div className="skeleton-card" key={item}><span/><span/><span/><span/></div>)}</div> : visible.length ? <div className="node-grid">{visible.map((node,index) => <NodeCard key={node.id} node={node} index={index} onOpen={() => go(node.id)}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={22}/></span><h3>{sorted.length ? t.noMatchesTitle : t.emptyFleetTitle}</h3><p>{sorted.length ? t.noMatchesHint : t.emptyFleetHint}</p></div>}{error && <div className="inline-error"><span>{error}</span><button onClick={() => !demo && location.reload()}>{t.tryAgain}</button></div>}<footer className="page-footer"><span>MIUIX <i>×</i> MONITOR</span><span><i className="green-dot"/> {t.liveUpdated(Math.max(0,Math.floor((Date.now()-lastSeenAt)/1000)))}</span><span>{t.footerTagline}</span></footer></section></> }</main>{searchOpen && <SearchDialog nodes={sorted} onClose={() => setSearchOpen(false)} onOpen={go}/>}</div>
}
