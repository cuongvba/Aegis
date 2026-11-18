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
};

export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[_*#`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakKidText(rawText: string, langOrBcp47: string = 'vi'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const text = cleanTextForSpeech(rawText);
  if (!text) return;

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    // Support unbounded BCP-47 tags directly from DB (e.g., "th-TH", "de-DE", "ar-SA")
    utter.lang = langOrBcp47.includes('-') ? langOrBcp47 : (LANG_VOICE_MAP[langOrBcp47] || langOrBcp47 || 'en-US');
    utter.rate = 0.96;
    utter.pitch = 1.12;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore browser speech synthesis blocks
  }
}

export function stopKidSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore
  }
}
