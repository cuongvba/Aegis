import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, ShieldCheck, BrainCircuit, Sparkles, ArrowRight, Home } from 'lucide-react';

const EDITIONS = [
  {
    title: '1. Bình dân Học vụ Số & Di sản Trẻ em',
    subtitle: 'Khai phóng tri thức, học thích ứng IRT/CAT và kể chuyện di sản tương tác 6 lớp.',
    icon: GraduationCap,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
    links: [
      { label: 'Kids Dynamic Studio', path: '/kids' },
      { label: 'Luyện tập Thích ứng', path: '/practice' },
      { label: 'Visual Learning Lab', path: '/visual-lab' },
    ],
  },
  {
    title: '2. Văn phòng Thông minh & Điều hành',
    subtitle: 'Giải phóng giấy tờ thủ công: OCR tài liệu, Sổ việc/KPI Google Calendar & Công văn 7 pha AI.',
    icon: Building2,
    color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-300',
    links: [
      { label: 'Công văn AI Auto-Pilot', path: '/dispatches' },
      { label: 'Sổ Việc & Lịch Google', path: '/work-ledger' },
      { label: 'Office Studio', path: '/office-studio' },
    ],
  },
  {
    title: '3. Khiên Bảo mật ISO/IEC 27001:2022',
    subtitle: 'Dân chủ hóa chuẩn an toàn thông tin: 93 Controls SoA, Rủi ro 5x5, AI CAPA & TOTP 2FA.',
    icon: ShieldCheck,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
    links: [
      { label: 'Mở ISMS Cockpit', path: '/isms' },
    ],
  },
  {
    title: '4. AI Biện chứng & Tri thức Mở Lạc Hồng',
    subtitle: 'Hội đồng phản biện đa tác tử Symposium, Sáng tạo đề thi Zen Studio & Kho học liệu chuẩn hóa.',
    icon: BrainCircuit,
    color: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 text-violet-300',
    links: [
      { label: 'Universal Symposium', path: '/symposium' },
      { label: 'Creator Zen Studio', path: '/creator/studio' },
    ],
  },
];

export const LacHongMissionHubPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-black text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> TINH THẦN LẠC HỒNG • PHỤNG SỰ NHÂN LOẠI
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">AegisGlobal — Trung tâm Điều phối 4 Sứ mệnh Hợp nhất</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Chọn đúng không gian làm việc theo vai trò của bạn để loại bỏ nhiễu, tiết kiệm thời gian và khai thác trọn vẹn sức mạnh Trí tuệ, Giáo dục, Văn phòng & An toàn Thông tin.
            </p>
          </div>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-bold">
            <Home className="w-4 h-4 text-sky-400" /> Trang chính
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EDITIONS.map((ed) => {
            const Icon = ed.icon;
            return (
              <div key={ed.title} className={`rounded-3xl bg-gradient-to-br ${ed.color} border p-5 flex flex-col justify-between gap-4`}>
                <div>
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-6 h-6 shrink-0" />
                    <h2 className="text-base font-black text-white">{ed.title}</h2>
                  </div>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{ed.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ed.links.map((l) => (
                    <button
                      key={l.path}
                      onClick={() => navigate(l.path)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-white/10 px-3.5 py-2 text-xs font-bold text-white transition"
                    >
                      {l.label} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LacHongMissionHubPage;
