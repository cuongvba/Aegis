---
name: aegis-performance-and-scale-auditor
description: Principal Systems Performance & Scalability Auditor for AegisGlobal (.NET 10, EF Core, PostgreSQL, Redis, Python FastAPI, React 19). Use when optimizing latency, memory, DB queries, caching, concurrency, or async background processing.
---

# Aegis Performance & Scale Auditor

Enforces sub-10ms API responsiveness, Zero-DB-Hit exam delivery, and bounded resource usage across the 7-container AegisGlobal stack.

## 1. Backend (.NET 10 & EF Core)
- **Read-Only Queries**: Always use `.AsNoTracking()` and tight `.Select(...)` DTO projections on read paths; never materialize full entity graphs unnecessarily.
- **Zero-DB-Hit Hot Paths**: Serve high-concurrency exam sessions from RAM/Redis prewarmed structures ([`ExamFortressPrewarmService.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Services/ExamFortressPrewarmService.cs)).
- **Lock-Free Async Offloading**: Offload long-running batch ingestion, exports, or multi-phase AI jobs onto [`IAegisBackgroundTaskQueue`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Application/Interfaces/IAegisBackgroundTaskQueue.cs) (`System.Threading.Channels`) and return job IDs immediately.
- **External AI Timeout Guards**: Never let slow external LLM providers stall HTTP requests indefinitely; enforce bounded timeouts + deterministic fallbacks (pattern: [`VosMusicService.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Services/VosMusicService.cs)).

## 2. Database & Caching
- **CAS + COW Deduplication**: Hash normalized exam/document payloads (SHA-256) before storing duplicates.
- **Bounded In-Memory Caches**: Every static `ConcurrentDictionary` cache must have an eviction/size cap (e.g., `<= 500` entries) to prevent unbounded container RSS growth.

## 3. Frontend & Network
- **Zero Waterfall**: Parallelize independent API/TTS/asset fetches with `Promise.all` (pattern: [`videoOverviewExporter.ts`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/components/notebooks/videoOverviewExporter.ts)).
- **Build & Chunk Audit**: Verify `npx tsc -b` and `vite build` output for oversized chunks or accidental synchronous imports of heavy libraries.
