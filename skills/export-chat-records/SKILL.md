---
name: export-chat-records
version: 1.0.0
description: 导出指定工作区的 AI 聊天记录到 Markdown 文件。用户提到导出聊天记录、导出会话记录、导出 AI 对话、导出 Cursor/Claude/Codex/Copilot 聊天时使用。脚本会优先根据工作区根目录中的 .claude、.codex、.codex、.github 自动识别 AI 类型，并将导出结果写入工作区根目录下新建的 chat_exports 文件夹。
---

# 导出聊天记录

当前版本：`1.0.0`

## 通用 Skill 查找规则

本项目只维护 `.codex/skills` 这一份通用 skill 内容，不再为不同 AI 单独维护多套 skill。

当需要根据当前 AI 客户端判断应查看哪个工作区根目录下的配置目录时，按以下规则理解：

- 根目录有 `.claude` 目录时，表示 Claude Code 在该目录中寻找项目级能力配置
- 根目录有 `.codex` 目录时，表示 Cursor 在该目录中寻找项目级 skill
- 根目录有 `.codex` 目录时，表示 Codex 在该目录中寻找项目级 skill
- 根目录有 `.github` 目录时，表示 VSCode Copilot 在该目录中寻找项目级提示与指令

以上规则用于确定不同 AI 的项目级目录位置；本仓库中的通用 skill 内容统一以 `.codex/skills` 为准。

## 使用时机

当用户提到以下需求时使用此技能：

- 导出聊天记录
- 导出会话记录
- 导出 AI 对话
- 导出 Cursor / Claude Code / Codex / VSCode Copilot 聊天记录

## 执行规则

1. 默认使用当前工作区根目录作为 `--workspace`
2. 执行脚本：`node .codex/skills/export-chat-records/scripts/export_ai_sessions.js --workspace "."`
3. 如果用户明确指定了 AI 类型，再额外传入 `--ai <ai-type>`
4. 如果用户明确指定了输出目录，再额外传入 `--output "<输出目录>"`
5. 若未传 `--ai`，脚本会按以下顺序自动识别工作区根目录中的标记目录：
   - `.claude` -> `claude-code`
   - `.codex` -> `cursor`
   - `.codex` -> `codex`
   - `.github` -> `vscode-copilot`
6. 若未指定 `--output`，脚本会在工作区根目录中创建 `chat_exports/<ai-type>/`，并将每个会话导出为一个 Markdown 文件
7. 导出完成后，向用户说明导出目录和导出的会话数量
8. 在 PowerShell 中不要使用 `cd <路径> && node ...` 这种写法；应直接在目标工作区根目录执行命令，或先单独切换目录后再执行命令
9. 如果导出内容中识别到访问令牌、API Key、Bearer Token 等敏感令牌，脚本会自动将实际内容替换为 `[token过滤]`

## 常用命令

```bash
# 导出当前工作区聊天记录，AI 类型自动识别
node .codex/skills/export-chat-records/scripts/export_ai_sessions.js --workspace "."

# 指定 AI 类型
node .codex/skills/export-chat-records/scripts/export_ai_sessions.js --workspace "." --ai cursor

# 指定输出目录
node .codex/skills/export-chat-records/scripts/export_ai_sessions.js --workspace "." --output "./chat_exports/custom"
```

PowerShell 示例：

```powershell
Set-Location "G:\VibeCoding\Copilot"
node .github/skills/export-chat-records/scripts/export_ai_sessions.js --workspace "." --ai vscode-copilot
```

## 输出位置

默认输出目录：

```text
<workspace>/chat_exports/<ai-type>/
```

例如：

```text
./chat_exports/cursor/
```

## 注意事项

- 如果工作区根目录不存在 `.claude`、`.codex`、`.codex`、`.github`，脚本会回退为手动选择 AI 类型
- 如果本地工作区路径不存在，脚本仍会尝试从历史记录中匹配并导出
- 每个会话会单独导出成一个 `.md` 文件
- 导出前会对消息内容做敏感令牌脱敏，避免把访问令牌原文写入导出结果
