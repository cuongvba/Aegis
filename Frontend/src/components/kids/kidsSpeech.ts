const LANG_VOICE_MAP: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-BR',
  ru: 'ru-RU',
  id: 'id-ID',
  th: 'th-TH',
  de: 'de-DE',
  ar: 'ar-SA',
};

const VOICE_PREF_KEY = 'aegis-kids-voice-id';
const neuralAudioCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let activeFetchController: AbortController | null = null;

export interface KidsVoiceProfile {
  voiceId: string;
  displayName: string;
  localeCode: string;
  gender: string;
  persona: string;
  provider: string;
}

export function normalizeBcp47(langOrBcp47: string = 'vi'): string {
  const raw = (langOrBcp47 || 'vi').trim();
  if (raw.includes('-')) return raw;
  return LANG_VOICE_MAP[raw.toLowerCase()] || raw || 'vi-VN';
}

export function getSelectedKidVoiceId(): string {
  try {
    return localStorage.getItem(VOICE_PREF_KEY) || '';
  } catch {
    return '';
  }
}

export function setSelectedKidVoiceId(voiceId: string): void {
  try {
    if (voiceId) localStorage.setItem(VOICE_PREF_KEY, voiceId);
    else localStorage.removeItem(VOICE_PREF_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function fetchKidsVoices(locale?: string): Promise<KidsVoiceProfile[]> {
  try {
    const query = locale ? `?locale=${encodeURIComponent(normalizeBcp47(locale))}` : '';
    const res = await fetch(`/api/kids/voices${query}`);
    if (!res.ok) return [];
    return (await res.json()) as KidsVoiceProfile[];
  } catch {
    return [];
  }
}

export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[_*#`~]/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickBestBrowserVoice(targetBcp47: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const norm = targetBcp47.toLowerCase();
  const prefix = norm.split('-')[0];
  const candidates = voices.filter(
    (v) => v.lang.toLowerCase() === norm || v.lang.toLowerCase().startsWith(prefix + '-')
  );
  if (candidates.length === 0) return null;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    let score = v.lang.toLowerCase() === norm ? 10 : 5;
    const name = v.name.toLowerCase();
    if (name.includes('natural') || name.includes('neural')) score += 20;
    if (name.includes('online')) score += 8;
    if (name.includes('google')) score += 6;
    if (name.includes('hoaimy') || name.includes('namminh') || name.includes('ana')) score += 10;
    return score;
  };

  return [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

function speakWithBrowserVoice(text: string, targetBcp47: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = targetBcp47;
    const matchedVoice = pickBestBrowserVoice(targetBcp47);
    if (matchedVoice) {
      utter.voice = matchedVoice;
    }
    utter.rate = 0.96;
    utter.pitch = 1.08;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore browser speech synthesis blocks
  }
}

export function stopKidSpeech(): void {
  if (activeFetchController) {
    activeFetchController.abort();
    activeFetchController = null;
  }
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export function speakKidText(rawText: string, langOrBcp47: string = 'vi', explicitVoiceId?: string): void {
  const text = cleanTextForSpeech(rawText);
  if (!text) return;

  const targetBcp47 = normalizeBcp47(langOrBcp47);
  const voiceId = explicitVoiceId ?? getSelectedKidVoiceId();
  const cacheKey = `${targetBcp47}|${voiceId}|${text}`;

  stopKidSpeech();

  const cachedUrl = neuralAudioCache.get(cacheKey);
  if (cachedUrl) {
    const audio = new Audio(cachedUrl);
    activeAudio = audio;
    audio.play().catch(() => speakWithBrowserVoice(text, targetBcp47));
    return;
  }

  const controller = new AbortController();
  activeFetchController = controller;

  fetch('/api/kids/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      localeCode: targetBcp47,
      voiceId: voiceId || undefined,
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (controller.signal.aborted) return;
      if (res.status === 200) {
        const blob = await res.blob();
        if (blob.size > 0 && !controller.signal.aborted) {
          if (neuralAudioCache.size >= 100) {
            const firstKey = neuralAudioCache.keys().next().value;
            if (firstKey) {
              URL.revokeObjectURL(neuralAudioCache.get(firstKey)!);
              neuralAudioCache.delete(firstKey);
            }
          }
          const url = URL.createObjectURL(blob);
          neuralAudioCache.set(cacheKey, url);
          const audio = new Audio(url);
          activeAudio = audio;
          await audio.play();
          return;
        }
      }
      speakWithBrowserVoice(text, targetBcp47);
    })
    .catch((err) => {
      if (err?.name === 'AbortError') return;
      speakWithBrowserVoice(text, targetBcp47);
    });
}
