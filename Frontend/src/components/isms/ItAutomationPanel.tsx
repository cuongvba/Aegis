import React, { useState } from 'react';
import { Server, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ismsApi, type IsmsAssetItem } from './ismsApi';

interface Props {
  totpCode: string;
  assets: IsmsAssetItem[];
  onSuccess: (msg: string) => Promise<void>;
}

export const ItAutomationPanel: React.FC<Props> = ({ totpCode, assets, onSuccess }) => {
  const physicalAssets = assets.filter((a) => a.category === 'PHYSICAL');
  const navigate = useNavigate();
  const [visitorName, setVisitorName] = useState('Nguyễn Văn An (IT)');
  const [purpose, setPurpose] = useState('Kiểm tra hệ thống Server & Firewall định kỳ');
  const [temperature, setTemperature] = useState('21°C');
  const [humidity, setHumidity] = useState('50%');
  const [bringDevice, setBringDevice] = useState(true);
  const [deviceSerial, setDeviceSerial] = useState('Laptop Dell Latitude (SN: DL-2026-88)');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [systemName, setSystemName] = useState('Switch Core & UPS');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [eventType, setEventType] = useState<'HANDOVER_INSTALL' | 'MAINTENANCE' | 'GATE_OUT' | 'DISPOSE'>('MAINTENANCE');
  const [svcMode, setSvcMode] = useState('Mang ra ngoài');
  const [targetLoc, setTargetLoc] = useState('Phòng Máy chủ');
  const [busy, setBusy] = useState(false);

  const handleLifecycle = async () => {
    const id = selectedAssetId || physicalAssets[0]?.id;
    if (!id) return;
    setBusy(true);
    try {
      const res = await ismsApi.triggerAssetLifecycle(id, {
        eventType,
        newLocation: targetLoc,
        mode: svcMode,
        performedBy: visitorName,
        totpCode: totpCode.trim() || undefined,
      });
      await onSuccess(
        `Đã cập nhật Vòng đời Tài sản & tự động ghi sổ: ${res.cascade.triggeredLedgers.join(' + ')} (SHA-256: ${String(res.cascade.auditSeal).slice(0, 12)}...)`,
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      const res = await ismsApi.triggerServerRoomVisit({
        visitorName,
        purpose,
        temperature,
        humidity,
        bringDevice,
        deviceNameAndSerial: bringDevice ? deviceSerial : undefined,
        isMaintenance,
        systemName: isMaintenance ? systemName : undefined,
        totpCode: totpCode.trim() || undefined,
      });
      await onSuccess(
        `Đã tự động sinh nhật ký liên hoàn (${res.triggeredLedgers.join(' + ')}) • Mã niêm phong SHA-256: ${String(res.auditSeal).slice(0, 12)}...`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="font-black text-sky-300 flex items-center gap-1.5">
            <Server className="w-4 h-4" /> Check-in Phòng Máy Chủ (Tự động Sinh Nhật ký Liên hoàn 3 Sổ IT)
          </div>
          <p className="text-[11px] text-slate-400">
            1 lần Check-in tự động ghi Sổ Phòng Máy chủ (PMC-01), tự động sinh Phiếu Mang Thiết bị (Mẫu 01/04) nếu có thiết bị, và tự động mở Sổ Bảo trì (BTBH) nếu có bảo dưỡng — đồng thời cập nhật bằng chứng ISO 27001 A.7.1, A.7.2, A.7.5, A.7.9, A.7.13.
          </p>
        </div>
        <button onClick={() => navigate('/work-ledger')} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 font-bold text-white">
          Xem Sổ IT tại /work-ledger <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Họ tên cán bộ vào PMC..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Mục đích vào phòng..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
        <input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="Nhiệt độ (21°C)" className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
        <input value={humidity} onChange={(e) => setHumidity(e.target.value)} placeholder="Độ ẩm (50%)" className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-2">
          <label className="flex items-center gap-2 font-bold text-amber-300 cursor-pointer">
            <input type="checkbox" checked={bringDevice} onChange={(e) => setBringDevice(e.target.checked)} />
            Có mang thiết bị / Laptop / USB vào phòng (Auto sinh Sổ Mẫu 01/04)
          </label>
          {bringDevice && (
            <input value={deviceSerial} onChange={(e) => setDeviceSerial(e.target.value)} placeholder="Tên thiết bị & Số Serial..." className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-white" />
          )}
        </div>

        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-2">
          <label className="flex items-center gap-2 font-bold text-emerald-300 cursor-pointer">
            <input type="checkbox" checked={isMaintenance} onChange={(e) => setIsMaintenance(e.target.checked)} />
            Thực hiện bảo trì / bảo hành tại chỗ (Auto sinh Sổ BTBH01/02)
          </label>
          {isMaintenance && (
            <div className="space-y-1.5">
              {physicalAssets.length > 0 && (
                <select
                  onChange={(e) => e.target.value && setSystemName(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-emerald-200"
                >
                  <option value="">-- Chọn thiết bị từ Danh mục TSCNTT ({physicalAssets.length}) --</option>
                  {physicalAssets.map((a) => (
                    <option key={a.id} value={`${a.assetCode ? `[${a.assetCode}] ` : ''}${a.name}`}>
                      {a.assetCode ? `[${a.assetCode}] ` : ''}{a.name} {a.location ? `(${a.location})` : ''}
                    </option>
                  ))}
                </select>
              )}
              <input value={systemName} onChange={(e) => setSystemName(e.target.value)} placeholder="Tên hệ thống / Thiết bị bảo trì..." className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-white" />
            </div>
          )}
        </div>
      </div>

      <button onClick={() => void handleCheckIn()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-5 py-2.5 font-black text-white disabled:opacity-50">
        <Sparkles className="w-4 h-4" /> {busy ? 'Đang ghi sổ liên hoàn...' : 'Check-in Phòng Máy Chủ & Tự Động Sinh Nhật Ký Liên Hoàn'}
      </button>

      {physicalAssets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5">
          <div className="font-black text-amber-300">Điều phối Vòng đời Tài sản Gốc → Tự động ghi Sổ Giao nhận / Bảo trì / Ra-Vào</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select value={selectedAssetId || physicalAssets[0]?.id} onChange={(e) => setSelectedAssetId(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white">
              {physicalAssets.map((a) => <option key={a.id} value={a.id}>{a.assetCode ? `[${a.assetCode}] ` : ''}{a.name}</option>)}
            </select>
            <select value={eventType} onChange={(e) => setEventType(e.target.value as any)} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-amber-300 font-bold">
              <option value="HANDOVER_INSTALL">Giao nhận & Lắp đặt (Mẫu 02)</option>
              <option value="MAINTENANCE">Bảo trì / Bảo hành (BTBH01/02)</option>
              <option value="GATE_OUT">Mang ra ngoài / Nhập kho (Mẫu 01/04)</option>
              <option value="DISPOSE">Thu hồi / Hủy an toàn (A.7.14)</option>
            </select>
            <select value={svcMode} onChange={(e) => setSvcMode(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white">
              <option value="Tại chỗ">Tại chỗ (Auto PMC nếu ở PMC)</option>
              <option value="Mang ra ngoài">Mang ra ngoài (Auto Mẫu 01/04)</option>
            </select>
            <input value={targetLoc} onChange={(e) => setTargetLoc(e.target.value)} placeholder="Vị trí lắp đặt mới..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
          </div>
          <button onClick={() => void handleLifecycle()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 font-black text-white disabled:opacity-50">
            Thực Thi Vòng Đời Tài Sản & Đồng Bộ Sổ
          </button>
        </div>
      )}
    </div>
  );
};
