import assert from "node:assert/strict"
import test from "node:test"
import { countryCode, countryToFlag, countryToName, formatBytes, formatPercent, getRemainingDays } from "./format.ts"
import { normalizeMetricsHistory } from "./metrics-history.ts"
import { getTrafficModeLabel, getTrafficUsed } from "./traffic.ts"

test("formats sizes and percentages safely", () => {
  assert.equal(formatBytes(0), "0 B")
  assert.equal(formatBytes(1024), "1.0 KiB")
  assert.equal(formatPercent(50, 200), 25)
  assert.equal(formatPercent(400, 200), 100)
})

test("normalizes supported ISO country codes and aliases", () => {
  assert.equal(countryCode(" cn "), "CN")
  assert.equal(countryCode("UK"), "GB")
  assert.equal(countryCode("United States"), "US")
  assert.equal(countryCode("ZZ"), null)
  assert.equal(countryCode("1A"), null)
  assert.equal(countryToName("XX"), "未知区域")
  assert.equal(countryToFlag("XX"), "🌐")
  assert.equal(countryToFlag("CN"), "🇨🇳")
})

test("normalizes Monitor metrics and flat per-task ping history", () => {
  const history = normalizeMetricsHistory({
    step: 60,
    metrics: [{ ts: 1710000000, cpu: 12.5, mem_used: 1073741824, disk_used: 12, net_rx: 1024, net_tx: 2048, cpu_max: 17 }],
    ping: [
      { task_id: 7, ts: 1710000060, latency: 12.3, band: [11, 16], loss: 2 },
      { task_id: 7, ts: 1710000000, latency: null },
    ],
    probes: { "7": "Cloudflare / ICMP" },
    loss: { "7": 0.75 },
  })
  assert.equal(history.metrics.length, 1)
  assert.equal(history.metrics[0].mem_used, 1073741824)
  assert.equal(history.ping[0].latency, null)
  assert.deepEqual(history.ping[1].band, [11, 16])
  assert.equal(history.probes["7"], "Cloudflare / ICMP")
  assert.equal(history.loss?.["7"], 0.75)
  assert.equal(history.ping[1].loss, 2)
  assert.equal(history.step, 60)
})

test("drops malformed history rows and clamps loss", () => {
  const history = normalizeMetricsHistory({
    metrics: [{ ts: "bad" }, { ts: 1, cpu: 200, net_rx: -5 }],
    ping: [{ task_id: 1, ts: 1, latency: "missing", loss: 120 }],
    step: -1,
  })
  assert.equal(history.metrics.length, 1)
  assert.equal(history.ping[0].latency, null)
  assert.equal(history.ping[0].loss, 100)
  assert.equal(history.step, 60)
})

test("calculates remaining days for ISO timestamps", () => {
  assert.ok(getRemainingDays(Date.now() + 2 * 86400000)! >= 2)
})

test("follows Monitor traffic metering modes when month_used is absent", () => {
  const node = { id: 1, name: "test", sort: 0, public: true, online: true, country: "US", last_seen: 0, month_rx: 20, month_tx: 35 }
  assert.equal(getTrafficUsed({ ...node, traffic_mode: "up" }), 35)
  assert.equal(getTrafficUsed({ ...node, traffic_mode: "down" }), 20)
  assert.equal(getTrafficUsed({ ...node, traffic_mode: "max" }), 35)
  assert.equal(getTrafficUsed({ ...node, traffic_mode: "sum" }), 55)
  assert.equal(getTrafficUsed({ ...node, traffic_mode: "up", month_used: 12 }), 12)
  assert.equal(getTrafficUsed({ ...node, month_rx: undefined, month_tx: undefined, total_rx: 40, total_tx: 60, traffic_mode: "max" }), 60)
  assert.equal(getTrafficModeLabel("max"), "较大方向计费")
})

test("preserves operator ping task ordering by first appearance", () => {
  const history = normalizeMetricsHistory({ ping: [
    { task_id: 8, ts: 2, latency: 20 },
    { task_id: 3, ts: 1, latency: 10 },
    { task_id: 8, ts: 1, latency: 15 },
  ] })
  assert.deepEqual(history.ping.map((point) => point.task_id), [8, 8, 3])
})
