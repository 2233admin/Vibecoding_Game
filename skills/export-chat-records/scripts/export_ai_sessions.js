#!/usr/bin/env node
/*
Export AI chat transcripts for a workspace into Markdown files.

Supported AI types:
- cursor
- claude-code
- codex
- vscode-copilot

Usage:
  node .codex/skills/export-chat-records/scripts/export_ai_sessions.js
  node .codex/skills/export-chat-records/scripts/export_ai_sessions.js --workspace "." --ai cursor
  node .codex/skills/export-chat-records/scripts/export_ai_sessions.js --workspace "." --ai codex --output "./chat_exports/codex"
*/

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const process = require("node:process");
const readline = require("node:readline/promises");

const AI_TYPES = {
  cursor: "Cursor",
  "claude-code": "Claude Code",
  codex: "Codex",
  "vscode-copilot": "VSCode Copilot",
};

const WORKSPACE_AI_MARKERS = [
  { folder: ".claude", aiType: "claude-code" },
  { folder: ".codex", aiType: "cursor" },
  { folder: ".codex", aiType: "codex" },
  { folder: ".github", aiType: "vscode-copilot" },
];

function parseArgs(argv) {
  const args = {
    workspace: undefined,
    ai: undefined,
    output: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    if (key === "workspace") {
      args.workspace = next;
    } else if (key === "ai") {
      args.ai = next;
    } else if (key === "output") {
      args.output = next;
    } else {
      throw new Error(`Unknown argument: --${key}`);
    }
    index += 1;
  }

  return args;
}

function printHelp() {
  console.log("Export all chat sessions for a workspace into Markdown files.");
  console.log("");
  console.log("Options:");
  console.log("  --workspace <path>   Workspace path to export.");
  console.log("  --ai <type>          AI type: cursor, claude-code, codex, vscode-copilot.");
  console.log("  --output <path>      Output directory. Defaults to <workspace>/chat_exports/<ai-type>/");
  console.log("");
  console.log("Auto-detect:");
  console.log("  If --ai is omitted, the script checks workspace root folders in this order:");
  console.log("  .claude -> Claude Code, .codex -> Cursor, .codex -> Codex, .github -> VSCode Copilot");
}

function sanitizeFilename(value, maxLength = 80) {
  let result = String(value || "");
  result = result.replace(/[\\/:*?"<>|]+/g, "-");
  result = result.replace(/\s+/g, " ").trim();
  result = result.replace(/ /g, "-");
  result = result.replace(/-{2,}/g, "-").replace(/^[-._]+|[-._]+$/g, "");
  result = result || "session";
  result = result.slice(0, maxLength).replace(/^[-._]+|[-._]+$/g, "");
  return result || "session";
}

function getWindowsParts(inputPath) {
  const full = path.win32.normalize(String(inputPath));
  const parsed = path.win32.parse(full);
  const drive = parsed.root ? parsed.root.replace(/[\\/:]/g, "") : "";
  const rest = full.slice(parsed.root.length);
  const parts = rest.split(/[\\/]+/).filter(Boolean);
  return { drive, parts };
}

function encodeCursorWorkspace(workspacePath) {
  const { drive, parts } = getWindowsParts(workspacePath);
  if (drive) {
    return [drive.toLowerCase(), ...parts].join("-");
  }
  return sanitizeFilename(String(workspacePath)).toLowerCase();
}

function encodeClaudeWorkspace(workspacePath) {
  const { drive, parts } = getWindowsParts(workspacePath);
  if (drive) {
    return parts.length > 0 ? `${drive.toUpperCase()}--${parts.join("-")}` : `${drive.toUpperCase()}--`;
  }
  return sanitizeFilename(String(workspacePath));
}

function workspaceMatchers(workspacePath) {
  const resolved = path.resolve(workspacePath);
  const winPath = path.win32.normalize(resolved).toLowerCase();
  const posixPath = resolved.replace(/\\/g, "/").toLowerCase();
  const uriPath = `/${posixPath}`;
  const encodedUri = encodeURI(uriPath).toLowerCase();
  return [...new Set([winPath, winPath.replace(/\\/g, "/"), posixPath, uriPath, encodedUri])].sort();
}

function detectAiTypeFromWorkspace(workspacePath) {
  if (!fs.existsSync(workspacePath) || !fs.statSync(workspacePath).isDirectory()) {
    return null;
  }

  for (const marker of WORKSPACE_AI_MARKERS) {
    const markerPath = path.join(workspacePath, marker.folder);
    if (fs.existsSync(markerPath) && fs.statSync(markerPath).isDirectory()) {
      return marker.aiType;
    }
  }

  return null;
}

function getDefaultOutputDir(workspacePath, aiType) {
  return path.resolve(workspacePath, "chat_exports", aiType);
}

function toPosixDisplayPath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function formatDisplayPath(targetPath, basePath = process.cwd()) {
  const absoluteTarget = path.resolve(targetPath);
  const absoluteBase = path.resolve(basePath);
  const relativeToBase = path.relative(absoluteBase, absoluteTarget);

  if (!relativeToBase) {
    return ".";
  }

  if (!relativeToBase.startsWith("..") && !path.isAbsolute(relativeToBase)) {
    return `./${toPosixDisplayPath(relativeToBase)}`;
  }

  const homeRelative = path.relative(os.homedir(), absoluteTarget);
  if (homeRelative && !homeRelative.startsWith("..") && !path.isAbsolute(homeRelative)) {
    return `~/${toPosixDisplayPath(homeRelative)}`;
  }

  return toPosixDisplayPath(absoluteTarget);
}

function safeReadText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJsonl(filePath) {
  const lines = safeReadText(filePath).split(/\r?\n/);
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      items.push(JSON.parse(trimmed));
    } catch (_error) {
      // Ignore malformed lines
    }
  }
  return items;
}

