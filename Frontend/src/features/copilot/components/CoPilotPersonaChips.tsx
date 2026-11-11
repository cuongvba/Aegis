import React from 'react';
import { Sparkles, GraduationCap, ShieldAlert, BookOpen } from 'lucide-react';
import type { CoPilotPersona } from '../types/copilot.types';

interface CoPilotPersonaChipsProps {
  currentPersona: CoPilotPersona;
  onSelectPersona: (persona: CoPilotPersona) => void;
}

const PERSONAS = [
  { id: 'AssessmentArchitect', label: 'Khảo Thí', icon: Sparkles, color: 'bg-cyan-600' },
  { id: 'SocraticMentor', label: 'Gia Sư', icon: GraduationCap, color: 'bg-emerald-600' },
  { id: 'GovernanceFinOps', label: 'Quản Trị', icon: ShieldAlert, color: 'bg-amber-600' },
  { id: 'ResearchScholar', label: 'Hội Thảo', icon: BookOpen, color: 'bg-purple-600' }
] as const;

export const CoPilotPersonaChips: React.FC<CoPilotPersonaChipsProps> = ({
  currentPersona,
  onSelectPersona
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
      {PERSONAS.map(p => {
        const Icon = p.icon;
        const active = currentPersona === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPersona(p.id as CoPilotPersona)}
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
  );
};

