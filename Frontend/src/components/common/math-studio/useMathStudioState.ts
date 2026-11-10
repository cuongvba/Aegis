import { useState, useRef, useCallback, useEffect } from 'react';
import katex from 'katex';

export type DisplayMode = 'inline' | 'block' | 'raw';

export interface UseMathStudioStateProps {
  initialLatex?: string;
  defaultMode?: DisplayMode;
  onInsert?: (formattedFormula: string) => void;
  onClose?: () => void;
}

export function useMathStudioState({
  initialLatex = '',
  defaultMode = 'inline',
  onInsert,
  onClose,
}: UseMathStudioStateProps) {
  // Strip enclosing $ or $$ if passed
  const cleanInitial = (str: string) => {
    const trimmed = (str || '').trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length >= 4) {
      return trimmed.slice(2, -2).trim();
    }
    if (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length >= 2) {
      return trimmed.slice(1, -1).trim();
    }
    return trimmed;
  };

  const [latexCode, setLatexCode] = useState(() => cleanInitial(initialLatex));
  const [displayMode, setDisplayMode] = useState<DisplayMode>(defaultMode);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [searchFilter, setSearchFilter] = useState('');
  const [recentFormulas, setRecentFormulas] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('aegis_recent_math_formulas');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveToRecent = useCallback((formula: string) => {
    const trimmed = formula.trim();
    if (!trimmed) return;
    setRecentFormulas(prev => {
      const filtered = prev.filter(f => f !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 12);
      try {
        localStorage.setItem('aegis_recent_math_formulas', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Validate KaTeX in real-time
  useEffect(() => {
    if (!latexCode.trim()) {
      setValidationError(null);
      return;
    }
    try {
      katex.renderToString(latexCode, {
        displayMode: displayMode === 'block',
        throwOnError: true,
      });
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err?.message?.replace(/^KaTeX parse error:\s*/i, '') || 'Cú pháp LaTeX chưa hợp lệ');
    }
  }, [latexCode, displayMode]);

  // Insert formula snippet at cursor
  const insertSnippet = useCallback((snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLatexCode(prev => (prev ? `${prev} ${snippet}` : snippet));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end);

    let insertedText = snippet;
    // If user has selected text and clicks \frac{a}{b}, wrap selected text into numerator if helpful
    if (selectedText && snippet.includes('{a}')) {
      insertedText = snippet.replace('{a}', `{${selectedText}}`);
    } else if (selectedText && snippet.includes('{x}')) {
      insertedText = snippet.replace('{x}', `{${selectedText}}`);
    }

    const nextVal = currentVal.substring(0, start) + insertedText + currentVal.substring(end);
    setLatexCode(nextVal);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + insertedText.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 10);
  }, []);

  // Format final string based on displayMode
  const getFormattedFormula = useCallback(() => {
    const trimmed = latexCode.trim();
    if (!trimmed) return '';
    if (displayMode === 'inline') {
      return `$${trimmed}$`;
    }
    if (displayMode === 'block') {
      return `$$${trimmed}$$`;
    }
    return trimmed;
  }, [latexCode, displayMode]);

  const handleConfirmInsert = useCallback(() => {
    const result = getFormattedFormula();
    if (result && onInsert) {
      saveToRecent(latexCode);
      onInsert(result);
    }
  }, [getFormattedFormula, latexCode, onInsert, saveToRecent]);

  const handleCopy = useCallback(async () => {
    const formatted = getFormattedFormula();
    if (!formatted) return;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [getFormattedFormula]);

  const handleClear = useCallback(() => {
    setLatexCode('');
    textareaRef.current?.focus();
  }, []);

  return {
    latexCode,
    setLatexCode,
    displayMode,
    setDisplayMode,
    validationError,
    copied,
    isFullscreen,
    setIsFullscreen,
    activeTab,
    setActiveTab,
    searchFilter,
    setSearchFilter,
    recentFormulas,
    saveToRecent,
    textareaRef,
    insertSnippet,
    getFormattedFormula,
    handleConfirmInsert,
    handleCopy,
    handleClear,
    onClose,
  };
}

