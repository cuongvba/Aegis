import React, { useState } from 'react';
import { X, Sparkles, Check, Eye, Compass, Activity, Box, Share2 } from 'lucide-react';
import type { DynamicVisualSpec } from './visual-types';
import { DynamicVisualWidget } from './DynamicVisualWidget';

interface InteractiveVisualStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertVisual: (snippet: string) => void;
}

const PRESET_MODELS: { id: string; label: string; icon: any; spec: DynamicVisualSpec }[] = [
  {
    id: 'cubic_fn',
    label: 'Hàm số bậc ba (y = x³ - 3x + 1)',
    icon: Activity,
    spec: {
      type: 'function_plot',
      title: 'Đồ thị hàm số bậc ba y = x³ - 3x + 1',
      fn: 'x^3 - 3*x + 1',
      xRange: [-3, 3],
      yRange: [-4, 4],
      caption: 'Điểm cực đại (-1, 3) và cực tiểu (1, -1)',
    },
  },
  {
    id: 'rational_fn',
    label: 'Hàm phân thức (y = (2x-1)/(x+1))',
    icon: Activity,
    spec: {
      type: 'function_plot',
      title: 'Đồ thị phân thức y = (2x - 1) / (x + 1)',
      fn: '(2*x - 1) / (x + 1)',
      xRange: [-5, 4],
      yRange: [-6, 6],
      caption: 'Tiệm cận đứng x = -1, tiệm cận ngang y = 2',
    },
  },
  {
    id: 'parabola_param',
    label: 'Parabol có tham số m (y = x² - 2mx + 1)',
    icon: Compass,
    spec: {
      type: 'function_plot',
      title: 'Họ đường cong Parabol y = x² - 2mx + 1',
      fn: 'x^2 - 2*m*x + 1',
      xRange: [-4, 4],
      yRange: [-4, 6],
      parameters: [{ name: 'm', value: 1, min: -3, max: 3, step: 0.5 }],
      caption: 'Kéo thanh trượt tham số m để quan sát quỹ đạo đỉnh',
    },
  },
  {
    id: 'pyramid_s_abcd',
    label: 'Hình chóp S.ABCD (Đáy tứ giác)',
    icon: Box,
    spec: {
      type: 'geometry_3d',
      solid: 'pyramid_s_abcd',
      title: 'Hình chóp S.ABCD (3D xoay 360°)',
      caption: 'Kéo chuột hoặc vuốt để xoay quan sát các mặt bên và đáy',
    },
  },
  {
    id: 'pyramid_s_abc',
    label: 'Hình chóp tam giác S.ABC',
    icon: Box,
    spec: {
      type: 'geometry_3d',
      solid: 'pyramid_s_abc',
      title: 'Hình chóp tam giác S.ABC',
      caption: 'Mô hình khối tứ diện trong không gian',
    },
  },
  {
    id: 'prism_tri',
    label: 'Hình lăng trụ tam giác ABC.A\'B\'C\'',
    icon: Box,
    spec: {
      type: 'geometry_3d',
      solid: 'prism_triangular',
      title: 'Khối lăng trụ đứng ABC.A\'B\'C\'',
      caption: 'Hai mặt đáy song song và các mặt bên là hình chữ nhật',
    },
  },
  {
    id: 'geogebra_sample',
    label: 'Nhúng GeoGebra Applet Quốc Tế',
    icon: Share2,
    spec: {
      type: 'geogebra_embed',
      geogebraId: 'm59vqu4h',
      title: 'Mô hình Dao Động Điều Hòa (GeoGebra)',
      caption: 'Mô hình vật lý tương tác trực tiếp từ kho học liệu GeoGebra',
    },
  },
];

export const InteractiveVisualStudioModal: React.FC<InteractiveVisualStudioModalProps> = ({
  isOpen,
  onClose,
  onInsertVisual,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('cubic_fn');
  const activePreset = PRESET_MODELS.find((p) => p.id === selectedPresetId) || PRESET_MODELS[0];

  if (!isOpen) return null;

  const handleInsert = () => {
    const jsonStr = JSON.stringify(activePreset.spec, null, 2);
    const snippet = `\`\`\`visual\n${jsonStr}\n\`\`\``;
    onInsertVisual(snippet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Compass size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Studio Hình Học Động &amp; Đồ Thị Tương Tác
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ADVS Engine 60fps
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tạo mô hình toán học tương tác trực quan tương tự GeoGebra cho học sinh toàn hệ thống
            </p>
          </div>
        </div>

        {/* Thân Modal 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 overflow-y-auto pr-1 flex-1">
          {/* Cột trái: Danh sách mẫu thiết kế */}
          <div className="md:col-span-2 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Chọn Mẫu Khối Hình / Hàm Số:
            </div>
            {PRESET_MODELS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`w-full text-start p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 text-white border border-cyan-500/50 shadow-md'
                      : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                  <span className="line-clamp-1">{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cột phải: Khung xem trước thời gian thực (Live Preview) */}
          <div className="md:col-span-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye size={13} className="text-cyan-400" />
                <span>Xem Trước Tương Tác Trực Tiếp (60fps Canvas):</span>
              </div>
              <DynamicVisualWidget spec={activePreset.spec} className="my-0" />
            </div>
          </div>
        </div>

        {/* Chân Modal */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800 mt-4 shrink-0">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Mô hình sẽ tự động hiển thị trong Phòng thi, Đấu trường, Mobile PWA và Bài giảng.
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/25 active:scale-95 transition cursor-pointer"
            >
              <Check size={14} />
              <span>Chèn Vào Nội Dung Câu Hỏi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

