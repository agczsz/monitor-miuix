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
  onSelect: (node: Node) => void
}

function getBarColor(pct: number): string {
  if (pct >= 85) return "var(--miuix-error)"
  if (pct >= 68) return "var(--miuix-warning)"
  return "var(--miuix-primary)"
}

export const NodeCard: React.FC<NodeCardProps> = ({ node, showBilling, onSelect }) => {
  const m = node.metrics
  const cpuPct = m ? Math.min(100, Math.max(0, Math.round(m.cpu * 10) / 10)) : 0
  const memTotal = m?.mem_total || node.mem_total || 0
  const memUsed = m?.mem_used || 0
  const memPct = formatPercent(memUsed, memTotal)

  const diskTotal = m?.disk_total || node.disk_total || 0
  const diskUsed = m?.disk_used || 0
  const diskPct = formatPercent(diskUsed, diskTotal)

  const trafficUsed = getTrafficUsed(node)
  const trafficPct = node.traffic_limit ? formatPercent(trafficUsed, node.traffic_limit) : null
  const trafficProgress = trafficPct === null ? 0 : Math.min(100, Math.max(0, trafficPct))
  const onlineDuration = m?.uptime ?? null

  const remDays = node.expires_in !== undefined ? node.expires_in : getRemainingDays(node.expires_at)

  return (
    <article
      className="miuix-card miuix-node-card miuix-pressable"
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

      {/* Resource progress bars, alongside billed monthly traffic. */}
      <div className="node-card-resources">
        {/* CPU */}
        <div className="node-card-resource">
          <div className="node-card-resource-heading">
            <span className="miuix-footnote1 resource-label"><ResourceIcon name="cpu" size={14} />CPU</span>
            <span className="miuix-footnote1 miuix-mono node-card-resource-value">{node.online ? `${cpuPct.toFixed(1)}%` : "—"}</span>
          </div>
          <div className="miuix-progress-track"><div className="miuix-progress-bar" style={{ width: `${cpuPct}%`, backgroundColor: getBarColor(cpuPct) }} /></div>
          <div className="node-card-resource-detail">{m?.load ? `负载 ${m.load.map((value) => value.toFixed(2)).join(" · ")}` : "系统负载暂不可用"}</div>
        </div>

        {/* Memory */}
        <div className="node-card-resource">
          <div className="node-card-resource-heading">
            <span className="miuix-footnote1 resource-label"><ResourceIcon name="memory" size={14} />内存</span>
            <span className="miuix-footnote1 miuix-mono node-card-resource-value">{memPct.toFixed(1)}%</span>
          </div>
          <div className="miuix-progress-track"><div className="miuix-progress-bar" style={{ width: `${memPct}%`, backgroundColor: getBarColor(memPct) }} /></div>
          <div className="node-card-resource-detail">{formatBytes(memUsed)} / {formatBytes(memTotal)}{m?.swap_used ? ` · Swap ${formatBytes(m.swap_used)}` : ""}</div>
        </div>

        {/* Disk */}
        <div className="node-card-resource">
          <div className="node-card-resource-heading">
            <span className="miuix-footnote1 resource-label"><ResourceIcon name="disk" size={14} />磁盘</span>
            <span className="miuix-footnote1 miuix-mono node-card-resource-value">{diskPct.toFixed(1)}%</span>
          </div>
          <div className="miuix-progress-track"><div className="miuix-progress-bar" style={{ width: `${diskPct}%`, backgroundColor: getBarColor(diskPct) }} /></div>
          <div className="node-card-resource-detail">{formatBytes(diskUsed)} / {formatBytes(diskTotal)}</div>
        </div>

        <div className="node-card-resource" title={`本月 ${getTrafficModeLabel(node.traffic_mode)}: ${formatBytes(trafficUsed)} / ${node.traffic_limit && node.traffic_limit > 0 ? formatBytes(node.traffic_limit) : "∞"}`}>
          <div className="node-card-resource-heading">
            <span className="miuix-footnote1 resource-label"><ResourceIcon name="traffic" size={14} />{getTrafficModeLabel(node.traffic_mode)}</span>
            <span className="miuix-footnote1 miuix-mono node-card-resource-value">{trafficPct === null ? "∞" : `${trafficPct}%`}</span>
          </div>
          <div className="miuix-progress-track" aria-label={`本月流量使用 ${trafficPct ?? "0"}%`}><div className="miuix-progress-bar" style={{ width: `${trafficProgress}%`, backgroundColor: getBarColor(trafficProgress) }} /></div>
          <div className="node-card-resource-detail">{formatBytes(trafficUsed)} / {node.traffic_limit && node.traffic_limit > 0 ? formatBytes(node.traffic_limit) : "∞"}</div>
        </div>
      </div>

      {/* Realtime upload/download rates with the requested directional icons. */}
      <div className="node-card-speeds">
        <span className="miuix-footnote2 resource-label node-card-speed-down">
          <ResourceIcon name="download" size={13} />↓ {node.online ? formatSpeed(m?.net_rx) : "0 B/s"}
        </span>
        <span className="miuix-footnote2 resource-label node-card-speed-up">
          <ResourceIcon name="upload" size={13} />↑ {node.online ? formatSpeed(m?.net_tx) : "0 B/s"}
        </span>
      </div>

      {/* Footer: price left, uptime right. */}
      <div className="node-card-footer">
        {showBilling && node.price != null ? (
          <span className="node-card-price">
            {node.currency || "¥"}{node.price}/{node.billing_cycle || "月"}
            {remDays !== null ? ` · ${remDays >= 0 ? `余${remDays}天` : "已到期"}` : ""}
          </span>
        ) : <span />}
        <div className="node-card-uptime">
          {node.last_seen_ago != null && !node.online && <span className="last-seen-label">离线 {formatDuration(node.last_seen_ago)}</span>}
          <span className="resource-label"><ResourceIcon name="clock" size={13} />{node.online ? (onlineDuration === null || onlineDuration <= 0 ? "在线" : formatUptime(onlineDuration)) : "已离线"}</span>
        </div>
      </div>
    </article>
  )
}
