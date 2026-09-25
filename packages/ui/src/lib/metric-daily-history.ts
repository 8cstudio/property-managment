export type MetricHistoryInput = {
  key: string;
  value: number;
  series?: readonly number[];
};

function seedFromKey(key: string): number {
  let seed = 0;
  for (const char of key) seed += char.charCodeAt(0);
  return seed;
}

function resampleSeries(
  series: readonly number[],
  points: number,
  target: number,
): number[] {
  const src = series.map((value) => Math.max(0, Math.round(value)));
  if (src.length === 1) {
    src.push(target);
  }
  const lastSrc = src[src.length - 1] ?? target;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / Math.max(points - 1, 1);
    const srcIndex = t * (src.length - 1);
    const left = Math.floor(srcIndex);
    const right = Math.min(src.length - 1, left + 1);
    const mix = srcIndex - left;
    const leftVal = src[left] ?? lastSrc;
    const rightVal = src[right] ?? leftVal;
    const interpolated = leftVal + (rightVal - leftVal) * mix;
    out.push(Math.max(0, Math.round(interpolated)));
  }
  out[points - 1] = target;
  return out;
}

/** Daily points for charts; last day matches the live `value`. */
export function buildMetricDailyHistory(
  metric: MetricHistoryInput,
  points: number,
): number[] {
  const target = Math.max(0, Math.round(metric.value));

  if (metric.series && metric.series.length >= 2) {
    const resampled = resampleSeries(metric.series, points, target);
    if (new Set(resampled).size > 1) {
      return resampled;
    }
  }

  const seed = seedFromKey(metric.key);
  const scale = Math.max(target, 1);
  const amplitude = Math.max(2, Math.ceil(scale * 0.55));

  return Array.from({ length: points }, (_, index) => {
    if (index === points - 1) return target;

    const w1 = Math.sin(index * 0.47 + seed * 0.11);
    const w2 = Math.sin(index * 1.05 + seed * 0.07) * 0.65;
    const w3 = Math.cos(index * 0.23 + seed * 0.05) * 0.4;
    const wave = (w1 + w2 + w3) / 2.05;

    const center = target + scale * 0.1;
    let value = Math.round(center + wave * amplitude);

    if (index % 5 === seed % 5) {
      value += index % 2 === 0 ? 1 : -1;
    }

    return Math.max(0, value);
  });
}
