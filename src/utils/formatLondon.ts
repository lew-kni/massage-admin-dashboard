// The business operates entirely in the UK, so every appointment date/time
// shown or entered in the admin should mean Europe/London -- correctly
// handling the GMT/BST switch -- regardless of which timezone the viewing
// browser happens to be in. Mirrors massage-website-backend's
// src/utils/londonTime.js (same Intl-based approach, no new dependency: every
// modern browser ships full ICU/tz data).

const LONDON_TZ = 'Europe/London'

function londonPartsOf(instant: Date, options: Intl.DateTimeFormatOptions): Record<string, string> {
  const dtf = new Intl.DateTimeFormat('en-GB', { timeZone: LONDON_TZ, hourCycle: 'h23', ...options })
  const parts: Record<string, string> = {}
  for (const { type, value } of dtf.formatToParts(instant)) {
    if (type !== 'literal') parts[type] = value
  }
  return parts
}

// The UTC offset (in minutes) Europe/London observes at a given instant --
// 0 for GMT, 60 for BST.
function londonOffsetMinutesAt(instant: Date): number {
  const p = londonPartsOf(instant, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second))
  return Math.round((asUtc - instant.getTime()) / 60000)
}

// Converts an intended Europe/London wall-clock date + time (as entered in a
// form) into the UTC instant it actually represents. Two-pass guess-and-correct
// -- see the backend's londonTime.js for the full explanation.
export function londonWallTimeToUtc(dateStr: string, timeStr: string): Date {
  const hhmmss = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  const naiveUtc = new Date(`${dateStr}T${hhmmss}Z`)
  const offset = londonOffsetMinutesAt(naiveUtc)
  let corrected = new Date(naiveUtc.getTime() - offset * 60000)
  const offset2 = londonOffsetMinutesAt(corrected)
  if (offset2 !== offset) {
    corrected = new Date(naiveUtc.getTime() - offset2 * 60000)
  }
  return corrected
}

// Splits a stored instant into the London-local { date, time } an edit form
// needs -- replaces `date.split('T')[0]` (wrong for the UTC/London calendar
// day whenever they differ) and browser-local `format(date, 'HH:mm')`.
export function toLondonInputParts(instant: string | Date): { date: string; time: string } {
  const p = londonPartsOf(new Date(instant), {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`
  }
}

// Pure calendar arithmetic (no timezone involved) -- adds `days` to a
// 'YYYY-MM-DD' string. Mirrors the backend's addLondonDays.
export function addLondonDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

// Returns a Date whose LOCAL calendar/clock fields (as read by getFullYear(),
// getHours(), etc. -- what date-fns' format() reads) match the Europe/London
// wall-clock reading of `instant`, regardless of the runtime's real timezone.
// Lets an existing `format(new Date(x), 'pattern')` call site become
// timezone-correct by changing only the Date construction -- zero change to
// its visual output style, since date-fns still just reads local fields.
export function toLondonFakeLocalDate(instant: string | Date): Date {
  const p = londonPartsOf(new Date(instant), {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  return new Date(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second))
}

// Date/time formatting pinned to Europe/London, for display anywhere in the
// admin -- so an appointment always shows its actual UK local time, whether
// the person viewing is in the UK or not.
export function formatLondonDate(instant: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(instant).toLocaleDateString('en-GB', { timeZone: LONDON_TZ, day: '2-digit', month: 'short', year: 'numeric', ...opts })
}

export function formatLondonTime(instant: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(instant).toLocaleTimeString('en-GB', { timeZone: LONDON_TZ, hour: '2-digit', minute: '2-digit', ...opts })
}

export function formatLondonDateTime(instant: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return `${formatLondonDate(instant, opts)}, ${formatLondonTime(instant, opts)}`
}
