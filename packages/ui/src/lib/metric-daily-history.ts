export type MetricHistoryInput = {
  key: string;
  value: number;
  series?: readonly number[];
};

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

  // No recorded history: flat line at the live value (never decorate with fake trends).
  return Array.from({ length: points }, () => target);
}
