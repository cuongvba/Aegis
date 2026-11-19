import { latexToSpeech } from './mathToSpeech';

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
const VOICE_RATE_KEY = 'aegis-kids-voice-rate';
const MALE_VOICE_HINTS = ['namminh', 'youth-male', 'kid-boy', 'andrew', 'ryan', 'keita', 'injoon', 'yunxi', 'henri', 'alvaro', 'conrad', 'niwat', 'ardi', 'antonio', 'dmitry', 'hamed'];
const KID_VOICE_HINTS = ['ana', 'kid-girl', 'kid-boy'];

const neuralAudioCache = new Map<string, { url: string; provider: string }>();
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

export function getSelectedKidVoiceRate(): number {
  try {
    const val = Number(localStorage.getItem(VOICE_RATE_KEY));
    return Number.isFinite(val) && val >= 0.7 && val <= 1.4 ? val : 1.0;
  } catch {
    return 1.0;
  }
}

export function setSelectedKidVoiceRate(rate: number): void {
  try {
    const clamped = Math.max(0.7, Math.min(1.4, Number(rate) || 1.0));
    localStorage.setItem(VOICE_RATE_KEY, String(clamped));
  } catch {
    // Ignore storage errors
  }
}

function getBrowserVoicesForLocale(locale: string): KidsVoiceProfile[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const norm = normalizeBcp47(locale).toLowerCase();
  const prefix = norm.split('-')[0];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase() === norm || v.lang.toLowerCase().startsWith(prefix + '-'))
    .slice(0, 6)
    .map((v) => ({
      voiceId: `browser:${v.name}`,
      displayName: `${v.name.replace(/Microsoft |Google |Online \(Natural\) /gi, '')} (Trình duyệt)`,
      localeCode: v.lang,
      gender: 'Neutral',
      persona: 'Browser',
      provider: 'browser-speech',
    }));
}

export async function fetchKidsVoices(locale?: string): Promise<KidsVoiceProfile[]> {
  const targetLocale = normalizeBcp47(locale || 'vi-VN');
  let serverVoices: KidsVoiceProfile[] = [];
  try {
    const res = await fetch(`/api/kids/voices?locale=${encodeURIComponent(targetLocale)}`);
    if (res.ok) {
      serverVoices = (await res.json()) as KidsVoiceProfile[];
    }
  } catch {
    // Ignore network errors
  }
  const browserVoices = getBrowserVoicesForLocale(targetLocale);
  return [...serverVoices, ...browserVoices];
}

