import api from '@/services/api';

export interface MathTypeClipboardResponse {
  success: boolean;
  source?: string;
  formulas: string[];
  singleLatex: string | null;
}

/**
 * Trích xuất các khối dữ liệu nhị phân Hex của đối tượng MathType từ luồng text/rtf của Microsoft Word.
 * Mỗi đối tượng MathType trong RTF có khối \wmetafile8 (tương đương 100% với word/media/imageX.wmf trong file .docx)
 * và/hoặc khối \objdata (chứa OLE Equation Native MTEF v5).
 * Ghép cặp "WMF_HEX|OBJDATA_HEX" cho từng phương trình để Backend ưu tiên giải mã WMF chuẩn .docx trước, fallback sang OLE.
 */
export function extractMathTypeRtfHexChunks(rtf: string): string[] {
  if (!rtf || rtf.length < 64) return [];

  const wmfChunks: string[] = [];
  const objDataChunks: string[] = [];

  // 1. Trích xuất khối \wmetafile8 (cho phép các control word kích thước \picw...\pich...\picwgoal... đứng trước chuỗi Hex)
  const wmfRegex = /\\wmetafile\d*(?:\\[a-zA-Z]+-?\d*\s*)*[\s\r\n]+([0-9a-fA-F\s\r\n]{128,})/g;
  let match: RegExpExecArray | null;
  while ((match = wmfRegex.exec(rtf)) !== null) {
    const cleanHex = match[1].replace(/[^0-9a-fA-F]/g, '');
    if (cleanHex.length >= 128) {
      wmfChunks.push(cleanHex);
    }
  }

  // 2. Trích xuất khối \objdata (OLE Equation Native / DSMT)
  const objDataRegex = /\\objdata\b(?:\\[a-zA-Z]+-?\d*\s*)*[\s\r\n]+([0-9a-fA-F\s\r\n]{64,})/g;
  while ((match = objDataRegex.exec(rtf)) !== null) {
    const cleanHex = match[1].replace(/[^0-9a-fA-F]/g, '');
    if (cleanHex.length >= 64) {
      objDataChunks.push(cleanHex);
    }
  }

  if (wmfChunks.length > 0 && objDataChunks.length > 0) {
    const maxLen = Math.max(wmfChunks.length, objDataChunks.length);
    const combined: string[] = [];
    for (let i = 0; i < maxLen; i++) {
      const wmf = wmfChunks[i];
      const obj = objDataChunks[i];
      if (wmf && obj) combined.push(`${wmf}|${obj}`);
      else if (wmf) combined.push(wmf);
      else if (obj) combined.push(obj);
    }
    return combined;
  }

  return wmfChunks.length > 0 ? wmfChunks : objDataChunks;
}

/**
 * Nhận diện dấu vân tay của đối tượng MathType OLE trong luồng text/html từ Microsoft Word
 * (<v:shape ... o:ole="">, file:///.../clip_image001.wmz, Equation.DSMT4).
 */
export function extractWordMathTypeHtmlMetadata(html: string): {
  hasMathTypeOle: boolean;
  localWmzPaths: string[];
} {
  if (!html) return { hasMathTypeOle: false, localWmzPaths: [] };

  const hasOleAttr = /\bo:ole\b/i.test(html) || /Equation\.DSMT/i.test(html);
  const wmzMatches = [...html.matchAll(/src=["'](file:\/\/\/[^"']+\.(?:wmz|wmf|emz))["']/gi)];
  const localWmzPaths = wmzMatches.map(m => m[1]);

  return {
    hasMathTypeOle: hasOleAttr || localWmzPaths.length > 0,
    localWmzPaths,
  };
}

/**
 * Phân tích đặc trưng điểm ảnh (Pixel Distribution Signature) trong < 2ms để phân biệt:
 * - Ảnh chụp công thức toán học / đối tượng MathType rời (Nét mực đen/xám trên nền trắng/trong suốt)
 * - Ảnh minh họa màu / Tranh ảnh hoạt hình / Biểu đồ màu (Có tỷ lệ điểm ảnh đa sắc cao hoặc kích thước lớn)
 * Đồng thời kết xuất luôn `formulaReadyDataUri` đã phủ nền trắng #FFFFFF + viền đệm 24px + phóng đại (Upscale)
 * để loại bỏ hoàn toàn lỗi kênh Alpha trong suốt bị biến thành nền đen.
 */
export async function inspectImageMathSignature(
  _file: Blob,
  dataUri: string
): Promise<{ isLikelyFormula: boolean; formulaReadyDataUri?: string }> {
  return new Promise(resolve => {
    const img = new Image();
    img.onerror = () => resolve({ isLikelyFormula: false });
    img.onload = () => {
      const { width, height } = img;
      // Công thức toán học đơn lẻ, phân số nhiều tầng hoặc hệ phương trình thường có chiều cao <= 560px
      if (width < 8 || height < 8 || height > 560 || width > 1800) {
        resolve({ isLikelyFormula: false });
        return;
      }

      const sampleW = Math.min(width, 260);
      const sampleH = Math.min(height, 140);
      const canvas = document.createElement('canvas');
      canvas.width = sampleW;
      canvas.height = sampleH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ isLikelyFormula: false });
        return;
      }

      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
      const totalPixels = sampleW * sampleH;
      let colorfulPixels = 0;
      let bgPixels = 0;
      let inkPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Điểm ảnh nền: trong suốt (alpha thấp) hoặc trắng/xám rất sáng
        if (a < 55 || (r > 228 && g > 228 && b > 228)) {
          bgPixels++;
          continue;
        }

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        if (maxC - minC > 42) {
          colorfulPixels++;
        }
        if (r < 210 || g < 210 || b < 210) {
          inkPixels++;
        }
      }

      const colorfulRatio = colorfulPixels / totalPixels;
      const bgRatio = bgPixels / totalPixels;
      const inkRatio = inkPixels / totalPixels;

      // Công thức MathType / ảnh chụp công thức: đơn sắc (colorfulRatio < 8%), nền sáng/trong suốt (>= 42%), mật độ nét chữ 0.2% - 50%
      const isLikelyFormula =
        colorfulRatio < 0.08 &&
        bgRatio >= 0.42 &&
        inkRatio >= 0.002 &&
        inkRatio <= 0.50;

      if (!isLikelyFormula) {
        resolve({ isLikelyFormula: false });
        return;
      }

      // Kết xuất ảnh PNG nền trắng tinh khiết (#ffffff) + Padding 24px + Upscale 2x cho công thức nhỏ
      const scale = width < 360 || height < 90 ? 2 : 1;
      const pad = 24;
      const outCanvas = document.createElement('canvas');
      outCanvas.width = width * scale + pad * 2;
      outCanvas.height = height * scale + pad * 2;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) {
        resolve({ isLikelyFormula: true, formulaReadyDataUri: dataUri });
        return;
      }
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = 'high';
      outCtx.drawImage(img, pad, pad, width * scale, height * scale);

      resolve({
        isLikelyFormula: true,
        formulaReadyDataUri: outCanvas.toDataURL('image/png'),
      });
    };
    img.src = dataUri;
  });
}

export async function transpileClipboardMathTypeViaApi(payload: {
  rtfHexChunks?: string[];
  localWmzPaths?: string[];
  imageDataUri?: string;
}): Promise<MathTypeClipboardResponse> {
  try {
    const res = await api.post<MathTypeClipboardResponse>(
      '/api/quiz/questions/clipboard-mathtype',
      payload
    );
    return res.data;
  } catch {
    return { success: false, formulas: [], singleLatex: null };
  }
}

