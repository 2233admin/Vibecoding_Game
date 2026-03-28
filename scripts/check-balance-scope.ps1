param(
  [string]$Base = "HEAD~1",
  [string]$Head = "HEAD"
)

$allowed = @(
  "config/balance-config.json",
  "docs/context-log.md"
)

$changed = git diff --name-only $Base $Head
if (-not $changed) {
  Write-Host "No file changes detected."
  exit 0
}

$illegal = $changed | Where-Object { $_ -notin $allowed }

if ($illegal) {
  Write-Host "Out-of-scope changes detected (not in balance allowlist):"
  $illegal | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Pass: changes are limited to balance allowlist files."
exit 0
