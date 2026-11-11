import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { CoPilotMessage, CoPilotArtifact } from '../types/copilot.types';
import { CognitiveTraceViewer } from './CognitiveTraceViewer';
import { ToolActionPill } from './ToolActionPill';
import { ArtifactCardRenderer } from './ArtifactCardRenderer';
import { MathRenderer } from '@/components/common/MathRenderer';

interface CoPilotMessageItemProps {
  msg: CoPilotMessage;
  onApplyArtifact?: (artifact: CoPilotArtifact) => void;
  onSendAction: (action: string) => void;
}

export const CoPilotMessageItem: React.FC<CoPilotMessageItemProps> = ({
  msg,
  onApplyArtifact,
  onSendAction
}) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Header Info */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1">
        <span className="font-semibold text-slate-400">{isUser ? 'Bạn' : 'Aegis Co-Pilot'}</span>
        <span>•</span>
        <span>{msg.timestamp}</span>
        {msg.modelUsed && (
          <>
            <span>•</span>
            <span className="font-mono text-cyan-400/80">{msg.modelUsed}</span>
          </>
        )}
        {msg.keySourceUsed && (
          <>
            <span>•</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                msg.keySourceUsed === 'UserBYOK'
                  ? 'bg-blue-950 text-blue-300 border-blue-700/60'
                  : msg.keySourceUsed === 'TenantBYOK'
                  ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {msg.keySourceUsed === 'UserBYOK'
                ? '👤 User BYOK'
                : msg.keySourceUsed === 'TenantBYOK'
                ? '🏢 Tenant BYOK'
                : '🌐 System'}
            </span>
          </>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[92%] shadow-md transition-all ${
          isUser
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
        }`}
      >
        {/* Cognitive Trace (Thinking...) */}
        {msg.thoughtTrace && <CognitiveTraceViewer thoughtTrace={msg.thoughtTrace} />}

        {/* Action Pills */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 my-2">
            {msg.toolCalls.map((t, idx) => (
              <ToolActionPill key={idx} tool={t} />
            ))}
          </div>
        )}

        {/* Content body rendered via KaTeX + Markdown */}
        <div className="select-text font-normal text-slate-100 py-1 space-y-1">
          {msg.content ? (
            <MathRenderer content={msg.content} />
          ) : !msg.artifact ? (
            <span className="text-slate-500 italic">Đang tổng hợp nội dung nhận thức...</span>
          ) : null}
        </div>

        {/* Interactive Artifact Card */}
        {msg.artifact && (
          <ArtifactCardRenderer artifact={msg.artifact} onApply={onApplyArtifact} />
        )}
      </div>

      {/* Suggested Actions Chips */}
      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[92%]">
          {msg.suggestedActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendAction(action)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-900/60 hover:border-cyan-500/50 transition-colors shadow-sm cursor-pointer"
            >
              <span>{action}</span>
              <ArrowUpRight className="w-2.5 h-2.5 opacity-70" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

