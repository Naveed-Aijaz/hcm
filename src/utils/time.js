// Office-local date/time helpers. Vercel runs in UTC, so never use getHours()/toISOString()
// for "today" or lateness: they would be wrong for any non-UTC office.
export const OFFICE_TZ = process.env.OFFICE_TIMEZONE || 'Asia/Karachi';

export function officeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: OFFICE_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}
