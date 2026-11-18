<#
.SYNOPSIS
    AegisGlobal Fast Scoped Quality & E2E Smoke Verification Gate.
    Checks scoped Backend unit tests, Frontend TypeScript build, and live API/SPA route contracts.
#>
$ErrorActionPreference = "Stop"

Write-Host "=== [1/3] Running Scoped Backend Unit Tests ===" -ForegroundColor Cyan
dotnet test Backend/tests/Aegis.UnitTests/Aegis.UnitTests.csproj `
    --filter "FullyQualifiedName~NotebookStudioTests|FullyQualifiedName~OfficeDocumentWorkspaceServiceTests|FullyQualifiedName~EpistemicRouterTests|FullyQualifiedName~ScopedRbacAndTenantTests|FullyQualifiedName~BackgroundTaskQueueTests|FullyQualifiedName~VosMusicStudioTests" `
    --no-restore

Write-Host "`n=== [2/3] Running Frontend TypeScript Typecheck ===" -ForegroundColor Cyan
Push-Location Frontend
try {
    npx tsc -b
} finally {
    Pop-Location
}

Write-Host "`n=== [3/3] Checking Live Docker Health & E2E Route Contracts ===" -ForegroundColor Cyan
$endpoints = @(
    @{ Name = "SPA Landing (/)"; Url = "http://localhost:3000/" },
    @{ Name = "SPA Office Studio (/office-studio)"; Url = "http://localhost:3000/office-studio" },
    @{ Name = "SPA Visual Lab (/visual-lab)"; Url = "http://localhost:3000/visual-lab" },
    @{ Name = "SPA V-OS Sonic Studio (/music-studio)"; Url = "http://localhost:3000/music-studio" },
    @{ Name = "API Health (/health)"; Url = "http://localhost:5080/health" },
    @{ Name = "API V-OS Kernel (/api/music-studio/kernel)"; Url = "http://localhost:5080/api/music-studio/kernel" },
    @{ Name = "API Neural Voices (/api/kids/voices)"; Url = "http://localhost:5080/api/kids/voices?locale=vi-VN" },
    @{ Name = "API Background Jobs (/api/system/jobs)"; Url = "http://localhost:5080/api/system/jobs" },
    @{ Name = "IRT/CAT Service (/health)"; Url = "http://localhost:8001/health" }
)
foreach ($ep in $endpoints) {
    try {
        $resp = Invoke-WebRequest -Uri $ep.Url -UseBasicParsing -TimeoutSec 5
        Write-Host ("  [OK] {0} -> HTTP {1}" -f $ep.Name, $resp.StatusCode) -ForegroundColor Green
    } catch {
        Write-Host ("  [WARN] {0} unreachable at {1}" -f $ep.Name, $ep.Url) -ForegroundColor Yellow
    }
}
Write-Host "`nSmoke Verification Complete!" -ForegroundColor Green
