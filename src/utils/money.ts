// Money is stored and passed across the API as an integer number of **pence**
// (e.g. 7500 = £75.00). This is the single place that turns that into a
// human-facing string and converts to/from pounds at a form's input edge.
//
// Mirrors the backend's src/utils/money.js. The accounting side already worked
// in pence; the booking / service / payment side now does too, so every view
// can format the same way.

// Whole pence -> "£37.50". Always two decimal places, thousands separators for
// larger figures (£1,250.00). Negative pence (a refund) render as -£10.00.
export function formatGBP(pence: number | null | undefined): string {
  const n = Number(pence) || 0
  const sign = n < 0 ? '-' : ''
  const pounds = Math.abs(n) / 100
  return `${sign}£${pounds.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Compact form for dense charts/tiles: "£1.3k" above £1,000, else "£75".
// Rounds to whole pounds — for axis labels and bar tooltips, not ledgers.
export function formatGBPCompact(pence: number | null | undefined): string {
  const pounds = (Number(pence) || 0) / 100
  return pounds >= 1000
    ? '£' + (pounds / 1000).toFixed(1) + 'k'
    : '£' + Math.round(pounds).toLocaleString('en-GB')
}

// Pounds typed by a human -> integer pence, rounded to the nearest penny.
// null / '' pass through as null so an unset price stays unset.
export function poundsToPence(pounds: number | string | null | undefined): number | null {
  if (pounds === null || pounds === undefined || pounds === '') return null
  return Math.round(Number(pounds) * 100)
}

// Integer pence -> a pounds number (for pre-filling a £ input). Null-safe.
export function penceToPounds(pence: number | null | undefined): number | null {
  if (pence === null || pence === undefined) return null
  return Number(pence) / 100
}

// Integer pence -> a fixed 2dp pounds string for an <input> value ("75.00").
// Empty string when unset, so the field shows a placeholder rather than "0.00".
export function penceToInput(pence: number | null | undefined): string {
  if (pence === null || pence === undefined) return ''
  return (Number(pence) / 100).toFixed(2)
}
