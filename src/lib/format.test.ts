import { bytes, percent, rate, uptime } from "./format.ts"

const tests: [string, unknown, unknown][] = [
  ["zero bytes", bytes(0), "0 B"],
  ["kilobytes", bytes(1024), "1.0 KB"],
  ["megabytes", bytes(1024 ** 2), "1.0 MB"],
  ["percentage", percent(50, 200), 25],
  ["zero denominator", percent(10, 0), 0],
  ["network rate", rate(1024), "1.0 KB/s"],
  ["minute uptime", uptime(60), "1 分钟"],
  ["hour uptime", uptime(3600), "1 小时"],
]
for (const [name, actual, expected] of tests) {
  if (actual !== expected) throw new Error(`${name}: expected ${String(expected)}, received ${String(actual)}`)
}
console.log(`${tests.length} format tests passed`)
