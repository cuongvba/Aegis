import React from 'react';
import { PaperExamMetadata } from './paper-editor.types';

interface PaperExamHeaderProps {
  metadata: PaperExamMetadata;
  onChange: (patch: Partial<PaperExamMetadata>) => void;
  isEditable?: boolean;
}

export const PaperExamHeader: React.FC<PaperExamHeaderProps> = ({
  metadata,
  onChange,
  isEditable = true,
}) => {
  return (
    <div className="border-b-2 border-slate-900 pb-4 mb-5 text-slate-900 font-serif select-text">
      {/* Top row: 2 columns */}
      <div className="grid grid-cols-2 gap-4 items-start text-xs sm:text-sm">
        {/* Left Column: Sở & Trường */}
        <div className="text-center space-y-1">
          {isEditable ? (
            <>
              <input
                type="text"
                value={metadata.departmentName}
                onChange={(e) => onChange({ departmentName: e.target.value })}
                className="w-full text-center font-bold uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                placeholder="SỞ GD&ĐT HÀ NỘI / TỈNH THÀNH"
              />
              <input
                type="text"
                value={metadata.schoolName}
                onChange={(e) => onChange({ schoolName: e.target.value })}
                className="w-full text-center font-bold uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                placeholder="TRƯỜNG THPT CHUYÊN..."
              />
            </>
          ) : (
            <>
              <p className="font-bold uppercase tracking-wider">{metadata.departmentName}</p>
              <p className="font-bold uppercase tracking-wider">{metadata.schoolName}</p>
            </>
          )}
          <div className="w-16 h-0.5 bg-slate-900 mx-auto mt-1" />
        </div>

        {/* Right Column: Kỳ thi & Năm học */}
        <div className="text-center space-y-1">
          {isEditable ? (
            <>
              <input
                type="text"
                value={metadata.examTitle}
                onChange={(e) => onChange({ examTitle: e.target.value })}
                className="w-full text-center font-bold uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                placeholder="KỲ THI KHẢO SÁT CHẤT LƯỢNG HỌC KỲ"
              />
              <input
                type="text"
                value={metadata.academicYear}
                onChange={(e) => onChange({ academicYear: e.target.value })}
                className="w-full text-center font-medium bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                placeholder="NĂM HỌC 2025 - 2026"
              />
            </>
          ) : (
            <>
              <p className="font-bold uppercase tracking-wider">{metadata.examTitle}</p>
              <p className="font-medium">{metadata.academicYear}</p>
            </>
          )}
          <div className="w-20 h-0.5 bg-slate-900 mx-auto mt-1" />
        </div>
      </div>

      {/* Middle row: Subject, Duration, Exam Code */}
      <div className="mt-3 text-center space-y-1">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-bold text-sm sm:text-base uppercase">
          <span>MÔN THI:</span>
          {isEditable ? (
            <input
              type="text"
              value={metadata.subjectName}
              onChange={(e) => onChange({ subjectName: e.target.value })}
              className="text-center font-black uppercase text-indigo-950 bg-transparent border-b border-dashed border-slate-400 focus:border-indigo-600 focus:outline-none min-w-[120px]"
              placeholder="TOÁN HỌC"
            />
          ) : (
            <span className="text-indigo-950">{metadata.subjectName}</span>
          )}
          <span>- LỚP {metadata.gradeLevel}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-700 italic">
          <span>Thời gian làm bài:</span>
          {isEditable ? (
            <input
              type="number"
              value={metadata.durationMinutes}
              onChange={(e) => onChange({ durationMinutes: Number(e.target.value) || 50 })}
              className="w-12 text-center font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none"
            />
          ) : (
            <strong>{metadata.durationMinutes}</strong>
          )}
          <span>phút (không kể thời gian phát đề)</span>
          <span className="inline-block px-2 py-0.5 rounded border border-slate-800 font-mono font-bold not-italic text-xs">
            MÃ ĐỀ: {metadata.examCode}
          </span>
        </div>
      </div>

      {/* Bottom row: Student Info Placeholder line */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-800 font-sans gap-2">
        <div className="flex items-center gap-2">
          <span>Họ và tên thí sinh:</span>
          <span className="border-b border-dotted border-slate-600 min-w-[200px] inline-block" />
        </div>
        <div className="flex items-center gap-2">
          <span>Số báo danh:</span>
          <span className="border-b border-dotted border-slate-600 min-w-[100px] inline-block" />
        </div>
      </div>
    </div>
  );
};

