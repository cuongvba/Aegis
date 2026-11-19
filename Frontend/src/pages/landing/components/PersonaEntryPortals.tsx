import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, FileCheck2, Shield, Sparkles } from 'lucide-react';

const PORTALS = [
  {
    id: 'enterprise',
    badge: 'B2B • Khảo thí & AI',
    title: 'Aegis Exam & AI Symposium',
    desc: 'Thi thích ứng IRT 3-PL, Hội đồng AI biện chứng 6 pha, bóc tách đề Word/MathType & bảo mật đa khách thuê.',
    to: '/dashboard',
    cta: 'Vào Không Gian Doanh Nghiệp',
    accent: 'from-sky-500/20 to-indigo-500/10 border-sky-500/40 text-sky-300',
    icon: Shield,
  },
  {
    id: 'office',
    badge: 'Văn phòng • OCR • ATTT',
    title: 'Aegis Office & 7z Vault',
    desc: 'Soạn thảo Word/Excel không cần cài MS Office, OCR chuẩn ABBYY, nén PDF, đóng Stamp, khóa AES-256 & Google Drive.',
    to: '/office-studio',
    cta: 'Mở Office Studio',
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
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
    id: 'kids',
    badge: '3–11 tuổi • Offline-First',
    title: 'Aegis Kids Creative Factory',
    desc: 'Sân khấu động 6 lớp, sáng tạo truyện & game đa tập hóa thân Hero, hoạt động 100% không cần Internet.',
    to: '/kids',
    cta: 'Vào Kids Wonderland',
    accent: 'from-amber-500/20 to-rose-500/10 border-amber-500/40 text-amber-300',
    icon: Sparkles,
  },
];

export function PersonaEntryPortals() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="text-center mb-6">
        <span className="text-xs font-black uppercase tracking-widest text-sky-400">4 Cổng Sản Phẩm Chuyên Biệt</span>
        <h2 className="mt-1 text-xl sm:text-2xl font-black text-white">Chọn Không Gian Phù Hợp Với Vai Trò Của Bạn</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
