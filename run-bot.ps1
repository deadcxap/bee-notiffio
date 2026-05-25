Set-Location $PSScriptRoot

$node = "C:\Users\steam\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path $node)) {
  $node = "node"
}

& $node "src\bot.js" *> "bot.service.log"