const TOKEN_PATTERNS = [
  /\bglpat-[A-Za-z0-9._-]+\b/g,
  /\bgithub_pat_[A-Za-z0-9_]+\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]+\b/g,
  /\bsk-[A-Za-z0-9_-]+\b/g,
  /\bxox(?:a|b|p|o|r|s|t)-[A-Za-z0-9-]+\b/g,
  /\b(?:access[_-]?token|token|api[_-]?key|secret)\s*[:=]\s*["']?[A-Za-z0-9._-]{8,}["']?/gi,
  /\bBearer\s+[A-Za-z0-9._-]{8,}\b/gi,
];

function redactSensitiveTokens(text) {
  let result = String(text || "");
  for (const pattern of TOKEN_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const assignmentMatch = match.match(/^((?:access[_-]?token|token|api[_-]?key|secret)\s*[:=]\s*["']?)/i);
      if (assignmentMatch) {
        const prefix = assignmentMatch[1];
        const suffix = /["']$/.test(match) ? match.slice(-1) : "";
        return `${prefix}[token过滤]${suffix}`;
      }
      if (/^Bearer\s+/i.test(match)) {
        return "Bearer [token过滤]";
      }
      return "[token过滤]";
    });
  }
  return result;
}

function firstUserText(messages) {
  for (const message of messages) {
    if (message.role === "user" && message.text.trim()) {
      return message.text.trim();
    }
  }
  return "session";
}

function mergeMessages(messages) {
  const merged = [];
  for (const message of messages) {
    const text = redactSensitiveTokens(message.text).trim();
    if (!text) {
      continue;
    }
    const previous = merged[merged.length - 1];
    if (previous && previous.role === message.role) {
      previous.text = `${previous.text}\n\n${text}`;
    } else {
      merged.push({ role: message.role, text });
    }
  }
  return merged;
}

function extractContentText(content) {
  const texts = [];

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    for (const item of content) {
      const nested = extractContentText(item);
      if (nested) {
        texts.push(nested);
      }
    }
    return texts.join("\n\n");
  }

  if (content && typeof content === "object") {
    const itemType = content.type;
    if (itemType === "text" || itemType === "input_text" || itemType === "output_text") {
      const value = content.text;
      if (typeof value === "string" && value.trim()) {
        texts.push(value.trim());
      }
    } else if (itemType === "tool_result" || itemType === "tool_use" || itemType === "thinking") {
      return "";
    } else if (typeof content.value === "string") {
      texts.push(content.value.trim());
    } else if ("content" in content) {
      const nested = extractContentText(content.content);
      if (nested) {
        texts.push(nested);
      }
    }
    return texts.filter(Boolean).join("\n\n");
  }

  return "";
}

function extractCursorText(message) {
  return extractContentText(message ? message.content : undefined);
}

function extractClaudeText(record) {
  if (record && record.isMeta) {
    return "";
  }
  return extractContentText(record && record.message ? record.message.content : undefined);
}

function extractCopilotRequestText(request) {
  const message = request && request.message ? request.message : {};
  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  const parts = Array.isArray(message.parts) ? message.parts : [];
  const texts = parts
    .filter((part) => part && typeof part === "object")
    .map((part) => String(part.text || "").trim())
    .filter(Boolean);
  return texts.join("\n\n");
}

function extractCopilotResponseText(items) {
  const texts = [];
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || typeof item !== "object") {
      continue;
    }
    if (item.kind === "toolInvocationSerialized") {
      continue;
    }
    if (typeof item.value === "string" && item.value.trim()) {
      texts.push(item.value.trim());
      continue;
    }
    if (item.content && typeof item.content === "object") {
      const value = item.content.value;
      if (typeof value === "string" && value.trim()) {
        texts.push(value.trim());
      }
    }
  }
  return texts.join("\n\n");
}

