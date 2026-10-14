import React from "react"
import { ColorMode, MiuixThemeSettings, ViewMode } from "@/types/monitor"
import { MIUIX_MONET_PRESETS } from "@/lib/miuix-colors"

interface ThemePreferenceDialogProps {
  open: boolean
  settings: MiuixThemeSettings
  onUpdate: (partial: Partial<MiuixThemeSettings>) => void
  onReset: () => void
  onClose: () => void
}

/**
 * Miuix `miuix-preference` inspired settings modal featuring:
 * - ColorSchemeMode selector (System / Light / Dark)
 * - Monet `keyColor` dynamic seed color palette (`MiuixColorPalette`)
 * - SwitchPreference rows (`MiuixSwitchPreference`)
 */
export const ThemePreferenceDialog: React.FC<ThemePreferenceDialogProps> = ({
  open,
  settings,
  onUpdate,
  onReset,
  onClose,
}) => {
  if (!open) return null

  return (
    <div className="miuix-dialog-backdrop" onClick={onClose}>
      <div
        className="miuix-dialog-surface"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px", padding: "24px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h2 className="miuix-title3">极简探针设置</h2>
            <p className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)" }}>
              自定义外观与节点展示偏好
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "var(--miuix-surface-container-high)",
              color: "var(--miuix-on-surface)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Color Mode Section */}
        <div className="miuix-subtitle" style={{ color: "var(--miuix-on-surface-summary)", marginBottom: "8px" }}>
          外观模式 (ColorSchemeMode)
        </div>
        <div className="miuix-tab-row" style={{ width: "100%", marginBottom: "18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {(["system", "light", "dark"] as ColorMode[]).map((m) => (
            <button
              key={m}
              className={`miuix-tab-item ${settings.color_mode === m ? "active" : ""}`}
              style={{ justifyContent: "center" }}
              onClick={() => onUpdate({ color_mode: m })}
            >
              {m === "system" ? "🌗 跟随系统" : m === "light" ? "☀️ 浅色模式" : "🌙 深色模式"}
            </button>
          ))}
        </div>

        {/* Monet KeyColor Swatches */}
        <div className="miuix-subtitle" style={{ color: "var(--miuix-on-surface-summary)", marginBottom: "8px" }}>
          Monet 动态种子色 (keyColor)
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "18px",
          }}
        >
          {MIUIX_MONET_PRESETS.map((preset) => {
            const active = settings.monet_key_color.toUpperCase() === preset.hex.toUpperCase()
            return (
              <button
                key={preset.name}
                onClick={() => onUpdate({ monet_key_color: preset.hex })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  border: active ? `2px solid ${preset.hex}` : "1px solid var(--miuix-divider)",
                  backgroundColor: "var(--miuix-surface)",
                  color: "var(--miuix-on-surface)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: preset.hex, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {preset.label.split(" ")[0]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Default View Layout */}
        <div className="miuix-subtitle" style={{ color: "var(--miuix-on-surface-summary)", marginBottom: "8px" }}>
          节点展示视图
        </div>
        <div className="miuix-tab-row" style={{ width: "100%", marginBottom: "18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {(["grid", "preference", "table"] as ViewMode[]).map((v) => (
            <button
              key={v}
              className={`miuix-tab-item ${settings.default_view === v ? "active" : ""}`}
              style={{ justifyContent: "center" }}
              onClick={() => onUpdate({ default_view: v })}
            >
              {v === "grid" ? "🗂 卡片网格" : v === "preference" ? "📋 设置列表" : "📊 紧凑表格"}
            </button>
          ))}
        </div>

        <div className="miuix-subtitle" style={{ color: "var(--miuix-on-surface-summary)", marginBottom: "8px" }}>节点卡片强调色（由站点后台管理）</div>
        <div className="miuix-tab-row accent-setting-display" aria-label="后台管理的节点卡片强调色" title={`当前：${settings.node_card_accent}`}>
          {[{ key: "blue", label: "澎湃蓝", color: "#3482FF" }, { key: "cyan", label: "碧海青", color: "#06B6D4" }, { key: "green", label: "翡翠绿", color: "#16B767" }, { key: "orange", label: "科技橙", color: "#FF9500" }, { key: "purple", label: "星云紫", color: "#A855F7" }].map((option) => (
            <span key={option.key} aria-current={settings.node_card_accent === option.key ? "true" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 8px", opacity: settings.node_card_accent === option.key ? 1 : 0.5, fontSize: 11, whiteSpace: "nowrap" }}><i style={{ width: 9, height: 9, borderRadius: "50%", background: option.color }} />{option.label}</span>
          ))}
        </div>
        <p className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", margin: "4px 0 18px" }}>此项由 Monitor 后台的「主题设置」统一配置，访客不能覆盖。</p>

        {/* SwitchPreference Items */}
        <div className="miuix-subtitle" style={{ color: "var(--miuix-on-surface-summary)", marginBottom: "8px" }}>
          组件与视觉特效 (miuix-preference)
        </div>
        <div style={{ borderRadius: "16px", backgroundColor: "var(--miuix-surface)", overflow: "hidden", marginBottom: "18px" }}>
          {[
            { key: "show_summary", title: "显示顶部四宫格概览", summary: "展示在线节点数、CPU/内存概览、实时速率与流量汇总" },
            { key: "show_billing", title: "显示节点账单与到期时间", summary: "在卡片底部展示续费价格、周期与剩余天数标签" },
            { key: "enable_blur", title: "Liquid Glass 液态毛玻璃", summary: "启用 miuix-blur 顶栏与底栏高斯模糊层" },
          ].map((item, i, arr) => {
            const checked = Boolean(settings[item.key as keyof MiuixThemeSettings])
            return (
              <div
                key={item.key}
                onClick={() => onUpdate({ [item.key]: !checked } as Partial<MiuixThemeSettings>)}
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--miuix-divider)",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div className="miuix-body2" style={{ fontWeight: 600 }}>{item.title}</div>
                  <div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px" }}>
                    {item.summary}
                  </div>
                </div>
                <button className={`miuix-switch ${checked ? "checked" : ""}`} type="button">
                  <span className="miuix-switch-thumb" />
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "var(--miuix-surface-container-high)",
              color: "var(--miuix-on-surface)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            恢复站点默认
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "var(--miuix-primary)",
              color: "var(--miuix-on-primary)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            完成并应用
          </button>
        </div>
      </div>
    </div>
  )
}
