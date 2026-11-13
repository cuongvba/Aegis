import React, { useState } from 'react';
import { Sliders, Sparkles, ExternalLink } from 'lucide-react';
import type { DynamicVisualSpec } from './visual-types';
import { FunctionPlotCanvas } from './FunctionPlotCanvas';
import { Geometry3dCanvas } from './Geometry3dCanvas';

interface DynamicVisualWidgetProps {
  spec: DynamicVisualSpec;
  className?: string;
}

export const DynamicVisualWidget: React.FC<DynamicVisualWidgetProps> = ({ spec, className = '' }) => {
  // Trạng thái tham số động cho đồ thị hàm số
  const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    spec.parameters?.forEach((p) => {
      initial[p.name] = p.value;
    });
    return initial;
  });

  const handleParamChange = (name: string, value: number) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`my-4 p-4 rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl max-w-lg mx-auto ${className}`}>
      {/* Tiêu đề & Huy hiệu */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles size={15} />
          </div>
          <h4 className="text-xs sm:text-sm font-extrabold text-white line-clamp-1">
            {spec.title || 'Mô Hình Trực Quan Tương Tác (ADVS 60fps)'}
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
          {spec.type === 'geometry_3d' ? '3D Geometry' : spec.type === 'geogebra_embed' ? 'GeoGebra' : 'Dynamic Graph'}
        </span>
      </div>

      {/* Vùng hiển thị Canvas theo loại mô hình */}
      <div className="flex justify-center">
        {spec.type === 'function_plot' && (
          <FunctionPlotCanvas spec={spec} paramValues={paramValues} />
        )}

        {spec.type === 'geometry_3d' && (
          <Geometry3dCanvas spec={spec} />
        )}

        {spec.type === 'geogebra_embed' && (
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            <iframe
              src={spec.geogebraUrl || `https://www.geogebra.org/material/iframe/id/${spec.geogebraId}/width/480/height/320/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/true/rc/false/ld/false/sdz/false/ctl/false`}
              title={spec.title || 'GeoGebra Applet'}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Thanh điều chỉnh tham số tương tác (Interactive Sliders) */}
      {spec.parameters && spec.parameters.length > 0 && (
        <div className="mt-3.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <Sliders size={13} className="text-amber-400" />
            <span>Thanh Trượt Tham Số Động:</span>
          </div>

          <div className="space-y-2">
            {spec.parameters.map((param) => {
              const currentVal = paramValues[param.name] ?? param.value;
              return (
                <div key={param.name} className="flex items-center gap-3 text-xs">
                  <span className="font-mono font-bold text-cyan-300 w-16">
                    {param.name} = {currentVal}
                  </span>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step || 0.1}
                    value={currentVal}
                    onChange={(e) => handleParamChange(param.name, Number(e.target.value))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="font-mono text-[10px] text-slate-500 w-8 text-right">
                    {param.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chú thích */}
      {spec.caption && (
        <p className="text-[11px] text-slate-400 text-center mt-2.5 italic">
          {spec.caption}
        </p>
      )}
    </div>
  );
};

