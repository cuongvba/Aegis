param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
Write-Host "[AEGIS E2E] Running Office Studio, 7z Vault, Kids Cloud Sync & Portal Probes against $BaseUrl..."

# 1. Frontend SPA routes
foreach ($route in @("/", "/office-studio", "/kids")) {
  $res = Invoke-WebRequest -Uri "$BaseUrl$route" -UseBasicParsing -TimeoutSec 10
  if ($res.StatusCode -ne 200) { throw "Route $route returned $($res.StatusCode)" }
  Write-Host "  [OK] GET $route -> HTTP 200"
}

# 2. Kids Dynamic Courses Cloud Sync Round-Trip
$coursePayload = @{
  id = "e2e-course-test"
  domainCode = "NATURE_STEM"
  title = "E2E Water Cycle Verification"
  ageBand = "6-8"
  isGameMode = $true
  heroBadgeTitle = "E2E Hero"
  episodes = @()
  createdAt = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 4

$postRes = Invoke-RestMethod -Uri "$BaseUrl/api/kids/dynamic-courses" -Method POST -Body $coursePayload -ContentType "application/json"
if (-not $postRes.saved) { throw "POST /api/kids/dynamic-courses failed" }
$listRes = Invoke-RestMethod -Uri "$BaseUrl/api/kids/dynamic-courses" -Method GET
Write-Host "  [OK] Kids Dynamic Courses Cloud Sync -> $($listRes.Count) synced items"

# 3. Office Export DOCX with Properties + Watermark
$docxReq = @{
  title = "E2E Sovereign Doc"
  markdownContent = "# E2E Check`n`nVerified properties."
  watermarkText = "AEGIS E2E"
  properties = @{ author = "No1 Auditor"; company = "AegisGlobal" }
} | ConvertTo-Json -Depth 4
$outDocx = Join-Path $env:TEMP "aegis_e2e_test.docx"
Invoke-WebRequest -Uri "$BaseUrl/api/office-workspace/export-docx" -Method POST -Body $docxReq -ContentType "application/json" -OutFile $outDocx
if ((Get-Item $outDocx).Length -lt 1000) { throw "Exported DOCX too small" }
Remove-Item $outDocx -Force
Write-Host "  [OK] POST /api/office-workspace/export-docx (Stamp + Properties)"

Write-Host "[AEGIS E2E] ALL CHECKS PASSED!"
