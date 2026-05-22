# 火车乘坐记录统计与车票生成

个人出行档案管理应用，支持记录火车出行信息、统计分析及车票样式预览。

## 功能特性

- **行程记录**：添加、删除火车出行记录（日期、车次、起终站、席别、票价、用时）
- **批量导入**：支持从语雀等工具复制表格文本批量导入行程
- **统计面板**：按年份筛选，展示行程数量、累计票价、线路数、高频年份
- **年度分布图**：可视化各年乘车次数柱状图
- **车票预览**：自动生成铁路电子客票样式，支持打印
- **数据持久化**：记录保存在服务端 JSON 文件，刷新不丢失

## 技术栈

- **框架**：Next.js 16 + React 19
- **语言**：TypeScript 5
- **包管理**：Yarn
- **运行环境**：Node.js

## 项目结构

```
ticket/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/records/        # REST API 路由
│   │   │   ├── route.ts        # GET 查询 / POST 新增
│   │   │   ├── [id]/           # DELETE 删除单条
│   │   │   ├── import/         # POST 批量导入
│   │   │   └── reset/          # POST 恢复初始数据
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── frontend/
│   │   ├── components/
│   │   │   └── TicketDashboard.tsx   # 主界面组件
│   │   ├── styles/             # 全局样式
│   │   └── utils/              # 前端工具函数
│   └── backend/
│       ├── lib/
│       │   ├── recordStore.ts  # 文件读写逻辑
│       │   └── seedRecords.ts  # 初始种子数据
│       └── types/              # 共享类型定义
├── data/                       # 运行时数据存储目录（自动创建）
├── package.json
└── tsconfig.json
```

## 快速开始

### 安装依赖

```bash
yarn install
```

### 启动开发服务

```bash
yarn dev
```

访问 [http://127.0.0.1:3000](http://127.0.0.1:3000)

### 构建生产版本

```bash
yarn build
yarn start
```

## API 接口

| 方法     | 路径                  | 说明             |
| -------- | --------------------- | ---------------- |
| `GET`    | `/api/records`        | 获取所有行程记录 |
| `POST`   | `/api/records`        | 新增一条行程     |
| `DELETE` | `/api/records/:id`    | 删除指定行程     |
| `POST`   | `/api/records/import` | 批量导入行程     |
| `POST`   | `/api/records/reset`  | 恢复初始数据     |

## 数据格式

每条行程记录包含以下字段：

| 字段       | 类型   | 说明                                        |
| ---------- | ------ | ------------------------------------------- |
| `id`       | string | 唯一标识                                    |
| `date`     | string | 乘车日期（YYYY-MM-DD）                      |
| `train`    | string | 车次（如 G114）                             |
| `from`     | string | 出发站                                      |
| `to`       | string | 到达站                                      |
| `seat`     | string | 席别（二等座/一等座/商务座/硬座/硬卧/软卧） |
| `fare`     | number | 票价（元）                                  |
| `duration` | string | 用时（如 4小时52分）                        |
