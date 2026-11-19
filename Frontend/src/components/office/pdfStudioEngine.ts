import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export type PdfCompressionPreset = 'LOSSLESS' | 'HIGH_QUALITY' | 'BALANCED' | 'MAX_COMPRESS';

export interface PdfWatermarkOptions {
  enabled: boolean;
  text: string;
  position: 'DIAGONAL' | 'STAMP_CORNER';
  opacity?: number;
}

export interface PdfStudioPageItem {
  id: string;
  sourceKind: 'PDF' | 'IMAGE';
  sourceName: string;
  sourcePageIndex: number; // 0-based for PDF
  sourceBytes: Uint8Array;
  imageMime?: string;
  thumbnailUrl: string;
  rotation: number; // 0 | 90 | 180 | 270
  selected: boolean;
}

export async function loadPdfFilePages(file: File): Promise<PdfStudioPageItem[]> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: buf.slice() });
  const pdf = await loadingTask.promise;
  const items: PdfStudioPageItem[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 0.35 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(vp.width));
    canvas.height = Math.max(1, Math.floor(vp.height));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    }
    items.push({
      id: `${file.name}_p${p}_${Math.random().toString(36).slice(2, 7)}`,
      sourceKind: 'PDF',
      sourceName: file.name,
      sourcePageIndex: p - 1,
      sourceBytes: buf,
      thumbnailUrl: canvas.toDataURL('image/jpeg', 0.72),
      rotation: 0,
      selected: true,
    });
  }
  return items;
}

export async function loadImageAsPdfPage(file: File): Promise<PdfStudioPageItem> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const blob = new Blob([buf], { type: file.type || 'image/png' });
  const url = URL.createObjectURL(blob);
  return {
    id: `${file.name}_img_${Math.random().toString(36).slice(2, 7)}`,
    sourceKind: 'IMAGE',
    sourceName: file.name,
    sourcePageIndex: 0,
    sourceBytes: buf,
    imageMime: file.type || 'image/png',
    thumbnailUrl: url,
    rotation: 0,
    selected: true,
  };
}

function renderUnicodeWatermarkPng(text: string, position: 'DIAGONAL' | 'STAMP_CORNER', opacity: number): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = position === 'DIAGONAL' ? 900 : 520;
  canvas.height = position === 'DIAGONAL' ? 900 : 180;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = Math.max(0.08, Math.min(0.85, opacity));
    ctx.fillStyle = position === 'DIAGONAL' ? '#dc2626' : '#0f172a';
    ctx.strokeStyle = '#dc2626';
    if (position === 'DIAGONAL') {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 5);
      ctx.font = 'bold 46px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    } else {
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#dc2626';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }
  }
  const dataUrl = canvas.toDataURL('image/png');
  return Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
}

