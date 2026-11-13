import React from 'react';
import { BookOpen, CheckCircle2, Clock, AlertCircle, Play, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TeamAssignableTopicNode } from '../hooks/useTeamManagement';

interface StudentClassroomViewProps {
  classNameTitle: string;
  teacherName: string;
  assignedTopics: TeamAssignableTopicNode[];
  onExitPreview?: () => void;
}

export const StudentClassroomView: React.FC<StudentClassroomViewProps> = ({
  classNameTitle,
  teacherName,
  assignedTopics,
  onExitPreview,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner thông báo góc nhìn học sinh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <span>
            {t('studentView.previewBanner', 'Đang hiển thị Góc Nhìn Học Sinh & Tự Học (Mô phỏng trải nghiệm người học)')}
          </span>
        </div>
        {onExitPreview && (
          <button
            type="button"
            onClick={onExitPreview}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
          >
            {t('studentView.exitPreview', 'Thoát Chế Độ Học Sinh')}
          </button>
        )}
      </div>

      {/* Thông tin Lớp học & Trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('studentView.myClass', 'Lớp Học Của Tôi')}</div>
          <div className="text-xl font-black text-white mt-1">{classNameTitle}</div>
          <div className="text-xs text-cyan-400 mt-0.5">{t('studentView.teacher', 'Thầy/Cô')}: {teacherName}</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('studentView.pendingAssignments', 'Bài Tập Cần Hoàn Thành')}</div>
          <div className="text-xl font-black text-amber-400 mt-1">{assignedTopics.length} {t('studentView.assignmentsUnit', 'chuyên đề')}</div>
          <div className="text-xs text-slate-400 mt-0.5">{t('studentView.deadlineNote', 'Nên hoàn thành sớm để giữ chuỗi rèn luyện')}</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('studentView.memoryBox', 'Hộp Ký Ức Ôn Tập (FSRS v5)')}</div>
          <div className="text-xl font-black text-emerald-400 mt-1">100% {t('studentView.readiness', 'Sẵn Sàng')}</div>
          <div className="text-xs text-slate-400 mt-0.5">{t('studentView.remedialReady', 'Hệ thống đã gom câu sai vào bài luyện riêng')}</div>
        </div>
      </div>

      {/* Danh sách bài tập do Thầy/Cô giao */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-cyan-400" />
            <h2 className="text-base font-black text-white">{t('studentView.homeworkList', 'Danh Sách Bài Tập & Đề Thi Thầy/Cô Đã Giao')}</h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">{assignedTopics.length} bài tập</span>
        </div>

        <div className="space-y-3">
          {assignedTopics.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {t('studentView.noAssignments', 'Hiện tại Thầy/Cô chưa giao bài tập mới cho lớp.')}
            </div>
          ) : (
            assignedTopics.map((top, idx) => (
              <div
                key={top.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                      {top.code}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {top.totalQuestionCount} câu hỏi • Thích ứng IRT
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{top.name}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-amber-400" />
                      <span>Hạn nộp: 3 ngày tới</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} className="text-emerald-400" />
                      <span>Trạng thái: Chưa làm</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/practice?topic=${encodeURIComponent(top.code)}`)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Play size={13} />
                  <span>Vào Làm Bài Ngay</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trạm Tự Học Độc Lập & Luyện Tập Cá Nhân */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Tự Học Nâng Cao Cùng Aegis Socratic Co-Pilot</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Luyện tập không giới hạn theo năng lực cá nhân, tự động bù đắp lỗ hổng kiến thức.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/practice')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          Khám Phá Phòng Luyện Thi
        </button>
      </div>
    </div>
  );
};

