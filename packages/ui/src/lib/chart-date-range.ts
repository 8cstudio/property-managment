export type ChartRangePreset = "3" | "7" | "30" | "custom";

export const CHART_HISTORY_DAYS = 90;
export const CHART_CUSTOM_MAX_DAYS = 90;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayStart(): Date {
  return startOfDay(new Date());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return startOfDay(d);
}

export function formatChartDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

export function daysBetween(start: Date, end: Date): number {
  return (
    Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) /
      86400000) + 1
  );
}

export function resolveChartRange(
  preset: ChartRangePreset,
  customStart: string,
  customEnd: string,
): { start: Date; end: Date } {
  const end = todayStart();
  if (preset === "3") {
    return { start: addDays(end, -2), end };
  }
  if (preset === "7") {
    return { start: addDays(end, -6), end };
  }
  if (preset === "30") {
    return { start: addDays(end, -29), end };
  }

  const parsedStart = parseDateInput(customStart);
  const parsedEnd = parseDateInput(customEnd);
  if (!parsedStart || !parsedEnd) {
    return { start: addDays(end, -6), end };
  }

  let start = parsedStart;
  let rangeEnd = parsedEnd;
  if (start > rangeEnd) {
    [start, rangeEnd] = [rangeEnd, start];
  }
  if (rangeEnd > end) {
    rangeEnd = end;
  }
  const span = daysBetween(start, rangeEnd);
  if (span > CHART_CUSTOM_MAX_DAYS) {
    start = addDays(rangeEnd, -(CHART_CUSTOM_MAX_DAYS - 1));
  }
  return { start, end: rangeEnd };
}

export function eachDayInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let cursor = startOfDay(start); cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function historyIndexForDate(
  historyLength: number,
  date: Date,
  anchorEnd: Date = todayStart(),
): number {
  const offset = Math.round(
    (startOfDay(anchorEnd).getTime() - startOfDay(date).getTime()) / 86400000,
  );
  return Math.max(0, Math.min(historyLength - 1, historyLength - 1 - offset));
}
