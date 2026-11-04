import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle2, Database, FolderTree, ExternalLink } from 'lucide-react';
import { ZenBankSaveResult } from '../types/zen-studio.types';

interface ZenPureBankSuccessModalProps {
  result: ZenBankSaveResult | null;
  onClose: () => void;
}

export const ZenPureBankSuccessModal: React.FC<ZenPureBankSuccessModalProps> = ({ result, onClose }) => {
  const { t } = useTranslation('creator');
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 md:p-8 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          Đã Lưu Vào Ngân Hàng Tri Thức Vĩnh Viễn!
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Tài sản đề thi đã được mã hóa và bảo tồn an toàn trong kho dữ liệu cá nhân của Thầy/Cô.
        </p>

        <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs mb-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Mã Đề Thi (Topic Code):</span>
            <span className="font-mono font-bold text-emerald-400">{result.topicCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Số Lượng Câu Hỏi Đã Lưu:</span>
            <span className="font-bold text-white">{result.questionCount} câu</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Cơ Chế Lưu Trữ:</span>
            <span className="font-medium text-cyan-400">Deduplication CAS + COW</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/admin/questions"
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Ngân Hàng Câu Hỏi</span>
            </a>
            <a
              href="/admin/topics"
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              <FolderTree className="w-4 h-4 text-amber-400" />
              <span>Cây Chủ Đề</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            Tiếp Tục Soạn Đề
          </button>
        </div>
      </div>
    </div>
  );
};
