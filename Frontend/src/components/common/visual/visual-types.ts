export type VisualType = 'function_plot' | 'geometry_3d' | 'geometry_2d' | 'geogebra_embed';

export interface VisualParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
}

export interface DynamicVisualSpec {
  type: VisualType;
  title?: string;
  caption?: string;
  // Function plot spec
  fn?: string;
  derivative?: string;
  xRange?: [number, number];
  yRange?: [number, number];
  showGrid?: boolean;
  showTangents?: boolean;
  parameters?: VisualParameter[];
  // 3D Geometry spec
  solid?: 'pyramid_s_abcd' | 'pyramid_s_abc' | 'prism_triangular' | 'prism_quad' | 'cone' | 'cylinder' | 'sphere';
  height?: number;
  baseRadius?: number;
  showLabels?: boolean;
  wireframeOnly?: boolean;
  // 2D Geometry spec
  figure2d?: 'triangle_altitude' | 'circle_tangent' | 'quadrilateral';
  // GeoGebra embed
  geogebraId?: string;
  geogebraUrl?: string;
  interactive?: boolean;
}

