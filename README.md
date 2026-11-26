# Personal Agent — web prototype

一个个人 agent 的 web 原型，React + TypeScript，Vite 构建。设计工作按
[app_docs_kit](https://github.com/sherrrrryz/app_docs_kit) 里的
`design-workflow-kit` 流程来跑：硬规则和任务路由表在 `CLAUDE.md`
（`AGENTS.md` 是它的软链接），细节文档在 `docs/design/`，skill 在
`.claude/skills/`，两个门禁脚本在 `scripts/`。

## 现在在哪一步

**任务 0（Foundations intake）进行中。** `docs/design/FOUNDATIONS.md`
里还有要你拍板的占位符；汇总的决定清单在 `.orchestration/G0-decision-packet.md`。
G-0 通过之前不写任何界面代码。

**Figma 相关流程在本项目置灰（D-04）**：任务 4、门禁 G-MIRROR、`FIGMA-SYNC.md`、
`figma-file-map.md` 和 `figma-mirror` skill 都保留在仓库里但标为不启用，每个阶段
到你看过运行中的代码（G-1 / G-2 / G-3 / G-5）即结束。

## 命令

```bash
npm install
npm run dev                  # http://localhost:5173
npm run check:docs           # 文档索引和状态头
npm run check:design-values  # src/ 下不许出现写死的视觉数值
npm run verify               # 以上两项 + lint + build
```

`npm run tokens:build`（从 `tokens/` 生成 `src/tokens/generated/tokens.css`）在任务 2 加入；
`npm test` 随任务 1 的 spec 加入。

## 目录

| 路径 | 作用 |
| --- | --- |
| `CLAUDE.md` / `AGENTS.md` | 每个 agent session 开头必读的硬规则和路由表 |
| `docs/README.md` | 所有文档的索引，一行一份 |
| `docs/design/` | 流程、规则、项目记录、六类任务的手册、模板 |
| `.claude/skills/` | responsive、accessibility、design-tokens、design-sessions、design-review；figma-mirror 置灰（D-04） |
| `scripts/` | `check-docs.mjs`、`check-design-values.mjs`（配置：`design-values.config.json`） |
| `tokens/` | 唯一的 token 源（任务 2 建立） |
| `src/` | React 代码；`src/tokens/generated/` 是生成物 |
| `.orchestration/` | 当前任务的运行时状态，不进 git |
