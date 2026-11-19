---
name: aegis-webapp-e2e-verifier
description: Disciplined Testing & Live Verification Skill for AegisGlobal (Scoped .NET Unit Tests, TypeScript typecheck, Docker health, and Browser E2E checks). Use after any code change to verify correctness before committing or reporting completion.
---

# Aegis WebApp & Scoped E2E Verifier

Adapts `anthropics/skills` `webapp-testing` discipline to AegisGlobal's **Scoped Testing First** law (`AGENTS.md` Law #8).

## 1. Mandatory Scoped Verification Gate
1. **Backend (Scoped Only)**:
   - Run `dotnet test Backend/tests/Aegis.UnitTests/Aegis.UnitTests.csproj --filter "FullyQualifiedName~<TargetTestClass>" --no-restore`.
   - **STRICT PROHIBITION**: Never run the full `dotnet test` suite without explicit user approval.
2. **Frontend Typecheck**:
   - Run `cd Frontend; npx tsc -b` and require `0` errors.
3. **One-Command Smoke Gate**:
   - Run [`verify-aegis-smoke.ps1`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/scripts/verify-aegis-smoke.ps1) to validate core unit tests, `tsc -b`, and live Docker HTTP 200 contracts across Frontend (`:3000`), Backend (`:5080`), and IRT (`:8001`).

## 2. Live UI & Browser Verification Protocol
- When verifying visual rendering, animations, KaTeX math, Canvas stages, or interactive flows on `http://localhost:3000`:
  - Delegate live browser checks to the `browser` subagent (never `curl` a SPA to claim UI works).
  - Verify zero console errors, zero failed `/api/*` network calls, and accurate layout/pagination.
- After modifying Backend or Frontend files when Docker is running, rebuild only the affected service(s): `docker compose up -d --build backend frontend`.

## 3. Truthful Reporting Gate
- Report only exact test counts, exit codes, and endpoint statuses observed *after* the final edit.
