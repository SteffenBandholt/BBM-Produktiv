export function parseIsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3])
    ? date
    : null;
}

export function formatIsoDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function isoWeekInfo(value) {
  const parsed = value instanceof Date
    ? new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
    : parseIsoDate(value);
  if (!parsed) return null;
  const day = parsed.getUTCDay() || 7;
  parsed.setUTCDate(parsed.getUTCDate() + 4 - day);
  const weekYear = parsed.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((parsed - yearStart) / 86400000) + 1) / 7);
  return { week, year: weekYear };
}

export function buildIsoMonthWeeks(year, monthIndex) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const cursor = new Date(first);
  cursor.setUTCDate(cursor.getUTCDate() - mondayOffset);
  const weeks = [];
  for (let row = 0; row < 6; row += 1) {
    const days = [];
    for (let column = 0; column < 7; column += 1) {
      const date = new Date(cursor);
      days.push({
        value: formatIsoDate(date),
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === monthIndex,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    const info = isoWeekInfo(days[0].value);
    weeks.push({ week: info.week, year: info.year, days });
  }
  return weeks;
}
