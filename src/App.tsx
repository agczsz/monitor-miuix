import React, { useEffect, useMemo, useState } from "react"
import manifest from "../theme.json"
import { ColorMode, MiuixThemeSettings, Node, SortField, ViewMode } from "@/types/monitor"
import { useMonitorNodes } from "@/lib/api"
import { DEFAULT_SETTINGS, loadThemeConfig, resetVisitorSettings, saveVisitorSettings } from "@/lib/config"
import { getTrafficUsed } from "@/lib/traffic"
import { applyMiuixCssVariables, resolveMiuixPalette } from "@/lib/miuix-colors"
import { TopAppBar } from "@/components/TopAppBar"
import { SummaryBento } from "@/components/SummaryBento"
import { NodeCard } from "@/components/NodeCard"
import { NodePreferenceList } from "@/components/NodePreferenceList"
import { NodeDetailDialog } from "@/components/NodeDetailDialog"
import { ThemePreferenceDialog } from "@/components/ThemePreferenceDialog"

export const App: React.FC = () => {
  const { nodes, me, loading, wsConnected, isDemo } = useMonitorNodes()
  const [settings, setSettings] = useState<MiuixThemeSettings>(DEFAULT_SETTINGS)
  const [settingsReady, setSettingsReady] = useState(false)
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  )

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")
  const [sortBy, setSortBy] = useState<SortField>("sort")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    loadThemeConfig().then((cfg) => {
      if (cancelled) return
      setSettings(cfg)
      setSettingsReady(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener("change", listener)
    return () => mq.removeEventListener("change", listener)
  }, [])

  const isDark =
    settings.color_mode === "dark" ||
    (settings.color_mode === "system" && systemDark)

  useEffect(() => {
    const tokens = resolveMiuixPalette(isDark, settings.monet_key_color)
    applyMiuixCssVariables(tokens, isDark)
  }, [isDark, settings.monet_key_color])

  const handleUpdateSettings = (partial: Partial<MiuixThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      if (settingsReady) {
        const visitorPartial: { color_mode?: string; default_view?: string; monet_key_color?: string } = {}
        if (partial.color_mode !== undefined) visitorPartial.color_mode = partial.color_mode
        if (partial.default_view !== undefined) visitorPartial.default_view = partial.default_view
        if (partial.monet_key_color !== undefined) visitorPartial.monet_key_color = partial.monet_key_color
        saveVisitorSettings(visitorPartial)
      }
      return next
    })
  }

  const handleResetSettings = () => {
    resetVisitorSettings()
    loadThemeConfig().then((cfg) => {
      setSettings(cfg)
      setSettingsReady(true)
    })
  }

  const handleCycleColorMode = () => {
    const order: ColorMode[] = ["system", "light", "dark"]
    const next = order[(order.indexOf(settings.color_mode) + 1) % order.length]
    handleUpdateSettings({ color_mode: next })
  }

  const publicNodes = useMemo(() => nodes.filter((node) => node.public === true), [nodes])
  const groups = useMemo(() => {
    const set = new Set<string>()
    for (const n of publicNodes) {
      if (n.group) set.add(n.group)
    }
    return Array.from(set)
  }, [publicNodes])

  const filteredNodes = useMemo(() => {
    return publicNodes
      .filter((n) => {
        if (selectedGroup !== null && (n.group || "") !== selectedGroup) return false
        if (statusFilter === "online" && !n.online) return false
        if (statusFilter === "offline" && n.online) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchName = n.name.toLowerCase().includes(q)
          const matchGroup = (n.group || "").toLowerCase().includes(q)
          const matchCountry = (n.country || "").toLowerCase().includes(q)
          const matchOs = (n.os || "").toLowerCase().includes(q)
          if (!matchName && !matchGroup && !matchCountry && !matchOs) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === "cpu") return (b.metrics?.cpu || 0) - (a.metrics?.cpu || 0)
        if (sortBy === "mem") return (b.metrics?.mem_used || 0) - (a.metrics?.mem_used || 0)
        if (sortBy === "net")
          return (
            (b.metrics?.net_rx || 0) +
            (b.metrics?.net_tx || 0) -
            ((a.metrics?.net_rx || 0) + (a.metrics?.net_tx || 0))
          )
        if (sortBy === "traffic") {
          return getTrafficUsed(b) - getTrafficUsed(a)
        }
        return (a.sort || 0) - (b.sort || 0) || a.id - b.id
      })
  }, [publicNodes, selectedGroup, statusFilter, searchQuery, sortBy])

  const siteTitle = me?.site_name || me?.title || manifest.name
  const onlineCount = publicNodes.filter((n) => n.online).length

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "96px" }}>
      <TopAppBar
        siteTitle={siteTitle}
        siteSubtitle={settings.site_subtitle}
        onlineCount={onlineCount}
        totalCount={publicNodes.length}
        wsConnected={wsConnected}
        isDemo={isDemo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        colorMode={settings.color_mode}
        onCycleColorMode={handleCycleColorMode}
        onOpenSettings={() => setSettingsOpen(true)}
        enableBlur={settings.enable_blur}
      />

      <main className="miuix-container">
        {settings.show_summary && <SummaryBento nodes={publicNodes} />}

        {/* Filter & View Bar (Miuix TabRowWithContour) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          {/* Group tabs keep their values separate from arbitrary operator labels. */}
          <div className="miuix-tab-row">
            <button className={`miuix-tab-item ${selectedGroup === null ? "active" : ""}`} onClick={() => setSelectedGroup(null)}>
              全部节点 <span className="filter-count">{publicNodes.length}</span>
            </button>
            {groups.map((group) => (
              <button key={group} className={`miuix-tab-item ${selectedGroup === group ? "active" : ""}`} onClick={() => setSelectedGroup(group)}>
                {group} <span className="filter-count">{publicNodes.filter((node) => node.group === group).length}</span>
              </button>
            ))}
            {publicNodes.some((node) => !node.group) && (
              <button className={`miuix-tab-item ${selectedGroup === "" ? "active" : ""}`} onClick={() => setSelectedGroup("")}>
                未分组 <span className="filter-count">{publicNodes.filter((node) => !node.group).length}</span>
              </button>
            )}
          </div>

          {/* Right Controls: Status Filter, Sort & View Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div className="miuix-tab-row">
              {(["all", "online", "offline"] as const).map((st) => (
                <button
                  key={st}
                  className={`miuix-tab-item ${statusFilter === st ? "active" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === "all" ? "全部" : st === "online" ? "在线" : "离线"}
                </button>
              ))}
            </div>

            <div className="miuix-tab-row">
              {(["grid", "preference", "table"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  className={`miuix-tab-item ${settings.default_view === v ? "active" : ""}`}
                  onClick={() => handleUpdateSettings({ default_view: v })}
                >
                  {v === "grid" ? "卡片" : v === "preference" ? "设置项" : "表格"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {settings.notice && <div className="miuix-card site-notice" role="note"><strong>站点公告</strong><span>{settings.notice}</span></div>}

        {/* Node Content Area */}
        {loading ? (
          <div className="miuix-card" style={{ padding: "48px", textAlign: "center", color: "var(--miuix-on-surface-summary)" }}>
            正在同步节点实时探针数据...
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="miuix-card" style={{ padding: "48px", textAlign: "center", color: "var(--miuix-on-surface-summary)" }}>
            未找到匹配的服务器节点
          </div>
        ) : settings.default_view === "grid" ? (
          <div className="miuix-nodes-grid">
            {filteredNodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                showBilling={settings.show_billing}
                onSelect={setSelectedNode}
              />
            ))}
          </div>
        ) : (
          <NodePreferenceList
            nodes={filteredNodes}
            viewMode={settings.default_view}
            onSelect={setSelectedNode}
          />
        )}
      </main>

      {/* Miuix FloatingNavigationBar / FloatingToolbar */}
      <nav
        className={settings.enable_blur ? "miuix-glass-pill" : "miuix-card"}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          borderRadius: "999px",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {(
          [
            { key: "sort", label: "默认排序" },
            { key: "cpu", label: "按 CPU" },
            { key: "mem", label: "按内存" },
            { key: "net", label: "按网速" },
          ] as { key: SortField; label: string }[]
        ).map((item) => (
          <button
            key={item.key}
            onClick={() => setSortBy(item.key)}
            style={{
              border: "none",
              background: sortBy === item.key ? "var(--miuix-primary)" : "transparent",
              color: sortBy === item.key ? "var(--miuix-on-primary)" : "var(--miuix-on-surface-secondary)",
              padding: "6px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.22s var(--miuix-folme-spring)",
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <footer
        className="miuix-container miuix-footnote1"
        style={{
          marginTop: "42px",
          textAlign: "center",
          color: "var(--miuix-on-surface-summary)",
        }}
      >
        Powered by{" "}
        <a
          href="https://github.com/monitor-probe/monitor"
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--miuix-primary)", textDecoration: "none", fontWeight: 600 }}
        >
          Monitor Probe
        </a>{" "}
        · Theme inspired by{" "}
        <a
          href="https://github.com/compose-miuix-ui/miuix"
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--miuix-primary)", textDecoration: "none", fontWeight: 600 }}
        >
          compose-miuix-ui/miuix
        </a>{" "}
        v{manifest.version}
      </footer>

      <NodeDetailDialog
        key={selectedNode?.id ?? "closed"}
        node={selectedNode}
        isDemo={isDemo}
        historyDays={me?.history_days ?? 7}
        onClose={() => setSelectedNode(null)}
      />

      <ThemePreferenceDialog
        open={settingsOpen}
        settings={settings}
        onUpdate={handleUpdateSettings}
        onReset={handleResetSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
export default App
