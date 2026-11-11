import React from 'react';
import { Terminal, ChevronRight } from 'lucide-react';
import type { CoPilotSlashCommand } from '../types/copilot.types';

interface CoPilotCommandsDropdownProps {
  commands: CoPilotSlashCommand[];
  onSelectCommand: (cmd: CoPilotSlashCommand) => void;
}

export const CoPilotCommandsDropdown: React.FC<CoPilotCommandsDropdownProps> = ({
  commands,
  onSelectCommand
}) => {
  return (
    <div className="mx-4 mb-2 p-2 rounded-xl bg-slate-900/95 border border-cyan-800/80 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
      <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1 flex items-center justify-between">
        <span>Slash Commands Khả Dụng</span>
        <Terminal className="w-3 h-3 text-cyan-400" />
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {commands.map(cmd => (
          <button
            key={cmd.command}
            type="button"
            onClick={() => onSelectCommand(cmd)}
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
  );
};

