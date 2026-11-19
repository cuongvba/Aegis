---
name: aegis-epistemic-research-and-docs
description: Anti-Hallucination Epistemic Research & ALDS v1.0 Living Documentation Skill for AegisGlobal. Use when authoring architecture dossiers, upgrading AegisNotebook/Symposium grounding, or updating system documentation.
---

# Aegis Epistemic Research & ALDS v1.0 Documentation

Combines `Imbad0202/academic-research-skills` anti-hallucination rigor with AegisGlobal's **ALDS v1.0** standard ([`AEGIS_LIVING_DOCUMENTATION_STANDARD.md`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/docs/standards/AEGIS_LIVING_DOCUMENTATION_STANDARD.md)).

## 1. Zero-Hallucination Evidence Standard
- **Verify Before Citing**: Every file path, class name, symbol, endpoint, and metric must be directly observed in files or tool output in the current session.
- **Source Grounding**: For AegisNotebook, RAG, and Symposium outputs, enforce explicit `[Nguồn X]` / `[Source X]` provenance links and surface cross-source contradictions rather than smoothing them over.

## 2. The 5 Mandatory ALDS v1.0 Pillars
Every technical or architecture document must include:
1. **Architectural Blueprint**: Mathematical/ontological model + GitHub-flavored Mermaid diagram (`flowchart`, `sequenceDiagram`, `classDiagram`).
2. **Live Code Links**: Clickable `file:///...` links (never plain-text filenames alone).
3. **Quantitative Proof**: Verified test counts, latency/size metrics, and objective gap analysis.
4. **Visual Proof-of-Work**: Links to real browser screenshots under `docs/assets/walkthroughs/`.
5. **Audit Trail**: Version/commit table recording upgrades and verification status.

## 3. SSoT Documentation Index
- Whenever adding a major guide or architecture spec under `docs/`, register it in [`docs/INDEX.md`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/docs/INDEX.md) and update [`AEGIS_GLOBAL_COMPREHENSIVE_EVALUATION_AND_ARCHITECTURE.md`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/docs/AEGIS_GLOBAL_COMPREHENSIVE_EVALUATION_AND_ARCHITECTURE.md) if system capabilities or scores changed.
