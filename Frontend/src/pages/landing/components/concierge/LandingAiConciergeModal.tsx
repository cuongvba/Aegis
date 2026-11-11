import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, X, Sparkles, BookOpen, Clock,
  ArrowRight, ShieldCheck, RefreshCw, MessageSquare
} from 'lucide-react';
import api from '@/services/api';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  ConciergeMessage,
  CONCIERGE_PRESETS_VI,
  CONCIERGE_PRESETS_EN,
  INITIAL_GREETING_VI,
  INITIAL_GREETING_EN
} from './conciergeData';

interface LandingAiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVi: boolean;
}

export const LandingAiConciergeModal: React.FC<LandingAiConciergeModalProps> = ({
  isOpen,
  onClose,
  isVi
}) => {
  const navigate = useNavigate();
  const presets = isVi ? CONCIERGE_PRESETS_VI : CONCIERGE_PRESETS_EN;
  const initialGreeting = isVi ? INITIAL_GREETING_VI : INITIAL_GREETING_EN;

  const [messages, setMessages] = useState<ConciergeMessage[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: initialGreeting,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'Aegis-Concierge-FastPath',
      latencyMs: 1
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: ConciergeMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/api/v1/copilot/docs-qa', {
        question: query,
        language: isVi ? 'vi' : 'en'
      });

      const data = res.data;
      const assistantMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'Xin lỗi, không có câu trả lời phù hợp.',
        sources: data.sources || [],
        latencyMs: data.latencyMs,
        modelUsed: data.modelUsed,
        suggestedFollowUps: data.suggestedFollowUps || [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: isVi
            ? '⚠️ Không thể kết nối tới máy chủ tư vấn. Xin vui lòng thử lại sau giây lát.'
            : '⚠️ Consultation server unavailable. Please try again shortly.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[480px] sm:max-h-[660px] h-full sm:h-[660px] z-50 flex flex-col bg-slate-950/98 border border-cyan-500/40 rounded-none sm:rounded-3xl shadow-2xl shadow-cyan-950/80 backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
            <Bot size={18} className="text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{isVi ? 'Aegis Sovereign Concierge' : 'Aegis Global Concierge'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-cyan-300/80 font-mono">
              {isVi ? 'Tư Vấn Giải Pháp & Kiến Trúc 24/7' : 'Global Architecture & Solutions 24/7'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMessages([messages[0]])}
            title={isVi ? 'Xóa đoạn hội thoại' : 'Reset chat'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Preset Topics Bar */}
      <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {presets.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSendMessage(p.prompt)}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 whitespace-nowrap shrink-0 transition-all cursor-pointer"
          >
            {p.category}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map(m => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                <span>{isUser ? (isVi ? 'Bạn' : 'You') : 'Aegis Concierge'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
                {m.latencyMs !== undefined && (
                  <span className="font-mono text-cyan-400/80">• {m.latencyMs}ms</span>
                )}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[94%] shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-sm'
                }`}
              >
                <div className="space-y-1 select-text">
                  <MathRenderer content={m.content} />
                </div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1 text-[9px] text-cyan-300/80">
                    <span className="text-slate-500 flex items-center gap-1">
                      <ShieldCheck size={10} className="text-cyan-400" /> {isVi ? 'Nguồn:' : 'Source:'}
                    </span>
                    {m.sources.map((s, idx) => (
                      <span key={idx} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up Question Chips */}
              {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[94%]">
                  {m.suggestedFollowUps.map((fu, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(fu)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-900/60 hover:border-cyan-500/60 text-left transition-colors cursor-pointer"
                    >
                      {fu} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/80 border border-cyan-900/40 text-xs text-cyan-300">
            <Sparkles size={14} className="animate-spin text-cyan-400" />
            <span className="animate-pulse">
              {isVi ? 'Đang phân tích tài liệu và cấu hình tổ chức...' : 'Analyzing AGCI documentation & architecture...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/80 shrink-0 space-y-2">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={
              isVi
                ? 'Hỏi về tính năng, bảo mật ngân hàng, tạo đề...'
                : 'Ask about features, banking security, workflows...'
            }
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-all flex items-center justify-center shrink-0 shadow-lg shadow-cyan-600/25 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>{isVi ? 'Tư vấn miễn phí không cần tài khoản' : 'Instant free consultation'}</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/creator/studio');
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isVi ? 'Mở Zen Studio (3 Chạm)' : 'Open Zen Studio'}</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

