import React from 'react';
import { Network, Plus, RefreshCw, FileQuestion, Layers, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminTopicsHeaderProps {
  totalTopics: number;
  myTopicsCount: number;
  hasUser: boolean;
  myOnly: boolean;
  setMyOnly: (v: boolean) => void;
  loading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
}

export const AdminTopicsHeader: React.FC<AdminTopicsHeaderProps> = ({
  totalTopics,
  myTopicsCount,
  hasUser,
  myOnly,
  setMyOnly,
  loading,
  onRefresh,
  onOpenAddModal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 pb-1">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Network className="text-amber-400" size={28} />
            <span>Cây Phân Cấp & Chủ Đề Tri Thức</span>
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono text-xs font-semibold">
            {totalTopics} Chủ đề
          </span>
          {hasUser && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-xs font-semibold">
              {myTopicsCount} Do tôi tạo
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
          Quản trị cấu trúc cây phân cấp chủ đề, mã hóa URN và đường dẫn MaterializedPath O(1) an toàn theo quyền hạn.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Scope Filter Switch: Tất cả vs Của tôi */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-xs select-none">
          <button
            type="button"
            onClick={() => setMyOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${!myOnly ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers size={13} />
            <span>Tất cả chủ đề</span>
          </button>
          <button
            type="button"
            onClick={() => setMyOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${myOnly ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <UserCheck size={13} />
            <span>Chủ đề của tôi</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Thêm Chủ Đề Mới</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/questions')}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
        >
          <FileQuestion size={14} className="text-blue-400" />
          <span>Ngân Hàng Câu Hỏi &rarr;</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all cursor-pointer"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-amber-400' : ''} />
        </button>
      </div>
    </div>
  );
};

