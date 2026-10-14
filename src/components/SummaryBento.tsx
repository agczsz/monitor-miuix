import React from "react"
import { Node } from "@/types/monitor"
import { formatBytes, formatPercent, formatSpeed } from "@/lib/format"
import { getTrafficUsed } from "@/lib/traffic"

interface SummaryBentoProps {
  nodes: Node[]
}

export const SummaryBento: React.FC<SummaryBentoProps> = ({ nodes }) => {
  const total = nodes.length
  const onlineNodes = nodes.filter((n) => n.online)
  const onlineCount = onlineNodes.length
  const onlineRate = total > 0 ? Math.round((onlineCount / total) * 1000) / 10 : 0

  const metricNodes = onlineNodes.filter((node) => node.metrics !== null && node.metrics !== undefined)
  const avgCpu = metricNodes.length > 0
    ? Math.round((metricNodes.reduce((acc, node) => acc + (node.metrics?.cpu ?? 0), 0) / metricNodes.length) * 10) / 10
    : null

  const totalMem = metricNodes.reduce((acc, node) => acc + (node.metrics?.mem_total || node.mem_total || 0), 0)
  const usedMem = metricNodes.reduce((acc, node) => acc + (node.metrics?.mem_used || 0), 0)
  const memPct = formatPercent(usedMem, totalMem)

  const totalNetRx = onlineNodes.reduce((acc, n) => acc + (n.metrics?.net_rx || 0), 0)
  const totalNetTx = onlineNodes.reduce((acc, n) => acc + (n.metrics?.net_tx || 0), 0)

  const monthRx = nodes.reduce((acc, n) => acc + (n.metrics?.month_rx ?? n.month_rx ?? n.total_rx ?? 0), 0)
  const monthTx = nodes.reduce((acc, n) => acc + (n.metrics?.month_tx ?? n.month_tx ?? n.total_tx ?? 0), 0)
  const billedUsage = nodes.reduce((acc, node) => acc + getTrafficUsed(node), 0)

  const busiestNode =
    metricNodes.length > 0
      ? [...metricNodes].sort((a, b) => (b.metrics?.cpu || 0) - (a.metrics?.cpu || 0))[0]
      : null

  return (
    <section className="miuix-summary-grid" style={{ marginTop: "14px", marginBottom: "18px" }}>
      {/* Card 1: Fleet Online Status */}
      <div className="miuix-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)", fontWeight: 600 }}>
            节点在线状态
          </span>
          <span
            style={{
              padding: "3px 9px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: onlineCount === total ? "var(--miuix-success-soft)" : "var(--miuix-warning-soft)",
              color: onlineCount === total ? "var(--miuix-success)" : "var(--miuix-warning)",
            }}
          >
            在线率 {onlineRate}%
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span className="miuix-title1 miuix-mono" style={{ color: "var(--miuix-primary)" }}>
            {onlineCount}
          </span>
          <span className="miuix-body2" style={{ color: "var(--miuix-on-surface-summary)" }}>
            / {total} 台服务器在线
          </span>
        </div>
        <div className="miuix-progress-track">
          <div
            className="miuix-progress-bar"
            style={{
              width: `${onlineRate}%`,
              backgroundColor: onlineCount === total ? "var(--miuix-success)" : "var(--miuix-primary)",
            }}
          />
        </div>
      </div>

      {/* Card 2: Cluster CPU & Memory Load */}
      <div className="miuix-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)", fontWeight: 600 }}>
            节点 CPU / 内存概览
          </span>
          <span className="miuix-footnote2" style={{ color: "var(--miuix-on-tertiary-container)", backgroundColor: "var(--miuix-tertiary-container)", padding: "3px 8px", borderRadius: "999px" }}>
            最忙: {busiestNode ? busiestNode.name.slice(0, 14) : "-"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <span className="miuix-title2 miuix-mono">{avgCpu === null ? "—" : `${avgCpu}%`}</span>
            <span className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginLeft: "6px" }}>CPU</span>
          </div>
          <div>
            <span className="miuix-title2 miuix-mono">{metricNodes.length === 0 ? "—" : `${memPct}%`}</span>
            <span className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)", marginLeft: "6px" }}>RAM</span>
          </div>
        </div>
        <div className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}>
          有指标节点: {metricNodes.length}/{onlineCount} · 内存 {formatBytes(usedMem)} / {formatBytes(totalMem)}
        </div>
      </div>

      {/* Card 3: Real-time Network Throughput */}
      <div className="miuix-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)", fontWeight: 600 }}>
            实时网络总吞吐
          </span>
          <span className="miuix-footnote2" style={{ color: "var(--miuix-primary)", fontWeight: 600 }}>
            ⚡ 秒级刷新
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="miuix-footnote1" style={{ color: "var(--miuix-success)", fontWeight: 600 }}>↓ 下行速率</span>
            <span className="miuix-headline1 miuix-mono">{formatSpeed(totalNetRx)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="miuix-footnote1" style={{ color: "var(--miuix-primary)", fontWeight: 600 }}>↑ 上行速率</span>
            <span className="miuix-headline1 miuix-mono">{formatSpeed(totalNetTx)}</span>
          </div>
        </div>
      </div>

      <div className="miuix-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)", fontWeight: 600 }}>
            当月累计流量
          </span>
          <span className="miuix-footnote2" style={{ color: "var(--miuix-on-surface-summary)" }}>
            计费口径 {formatBytes(billedUsage)}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)" }}>本月接收 (RX)</span>
            <span className="miuix-headline2 miuix-mono">{formatBytes(monthRx)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="miuix-footnote1" style={{ color: "var(--miuix-on-surface-summary)" }}>本月发送 (TX)</span>
            <span className="miuix-headline2 miuix-mono">{formatBytes(monthTx)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
