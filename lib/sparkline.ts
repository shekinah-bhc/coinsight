export interface SparklinePoint {
  x: number;
  y: number;
  value: number;
}

export interface SparklineGeometry {
  line: string;
  area: string;
  points: SparklinePoint[];
  last: SparklinePoint;
}

const FALLBACK_POINT: SparklinePoint = { x: 0, y: 0, value: 0 };

function smoothPath(points: SparklinePoint[]) {
  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Builds a smoothed sparkline and its closed area path for an SVG viewBox.
 * Coordinates use `width`/`height` units, so callers can pair them with
 * `viewBox="0 0 width height"`.
 */
export function buildSparkline(
  values: number[],
  width: number,
  height: number,
  padRatio = 0.15
): SparklineGeometry {
  if (values.length === 0) {
    return { line: "", area: "", points: [], last: FALLBACK_POINT };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * padRatio || 1;
  const bottom = min - pad;
  const top = max + pad;

  const points = values.map((value, index) => ({
    x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: height - ((value - bottom) / (top - bottom)) * height,
    value,
  }));

  const first = points[0];
  const last = points[points.length - 1];
  const line = smoothPath(points);
  const area = line
    ? `${line} L ${last.x} ${height} L ${first.x} ${height} Z`
    : "";

  return { line, area, points, last };
}
