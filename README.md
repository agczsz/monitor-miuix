# 极简探针 · Miuix 主题 (`monitor-miuix`)

基于 [compose-miuix-ui/miuix](https://github.com/compose-miuix-ui/miuix) 设计语言（Xiaomi HyperOS 视觉风格）开发的 [monitor-probe/monitor](https://github.com/monitor-probe/monitor) 公开状态页主题，完全遵循 [monitor-probe/themes](https://github.com/monitor-probe/themes) 主题站收录与打包规范。

<img width="2257" height="1219" alt="final-preview" src="https://github.com/user-attachments/assets/c399c5eb-cffd-4260-8d2f-3c226d10624c" />


## 1. 核心特性

### 轻盈 Miuix 视觉与动态色彩体系
* **原汁原味色彩语义**：完整移植 [compose-miuix-ui/miuix](https://github.com/compose-miuix-ui/miuix) 的 `lightColorScheme`（浅色画布 `#F7F7F7`、纯白卡片 `#FFFFFF`、澎湃蓝主色 `#3482FF`）与 `darkColorScheme`（深邃画布 `#000000`、容器 `#242424`、主色 `#277AF7`），支持 **跟随系统 (`system`)**、**浅色 (`light`)**、**深色 (`dark`)** 三种模式一键切换。
* **Monet 动态种子色引擎 (`keyColor`)**：内置澎湃蓝 (`#3482FF`)、碧海青 (`#00B4AA`)、翡翠绿 (`#16B767`)、科技橙 (`#FF6900`)、星云紫 (`#7C4DFF`)、珊瑚红 (`#F43F5E`) 6 套预设种子色，实时计算并注入全局 CSS 变量。
* **液态毛玻璃与弹簧动效**：顶栏 (`TopAppBar`) 与底部排序悬浮栏采用 `miuix-blur` 渐进式高斯模糊 (`backdrop-filter: blur(24px) saturate(180%)`)，卡片与交互控件采用 `miuix-squircle` 超椭圆圆角与 `Folme` 弹簧物理过渡曲线 (`cubic-bezier(0.22, 1, 0.36, 1)`)。

### 顶部四宫格运行总览 (`SummaryBento`)
* **节点在线状态**：直观展示当前在线节点数、总节点数、在线率百分比胶囊与动态进度条。
* **节点 CPU / 内存概览**：自动筛选具备实时指标的在线节点，计算集群平均 CPU 占用率与内存池总占用率，并在右上角动态标记当前负载最高的节点（如 `最忙: 香港-HYTRON2`）。
* **实时网络总吞吐**：秒级汇总所有在线节点的实时下行速率（`↓`）与实时上行速率（`↑`）。
* **当月累计流量**：右上角按各节点配置的计费模式自动汇总 **计费口径** 总流量，下方分列当月累计接收 (`RX`) 与发送 (`TX`)。

### 2×2 四维指标节点卡片 (`NodeCard`)
* **高清矢量国旗与状态胶囊**：集成 `flag-icons` 矢量国旗组件 (`Flag.tsx`)，展示节点名称、操作系统、架构 (`x86_64` / `aarch64`)、vCPU 核心数、分组标签及右侧呼吸灯状态胶囊（`运行中` / `已离线`）。
* **2×2 资源与流量计费网格**：
  * **CPU**：实时百分比进度条 + 底部 `1 / 5 / 15` 分钟系统平均负载 (`load`)。
  * **内存**：物理内存百分比进度条 + 已用/总量及 `Swap` 交换分区占用明细。
  * **磁盘**：存储空间百分比进度条 + 已用/总容量明细。
  * **月度计费流量**：根据节点 `traffic_mode` 自动显示 **双向计费**、**上行计费**、**下行计费** 或 **较大方向计费**，支持配额百分比进度条与无限制流量 (`∞`) 展示。
* **独立上下行速率胶囊条**：卡片中部采用柔和底色胶囊展示实时下行（蓝色 `↓`）与实时上行（绿色 `↑`）速率。
* **账单周期与在线时长底栏**：左下方显示续费价格、周期与到期剩余天数（如 `USD0/monthly` 或 `¥49/月 · 余24天`），右下方显示在线运行时长徽章（如 `2天 2小时`）或离线时长。

### 多维筛选、三种视图与详情历史图表
* **分组与状态筛选**：支持 `全部节点`、各自定义分组与 `未分组` 独立计数标签页切换；右侧提供 `全部 / 在线 / 离线` 状态过滤，顶栏支持按节点名称、地区、系统或分组即时搜索。
* **三种布局视图**：支持 **卡片 (`grid`)**、**设置项列表 (`preference`)**、**紧凑表格 (`table`)** 三种视图切换，底部提供 `默认排序 / 按 CPU / 按内存 / 按网速` 悬浮工具栏。
* **节点详情与 SVG 历史图表弹窗 (`NodeDetailDialog`)**：点击任意节点弹出 32px 圆角详情面板，展示 4 格硬件与系统规格（处理器与虚拟化、操作系统与内核、TCP/UDP/进程数与 Swap、内存与存储）以及三类交互式 SVG 历史曲线（自适应 `/api/me` 的 `history_days` 时间跨度）：
  * **CPU 与内存趋势**：三次贝塞尔平滑面积图 (`MetricHistoryChart`)、当前实时值虚线基准与系统负载摘要。
  * **三网延迟与丢包 (Ping)**：多探测目标 (`probes`) 分色折线图、采样点丢包率半径映射与超时高亮，底部展示各线路 **最新采样**、**区间平均延迟** 与 **时间段丢包率**。
  * **网络吞吐曲线**：历史下行 (`RX`) 与上行 (`TX`) 平均吞吐速率趋势图。

## 2. 技术栈与架构设计

| 模块分类 | 采用技术 / 实现路径 | 核心职责说明 |
| :--- | :--- | :--- |
| **前端框架与构建** | React 19 + TypeScript 5.8 + Vite 6 | 组件化状态管理、严格类型检查与高性能静态产物打包 |
| **图标与视觉资产** | `flag-icons` + 自定义 `ResourceIcon` / Lucide | 跨平台一致的 ISO 3166-1 国旗渲染与轻量化硬件资源矢量图标 |
| **实时数据流 (`src/lib/api.ts`)** | `WS /api/ws?gzip` + `DecompressionStream` | 自动识别 `0x1f 0x8b` Gzip 魔数并解压二进制帧，内置 10s 静默看门狗重连、5s HTTP 轮询降级与 `visibilitychange` 后台节流 |
| **历史数据归一化 (`src/lib/metrics-history.ts`)** | `normalizeMetricsHistory()` | 校验并清洗 `/api/nodes/{id}/metrics` 返回的 `metrics`、`ping`、`probes` 与 `loss` 数据 |
| **流量口径计算 (`src/lib/traffic.ts`)** | `getTrafficUsed()` / `getTrafficModeLabel()` | 优先读取服务端权威 `month_used`，并兼容 `both`、`tx`/`up`、`rx`/`down`、`max` 四种计费模式 |
| **配置分层管理 (`src/lib/config.ts`)** | `/api/themes/miuix/config` + `localStorage` | 合并 `theme.json` 默认值、站长后台配置与访客本地外观偏好（仅限 `color_mode`、`default_view`、`monet_key_color`） |

## 3. 目录结构

```text
monitor-miuix/
├── .github/workflows/
│   └── release.yml                # GitHub Actions 自动构建、校验与 Release 发布工作流
├── public/
│   └── favicon.svg                # Miuix 主题矢量图标
├── src/
│   ├── components/
│   │   ├── Flag.tsx               # 基于 flag-icons 的国旗/地区图标组件
│   │   ├── NodeCard.tsx           # 2×2 四维资源网格节点卡片组件
│   │   ├── NodeDetailDialog.tsx   # 节点硬件详情与 CPU/内存/Ping/网络 SVG 历史图表弹窗
│   │   ├── NodePreferenceList.tsx # Miuix 设置项分组列表视图与紧凑表格视图
│   │   ├── ResourceIcon.tsx       # CPU、内存、磁盘、流量、上下行速率与时钟矢量图标
│   │   ├── SummaryBento.tsx       # 顶部四宫格运行总览组件
│   │   ├── ThemePreferenceDialog.tsx # 极简探针外观与偏好设置弹窗
│   │   └── TopAppBar.tsx          # 渐进式毛玻璃顶栏、搜索框与快捷操作区
│   ├── lib/
│   │   ├── api.ts                 # HTTP API 请求、WebSocket Gzip 解压流、重连与轮询 Hook
│   │   ├── config.ts              # 后台配置校验加载与访客本地偏好持久化
│   │   ├── format.ts              # 字节、速率、时长、百分比与剩余天数格式化工具
│   │   ├── format.test.ts         # 格式化与数据转换单元测试
│   │   ├── metrics-history.ts     # 历史监控指标与 Ping 序列数据清洗与归一化
│   │   ├── miuix-colors.ts        # Miuix 浅色/深色 Token 定义与 Monet 动态调色板算法
│   │   ├── mock.ts                # 本地演示数据生成 (?demo=1 预览模式使用)
│   │   └── traffic.ts             # 多口径月度流量计算工具
│   ├── types/
│   │   └── monitor.ts             # Monitor 探针接口与主题配置 TypeScript 类型定义
│   ├── App.tsx                    # 应用主视图、分组/状态过滤与排序逻辑
│   ├── index.css                  # Miuix 全局 CSS 变量、圆角、排版与响应式布局样式
│   └── main.tsx                   # 应用挂载入口
├── index.html                     # 页面入口模板
├── package.json                   # 项目依赖与脚本配置
├── preview.png                    # 主题预览图
├── theme.json                     # Monitor 主题清单文件 (short: "miuix", version: "2.0.0")
└── vite.config.ts                 # Vite 构建与开发代理配置
```

## 4. 安装与使用说明

### 方式一：在 Monitor 面板后台直接安装
1. 从本仓库 [Releases](https://github.com/agczsz/monitor-miuix/releases) 页面下载最新版本的 `theme.tar.gz`，或直接复制仓库地址 `https://github.com/agczsz/monitor-miuix`。
2. 登录 [monitor-probe/monitor](https://github.com/monitor-probe/monitor) 管理后台，进入 **「主题」** 页面。
3. 选择上传 `theme.tar.gz` 压缩包，或粘贴仓库地址点击 **「从 GitHub 安装」**，启用 **「极简探针 (`miuix`)」** 即可。

### 方式二：后台自定义配置 (`theme.json`)
启用主题后，可在管理后台进入主题设置界面调整以下参数：

| 配置项字段 (`key`) | 类型 (`type`) | 默认值 (`default`) | 功能说明 |
| :--- | :--- | :--- | :--- |
| `show_summary` | `boolean` | `true` | 是否在首页顶部显示四宫格运行总览（在线节点、CPU/内存概览、实时总吞吐、当月累计流量） |
| `notice` | `text` | `""` | 站点公告内容，非空时在节点列表上方展示公告卡片，留空则自动隐藏 |

> **访客端个性化**：访客可随时点击顶栏右侧的 **「外观设置」** 按钮，自由切换浅色/深色/跟随系统模式、6 款 Monet 主题色、默认视图（卡片/设置项/表格）以及毛玻璃/账单显示开关，相关偏好保存在访客本地浏览器中。

## 5. 本地开发与打包测试

### 环境要求
* **Node.js**：建议使用 `Node.js 22+` 或 `Node.js 24`（支持内置 `--experimental-strip-types` 运行 TypeScript 测试）。

### 常用命令

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器（默认监听 0.0.0.0，API 请求自动代理至 http://127.0.0.1:3000）
# 若本地未运行后端探针，可在浏览器访问 http://localhost:5173/?demo=1 开启演示模式
npm run dev

# 3. 运行单元测试与类型检查
npm test
npm run lint

# 4. 构建生产环境静态产物至 dist/
npm run build
```

### 手动打包 `theme.tar.gz`
遵循 [monitor-probe/themes](https://github.com/monitor-probe/themes) 规范，`theme.tar.gz` 需将 `theme.json`、`preview.png` 与 `dist/` 直接置于压缩包根目录：

```bash
npm run build
mkdir -p package
cp theme.json preview.png package/
cp -R dist package/dist
tar -C package -czf theme.tar.gz theme.json preview.png dist
gzip -t theme.tar.gz
```

## 6. 致谢与开源协议

* 探针宿主与主题生态：[monitor-probe/monitor](https://github.com/monitor-probe/monitor) · [monitor-probe/themes](https://github.com/monitor-probe/themes)
* 设计系统灵感来源：[compose-miuix-ui/miuix](https://github.com/compose-miuix-ui/miuix)
* 国旗图标库：[lipis/flag-icons](https://github.com/lipis/flag-icons)
* 开源许可证：本项目基于 [MIT License](./LICENSE) 开源。
