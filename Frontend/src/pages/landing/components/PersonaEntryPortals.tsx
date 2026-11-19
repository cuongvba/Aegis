import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, FileCheck2, Film, Shield, ShieldCheck, Sparkles } from 'lucide-react';

const PORTALS = [
  {
    id: 'stem-exam',
    badge: 'MathType WMF • IRT 3-PL • QTI 3.0',
    title: 'STEM Exam & Knowledge AI',
    desc: 'Giải mã Word/PDF công thức Toán–Lý–Hóa phức tạp (MathType nhị phân) thành kho khảo thí KaTeX & thi thích ứng IRT/CAT.',
    to: '/creator/studio',
    cta: 'Mở Creator Zen Studio',
    accent: 'from-sky-500/20 to-indigo-500/10 border-sky-500/40 text-sky-300',
    icon: Shield,
  },
  {
    id: 'visual-lab',
    badge: '60fps Canvas • Video Export',
    title: 'Visual Learning Lab',
    desc: 'Công xưởng bài giảng trực quan sinh động, xuất Video tái sử dụng giúp giáo viên vùng khó khăn giảng dạy không cần Internet.',
    to: '/visual-lab',
    cta: 'Mở Visual Learning Lab',
    accent: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300',
    icon: Film,
  },
  {
    id: 'kids',
    badge: '3–11 tuổi • Offline-First',
    title: 'Aegis Kids Creative Factory',
    desc: 'Sân khấu động 6 lớp, sáng tạo truyện di sản & game đa tập hóa thân Hero, hoạt động 100% không cần Internet.',
    to: '/kids',
    cta: 'Vào Kids Wonderland',
    accent: 'from-amber-500/20 to-rose-500/10 border-amber-500/40 text-amber-300',
    icon: Sparkles,
  },
  {
    id: 'dispatches',
    badge: 'E-Office • AI Auto-Pilot • 2FA',
    title: 'Công Văn 7 Pha & Phê Duyệt',
    desc: 'OCR văn bản → Trình → Bút phê → Phân công tự động → Báo cáo & Chấm KPI, bảo vệ từng công đoạn bằng TOTP 2FA.',
    to: '/dispatches',
    cta: 'Mở Luồng Công Văn',
    accent: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/40 text-indigo-300',
    icon: FileCheck2,
  },
  {
    id: 'ledger',
    badge: 'Tập thể • KPI • Lịch Google',
    title: 'Aegis Smart Work & Ledger OS',
    desc: 'Sổ công việc Kanban/KPI cơ quan, điểm danh, thời khóa biểu, việc tốt, khảo sát tập thể & giao lịch Google Calendar.',
    to: '/work-ledger',
    cta: 'Mở Sổ Công Việc & Lịch',
    accent: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/40 text-violet-300',
    icon: CalendarCheck2,
  },
  {
    id: 'isms',
    badge: 'ISO/IEC 27001:2022 • 93 Controls',
    title: 'Aegis ISMS Security Shield',
    desc: 'Quản trị An toàn Thông tin chuẩn quốc tế: 93 Controls Live Auto-Evidence, Ma trận Rủi ro 5x5, AI CAPA & Niêm phong SHA-256.',
    to: '/isms',
    cta: 'Mở ISMS Cockpit',
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
    icon: ShieldCheck,
  },
];

export function PersonaEntryPortals() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="text-center mb-6">
        <span className="text-xs font-black uppercase tracking-widest text-sky-400">6 Kiệt tác Công nghệ Hợp nhất • Phụng sự Nhân loại</span>
        <h2 className="mt-1 text-xl sm:text-2xl font-black text-white">Chọn Không Gian Phù Hợp Với Sứ Mệnh Của Bạn</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PORTALS.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.id}
              to={p.to}
              className={`group rounded-3xl border bg-gradient-to-br ${p.accent} p-5 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider opacity-90">{p.badge}</span>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-3 text-lg font-black text-white">{p.title}</h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{p.desc}</p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-white group-hover:gap-2.5 transition-all">
                <span>{p.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
