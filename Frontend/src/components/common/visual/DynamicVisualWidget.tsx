import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sliders, Sparkles, Play, Pause, RotateCcw, Clock, Volume2, VolumeX, Mic, Camera } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import type { DynamicVisualSpec } from './visual-types';
import { FunctionPlotCanvas } from './FunctionPlotCanvas';
import { Geometry3dCanvas } from './Geometry3dCanvas';
import { PhysicsCollisionCanvas } from './PhysicsCollisionCanvas';
import { visualAudioEngine } from './visualAudioEngine';

interface DynamicVisualWidgetProps {
  spec: DynamicVisualSpec;
  className?: string;
  fullWidth?: boolean;
}

export const DynamicVisualWidget: React.FC<DynamicVisualWidgetProps> = ({
  spec,
  className = '',
  fullWidth = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    spec.parameters?.forEach((p) => {
      initial[p.name] = p.value;
    });
    return initial;
  });

  useEffect(() => {
    const next: Record<string, number> = {};
    spec.parameters?.forEach((p) => {
      next[p.name] = p.value;
    });
    setParamValues(next);
  }, [spec]);

  const hasTimeAxis = useMemo(
    () =>
      Boolean(spec.timeConfig) ||
      Boolean(spec.parametric) ||
      Boolean(spec.animateParam) ||
      /\bt\b/.test(spec.fn || ''),
    [spec.timeConfig, spec.parametric, spec.animateParam, spec.fn]
  );

  const tMin = spec.timeConfig?.min ?? 0;
  const tMax = spec.timeConfig?.max ?? 10;
  const tStep = spec.timeConfig?.step ?? 0.05;
  const tBaseSpeed = spec.timeConfig?.speed ?? 1.5;

  const [timeValue, setTimeValue] = useState<number>(tMin);
  const [isPlaying, setIsPlaying] = useState<boolean>(Boolean(spec.timeConfig?.autoPlay));
  const [speedMult, setSpeedMult] = useState<number>(1);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [voiceOn, setVoiceOn] = useState<boolean>(false);
  const lastFrameRef = useRef<number | null>(null);
  const lastMorphRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeValue(tMin);
    setIsPlaying(Boolean(spec.timeConfig?.autoPlay));
  }, [spec.title, tMin, spec.timeConfig?.autoPlay]);

  useEffect(() => {
    if (!isPlaying || !hasTimeAxis) {
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      if (lastFrameRef.current !== null) {
        const dt = (now - lastFrameRef.current) / 1000;
        const delta = dt * tBaseSpeed * speedMult;
        setTimeValue((prev) => {
          const next = prev + delta;
          if (next >= tMax) {
            if (spec.timeConfig?.loop !== false) return tMin;
            setIsPlaying(false);
            return tMax;
          }
          return Number(next.toFixed(3));
        });
      }
      lastFrameRef.current = now;
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying, hasTimeAxis, tBaseSpeed, speedMult, tMin, tMax, spec.timeConfig?.loop]);

  const effectiveParams = useMemo(() => {
    const base: Record<string, number> = {};
    spec.parameters?.forEach((p) => {
      base[p.name] = paramValues[p.name] ?? p.value;
    });
    if (spec.animateParam) {
      base[spec.animateParam] = timeValue;
    }
    return base;
  }, [paramValues, spec.parameters, spec.animateParam, timeValue]);

  const activeMorphStep = useMemo(() => {
    if (!spec.morphSteps || spec.morphSteps.length === 0) return null;
    const sorted = [...spec.morphSteps].sort((a, b) => a.timeAt - b.timeAt);
    return sorted.filter((s) => s.timeAt <= timeValue).pop() || sorted[0];
  }, [spec.morphSteps, timeValue]);

  useEffect(() => {
    if (!activeMorphStep) return;
    if (lastMorphRef.current !== null && lastMorphRef.current !== activeMorphStep.timeAt) {
      if (soundOn) visualAudioEngine.playPhaseChime();
      if (voiceOn && activeMorphStep.note) visualAudioEngine.speakNote(activeMorphStep.note);
    }
    lastMorphRef.current = activeMorphStep.timeAt;
  }, [activeMorphStep, soundOn, voiceOn]);

  useEffect(() => () => visualAudioEngine.stopAllVoice(), []);

  const handleExportPng = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(spec.title || 'aegis-visual-lab').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    a.click();
  };

  return (
    <div
      ref={containerRef}
      className={`my-4 p-4 rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl ${
        fullWidth ? 'w-full max-w-4xl' : 'max-w-lg'
      } mx-auto ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles size={15} />
          </div>
          <h4 className="text-xs sm:text-sm font-extrabold text-white line-clamp-1">
            {spec.title || 'Mô Hình Trực Quan Tương Tác (ADVS 60fps)'}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPng}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition"
            title="Lưu ảnh đồ thị PNG"
          >
            <Camera size={11} /> PNG
          </button>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
            {spec.type === 'geometry_3d' ? '3D Geometry' : spec.type === 'geogebra_embed' ? 'GeoGebra' : hasTimeAxis ? '60fps Time-Morph' : 'Dynamic Graph'}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        {spec.type === 'function_plot' && (
          <FunctionPlotCanvas spec={spec} paramValues={effectiveParams} timeValue={timeValue} />
        )}
        {spec.type === 'geometry_3d' && <Geometry3dCanvas spec={spec} />}
        {spec.type === 'physics_collision' && <PhysicsCollisionCanvas spec={spec} />}
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

      {hasTimeAxis && spec.type === 'function_plot' && (
        <div className="mt-3 p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
              <Clock size={13} />
              <span>{spec.timeConfig?.label || (spec.animateParam ? `Biến thiên ${spec.animateParam}` : 'Trục thời gian t')} = {timeValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = !isPlaying;
                  setIsPlaying(next);
                  if (soundOn) visualAudioEngine.playToggleClick(next);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition ${
                  isPlaying ? 'bg-rose-600 hover:bg-rose-500' : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                {isPlaying ? 'Tạm dừng' : 'Chạy t'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setTimeValue(tMin);
                  if (soundOn) visualAudioEngine.playToggleClick(false);
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title="Đặt lại t"
              >
                <RotateCcw size={12} />
              </button>
              <button
                type="button"
                onClick={() => setSoundOn((v) => !v)}
                className={`p-1.5 rounded-lg border transition ${
                  soundOn ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title={soundOn ? 'Tắt âm thanh phụ họa' : 'Bật âm thanh phụ họa'}
              >
                {soundOn ? <Volume2 size={12} /> : <VolumeX size={12} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !voiceOn;
                  setVoiceOn(next);
                  if (!next) visualAudioEngine.stopAllVoice();
                  else if (activeMorphStep?.note) visualAudioEngine.speakNote(activeMorphStep.note);
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition ${
                  voiceOn ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Bật/tắt giọng đọc thuyết minh từng pha"
              >
                <Mic size={11} /> Thuyết minh
              </button>
              <select
                value={speedMult}
                onChange={(e) => setSpeedMult(Number(e.target.value))}
                className="rounded-lg bg-slate-800 border border-slate-700 px-1.5 py-1 text-[10px] font-bold text-slate-200"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
          <input
            type="range"
            min={tMin}
            max={tMax}
            step={tStep}
            value={timeValue}
            onChange={(e) => { setIsPlaying(false); setTimeValue(Number(e.target.value)); }}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      )}

      {activeMorphStep && (
        <div className="mt-3 p-3 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-center space-y-1">
          <div className="text-xs sm:text-sm font-bold text-indigo-100">
            <MathRenderer content={`$$${activeMorphStep.latex}$$`} />
          </div>
          {activeMorphStep.note && (
            <div className="text-[11px] text-indigo-300 font-medium">{activeMorphStep.note}</div>
          )}
        </div>
      )}

      {spec.parameters && spec.parameters.length > 0 && (
        <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <Sliders size={13} className="text-amber-400" />
            <span>Thanh Trượt Tham Số Động:</span>
          </div>
          {spec.parameters.map((param) => {
            const currentVal = effectiveParams[param.name] ?? param.value;
            return (
              <div key={param.name} className="flex items-center gap-3 text-xs">
                <span className="font-mono font-bold text-cyan-300 w-20">
                  {param.name} = {Number(currentVal).toFixed(1)}
                </span>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step || 0.1}
                  value={currentVal}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [param.name]: Number(e.target.value) }))}
                  className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            );
          })}
        </div>
      )}

      {spec.caption && (
        <p className="mt-2.5 text-[11px] text-center text-slate-400 italic">{spec.caption}</p>
      )}
    </div>
  );
};
