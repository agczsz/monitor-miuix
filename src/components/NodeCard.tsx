import React from "react"
import { ResourceIcon } from "@/components/ResourceIcon"
import { Node } from "@/types/monitor"
import { Flag } from "@/components/Flag"
import { getTrafficModeLabel, getTrafficUsed } from "@/lib/traffic"
import {
  formatBytes,
  formatDuration,
  formatPercent,
  formatSpeed,
  formatUptime,
  getRemainingDays,
} from "@/lib/format"

interface NodeCardProps {
  node: Node
  showBilling: boolean
  accent: string
  onSelect: (node: Node) => void
}

function getBarColor(pct: number): string {
  if (pct >= 85) return "var(--miuix-error)"
  if (pct >= 68) return "var(--miuix-warning)"
  return "var(--miuix-primary)"
}

export const NodeCard: React.FC<NodeCardProps> = ({ node, showBilling, accent, onSelect }) => {
  const m = node.metrics
  const cpuPct = m ? Math.min(100, Math.max(0, Math.round(m.cpu * 10) / 10)) : 0
  const memTotal = m?.mem_total || node.mem_total || 0
  const memUsed = m?.mem_used || 0
  const memPct = formatPercent(memUsed, memTotal)

  const diskTotal = m?.disk_total || node.disk_total || 0
  const diskUsed = m?.disk_used || 0
  const diskPct = formatPercent(diskUsed, diskTotal)

  const monthRx = m?.month_rx ?? node.month_rx ?? 0
  const monthTx = m?.month_tx ?? node.month_tx ?? 0
  const trafficUsed = getTrafficUsed(node)
  const trafficPct = node.traffic_limit ? formatPercent(trafficUsed, node.traffic_limit) : null

  const remDays = node.expires_in !== undefined ? node.expires_in : getRemainingDays(node.expires_at)

  return (
    <article
      className={`miuix-card miuix-node-card accent-${["blue", "cyan", "green", "orange", "purple"].includes(accent) ? accent : "blue"} miuix-pressable`}
      onClick={() => onSelect(node)}
      style={{
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        opacity: node.online ? 1 : 0.78,
      }}
    >
      {/* Header Row: Flag, Title, Group Pill & Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Flag country={node.country} size="large" />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <h3
                className="miuix-headline1"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {node.name}
              </h3>
            </div>
            <div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginTop: "2px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span>{node.os ? node.os.split(" ")[0] : "Linux"}</span>
              {node.arch && <span>· {node.arch}</span>}
              {node.cpu_cores && <span>· {node.cpu_cores} vCPU</span>}
              {node.group && (
                <span
                  style={{
                    color: "var(--miuix-on-tertiary-container)",
                    backgroundColor: "var(--miuix-tertiary-container)",
                    padding: "1px 7px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                >
                  {node.group}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 600,
            backgroundColor: node.online ? "var(--miuix-success-soft)" : "var(--miuix-error-container)",
            color: node.online ? "var(--miuix-success)" : "var(--miuix-error)",
            flexShrink: 0,
          }}
        >
          <span className={node.online ? "miuix-dot-online" : "miuix-dot-offline"} style={{ width: 7, height: 7 }} />
          {node.online ? "运行中" : "已离线"}
        </div>
      </div>

      {/* Resource Progress Bars (CPU / RAM / Disk) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* CPU */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span className="miuix-footnote1 resource-label" style={{ color: "var(--miuix-on-surface-secondary)", fontWeight: 500 }}>
              <ResourceIcon name="cpu" size={15} />处理器 (CPU) {m?.load ? `· 负载 ${m.load[0].toFixed(2)}` : ""}
            </span>
            <span className="miuix-footnote1 miuix-mono" style={{ fontWeight: 600 }}>
              {node.online ? `${cpuPct}%` : "-"}
            </span>
          </div>
          <div className="miuix-progress-track">
            <div
              className="miuix-progress-bar"
              style={{ width: `${cpuPct}%`, backgroundColor: getBarColor(cpuPct) }}
            />
          </div>
        </div>

        {/* Memory */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span className="miuix-footnote1 resource-label" style={{ color: "var(--miuix-on-surface-secondary)", fontWeight: 500 }}>
              <ResourceIcon name="memory" size={15} />物理内存 (RAM)
            </span>
            <span className="miuix-footnote1 miuix-mono" style={{ fontWeight: 600 }}>
              {formatBytes(memUsed)} / {formatBytes(memTotal)} ({memPct}%)
            </span>
          </div>
          <div className="miuix-progress-track">
            <div
              className="miuix-progress-bar"
              style={{ width: `${memPct}%`, backgroundColor: getBarColor(memPct) }}
            />
          </div>
        </div>

        {/* Disk */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span className="miuix-footnote1 resource-label" style={{ color: "var(--miuix-on-surface-secondary)", fontWeight: 500 }}>
              <ResourceIcon name="disk" size={15} />存储空间 (Disk)
            </span>
            <span className="miuix-footnote1 miuix-mono" style={{ fontWeight: 600 }}>
              {formatBytes(diskUsed)} / {formatBytes(diskTotal)} ({diskPct}%)
            </span>
          </div>
          <div className="miuix-progress-track">
            <div
              className="miuix-progress-bar"
              style={{ width: `${diskPct}%`, backgroundColor: getBarColor(diskPct) }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Speed Pill Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          padding: "10px 12px",
          borderRadius: "12px",
          backgroundColor: "var(--miuix-surface)",
        }}
      >
        <div>
          <div className="miuix-footnote2 resource-label" style={{ color: "var(--miuix-on-surface-summary)" }}>
            <ResourceIcon name="network" size={13} />实时下行
          </div>
          <div className="miuix-body2 miuix-mono" style={{ fontWeight: 600, color: "var(--miuix-success)", marginTop: "2px" }}>
            {node.online ? formatSpeed(m?.net_rx) : "0 B/s"}
          </div>
        </div>
        <div>
          <div className="miuix-footnote2 resource-label" style={{ color: "var(--miuix-on-surface-summary)" }}>
            <ResourceIcon name="network" size={13} />实时上行
          </div>
          <div className="miuix-body2 miuix-mono" style={{ fontWeight: 600, color: "var(--miuix-primary)", marginTop: "2px" }}>
            {node.online ? formatSpeed(m?.net_tx) : "0 B/s"}
          </div>
        </div>
      </div>

      {/* Footer: Traffic, Uptime & Billing */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "8px",
          borderTop: "1px solid var(--miuix-divider)",
          fontSize: "12px",
          color: "var(--miuix-on-surface-summary)",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span className="miuix-mono">
          流量: ↓{formatBytes(monthRx)} · ↑{formatBytes(monthTx)} · {getTrafficModeLabel(node.traffic_mode)} {formatBytes(trafficUsed)}{trafficPct !== null ? ` (${trafficPct}%)` : ""}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="resource-label"><ResourceIcon name="clock" size={13} />{node.online ? formatUptime(m?.uptime) : "已离线"}</span>
          {node.last_seen_ago != null && !node.online && <span className="last-seen-label">离线 {formatDuration(node.last_seen_ago)}</span>}
          {showBilling && node.price != null ? (
            <span
              style={{
                padding: "2px 7px",
                borderRadius: "6px",
                backgroundColor: "var(--miuix-surface-container-high)",
                color: "var(--miuix-on-surface-secondary)",
                fontWeight: 600,
              }}
            >
              {node.currency || "¥"}{node.price}/{node.billing_cycle || "月"}
              {remDays !== null ? ` · ${remDays >= 0 ? `余${remDays}天` : "已到期"}` : ""}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}