export function cleanTextForSpeech(raw: string, langOrBcp47 = 'vi'): string {
  if (!raw) return '';
  const spokenMath = latexToSpeech(raw, langOrBcp47);
  return spokenMath
    .replace(/<[^>]+>/g, ' ')
    .replace(/[_*#`~]/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickBestBrowserVoice(targetBcp47: string, explicitBrowserVoiceName?: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (explicitBrowserVoiceName) {
    const exact = voices.find((v) => v.name === explicitBrowserVoiceName);
    if (exact) return exact;
  }

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

function speakWithBrowserVoice(
  text: string,
  targetBcp47: string,
  rate: number,
  explicitBrowserVoiceName?: string
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = targetBcp47;
    const matchedVoice = pickBestBrowserVoice(targetBcp47, explicitBrowserVoiceName);
    if (matchedVoice) {
      utter.voice = matchedVoice;
    }
    utter.rate = rate;
    utter.pitch = 1.05;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore browser speech synthesis blocks
  }
}

function applyAudioPlaybackSettings(
  audio: HTMLAudioElement,
  rate: number,
  voiceId: string,
  provider: string
): void {
  const lowerVoice = voiceId.toLowerCase();
  const isSingleVoiceFallback = provider === 'google-tts';
  const isMalePersona = MALE_VOICE_HINTS.some((h) => lowerVoice.includes(h));
  const isKidPersona = KID_VOICE_HINTS.some((h) => lowerVoice.includes(h));

  if (isSingleVoiceFallback && isMalePersona) {
    // Warm deeper timbre when single-voice fallback is used for male/heroic persona
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
    audio.playbackRate = Math.max(0.65, Math.min(1.35, rate * 0.88));
  } else if (isSingleVoiceFallback && isKidPersona) {
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
    audio.playbackRate = Math.max(0.75, Math.min(1.45, rate * 1.12));
  } else {
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    audio.playbackRate = rate;
  }
}

export function stopKidSpeech(): void {
  activeQueueToken++;
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

export function speakKidText(
  rawText: string,
  langOrBcp47: string = 'vi',
  explicitVoiceId?: string,
  explicitRate?: number
): void {
  const targetBcp47 = normalizeBcp47(langOrBcp47);
  const text = cleanTextForSpeech(rawText, targetBcp47);
  if (!text) return;

  const voiceId = explicitVoiceId ?? getSelectedKidVoiceId();
  const rate = explicitRate ?? getSelectedKidVoiceRate();

  stopKidSpeech();

  if (voiceId.startsWith('browser:')) {
    speakWithBrowserVoice(text, targetBcp47, rate, voiceId.slice('browser:'.length));
    return;
  }

  const cacheKey = `${targetBcp47}|${voiceId}|${text}`;
  const cached = neuralAudioCache.get(cacheKey);
  if (cached) {
    const audio = new Audio(cached.url);
    applyAudioPlaybackSettings(audio, rate, voiceId, cached.provider);
    activeAudio = audio;
    audio.play().catch(() => speakWithBrowserVoice(text, targetBcp47, rate));
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
        const provider = res.headers.get('X-Aegis-Voice-Provider') || 'google-tts';
        const blob = await res.blob();
        if (blob.size > 0 && !controller.signal.aborted) {
          if (neuralAudioCache.size >= 100) {
            const firstKey = neuralAudioCache.keys().next().value;
            if (firstKey) {
              URL.revokeObjectURL(neuralAudioCache.get(firstKey)!.url);
              neuralAudioCache.delete(firstKey);
            }
          }
          const url = URL.createObjectURL(blob);
          neuralAudioCache.set(cacheKey, { url, provider });
          const audio = new Audio(url);
          applyAudioPlaybackSettings(audio, rate, voiceId, provider);
          activeAudio = audio;
          await audio.play();
          return;
        }
      }
      speakWithBrowserVoice(text, targetBcp47, rate);
    })
    .catch((err) => {
      if (err?.name === 'AbortError') return;
      speakWithBrowserVoice(text, targetBcp47, rate);
    });
}

let activeQueueToken = 0;

export async function speakExamSegments(
  segments: string[],
  langOrBcp47 = 'vi-VN',
  onEnd?: () => void,
): Promise<void> {
  const targetBcp47 = normalizeBcp47(langOrBcp47);
  const cleaned = segments.map((s) => cleanTextForSpeech(s, targetBcp47)).filter(Boolean);
  if (cleaned.length === 0) {
    onEnd?.();
    return;
  }

  stopKidSpeech();
  const token = ++activeQueueToken;
  const voiceId = getSelectedKidVoiceId();
  const rate = getSelectedKidVoiceRate();

  const playOne = async (text: string): Promise<void> => {
    if (token !== activeQueueToken) return;
    if (voiceId.startsWith('browser:')) {
      await new Promise<void>((resolve) => {
        if (!('speechSynthesis' in window)) return resolve();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = targetBcp47;
        utt.rate = rate;
        utt.onend = () => resolve();
        utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
      });
      return;
    }

    try {
      const res = await fetch('/api/kids/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, localeCode: targetBcp47, voiceId: voiceId || undefined }),
      });
      if (token !== activeQueueToken) return;
      if (res.status === 200) {
        const provider = res.headers.get('X-Aegis-Voice-Provider') || 'google-tts';
        const blob = await res.blob();
        if (blob.size > 0 && token === activeQueueToken) {
          const url = URL.createObjectURL(blob);
          await new Promise<void>((resolve) => {
            const audio = new Audio(url);
            applyAudioPlaybackSettings(audio, rate, voiceId, provider);
            activeAudio = audio;
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
          });
          return;
        }
      }
    } catch {
      // Fallback below
    }
    if (token === activeQueueToken && 'speechSynthesis' in window) {
      await new Promise<void>((resolve) => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = targetBcp47;
        utt.rate = rate;
        utt.onend = () => resolve();
        utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
      });
    }
  };

  for (const chunk of cleaned) {
    if (token !== activeQueueToken) break;
    await playOne(chunk);
  }
  if (token === activeQueueToken) onEnd?.();
}
