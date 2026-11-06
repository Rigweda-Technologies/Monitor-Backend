const pad2 = value => String(value).padStart(2, '0');
const parseDateKey = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
};
export const isValidTimeZone = timeZone => {
  try { if (!timeZone || typeof timeZone !== 'string') return false; new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date()); return true; }
  catch { return false; }
};
const getZonedParts = (value, timeZone) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
  const result = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  return { year: result.year, month: result.month, day: result.day, hour: result.hour, minute: result.minute, second: result.second };
};
export const toDateKeyInTimeZone = (value, timeZone) => {
  if (parseDateKey(value)) return String(value);
  const parts = getZonedParts(value, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};
export const addDaysToDateKey = (dateKey, dayDelta) => {
  const parsed = parseDateKey(dateKey); if (!parsed) return null;
  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day) + Number(dayDelta || 0) * 86400000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
};
export const zonedDateTimeToUtc = (dateKey, hhmm, timeZone) => {
  const parsed = parseDateKey(dateKey); if (!parsed) return null;
  const [hourText, minuteText] = String(hhmm || '00:00').split(':');
  const hour = Number(hourText || 0); const minute = Number(minuteText || 0);
  const desired = Date.UTC(parsed.year, parsed.month - 1, parsed.day, hour, minute, 0, 0);
  let timestamp = desired;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const zoned = getZonedParts(new Date(timestamp), timeZone);
    const actual = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, 0, 0);
    const adjustment = desired - actual;
    if (!adjustment) break;
    timestamp += adjustment;
  }
  return new Date(timestamp);
};
export const startOfDayInTimeZone = (value, timeZone) => {
  const key = parseDateKey(value) ? String(value) : toDateKeyInTimeZone(value, timeZone);
  return zonedDateTimeToUtc(key, '00:00', timeZone);
};
export const endOfDayInTimeZone = (value, timeZone) => {
  const key = parseDateKey(value) ? String(value) : toDateKeyInTimeZone(value, timeZone);
  const nextDayStart = zonedDateTimeToUtc(addDaysToDateKey(key, 1), '00:00', timeZone);
  return new Date(nextDayStart.getTime() - 1);
};
export const parseMonthRangeInTimeZone = (monthValue, timeZone) => {
  const today = toDateKeyInTimeZone(new Date(), timeZone);
  let year = Number(today.slice(0, 4)); let month = Number(today.slice(5, 7));
  if (typeof monthValue === 'string' && /^\d{4}-\d{2}$/.test(monthValue)) [year, month] = monthValue.split('-').map(Number);
  const startKey = `${year}-${pad2(month)}-01`;
  const nextMonth = month === 12 ? Date.UTC(year + 1, 0, 1) : Date.UTC(year, month, 1);
  const endDay = new Date(nextMonth - 1).getUTCDate();
  const endKey = `${year}-${pad2(month)}-${pad2(endDay)}`;
  return { year, month, start: startOfDayInTimeZone(startKey, timeZone), end: endOfDayInTimeZone(endKey, timeZone), startKey, endKey, daysInMonth: endDay };
};
export const getDayInTimeZone = (value, timeZone) => Number(toDateKeyInTimeZone(value, timeZone).slice(8, 10));
export const getWeekdayForDateKey = (dateKey, timeZone) => {
  const localNoon = zonedDateTimeToUtc(dateKey, '12:00', timeZone);
  const text = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(localNoon);
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[text] ?? 0;
};
