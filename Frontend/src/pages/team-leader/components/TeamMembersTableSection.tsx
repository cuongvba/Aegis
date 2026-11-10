import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  BarChart3,
  Clock,
} from 'lucide-react';
import type { TeamMemberRecord } from '../hooks/useTeamManagement';

interface TeamMembersTableSectionProps {
  members: TeamMemberRecord[];
  activeMembersCount: number;
  onOpenAddMember: () => void;
  onOpenEditMember: (member: TeamMemberRecord) => void;
  onRemoveMember: (member: TeamMemberRecord) => void;
}

export const TeamMembersTableSection: React.FC<TeamMembersTableSectionProps> = ({
  members,
  activeMembersCount,
  onOpenAddMember,
  onOpenEditMember,
  onRemoveMember,
}) => {
  const [search, setSearch] = useState('');

  const filteredMembers = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return members;
    return members.filter(
      (m) =>
        (m.fullName || '').toLowerCase().includes(kw) ||
        (m.email || '').toLowerCase().includes(kw) ||
        (m.phoneNumber || '').toLowerCase().includes(kw)
    );
  }, [members, search]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header & Toolbar */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BarChart3 size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Quản Lý Thành Viên &amp; Tiến Độ Thực Tế ({members.length} thành viên &bull;{' '}
              {activeMembersCount} đã làm bài)
            </h2>
            <p className="text-[11px] text-slate-400">
              Dữ liệu đồng bộ 100% thời gian thực từ tài khoản học viên và lịch sử khảo thí PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, email, SĐT học viên..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>

          <button
            type="button"
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <UserPlus size={14} />
            <span>+ Thêm Học Viên</span>
          </button>
        </div>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <Users size={36} className="mx-auto text-slate-600" />
          <p className="text-sm font-bold text-slate-300">
            {members.length === 0
              ? 'Nhóm / Lớp học hiện chưa có thành viên nào.'
              : 'Không tìm thấy thành viên khớp từ khóa.'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Bấm &ldquo;+ Thêm Học Viên&rdquo; để kết nạp tài khoản học viên có sẵn hoặc khởi tạo học viên mới cho lớp.
          </p>
          <button
            type="button"
            onClick={onOpenAddMember}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Kết Nạp Thành Viên Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {filteredMembers.map((member, index) => {
            const accuracy =
              member.totalQuestions > 0
                ? Math.round((member.correctAnswers / member.totalQuestions) * 100)
                : Math.round(member.avgScore);
            const scoreColor =
              member.avgScore >= 80
                ? 'text-emerald-400'
                : member.avgScore >= 60
                ? 'text-amber-400'
                : member.totalAttempts > 0
                ? 'text-rose-400'
                : 'text-slate-500';
            const barColor =
              member.avgScore >= 80
                ? 'bg-emerald-500'
                : member.avgScore >= 60
                ? 'bg-amber-500'
                : 'bg-rose-500';

            return (
              <div
                key={member.userId}
                className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/30 transition"
              >
                {/* Left: Avatar & Member Identity */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-xs font-mono text-slate-500 w-5 text-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                    {(member.fullName || member.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white truncate">{member.fullName}</p>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                        {member.role}
                      </span>
                      {member.subscriptionTier && member.subscriptionTier !== 'FREE' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                          {member.subscriptionTier}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <Mail size={11} className="text-sky-400" />
                        {member.email}
                      </span>
                      {member.phoneNumber && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <Phone size={11} className="text-amber-400" />
                          {member.phoneNumber}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock size={11} />
                        {member.lastAttemptDate
                          ? `Hoạt động: ${new Date(member.lastAttemptDate).toLocaleDateString('vi-VN')}`
                          : 'Chưa có lượt nộp bài'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Real Progress Stats & Member Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-5">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-300">
                      {member.totalAttempts} lượt làm &bull; {member.correctAnswers}/
                      {member.totalQuestions} câu đúng
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${Math.min(100, accuracy)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{accuracy}%</span>
                    </div>
                  </div>

                  <div className={`text-base font-black font-mono w-16 text-right ${scoreColor}`}>
                    {member.totalAttempts > 0 ? `${member.avgScore.toFixed(1)}%` : '—'}
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                    <button
                      type="button"
                      onClick={() => onOpenEditMember(member)}
                      title="Chỉnh sửa thông tin thành viên"
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member)}
                      title="Xóa thành viên khỏi nhóm"
                      className="p-2 rounded-lg bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

