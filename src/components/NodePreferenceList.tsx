import React from "react"
import { ResourceIcon } from "@/components/ResourceIcon"
import { Node, ViewMode } from "@/types/monitor"
import { Flag } from "@/components/Flag"
import { getTrafficModeLabel, getTrafficUsed } from "@/lib/traffic"
import {
  formatBytes,
  formatDuration,
  formatPercent,
  formatSpeed,
  formatUptime,
} from "@/lib/format"

interface NodePreferenceListProps {
  nodes: Node[]
  viewMode: ViewMode
  onSelect: (node: Node) => void
}

/**
 * Implements Miuix `miuix-preference` grouped list style (`BasicComponent` / `ArrowPreference`)
 * as well as the compact ServerStatus-style Table layout.
 */
export const NodePreferenceList: React.FC<NodePreferenceListProps> = ({
  nodes,
  viewMode,
  onSelect,
}) => {
  if (viewMode === "table") {
    return (
      <div className="miuix-card" style={{ overflowX: "auto", padding: "6px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--miuix-divider)", color: "var(--miuix-on-surface-summary)", fontSize: "12px" }}>
              <th style={{ padding: "12px 16px" }}>状态</th>
              <th style={{ padding: "12px 14px" }}>节点名称</th>
              <th style={{ padding: "12px 14px" }}>分组 / 系统</th>
              <th style={{ padding: "12px 14px" }}><ResourceIcon name="clock" size={14} /> 在线时长</th>
              <th style={{ padding: "12px 14px" }}><ResourceIcon name="cpu" size={14} /> CPU</th>
              <th style={{ padding: "12px 14px" }}><ResourceIcon name="memory" size={14} /> 内存</th>
              <th style={{ padding: "12px 14px" }}><ResourceIcon name="disk" size={14} /> 硬盘</th>
              <th style={{ padding: "12px 14px" }}>实时网速 (↓/↑)</th>
              <th style={{ padding: "12px 16px" }}>月流量 (↓/↑)</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n, idx) => {
              const m = n.metrics
              const cpu = m ? Math.round(m.cpu) : 0
              const memPct = formatPercent(m?.mem_used, m?.mem_total || n.mem_total)
              const diskPct = formatPercent(m?.disk_used, m?.disk_total || n.disk_total)
              const trafficUsed = getTrafficUsed(n)
              return (
                <tr
                  key={n.id}
                  onClick={() => onSelect(n)}
                  style={{
                    borderBottom: idx === nodes.length - 1 ? "none" : "1px solid var(--miuix-divider)",
                    cursor: "pointer",
                    transition: "background-color 0.18s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--miuix-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <span className={n.online ? "miuix-dot-online" : "miuix-dot-offline"} style={{ display: "inline-block" }} />
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>
                    <span className="table-node-name"><Flag country={n.country} size="medium" />{n.name}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--miuix-on-surface-summary)", fontSize: "13px" }}>
                    {n.group || "默认分组"} · {n.os ? n.os.split(" ")[0] : "Linux"}{n.expires_in !== undefined && n.expires_in !== null ? ` · ${n.expires_in >= 0 ? `余${n.expires_in}天` : "已到期"}` : ""}
                  </td>
                  <td className="miuix-mono" style={{ padding: "12px 14px", fontSize: "13px" }}>
                    {n.online ? formatUptime(m?.uptime) : `离线${n.last_seen_ago != null ? ` ${formatDuration(n.last_seen_ago)}` : ""}`}
                  </td>
                  <td className="miuix-mono" style={{ padding: "12px 14px", fontWeight: 600, color: cpu >= 80 ? "var(--miuix-error)" : "inherit" }}>
                    {n.online ? `${cpu}%` : "-"}
                  </td>
                  <td className="miuix-mono" style={{ padding: "12px 14px" }}>{memPct}%</td>
                  <td className="miuix-mono" style={{ padding: "12px 14px" }}>{diskPct}%</td>
                  <td className="miuix-mono" style={{ padding: "12px 14px", fontSize: "13px" }}>
                    <span style={{ color: "var(--miuix-success)" }}>↓{formatSpeed(m?.net_rx)}</span>{" "}
                    <span style={{ color: "var(--miuix-primary)" }}>↑{formatSpeed(m?.net_tx)}</span>
                  </td>
                  <td className="miuix-mono" style={{ padding: "12px 16px", fontSize: "13px", color: "var(--miuix-on-surface-summary)" }}>
                    {getTrafficModeLabel(n.traffic_mode)} {formatBytes(trafficUsed)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Miuix Preference Style Grouped List
  const groups = new Map<string, Node[]>()
  for (const n of nodes) {
    const group = n.group || "未分组节点"
    const groupNodes = groups.get(group) ?? []
    groupNodes.push(n)
    groups.set(group, groupNodes)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {Array.from(groups.entries()).map(([groupName, groupNodes]) => (
        <div key={groupName}>
          <div
            className="miuix-subtitle"
            style={{
              color: "var(--miuix-on-surface-summary)",
              padding: "0 12px 8px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{groupName}</span>
            <span>{groupNodes.length} 台节点</span>
          </div>
          <div className="miuix-card" style={{ overflow: "hidden" }}>
            {groupNodes.map((n, idx) => {
              const m = n.metrics
              const cpu = m ? Math.round(m.cpu) : 0
              const memPct = formatPercent(m?.mem_used, m?.mem_total || n.mem_total)
              const trafficUsed = getTrafficUsed(n)
              return (
                <div
                  key={n.id}
                  onClick={() => onSelect(n)}
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                    borderBottom: idx === groupNodes.length - 1 ? "none" : "1px solid var(--miuix-divider)",
                    cursor: "pointer",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>
                    <span className={n.online ? "miuix-dot-online" : "miuix-dot-offline"} />
                    <Flag country={n.country} size="large" />
                    <div>
                      <div className="miuix-headline2" style={{ fontWeight: 600 }}>{n.name}</div>
                      <div className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)" }}>
                        {n.os ? n.os.split(" ")[0] : "Linux"} · {n.cpu_cores || 2}C / {formatBytes(n.mem_total, 0)} · {n.online ? `在线 ${formatUptime(m?.uptime)}` : `离线${n.last_seen_ago != null ? ` ${formatDuration(n.last_seen_ago)}` : ""}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right" }}>
                      <div className="miuix-footnote2 resource-label" style={{ color: "var(--miuix-on-surface-summary)" }}><ResourceIcon name="cpu" size={12} /><ResourceIcon name="memory" size={12} /> CPU / 内存</div>
                      <div className="miuix-body2 miuix-mono" style={{ fontWeight: 600 }}>
                        {n.online ? `${cpu}% · ${memPct}%` : "离线"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: "130px" }}>
                      <div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}>实时速率</div>
                      <div className="miuix-body2 miuix-mono" style={{ fontWeight: 600, color: "var(--miuix-primary)" }}>
                        ↓{formatSpeed(m?.net_rx)}
                      </div>
                    </div>
                    <span style={{ color: "var(--miuix-on-surface-actions)", fontSize: "18px", fontWeight: 600 }}>›</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
