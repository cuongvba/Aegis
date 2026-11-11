import React, { useState, useEffect, useRef } from 'react';
import {
  Brain, ChevronRight, Maximize2, Minimize2, RefreshCw, Send,
  Sparkles, Terminal, X, GraduationCap, ShieldAlert, BookOpen
} from 'lucide-react';
import type {
  CoPilotPersona, CoPilotMessage, CoPilotSlashCommand,
  CoPilotModelGroup, CoPilotArtifact
} from '../types/copilot.types';
import { CoPilotService } from '../services/copilot.service';
import { CoPilotMessageItem } from './CoPilotMessageItem';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

interface AegisCoPilotSidecarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen?: string;
  onApplyArtifact?: (artifact: CoPilotArtifact) => void;
}

export const AegisCoPilotSidecar: React.FC<AegisCoPilotSidecarProps> = ({
  isOpen,
  onClose,
  currentScreen = 'Dashboard',
  onApplyArtifact
}) => {
  const [persona, setPersona] = useState<CoPilotPersona>('AssessmentArchitect');
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [modelGroups, setModelGroups] = useState<CoPilotModelGroup[]>([]);
  const [commands, setCommands] = useState<CoPilotSlashCommand[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showCommandsDropdown, setShowCommandsDropdown] = useState<boolean>(false);

  const [messages, setMessages] = useState<CoPilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là **Aegis Sovereign Co-Pilot** — trợ lý nhận thức khảo thí & tri thức cá nhân hóa.\n\nBạn có thể ra lệnh siêu tốc bằng các Slash Command:\n* `/soan [chủ đề]`: Thiết kế câu hỏi chuẩn Bloom & IRT 3-PL kèm công thức KaTeX.\n* `/hoithao [chủ đề]`: Triệu tập 9 Viện Hàn Lâm tranh biện đa chiều.\n* `/ma-tran`: Lập ma trận đặc tả đề thi 6 cấp độ nhận thức.\n* `/gia-su`: Hướng dẫn tư duy Socratic không mớm lời giải.',
      suggestedActions: [
        '/soan Toán tài chính lãi suất kép',
        '/hoithao Đạo đức khảo thí AI',
        '/ma-tran Đề thi Kinh tế học 40 câu'
      ],
      modelUsed: 'UniversalAiRouter:Auto',
      keySourceUsed: 'SystemDefault',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    CoPilotService.getGroupedModels().then(data => {
      if (data && data.length > 0) setModelGroups(data);
    });
    CoPilotService.getCommands(persona).then(setCommands);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputMessage.trim().length > 2) {
        CoPilotService.getGroupedModels(inputMessage).then(data => {
          if (data && data.length > 0) setModelGroups(data);
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputMessage]);

  useEffect(() => {
    CoPilotService.getCommands(persona).then(setCommands);
  }, [persona]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);
    setShowCommandsDropdown(val.startsWith('/') && !val.includes(' '));
  };

  const handleSelectCommand = (cmd: CoPilotSlashCommand) => {
    setInputMessage(cmd.command + ' ');
    setShowCommandsDropdown(false);
    inputRef.current?.focus();
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt ?? inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CoPilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setShowCommandsDropdown(false);
    setIsLoading(true);

    try {
      const response = await CoPilotService.sendMessage({
        message: textToSend,
        persona: persona,
        modelCode: selectedModel === 'auto' ? undefined : selectedModel,
        context: { screenName: currentScreen },
        history: messages.slice(-4).map(m => ({ role: m.role, content: m.content }))
      });

      const assistantMsg: CoPilotMessage = {
        id: response.sessionId,
        role: 'assistant',
        content: response.content,
        thoughtTrace: response.thoughtTrace,
        toolCalls: response.toolCalls,
        artifact: response.artifact,
        suggestedActions: response.suggestedActions,
        modelUsed: response.modelUsed,
        keySourceUsed: response.keySourceUsed,
        latencyMs: response.latencyMs,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const serverError = err?.response?.data?.message || err?.message;
      const errorMsg: CoPilotMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ **Không thể kết nối tới mô hình AI đã chọn.**\n\n* **Chi tiết**: \`${serverError || 'Lỗi mạng hoặc không phản hồi'}\`\n* **Giải pháp**: Chọn **'🌟 Miễn phí / Cục bộ'** hoặc kích hoạt các Slash Command sẵn có!`,
        modelUsed: 'WPSE:ResilientFallback',
        suggestedActions: ['/soan Toán tài chính lãi suất kép', '/hoithao Đạo đức khảo thí AI'],
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={`fixed top-0 right-0 h-screen z-50 flex flex-col bg-slate-950/95 text-slate-100 border-l border-cyan-800/50 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-full md:w-[650px]' : 'w-full md:w-[430px]'
      }`}
      aria-label="Aegis Sovereign Co-Pilot Sidecar"
    >
      {/* ── Header ── */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-900/80 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm tracking-wide bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  Aegis Co-Pilot Sovereign
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  Sidecar
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>Ngữ cảnh:</span>
                <span className="text-cyan-300 font-medium">{currentScreen}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Mở rộng'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMessages([messages[0]])}
              title="Xóa phiên làm việc"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng Sidecar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Persona Switcher Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {[
            { id: 'AssessmentArchitect', label: 'Khảo Thí', icon: Sparkles, color: 'bg-cyan-600' },
            { id: 'SocraticMentor', label: 'Gia Sư', icon: GraduationCap, color: 'bg-emerald-600' },
            { id: 'GovernanceFinOps', label: 'Quản Trị', icon: ShieldAlert, color: 'bg-amber-600' },
            { id: 'ResearchScholar', label: 'Hội Thảo', icon: BookOpen, color: 'bg-purple-600' }
          ].map(p => {
            const Icon = p.icon;
            const active = persona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id as CoPilotPersona)}
                className={`px-2.5 py-1 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  active ? `${p.color} text-white shadow-sm` : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages Stream ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.map(msg => (
          <CoPilotMessageItem
            key={msg.id}
            msg={msg}
            onApplyArtifact={onApplyArtifact}
            onSendAction={handleSend}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-cyan-900/40 text-xs text-cyan-300">
            <Brain className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="animate-pulse">Đang phân tích nhận thức & điều phối mô hình...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Slash Commands Autocomplete ── */}
      {showCommandsDropdown && (
        <div className="mx-4 mb-2 p-2 rounded-xl bg-slate-900/95 border border-cyan-800/80 shadow-2xl backdrop-blur-xl">
          <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1 flex items-center justify-between">
            <span>Slash Commands Khả Dụng</span>
            <Terminal className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {commands.map(cmd => (
              <button
                key={cmd.command}
                type="button"
                onClick={() => handleSelectCommand(cmd)}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-mono font-bold text-cyan-300">{cmd.command}</div>
                  <div className="text-[10px] text-slate-400">{cmd.description}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Input & Model Selector Bar ── */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-900/90 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <ModelSelectorDropdown
            selectedModelCode={selectedModel}
            groups={modelGroups}
            onSelectModel={setSelectedModel}
            currentPrompt={inputMessage}
          />
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Phím tắt: Ctrl + J</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Hỏi Co-Pilot hoặc gõ '/' để xem lệnh soạn đề..."
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-all flex items-center justify-center shrink-0 shadow-lg shadow-cyan-600/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
