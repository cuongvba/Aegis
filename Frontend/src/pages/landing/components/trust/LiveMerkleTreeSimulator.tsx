import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, RefreshCw, Lock, ArrowUp } from 'lucide-react';
import { INITIAL_MERKLE_NODES } from './merkleData';

export const LiveMerkleTreeSimulator: React.FC = () => {
  const { i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi') ?? true;
  const [isTampered, setIsTampered] = useState(false);

  const leaves = INITIAL_MERKLE_NODES.filter(n => n.type === 'leaf');
  const branches = INITIAL_MERKLE_NODES.filter(n => n.type === 'branch');
  const root = INITIAL_MERKLE_NODES.find(n => n.type === 'root')!;

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5">
            <Lock size={12} />
            <span>{isVi ? 'Mô Phỏng Cây Mật Mã Merkle SHA-256' : 'Interactive SHA-256 Merkle Simulator'}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            {isVi ? 'Bằng Chứng Bất Biến & Chống Can Thiệp Kết Quả Thi' : 'Tamper-Proof Immutable Audit Verification'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {isVi
              ? 'Mọi hành vi can thiệp 1 bit dữ liệu bài làm sẽ lập tức phá vỡ băm Merkle Root toàn cục, bị phát hiện trong 0.001ms.'
              : 'Any 1-bit tampering with answers or scores breaks the Merkle Root instantly, alerting auditors in 0.001ms.'}
          </p>
        </div>

        {/* Action Toggle Button */}
        <button
          type="button"
          onClick={() => setIsTampered(prev => !prev)}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
            isTampered
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-lg shadow-rose-500/20 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/20'
          }`}
        >
          {isTampered ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>{isVi ? 'Khôi Phục Chuỗi Mật Mã' : 'Restore Cryptographic Integrity'}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} className="text-amber-400" />
              <span>{isVi ? '⚡ Mô Phỏng Can Thiệp Bài Nộp' : '⚡ Simulate Grade Tampering'}</span>
            </>
          )}
        </button>
      </div>

      {/* Merkle Tree Flow Graph */}
      <div className="py-6 flex flex-col items-center gap-4">
        {/* Tier 3: Merkle Root Node */}
        <div
          className={`w-full max-w-md p-4 rounded-2xl border text-center transition-all ${
            isTampered
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-xl shadow-rose-500/30'
              : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/20'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider">
            {isTampered ? <AlertTriangle size={16} className="text-rose-400" /> : <ShieldCheck size={16} className="text-emerald-400" />}
            <span>{isVi ? root.labelVi : root.labelEn}</span>
          </div>
          <div className="mt-1 font-mono text-xs sm:text-sm font-bold tracking-wider">
            {isTampered ? root.tamperedHash : root.originalHash}
          </div>
          <div className="mt-1 text-[11px] font-medium opacity-80">
            {isTampered
              ? (isVi ? '⛔ PHÁT HIỆN GIAN LẬN: Merkle Root không khớp chuỗi gốc!' : '⛔ FRAUD DETECTED: Merkle Root Mismatch!')
              : (isVi ? '✅ HỢP LỆ: Toàn vẹn 100% — Ký số Merkle đã đối soát' : '✅ VALID: 100% Cryptographically Verified')}
          </div>
        </div>

        <ArrowUp size={18} className={isTampered ? 'text-rose-400 animate-bounce' : 'text-emerald-400'} />

        {/* Tier 2: Intermediate Branch Hashes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {branches.map(branch => {
            const hasError = isTampered && branch.id === 'branch-1';
            return (
              <div
                key={branch.id}
                className={`p-3 rounded-xl border text-center font-mono transition-all text-xs ${
                  hasError
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">
                  {isVi ? branch.labelVi : branch.labelEn}
                </div>
                <div className="font-bold mt-0.5">
                  {hasError ? branch.tamperedHash : branch.originalHash}
                </div>
              </div>
            );
          })}
        </div>

        <ArrowUp size={18} className={isTampered ? 'text-rose-400' : 'text-slate-600'} />

        {/* Tier 1: Leaf Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
          {leaves.map(leaf => {
            const isTargetOfTamper = isTampered && leaf.id === 'leaf-sub';
            return (
              <div
                key={leaf.id}
                className={`p-3 rounded-xl border text-left transition-all text-xs ${
                  isTargetOfTamper
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500 animate-pulse'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold mb-1">
                  <span>{leaf.id}</span>
                  {isTargetOfTamper && <span className="text-rose-400 font-bold">MODIFIED!</span>}
                </div>
                <div className="font-semibold truncate text-[11px] mb-1">
                  {isVi ? leaf.labelVi : leaf.labelEn}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  {isTargetOfTamper ? leaf.tamperedHash : leaf.originalHash}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
