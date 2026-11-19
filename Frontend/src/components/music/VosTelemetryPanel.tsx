import React from 'react';
import type { VosAcousticTelemetryDto } from '@/services/vosMusic.service';

interface Props {
  telemetry: VosAcousticTelemetryDto;
  accentColor?: string;
}

export const VosTelemetryPanel: React.FC<Props> = ({ telemetry, accentColor = '#8b5cf6' }) => {
  const axes = [
    { label: 'Trầm (Huyền/Nặng)', val: Math.min(1, (telemetry.huyenRatio + telemetry.nangRatio) * 1.8) },
    { label: 'Bổng (Sắc/Ngã)', val: Math.min(1, (telemetry.sacRatio + telemetry.ngaRatio) * 1.8) },
    { label: 'Tĩnh (Ngang/Hỏi)', val: Math.min(1, (telemetry.ngangRatio + telemetry.hoiRatio) * 1.6) },
    { label: 'Mở (A/Ă/Â)', val: Math.min(1, telemetry.openVowelARatio * 2.2) },
    { label: 'Tròn/Biến (U/O/Uya)', val: Math.min(1, (telemetry.roundVowelUORatio + telemetry.morphingDiphthongRatio) * 1.8) },
    { label: 'Vang Mũi (M/N/Ng)', val: Math.min(1, telemetry.nasalReverbRatio * 1.6) },
    { label: 'Xung Lực (Tr/Ch/K)', val: Math.min(1, (telemetry.stopAttackRatio + telemetry.hardGateRatio) * 1.5) },
  ];

  const cx = 110;
  const cy = 96;
  const maxR = 68;
  const pts = axes.map((ax, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / axes.length;
    const r = Math.max(10, ax.val * maxR);
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
      <div className="text-xs font-semibold text-violet-300">Radar Phổ Âm 7 Chiều V-OS ({telemetry.totalSyllables} âm tiết)</div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <svg width={220} height={192} viewBox="0 0 220 192" className="shrink-0">
          {[0.33, 0.66, 1].map((s) => (
            <circle key={s} cx={cx} cy={cy} r={maxR * s} fill="none" stroke="#1e293b" strokeWidth={1} />
          ))}
          {axes.map((ax, i) => {
            const angle = -Math.PI / 2 + (i * Math.PI * 2) / axes.length;
            const x2 = cx + Math.cos(angle) * maxR;
            const y2 = cy + Math.sin(angle) * maxR;
            const lx = cx + Math.cos(angle) * (maxR + 14);
            const ly = cy + Math.sin(angle) * (maxR + 14);
            return (
              <g key={ax.label}>
                <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#334155" strokeWidth={1} />
                <text x={lx} y={ly} fill="#94a3b8" fontSize="8" textAnchor="middle" dominantBaseline="middle">
                  {ax.label.split(' ')[0]}
                </text>
              </g>
            );
          })}
          <polygon points={pts} fill={`${accentColor}44`} stroke={accentColor} strokeWidth={2} />
        </svg>

        <div className="grid grid-cols-2 gap-1.5 w-full text-[11px] text-slate-300">
          <div className="p-1.5 rounded bg-slate-900">Ngang: {(telemetry.ngangRatio * 100).toFixed(0)}%</div>
          <div className="p-1.5 rounded bg-slate-900">Huyền: {(telemetry.huyenRatio * 100).toFixed(0)}%</div>
          <div className="p-1.5 rounded bg-slate-900">Sắc: {(telemetry.sacRatio * 100).toFixed(0)}%</div>
          <div className="p-1.5 rounded bg-slate-900">Nặng: {(telemetry.nangRatio * 100).toFixed(0)}%</div>
          <div className="p-1.5 rounded bg-slate-900">Hỏi: {(telemetry.hoiRatio * 100).toFixed(0)}%</div>
          <div className="p-1.5 rounded bg-slate-900">Ngã: {(telemetry.ngaRatio * 100).toFixed(0)}%</div>
          <div className="p-1.5 rounded bg-slate-900">Mũi Reverb: {(telemetry.nasalReverbRatio * 100).toFixed(0)}%</div>
          <div className="p-1.5 rounded bg-slate-900">Dấu (, . ! ?): {telemetry.pauseCommaCount}/{telemetry.dropPeriodCount}/{telemetry.burstExclamationCount}/{telemetry.questionBendCount}</div>
        </div>
      </div>
    </div>
  );
};
