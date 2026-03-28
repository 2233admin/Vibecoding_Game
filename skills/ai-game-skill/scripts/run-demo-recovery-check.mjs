import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const projectRoot = path.resolve(args["project-root"] || process.cwd());

const checks = [
  { name: "index.html exists", ok: fs.existsSync(path.join(projectRoot, "index.html")) },
  { name: "styles.css exists", ok: fs.existsSync(path.join(projectRoot, "styles.css")) },
  { name: "game.js exists", ok: fs.existsSync(path.join(projectRoot, "game.js")) },
  { name: "src/game exists", ok: fs.existsSync(path.join(projectRoot, "src", "game")) },
  {
    name: "acceptance script exists",
    ok: fs.existsSync(path.join(projectRoot, "scripts", "acceptance-interaction.mjs")),
  },
];

let failed = 0;
for (const check of checks) {
  if (!check.ok) {
    failed += 1;
  }
  console.log(`${check.ok ? "PASS" : "FAIL"} | ${check.name}`);
}

const acceptancePath = path.join(projectRoot, "scripts", "acceptance-interaction.mjs");
if (fs.existsSync(acceptancePath)) {
  const result = spawnSync("node", [acceptancePath], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  const output = [result.stdout || "", result.stderr || ""].join("\n").trim();
  const summaryLine = output
    .split(/\r?\n/)
    .reverse()
    .find((line) => line.includes("SUMMARY |"));

  const ok = result.status === 0;
  if (!ok) {
    failed += 1;
  }
  console.log(`${ok ? "PASS" : "FAIL"} | acceptance-interaction.mjs`);
  if (summaryLine) {
    console.log(summaryLine);
  } else if (output) {
    console.log(output.split(/\r?\n/).slice(-5).join("\n"));
  }
}

console.log(`RECOVERY_CHECK_SUMMARY | failed=${failed}`);
process.exitCode = failed > 0 ? 1 : 0;

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith("--")) {
      continue;
    }
    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }
    parsed[key] = next;
    i += 1;
  }
  return parsed;
}
