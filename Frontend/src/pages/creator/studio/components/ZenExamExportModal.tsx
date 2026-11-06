import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Download, 
  Archive, 
  X, 
  Loader2, 
  Shuffle, 
  Printer, 
  SlidersHorizontal,
  CheckCircle2,
  Building2,
  GraduationCap
} from 'lucide-react';
import api from '@/services/api';

export interface ZenExamExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: any[];
  defaultTitle?: string;
  defaultSubject?: string;
}

export const ZenExamExportModal: React.FC<ZenExamExportModalProps> = ({
  isOpen,
  onClose,
  questions,
  defaultTitle = 'ĐỀ KHẢO SÁT CHẤT LƯỢNG HỌC KỲ',
  defaultSubject = 'MÔN: TOÁN HỌC'
}) => {
  const { t } = useTranslation('creator');
  const [ministryName, setMinistryName] = useState('SỞ GIÁO DỤC VÀ ĐÀO TẠO');
  const [schoolName, setSchoolName] = useState('TRƯỜNG THPT CHUYÊN');
  const [examTitle, setExamTitle] = useState(defaultTitle);
  const [subjectName, setSubjectName] = useState(defaultSubject);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [academicYear, setAcademicYear] = useState('2025 - 2026');
  const [examCodePrefix, setExamCodePrefix] = useState('10');
  const [variantCount, setVariantCount] = useState<number>(4);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeSolutions, setIncludeSolutions] = useState(true);
  const [includeMatrix, setIncludeMatrix] = useState(true);
  const [includeOmr, setIncludeOmr] = useState(true);

  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  useEffect(() => {
    if (defaultTitle) setExamTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    if (defaultSubject) setSubjectName(defaultSubject);
  }, [defaultSubject]);

  if (!isOpen) return null;

  const buildPayload = () => ({
    examTitle,
    ministryOrDepartmentName: ministryName,
    schoolOrOrgName: schoolName,
    subjectName,
    durationMinutes: Number(durationMinutes) || 90,
    academicYear,
    examCodePrefix,
    variantCount: Number(variantCount) || 1,
    includeAnswerKey,
    includeDetailedSolutions: includeSolutions,
    includeSpecificationMatrix: includeMatrix,
    includeOmrAnswerSheet: includeOmr,
    targetStandard: 'THPT_2025',
    questions: questions.map(q => ({
      content: q.content,
      questionType: q.questionType || 'SINGLE',
      options: q.options || [],
      suggestedAnswer: q.suggestedAnswer || q.correctAnswer,
      aiExplanation: q.aiExplanation || q.explanation,
      contextTitle: q.contextTitle,
      contextContent: q.contextContent,
      topicCode: q.topicCode,
      topicName: q.topicName,
      difficulty: q.difficulty || 2,
      subItems: q.subItems
    }))
  });

  // Xuất 1 file Word .docx
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const payload = buildPayload();
      const response = await api.post('/api/creator/studio/export/docx', payload, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DeThi_${subjectName.replace(/\s+/g, '_')}_MaDe_${examCodePrefix}1.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export Docx error:', err);
      alert('Không thể xuất file Word đề thi: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Trộn đa mã đề & xuất trọn bộ hồ sơ ZIP
  const handleExportZipPackage = async () => {
    setIsExportingZip(true);
    try {
      const payload = buildPayload();
      const response = await api.post('/api/creator/studio/export/package-zip', payload, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HoSo_KhaoThi_${subjectName.replace(/\s+/g, '_')}_${variantCount}MaDe.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export ZIP error:', err);
      alert('Không thể xuất trọn bộ hồ sơ ZIP: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsExportingZip(false);
    }
  };

  // Mở phiếu tô OMR chuẩn A4
  const handlePreviewOmrSheet = async () => {
    try {
      const payload = buildPayload();
      const response = await api.post('/api/creator/studio/export/omr-sheet', payload, {
        responseType: 'text'
      });
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(response.data);
        win.document.close();
      }
    } catch (err: any) {
      alert('Không thể tạo phiếu tô OMR.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Xuất Bản Hồ Sơ Đề Thi Chuẩn Quốc Gia
              </h3>
              <p className="text-xs text-slate-400">
                Tạo file Word (.docx), trộn đa mã đề, ma trận đặc tả & phiếu tô OMR nộp trường
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin cơ quan & Kỳ thi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sở GD&ĐT / Cơ quan chủ quản:</span>
            </label>
            <input
              value={ministryName}
              onChange={e => setMinistryName(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trường / Đơn vị khảo thí:</span>
            </label>
            <input
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tên bài thi / Kỳ thi:</label>
            <input
              value={examTitle}
              onChange={e => setExamTitle(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Môn thi & Lớp:</label>
            <input
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-slate-300 font-semibold mb-1">Thời gian (phút):</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
              />
            </div>
            <div className="flex-1">
              <label className="block text-slate-300 font-semibold mb-1">Năm học:</label>
              <input
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-slate-300 font-semibold mb-1">Số mã đề cần trộn:</label>
              <select
                value={variantCount}
                onChange={e => setVariantCount(Number(e.target.value))}
                className="w-full h-8 px-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
              >
                <option value={1}>1 mã đề (Giữ nguyên gốc)</option>
                <option value={2}>2 mã đề hoán vị</option>
                <option value={4}>4 mã đề chuẩn Bộ GD&ĐT</option>
                <option value={8}>8 mã đề kỳ thi lớn</option>
              </select>
            </div>
            <div className="w-24">
              <label className="block text-slate-300 font-semibold mb-1">Đầu số:</label>
              <input
                value={examCodePrefix}
                onChange={e => setExamCodePrefix(e.target.value)}
                placeholder="10 -> 101"
                className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-center font-mono"
              />
            </div>
          </div>
        </div>

        {/* Các tùy chọn đóng gói tài liệu */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Thành phần hồ sơ khảo thí tự động đóng gói:</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeAnswerKey} onChange={e => setIncludeAnswerKey(e.target.checked)} className="rounded border-slate-700" />
              <span>Bảng đáp án nhanh ở cuối đề thi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeSolutions} onChange={e => setIncludeSolutions(e.target.checked)} className="rounded border-slate-700" />
              <span>Hướng dẫn giải chi tiết & Biểu điểm</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeMatrix} onChange={e => setIncludeMatrix(e.target.checked)} className="rounded border-slate-700" />
              <span>Ma trận & Bản đặc tả Bloom đề thi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeOmr} onChange={e => setIncludeOmr(e.target.checked)} className="rounded border-slate-700" />
              <span>Phiếu tô trắc nghiệm quang học OMR A4</span>
            </label>
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handlePreviewOmrSheet}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Xem & In Phiếu Tô OMR</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isExportingDocx || isExportingZip}
              onClick={handleExportDocx}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isExportingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>Tải File Word (.docx)</span>
            </button>

            <button
              type="button"
              disabled={isExportingDocx || isExportingZip}
              onClick={handleExportZipPackage}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isExportingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              <span>Trộn Đề & Tải Trọn Bộ (.zip)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ZenExamExportModal;
