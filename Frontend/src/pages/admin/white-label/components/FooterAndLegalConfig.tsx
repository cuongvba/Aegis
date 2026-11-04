import React from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Phone, Mail } from 'lucide-react';
import type { WhiteLabelConfig } from '../hooks/useWhiteLabelTheme';

interface FooterAndLegalConfigProps {
  config: WhiteLabelConfig;
  onUpdate: (partial: Partial<WhiteLabelConfig>) => void;
}

export const FooterAndLegalConfig: React.FC<FooterAndLegalConfigProps> = ({ config, onUpdate }) => {
  const { t } = useTranslation('white_label');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-black uppercase text-white tracking-wider">
            {t('legalFooterTitle', '4. Pháp Lý Chân Trang & Kênh Hỗ Trợ')}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
          Touchpoints & Legal
        </span>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">
          {t('copyrightLabel', 'Dòng thông báo Bản quyền (Copyright Notice)')}
        </label>
        <input
          type="text"
          value={config.copyrightText}
          onChange={(e) => onUpdate({ copyrightText: e.target.value })}
          placeholder="© 2026 Ngân hàng NN&PTNT Việt Nam (Agribank). Bảo lưu mọi quyền."
          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
            <Phone size={13} className="text-emerald-400" />
            <span>{t('supportHotline', 'Hotline hỗ trợ kỹ thuật')}</span>
          </label>
          <input
            type="text"
            value={config.supportHotline}
            onChange={(e) => onUpdate({ supportHotline: e.target.value })}
            placeholder="1900 558818 / (024) 3868xxxx"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
            <Mail size={13} className="text-blue-400" />
            <span>{t('supportEmail', 'Email tiếp nhận phản hồi')}</span>
          </label>
          <input
            type="email"
            value={config.supportEmail}
            onChange={(e) => onUpdate({ supportEmail: e.target.value })}
            placeholder="hotro-sathach@agribank.com.vn"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

