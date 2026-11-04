// ─── AEGIS EPISTEMIC ANTI-SCRAPING & WATERMARK FORTRESS SERVICE ─────────────
export interface IngestionQuotaStatus {
  dailyUsed: number;
  dailyLimit: number;
  isUnlimited: boolean;
  proExpiryDate?: string;
  isAegisHeartBeneficiary: boolean;
  isQuarantined: boolean;
}

const STORAGE_KEY_QUOTA = 'aegis_ingestion_quota';
const STORAGE_KEY_PRO = 'aegis_teacher_pro_pass';

// Ký tự vô hình (Zero-Width Steganography) để đóng dấu bản quyền nhận thức ẩn
const ZW_SPACE = '\u200B'; // 0
const ZW_NON_JOINER = '\u200C'; // 1
const ZW_JOINER = '\u200D'; // Delimiter

export const antiScrapingGuardService = {
  getQuotaStatus(): IngestionQuotaStatus {
    const today = new Date().toISOString().slice(0, 10);
    let usedToday = 0;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_QUOTA}_${today}`);
      usedToday = raw ? parseInt(raw, 10) : 0;
    } catch {}

    const proPass = this.getProPass();
    const isPro = Boolean(proPass && new Date(proPass.expiryDate) > new Date());
    const isHeart = Boolean(proPass && proPass.isAegisHeart);

    return {
      dailyUsed: usedToday,
      dailyLimit: isPro ? 9999 : 5, // Người thường: 5 đề/ngày, Pro/Cafe: Không giới hạn
      isUnlimited: isPro,
      proExpiryDate: proPass?.expiryDate,
      isAegisHeartBeneficiary: isHeart,
      isQuarantined: usedToday > 15 && !isPro, // Chống bot cào hàng loạt
    };
  },

  incrementDailyUsage(): void {
    const today = new Date().toISOString().slice(0, 10);
    const cur = this.getQuotaStatus().dailyUsed;
    try {
      localStorage.setItem(`${STORAGE_KEY_QUOTA}_${today}`, String(cur + 1));
    } catch {}
  },

  canIngestExam(): { allowed: boolean; reason?: string } {
    const q = this.getQuotaStatus();
    if (q.isQuarantined) {
      return {
        allowed: false,
        reason: 'Hệ thống phát hiện tần suất nạp đề bất thường. Vui lòng xác thực tương tác lớp học hoặc liên hệ bảo trợ sư phạm để mở khóa!',
      };
    }
    if (!q.isUnlimited && q.dailyUsed >= q.dailyLimit) {
      return {
        allowed: false,
        reason: 'Thầy/Cô đã dùng hết hạn mức 5 đề miễn phí hôm nay. Hãy mời nhóm phát triển 1 ly cafe sáng (25k) để mở khóa trọn vẹn 7 ngày không giới hạn nhé!',
      };
    }
    return { allowed: true };
  },

  activateCoffeePass(days: number, isAegisHeart = false): void {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    const pass = {
      activatedAt: new Date().toISOString(),
      expiryDate: expiry.toISOString(),
      isAegisHeart,
    };
    try {
      localStorage.setItem(STORAGE_KEY_PRO, JSON.stringify(pass));
    } catch {}
  },

  getProPass(): { activatedAt: string; expiryDate: string; isAegisHeart?: boolean } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRO);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // ── INVISIBLE WATERMARK: Cấy chữ ký bản quyền ẩn vào văn bản ─────────────────
  injectInvisibleWatermark(text: string, teacherId = 'AegisEducator'): string {
    try {
      const sig = `AEGIS_AUTH:${teacherId}:${new Date().getFullYear()}`;
      // Chuyển chuỗi sang binary bits
      let binary = '';
      for (let i = 0; i < sig.length; i++) {
        binary += sig.charCodeAt(i).toString(2).padStart(8, '0');
      }
      // Mã hóa thành chuỗi zero-width
      const zwStr = binary
        .split('')
        .map((b) => (b === '1' ? ZW_NON_JOINER : ZW_SPACE))
        .join('') + ZW_JOINER;

      // Cấy vào sau dấu chấm hoặc từ đầu tiên
      const firstSpace = text.indexOf(' ');
      if (firstSpace > 0) {
        return text.slice(0, firstSpace) + zwStr + text.slice(firstSpace);
      }
      return zwStr + text;
    } catch {
      return text;
    }
  },

  // Giải mã kiểm tra xem văn bản có bị copy trộm từ Aegis không
  detectWatermark(text: string): { isWatermarked: boolean; signature?: string } {
    try {
      const delimiterIdx = text.indexOf(ZW_JOINER);
      if (delimiterIdx === -1) return { isWatermarked: false };

      const zwPart = text.slice(0, delimiterIdx).replace(/[^\u200B\u200C]/g, '');
      if (!zwPart) return { isWatermarked: false };

      let binary = '';
      for (let i = 0; i < zwPart.length; i++) {
        binary += zwPart[i] === ZW_NON_JOINER ? '1' : '0';
      }

      let decoded = '';
      for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.slice(i, i + 8);
        if (byte.length === 8) decoded += String.fromCharCode(parseInt(byte, 2));
      }

      return {
        isWatermarked: decoded.startsWith('AEGIS_AUTH'),
        signature: decoded,
      };
    } catch {
      return { isWatermarked: false };
    }
  },
};

