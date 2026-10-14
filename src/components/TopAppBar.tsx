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
    let frame = 0
    const update = () => {
      frame = 0
      const scrollY = window.scrollY
      // Keep a wide hysteresis band so slow trackpad/touch scrolling around
      // the compact threshold cannot repeatedly expand and collapse the bar.
      setScrolled((current) => current ? scrollY > 12 : scrollY > 64)
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const modeLabel = colorMode === "system" ? "跟随系统" : colorMode === "light" ? "浅色" : "深色"

  return (
    <header
      className={`${enableBlur ? "miuix-glass" : ""} miuix-topbar ${scrolled ? "is-compact" : ""}`}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: enableBlur ? undefined : "var(--miuix-surface)",
      }}
    >
      <div className="miuix-container miuix-topbar-content">
        <div className="miuix-topbar-main-row">
          {/* Left Brand & Miuix Large Title */}
          <div className="miuix-topbar-brand" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
            className="miuix-topbar-logo"
            style={{
              width: "46px",
              height: "46px",
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
          <div className="miuix-topbar-title-wrap">
            <div className="miuix-topbar-heading">
              <div className="miuix-topbar-titleline">
                <h1 className={`miuix-topbar-title ${scrolled ? "is-compact" : ""}`}>
                  {siteTitle}
                </h1>
                <span
                  className="miuix-topbar-status"
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
              <p className={`miuix-topbar-subtitle ${scrolled || !siteSubtitle ? "is-hidden" : ""}`}>{siteSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Right MiuixSearchBar & Action Buttons */}
        <div className="miuix-topbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: "1 1 auto", justifyContent: "flex-end" }}>
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
            title="MIUIX 外观设置"
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
      </div>
    </header>
  )
}
