$ErrorActionPreference = "Stop"

$crawlerRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $crawlerRoot
$python = Join-Path $crawlerRoot ".venv\Scripts\python.exe"
$logDirectory = Join-Path $repoRoot "runtime-logs"
$logPath = Join-Path $logDirectory "rss-news-$(Get-Date -Format 'yyyy-MM-dd').log"

if (-not (Test-Path -LiteralPath $python)) {
    Write-Error "Không tìm thấy Python của crawler tại $python"
    exit 2
}

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
Push-Location $crawlerRoot
try {
    "[$(Get-Date -Format o)] Bắt đầu thu thập RSS" | Tee-Object -FilePath $logPath -Append
    $crawlerOutput = & $python main.py --stage news 2>&1
    $crawlerExitCode = $LASTEXITCODE
    $crawlerOutput | Tee-Object -FilePath $logPath -Append

    $healthOutput = & $python rss_health.py 2>&1
    $healthExitCode = $LASTEXITCODE
    $healthOutput | Tee-Object -FilePath $logPath -Append
    "[$(Get-Date -Format o)] Kết thúc: crawler=$crawlerExitCode, health=$healthExitCode" |
        Tee-Object -FilePath $logPath -Append
} finally {
    Pop-Location
}

if ($crawlerExitCode -ne 0) {
    exit $crawlerExitCode
}
exit $healthExitCode
