/**
 * Aegis — TrustSection (Landing Page)
 * ==========================================
 * Huy hiệu tin cậy & Kiểm toán Mật mã học SHA-256 Merkle Chain.
 * Thiết kế cho nhóm khách hàng Banking/Enterprise & Quốc gia.
 * FSD Layer: pages/landing/components/
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Lock, ShieldCheck, Layers, Award } from 'lucide-react';
import { TrustMetricsTicker } from './trust/TrustMetricsTicker';
import { LiveMerkleTreeSimulator } from './trust/LiveMerkleTreeSimulator';

const ICONS = [KeyRound, Lock, ShieldCheck, Layers];

interface TrustBadge {
  label: string;
  desc: string;
}

export const TrustSection: React.FC = () => {
  const { t, i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi') ?? true;
  const badges = (t('trust.badges', { returnObjects: true }) as TrustBadge[]) || [
    { label: 'Bảo mật Cấp Ngân Hàng', desc: 'PostgreSQL Row-Level Security 3 tầng' },
    { label: 'Ký số PKI USB Token', desc: 'Tuân thủ Nghị định 130/2018/NĐ-CP' },
    { label: 'Bất biến Merkle Chain', desc: 'Nhật ký thi cử băm SHA-256 chống sửa điểm' },
    { label: 'Hạ tầng Đa Khách thuê', desc: 'Cô lập dữ liệu tuyệt đối giữa các tổ chức' },
  ];

  return (
    <section id="trust-security" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="space-y-3 max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Award size={14} className="text-emerald-400" />
          <span>{isVi ? 'Độ Tin Cậy Mật Mã Học & Kiểm Toán Bất Biến' : 'Cryptographic Integrity & Enterprise Trust'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
          {isVi ? (
            <>Bảo Mật <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Cấp Ngân Hàng</span> & Bằng Chứng <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Merkle Tree</span></>
          ) : (
            <>Bank-Grade Security & <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Merkle Tree Verification</span></>
          )}
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {isVi
            ? 'Không phụ thuộc vào lời hứa của nhà cung cấp. Mọi kết quả khảo thí đều được bảo vệ bởi toán học mật mã SHA-256 và cô lập dữ liệu 3 tầng.'
            : 'Zero reliance on verbal promises. Every assessment result is mathematically secured by SHA-256 Merkle chains and 3-tier data isolation.'}
        </p>
      </div>

      {/* Real-Time Metrics Ticker */}
      <TrustMetricsTicker />

      {/* Interactive Merkle Tree Simulator */}
      <div className="mb-12">
        <LiveMerkleTreeSimulator />
      </div>

      {/* Enterprise Security Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {badges.map((badge, idx) => {
          const Icon = ICONS[idx] ?? ShieldCheck;
          return (
            <div
              key={badge.label}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 text-center flex flex-col items-center gap-2.5 hover:border-emerald-500/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon size={18} aria-hidden="true" />
              </div>
              <p className="text-xs font-black text-white">{badge.label}</p>
              <p className="text-[11px] text-slate-400 leading-snug">{badge.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
export default TrustSection;