function listFilesRecursive(rootDir, predicate) {
  const results = [];
  if (!fs.existsSync(rootDir)) {
    return results;
  }

  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (!predicate || predicate(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  results.sort((a, b) => a.localeCompare(b));
  return results;
}

function extractCodexSessions(workspacePath) {
  const root = path.join(os.homedir(), ".codex", "sessions");
  if (!fs.existsSync(root)) {
    return [];
  }

  const sessions = [];
  const workspaceNorm = path.resolve(workspacePath).toLowerCase();
  const files = listFilesRecursive(root, (filePath) => filePath.toLowerCase().endsWith(".jsonl"));

  for (const filePath of files) {
    const messages = [];
    let matched = false;

    for (const item of readJsonl(filePath)) {
      if (item.type === "session_meta") {
        const cwd = String(item.payload && item.payload.cwd ? item.payload.cwd : "").toLowerCase();
        if (cwd === workspaceNorm) {
          matched = true;
        }
      } else if (item.type === "event_msg") {
        const payload = item.payload || {};
        if (payload.type === "user_message") {
          const text = String(payload.message || "").trim();
          if (text) {
            messages.push({ role: "user", text });
          }
        } else if (payload.type === "agent_message") {
          const text = String(payload.message || "").trim();
          if (text) {
            messages.push({ role: "assistant", text });
          }
        }
      }
    }

    if (matched && messages.length > 0) {
      sessions.push({
        session_id: path.parse(filePath).name,
        source_path: filePath,
        messages: mergeMessages(messages),
      });
    }
  }

  return sessions;
}

function extractCursorSessions(workspacePath) {
  const projectsRoot = path.join(os.homedir(), ".codex", "projects");
  const direct = path.join(projectsRoot, encodeCursorWorkspace(workspacePath), "agent-transcripts");
  const candidates = fs.existsSync(direct)
    ? listFilesRecursive(direct, (filePath) => filePath.toLowerCase().endsWith(".jsonl"))
    : listFilesRecursive(projectsRoot, (filePath) => {
        const lower = filePath.toLowerCase();
        return lower.endsWith(".jsonl") && lower.includes(`${path.sep}agent-transcripts${path.sep}`);
      });

  const sessions = [];
  const workspaceTokens = workspaceMatchers(workspacePath);

  for (const filePath of candidates) {
    let matched = fs.existsSync(direct);
    if (!matched) {
      const raw = safeReadText(filePath).toLowerCase();
      matched = workspaceTokens.some((token) => raw.includes(token));
    }
    if (!matched) {
      continue;
    }

    const messages = [];
    for (const item of readJsonl(filePath)) {
      const role = item.role;
      if (role !== "user" && role !== "assistant") {
        continue;
      }
      const text = extractCursorText(item.message || {});
      if (text) {
        messages.push({ role, text });
      }
    }

    if (messages.length > 0) {
      sessions.push({
        session_id: path.parse(filePath).name,
        source_path: filePath,
        messages: mergeMessages(messages),
      });
    }
  }

  return sessions;
}

function extractClaudeSessions(workspacePath) {
  const projectsRoot = path.join(os.homedir(), ".claude", "projects");
  const direct = path.join(projectsRoot, encodeClaudeWorkspace(workspacePath));
  const candidates = fs.existsSync(direct)
    ? fs
        .readdirSync(direct, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".jsonl"))
        .map((entry) => path.join(direct, entry.name))
        .sort((a, b) => a.localeCompare(b))
    : listFilesRecursive(projectsRoot, (filePath) => {
        const lower = filePath.toLowerCase();
        if (!lower.endsWith(".jsonl")) {
          return false;
        }
        return !lower.split(/[\\/]+/).includes("subagents");
      });

  const sessions = [];
  const workspaceNorm = path.resolve(workspacePath).toLowerCase();

  for (const filePath of candidates) {
    const messages = [];
    let matched = fs.existsSync(direct);

    for (const item of readJsonl(filePath)) {
      if (!matched) {
        const cwd = String(item.cwd || "").toLowerCase();
        if (cwd === workspaceNorm) {
          matched = true;
        }
      }

      if (item.type !== "user" && item.type !== "assistant") {
        continue;
      }

      const text = extractClaudeText(item);
      if (text) {
        messages.push({ role: item.type, text });
      }
    }

    if (matched && messages.length > 0) {
      sessions.push({
        session_id: path.parse(filePath).name,
        source_path: filePath,
        messages: mergeMessages(messages),
      });
    }
  }

  return sessions;
}

function extractCopilotSessions(workspacePath) {
  const root = path.join(os.homedir(), "AppData", "Roaming", "Code", "User", "workspaceStorage");
  if (!fs.existsSync(root)) {
    return [];
  }

  const sessions = [];
  const tokens = workspaceMatchers(workspacePath);
  const files = listFilesRecursive(root, (filePath) => {
    const lower = filePath.toLowerCase();
    return lower.endsWith(".json") && lower.includes(`${path.sep}chatsessions${path.sep}`);
  });

  for (const filePath of files) {
    const raw = safeReadText(filePath);
    const lowerRaw = raw.toLowerCase();
    if (!tokens.some((token) => lowerRaw.includes(token))) {
      continue;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (_error) {
      continue;
    }

    const requests = Array.isArray(payload.requests) ? payload.requests : [];
    const messages = [];
    for (const request of requests) {
      const userText = extractCopilotRequestText(request);
      if (userText) {
        messages.push({ role: "user", text: userText });
      }

      const assistantText = extractCopilotResponseText(request.response || []);
      if (assistantText) {
        messages.push({ role: "assistant", text: assistantText });
      }
    }

    if (messages.length > 0) {
      sessions.push({
        session_id: path.parse(filePath).name,
        source_path: filePath,
        messages: mergeMessages(messages),
      });
    }
  }

  return sessions;
}

function renderSessionMarkdown(workspacePath, aiType, session) {
  const workspaceDisplay = formatDisplayPath(workspacePath, workspacePath);
  const sourceDisplay = formatDisplayPath(session.source_path, workspacePath);
  const lines = [
    `# ${(firstUserText(session.messages) || session.session_id).slice(0, 80)}`,
    "",
    `- AI Type: ${AI_TYPES[aiType]}`,
    `- Session ID: \`${session.session_id}\``,
    `- Workspace: \`${workspaceDisplay}\``,
    `- Source: \`${sourceDisplay}\``,
    "",
    "---",
    "",
  ];

  session.messages.forEach((message, index) => {
    const heading = message.role === "user" ? "User" : "Assistant";
    lines.push(`## ${index + 1}. ${heading}`);
    lines.push("");
    lines.push(String(message.text || "").replace(/\s+$/g, ""));
    lines.push("");
  });

  return `${lines.join("\n").replace(/\s+$/g, "")}\n`;
}

function exportSessions(workspacePath, aiType, outputDir, sessions) {
  fs.mkdirSync(outputDir, { recursive: true });
  const writtenFiles = [];

  sessions.forEach((session, index) => {
    const title = sanitizeFilename(firstUserText(session.messages), 40);
    const filename = `${String(index + 1).padStart(3, "0")}_${session.session_id}_${title}.md`;
    const target = path.join(outputDir, filename);
    const markdown = renderSessionMarkdown(workspacePath, aiType, session);
    fs.writeFileSync(target, markdown, "utf8");
    writtenFiles.push(target);
  });

  return writtenFiles;
}

function discoverSessions(workspacePath, aiType) {
  if (aiType === "cursor") {
    return extractCursorSessions(workspacePath);
  }
  if (aiType === "claude-code") {
    return extractClaudeSessions(workspacePath);
  }
  if (aiType === "codex") {
    return extractCodexSessions(workspacePath);
  }
  if (aiType === "vscode-copilot") {
    return extractCopilotSessions(workspacePath);
  }
  throw new Error(`Unsupported AI type: ${aiType}`);
}

async function promptForMissing(args) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    let workspace = args.workspace ? path.resolve(args.workspace) : "";
    if (!workspace) {
      const raw = (await rl.question("Workspace path: ")).trim();
      if (!raw) {
        throw new Error("Workspace path is required.");
      }
      workspace = path.resolve(raw);
    }

    let aiType = args.ai;
    if (!aiType) {
      aiType = detectAiTypeFromWorkspace(workspace);
      if (aiType) {
        console.log(`[INFO] Detected AI type from workspace folder: ${AI_TYPES[aiType]} (${aiType})`);
      } else {
        console.log("Select AI type:");
        const options = Object.entries(AI_TYPES);
        options.forEach(([key, label], index) => {
          console.log(`  ${index + 1}. ${label} (${key})`);
        });

        const choice = (await rl.question("AI type: ")).trim().toLowerCase();
        if (/^\d+$/.test(choice)) {
          const index = Number(choice) - 1;
          if (index < 0 || index >= options.length) {
            throw new Error("Invalid AI type selection.");
          }
          aiType = options[index][0];
        } else if (Object.prototype.hasOwnProperty.call(AI_TYPES, choice)) {
          aiType = choice;
        } else {
          throw new Error("Invalid AI type selection.");
        }
      }
    }

    if (!Object.prototype.hasOwnProperty.call(AI_TYPES, aiType)) {
      throw new Error(`Unsupported AI type: ${aiType}`);
    }

    const outputDir = args.output ? path.resolve(args.output) : getDefaultOutputDir(workspace, aiType);

    return { workspace, aiType, outputDir };
  } finally {
    rl.close();
  }
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    return 1;
  }

  let workspace;
  let aiType;
  let outputDir;
  try {
    ({ workspace, aiType, outputDir } = await promptForMissing(args));
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    return 1;
  }

  if (!fs.existsSync(workspace)) {
    console.log(
      `[WARN] Workspace path does not exist locally, exporting from historical records: ${formatDisplayPath(workspace)}`,
    );
  }

  const sessions = discoverSessions(workspace, aiType);
  if (sessions.length === 0) {
    console.log(`[ERROR] No sessions found for ${AI_TYPES[aiType]} in workspace: ${workspace}`);
    return 1;
  }

  const written = exportSessions(workspace, aiType, outputDir, sessions);
  console.log(`[OK] Exported ${written.length} sessions to: ${formatDisplayPath(outputDir, workspace)}`);
  for (const filePath of written) {
    console.log(`  - ${formatDisplayPath(filePath, workspace)}`);
  }
  return 0;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  });
