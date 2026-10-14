import React, { useEffect, useState } from "react"
import { ColorMode } from "@/types/monitor"

interface TopAppBarProps {
  siteTitle: string
  siteSubtitle: string
  onlineCount: number
  totalCount: number
  wsConnected: boolean
  isDemo: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  colorMode: ColorMode
  onCycleColorMode: () => void
  onOpenSettings: () => void
  enableBlur: boolean
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  siteTitle,
  siteSubtitle,
  onlineCount,
  totalCount,
  wsConnected,
  isDemo,
  searchQuery,
  onSearchChange,
  colorMode,
  onCycleColorMode,
  onOpenSettings,
  enableBlur,
}) => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const modeLabel = colorMode === "system" ? "跟随系统" : colorMode === "light" ? "浅色" : "深色"

  return (
    <header
      className={enableBlur ? "miuix-glass" : ""}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: enableBlur ? undefined : "var(--miuix-surface)",
        transition: "padding 0.25s var(--miuix-folme-spring)",
      }}
    >
      <div
        className="miuix-container"
        style={{
          paddingTop: scrolled ? "12px" : "22px",
          paddingBottom: scrolled ? "12px" : "18px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Left Brand & Miuix Large Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: scrolled ? "38px" : "46px",
              height: scrolled ? "38px" : "46px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, var(--miuix-primary-container), var(--miuix-primary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 6px 18px color-mix(in srgb, var(--miuix-primary) 32%, transparent)",
              transition: "all 0.28s var(--miuix-folme-spring)",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 className={scrolled ? "miuix-title3" : "miuix-title1"} style={{ transition: "font-size 0.25s var(--miuix-folme-spring)" }}>
                {siteTitle}
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "var(--miuix-tertiary-container)",
                  color: "var(--miuix-on-tertiary-container)",
                }}
              >
                <span className={onlineCount > 0 ? "miuix-dot-online" : "miuix-dot-offline"} style={{ width: 7, height: 7 }} />
                {isDemo ? "演示预览" : wsConnected ? "实时流 · WS" : "HTTP 轮询"} · {onlineCount}/{totalCount} 在线
              </span>
            </div>
            {!scrolled && siteSubtitle && (
              <p className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "3px" }}>
                {siteSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right MiuixSearchBar & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: "1 1 auto", justifyContent: "flex-end" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--miuix-surface-container-high)",
              borderRadius: "999px",
              padding: "7px 14px",
              minWidth: "220px",
              maxWidth: "300px",
              flex: "1 1 220px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--miuix-on-surface-summary)" strokeWidth="2" style={{ marginRight: "8px", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索节点、地区、系统或分组..."
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--miuix-on-surface)",
                fontSize: "14px",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--miuix-on-surface-summary)",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "0 2px",
                }}
                title="清空搜索"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onCycleColorMode}
            className="miuix-pressable"
            style={{
              border: "none",
              backgroundColor: "var(--miuix-surface-container-high)",
              color: "var(--miuix-on-surface)",
              padding: "8px 14px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="切换深浅色模式"
          >
            <span>{colorMode === "dark" ? "🌙" : colorMode === "light" ? "☀️" : "🌗"}</span>
            <span>{modeLabel}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="miuix-pressable"
            style={{
              border: "none",
              backgroundColor: "var(--miuix-primary)",
              color: "var(--miuix-on-primary)",
              padding: "8px 14px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="极简探针外观设置"
          >
            <span>🎨</span>
            <span>外观设置</span>
          </button>

          <a
            href="/admin"
            className="miuix-pressable"
            style={{
              textDecoration: "none",
              backgroundColor: "var(--miuix-surface-container-high)",
              color: "var(--miuix-on-surface-secondary)",
              padding: "8px 12px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 600,
            }}
            title="进入 Monitor 管理面板"
          >
            控制台
          </a>
        </div>
      </div>
    </header>
  )
}
