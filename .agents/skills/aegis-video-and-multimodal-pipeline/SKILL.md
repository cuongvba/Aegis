---
name: aegis-video-and-multimodal-pipeline
description: Browser-Native Video Rendering, Audio Muxing, and V-OS 7D Multimodal Synthesis Skill for AegisGlobal. Use when working on Notebook Video Overview, Visual Lab exports, Kids Voice Neural TTS, or V-OS Sonic Studio.
---

# Aegis Video, Audio-Muxing & V-OS Multimodal Pipeline

Synthesizes `heygen-com/hyperframes` agentic media-rendering discipline with AegisGlobal's client-side Canvas + Web Audio + V-OS 7D engines.

## 1. Client-Side Video Export Architecture (Zero Server FFmpeg)
- **Video Track**: Render deterministic 60fps frames onto an offscreen/preview `<canvas width={960} height={540}>` and capture via `canvas.captureStream(30)`.
- **Audio Track Muxing**: Fetch Neural TTS MP3s from `/api/kids/tts` in parallel, decode via `AudioContext.decodeAudioData()`, route into `MediaStreamAudioDestinationNode`, and combine with video tracks.
- **Codec Priority**: Prefer native MP4 (`video/mp4;codecs=avc1.42E01E,mp4a.40.2`, `video/mp4`) with automatic fallback to `video/webm;codecs=vp9,opus` / `video/webm`, matching the downloaded file extension to the selected MIME type ([`videoOverviewExporter.ts`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/components/notebooks/videoOverviewExporter.ts)).

## 2. V-OS 7D Phonetic-to-AV Grounding
- Ground all V-OS music/synesthesia compilation in the 3 embedded kernel specs under `Backend/src/Aegis.Application/Resources/VosCore/`:
  - [`V-OS_Core.md.md`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Application/Resources/VosCore/V-OS_Core.md.md)
  - [`V-OS-MAPPING-KERNEL.md`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Application/Resources/VosCore/V-OS-MAPPING-KERNEL.md)
  - [`V-OS_Unified_Infinity_Core.md`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Application/Resources/VosCore/V-OS_Unified_Infinity_Core.md)
- Maintain clean separation between the **7D Acoustic IR** ([`VosPhoneticAnalyzer.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Services/VosPhoneticAnalyzer.cs)) and target transpilers (Suno v5.5/v6+, Google Lyria, Omni Veo, Web Audio Quantum Synth).
