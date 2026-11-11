export interface MerkleNodeData {
  id: string;
  labelVi: string;
  labelEn: string;
  originalHash: string;
  tamperedHash: string;
  type: 'leaf' | 'branch' | 'root';
}

export const INITIAL_MERKLE_NODES: MerkleNodeData[] = [
  {
    id: 'leaf-q',
    labelVi: 'Câu hỏi & Đáp án Gốc',
    labelEn: 'Question & Answer Spec',
    originalHash: '8f4a1c9e...b2d0',
    tamperedHash: '3e1b7f02...9c4a',
    type: 'leaf',
  },
  {
    id: 'leaf-sub',
    labelVi: 'Bài Nộp Thí Sinh (10:14:02)',
    labelEn: 'Student Submission (10:14:02)',
    originalHash: 'd7c2e0b1...41aa',
    tamperedHash: 'a55f9c11...02be',
    type: 'leaf',
  },
  {
    id: 'leaf-sig',
    labelVi: 'Chữ Ký Số PKI USB Token',
    labelEn: 'PKI Digital Signature',
    originalHash: '1a9e33bc...7f04',
    tamperedHash: '1a9e33bc...7f04',
    type: 'leaf',
  },
  {
    id: 'leaf-time',
    labelVi: 'Dấu Thời Gian TSA RFC 3161',
    labelEn: 'TSA RFC 3161 Timestamp',
    originalHash: '55bc01fa...99e1',
    tamperedHash: '55bc01fa...99e1',
    type: 'leaf',
  },
  {
    id: 'branch-1',
    labelVi: 'Khối Hash H[0,1]',
    labelEn: 'Combined Hash H[0,1]',
    originalHash: 'e3b0c442...98fc',
    tamperedHash: '44a10d9f...7c20',
    type: 'branch',
  },
  {
    id: 'branch-2',
    labelVi: 'Khối Hash H[2,3]',
    labelEn: 'Combined Hash H[2,3]',
    originalHash: '9f86d081...e056',
    tamperedHash: '9f86d081...e056',
    type: 'branch',
  },
  {
    id: 'merkle-root',
    labelVi: 'MERKLE ROOT TOÀN CỤC',
    labelEn: 'GLOBAL MERKLE ROOT',
    originalHash: 'a1b2c3d4...ROOT',
    tamperedHash: 'FAIL_MISMATCH_INVALID',
    type: 'root',
  },
];

export interface TrustMetricItem {
  id: string;
  metric: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

export const TRUST_METRICS: TrustMetricItem[] = [
  {
    id: 'questions',
    metric: '5,842,900+',
    labelVi: 'Câu hỏi Bóc tách & Chuẩn hóa',
    labelEn: 'Standardized Ingested Questions',
    badgeVi: 'MTEF v5 Binary',
    badgeEn: 'MTEF v5 Binary',
  },
  {
    id: 'buzzer-latency',
    metric: '<1.85ms',
    labelVi: 'Độ trễ Phân định Buzzer RAM',
    labelEn: 'In-Memory Buzzer Latency',
    badgeVi: 'Zero Lock Contention',
    badgeEn: 'Zero Lock Contention',
  },
  {
    id: 'storage-saving',
    metric: '99.2%',
    labelVi: 'Tiết kiệm Bộ nhớ (Vector LaTeX)',
    labelEn: 'Storage Footprint Slashing',
    badgeVi: '45KB -> 60 Bytes',
    badgeEn: '45KB -> 60 Bytes',
  },
  {
    id: 'audit-integrity',
    metric: '100%',
    labelVi: 'Bất biến Tuyệt đối (Merkle Tree)',
    labelEn: 'Tamper-Proof Audit Integrity',
    badgeVi: 'SHA-256 Validated',
    badgeEn: 'SHA-256 Validated',
  },
];
