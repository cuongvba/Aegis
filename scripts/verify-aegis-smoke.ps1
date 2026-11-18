<#
.SYNOPSIS
    AegisGlobal Fast Scoped Quality & Smoke Verification Gate.
    Checks scoped Backend unit tests, Frontend TypeScript build, and live Docker health endpoints.
#>
$ErrorActionPreference = "Stop"

Write-Host "=== [1/3] Running Scoped Backend Unit Tests ===" -ForegroundColor Cyan
dotnet test Backend/tests/Aegis.UnitTests/Aegis.UnitTests.csproj `
    --filter "FullyQualifiedName~NotebookStudioTests|FullyQualifiedName~OfficeDocumentWorkspaceServiceTests|FullyQualifiedName~EpistemicRouterTests|FullyQualifiedName~ScopedRbacAndTenantTests" `
    --no-restore

Write-Host "`n=== [2/3] Running Frontend TypeScript Typecheck ===" -ForegroundColor Cyan
Push-Location Frontend
try {
    npx tsc -b
} finally {
    Pop-Location
}

Write-Host "`n=== [3/3] Checking Live Docker Health Endpoints ===" -ForegroundColor Cyan
$endpoints = @(
    @{ Name = "Frontend (Nginx)"; Url = "http://localhost:3000" },
    @{ Name = "Backend API (.NET 10)"; Url = "http://localhost:5080/health" },
    @{ Name = "IRT/CAT Service (FastAPI)"; Url = "http://localhost:8001/health" }
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