export async function buildOrCompressPdf(
  pages: PdfStudioPageItem[],
  preset: PdfCompressionPreset,
  onProgress?: (pct: number) => void,
  watermark?: PdfWatermarkOptions,
): Promise<{ blob: Blob; outputBytes: number }> {
  const activePages = pages.filter((p) => p.selected);
  if (activePages.length === 0) throw new Error('Chưa chọn trang nào để xuất.');

  const outPdf = await PDFDocument.create();

  if (preset === 'LOSSLESS') {
    const pdfCache = new Map<Uint8Array, PDFDocument>();
    for (let i = 0; i < activePages.length; i++) {
      const item = activePages[i];
      if (item.sourceKind === 'PDF') {
        let srcDoc = pdfCache.get(item.sourceBytes);
        if (!srcDoc) {
          srcDoc = await PDFDocument.load(item.sourceBytes);
          pdfCache.set(item.sourceBytes, srcDoc);
        }
        const [copied] = await outPdf.copyPages(srcDoc, [item.sourcePageIndex]);
        if (item.rotation !== 0) {
          const cur = copied.getRotation().angle;
          copied.setRotation(degrees((cur + item.rotation) % 360));
        }
        outPdf.addPage(copied);
      } else {
        const img = item.imageMime?.includes('png')
          ? await outPdf.embedPng(item.sourceBytes)
          : await outPdf.embedJpg(item.sourceBytes);
        const page = outPdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      onProgress?.(Math.round(((i + 1) / activePages.length) * 100));
    }
  } else {
    // Rasterize + JPEG re-encode for dramatic scanned PDF compression (60%-85% smaller)
    const { scale, quality } = preset === 'MAX_COMPRESS'
      ? { scale: 1.2, quality: 0.56 }
      : preset === 'BALANCED'
        ? { scale: 1.65, quality: 0.74 }
        : { scale: 2.1, quality: 0.86 };

    const pdfjsCache = new Map<Uint8Array, pdfjsLib.PDFDocumentProxy>();
    for (let i = 0; i < activePages.length; i++) {
      const item = activePages[i];
      let jpegBytes: Uint8Array;
      let pageW = 595;
      let pageH = 842;

      if (item.sourceKind === 'PDF') {
        let doc = pdfjsCache.get(item.sourceBytes);
        if (!doc) {
          doc = await pdfjsLib.getDocument({ data: item.sourceBytes.slice() }).promise;
          pdfjsCache.set(item.sourceBytes, doc);
        }
        const page = await doc.getPage(item.sourcePageIndex + 1);
        const baseVp = page.getViewport({ scale: 1, rotation: item.rotation });
        pageW = baseVp.width;
        pageH = baseVp.height;
        const renderVp = page.getViewport({ scale, rotation: item.rotation });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(renderVp.width));
        canvas.height = Math.max(1, Math.floor(renderVp.height));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: renderVp, canvas }).promise;
        }
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        jpegBytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
      } else {
        const img = item.imageMime?.includes('png')
          ? await outPdf.embedPng(item.sourceBytes)
          : await outPdf.embedJpg(item.sourceBytes);
        const p = outPdf.addPage([img.width, img.height]);
        p.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        onProgress?.(Math.round(((i + 1) / activePages.length) * 100));
        continue;
      }

      const embedded = await outPdf.embedJpg(jpegBytes);
      const outPage = outPdf.addPage([pageW, pageH]);
      outPage.drawImage(embedded, { x: 0, y: 0, width: pageW, height: pageH });
      onProgress?.(Math.round(((i + 1) / activePages.length) * 100));
    }
  }

  if (watermark?.enabled && watermark.text.trim()) {
    const pngBytes = renderUnicodeWatermarkPng(
      watermark.text.trim(),
      watermark.position,
      watermark.opacity ?? (watermark.position === 'DIAGONAL' ? 0.22 : 0.72),
    );
    const wmImg = await outPdf.embedPng(pngBytes);
    for (const p of outPdf.getPages()) {
      const { width, height } = p.getSize();
      if (watermark.position === 'DIAGONAL') {
        const dim = Math.min(width, height) * 0.85;
        p.drawImage(wmImg, {
          x: (width - dim) / 2,
          y: (height - dim) / 2,
          width: dim,
          height: dim,
        });
      } else {
        const w = Math.min(180, width * 0.34);
        const h = (w * 180) / 520;
        p.drawImage(wmImg, {
          x: width - w - 20,
          y: height - h - 20,
          width: w,
          height: h,
        });
      }
    }
  }

  const bytes = await outPdf.save({ useObjectStreams: true });
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  return { blob, outputBytes: bytes.byteLength };
}

export async function protectPdfWithPassword(
  pdfBlob: Blob,
  fileName: string,
  password: string,
): Promise<Blob> {
  const form = new FormData();
  form.append('file', pdfBlob, `${fileName || 'document'}.pdf`);
  form.append('password', password);
  const res = await api.post('/api/office-workspace/protect-pdf', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });
  return res.data as Blob;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
