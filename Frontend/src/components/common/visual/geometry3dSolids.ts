import type { DynamicVisualSpec } from './visual-types';

export interface Point3D {
  x: number;
  y: number;
  z: number;
  label?: string;
}

export interface Edge3D {
  from: number;
  to: number;
  dashed?: boolean;
}

export function getSolidData(solidType: DynamicVisualSpec['solid'] = 'pyramid_s_abcd'): {
  vertices: Point3D[];
  edges: Edge3D[];
} {
  if (solidType === 'pyramid_s_abc') {
    return {
      vertices: [
        { x: 0, y: 1.8, z: 0, label: 'S' },
        { x: -1.4, y: -1, z: 1.2, label: 'A' },
        { x: 1.4, y: -1, z: 1.2, label: 'B' },
        { x: 0.2, y: -1, z: -1.4, label: 'C' },
      ],
      edges: [
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 1, dashed: true },
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 0, to: 3 },
      ],
    };
  }

  if (solidType === 'prism_triangular') {
    return {
      vertices: [
        { x: -1.2, y: -1.2, z: 1.0, label: 'A' },
        { x: 1.2, y: -1.2, z: 1.0, label: 'B' },
        { x: 0.1, y: -1.2, z: -1.2, label: 'C' },
        { x: -1.2, y: 1.2, z: 1.0, label: "A'" },
        { x: 1.2, y: 1.2, z: 1.0, label: "B'" },
        { x: 0.1, y: 1.2, z: -1.2, label: "C'" },
      ],
      edges: [
        { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 0, dashed: true },
        { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 3 },
        { from: 0, to: 3 }, { from: 1, to: 4 }, { from: 2, to: 5, dashed: true },
      ],
    };
  }

  if (solidType === 'prism_quad') {
    return {
      vertices: [
        { x: -1.2, y: -1.2, z: 1.2, label: 'A' },
        { x: 1.2, y: -1.2, z: 1.2, label: 'B' },
        { x: 1.2, y: -1.2, z: -1.2, label: 'C' },
        { x: -1.2, y: -1.2, z: -1.2, label: 'D' },
        { x: -1.2, y: 1.2, z: 1.2, label: "A'" },
        { x: 1.2, y: 1.2, z: 1.2, label: "B'" },
        { x: 1.2, y: 1.2, z: -1.2, label: "C'" },
        { x: -1.2, y: 1.2, z: -1.2, label: "D'" },
      ],
      edges: [
        { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3, dashed: true }, { from: 3, to: 0, dashed: true },
        { from: 4, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 4 },
        { from: 0, to: 4 }, { from: 1, to: 5 }, { from: 2, to: 6 }, { from: 3, to: 7, dashed: true },
      ],
    };
  }

  if (solidType === 'cylinder') {
    const segs = 16;
    const r = 1.25;
    const vertices: Point3D[] = [];
    const edges: Edge3D[] = [];
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      vertices.push({ x: r * Math.cos(a), y: -1.2, z: r * Math.sin(a), label: i === 0 ? 'A' : undefined });
    }
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      vertices.push({ x: r * Math.cos(a), y: 1.2, z: r * Math.sin(a), label: i === 0 ? "A'" : undefined });
    }
    for (let i = 0; i < segs; i++) {
      const next = (i + 1) % segs;
      edges.push({ from: i, to: next, dashed: i >= segs / 2 });
      edges.push({ from: segs + i, to: segs + next });
      if (i % 4 === 0) edges.push({ from: i, to: segs + i, dashed: i === 12 });
    }
    return { vertices, edges };
  }

  if (solidType === 'cone') {
    const segs = 16;
    const r = 1.35;
    const vertices: Point3D[] = [{ x: 0, y: 1.6, z: 0, label: 'S' }];
    const edges: Edge3D[] = [];
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      vertices.push({ x: r * Math.cos(a), y: -1.2, z: r * Math.sin(a), label: i === 0 ? 'A' : undefined });
    }
    for (let i = 0; i < segs; i++) {
      const next = (i + 1) % segs;
      edges.push({ from: 1 + i, to: 1 + next, dashed: i >= segs / 2 });
      if (i % 4 === 0) edges.push({ from: 0, to: 1 + i });
    }
    return { vertices, edges };
  }

  return {
    vertices: [
      { x: 0, y: 1.8, z: 0, label: 'S' },
      { x: -1.4, y: -1.1, z: 1.2, label: 'A' },
      { x: 1.4, y: -1.1, z: 1.2, label: 'B' },
      { x: 1.6, y: -1.1, z: -1.0, label: 'C' },
      { x: -1.2, y: -1.1, z: -1.0, label: 'D' },
    ],
    edges: [
      { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4, dashed: true }, { from: 4, to: 1, dashed: true },
      { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4, dashed: true },
    ],
  };
}

export function computeCrossSectionPolygon(
  vertices: Point3D[],
  edges: Edge3D[],
  sliceY: number,
  tiltX: number
): Point3D[] {
  const pts: Point3D[] = [];
  const planeVal = (p: Point3D) => p.y - (sliceY + tiltX * p.x);

  for (const e of edges) {
    const a = vertices[e.from];
    const b = vertices[e.to];
    const da = planeVal(a);
    const db = planeVal(b);
    if ((da <= 0 && db >= 0) || (da >= 0 && db <= 0)) {
      const denom = da - db;
      if (Math.abs(denom) < 1e-6) continue;
      const t = da / denom;
      if (t >= 0 && t <= 1) {
        const p = {
          x: a.x + t * (b.x - a.x),
          y: a.y + t * (b.y - a.y),
          z: a.z + t * (b.z - a.z),
        };
        if (!pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) < 0.05)) {
          pts.push(p);
        }
      }
    }
  }

  if (pts.length < 3) return pts;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
  return [...pts].sort((p, q) => Math.atan2(p.z - cz, p.x - cx) - Math.atan2(q.z - cz, q.x - cx));
}
