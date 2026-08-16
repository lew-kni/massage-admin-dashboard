// Per-client retention/rebooking picture, derived from non-cancelled bookings.
// Shared by the Rebooking page and the Dashboard tile so they never disagree.
import type { Booking } from '@/types'

const DAY = 86400000
// Fallback rebooking gap for clients with fewer than two visits, so a lone
// first-timer who never rebooked still surfaces as "due" after ~4 weeks.
export const DEFAULT_INTERVAL = 28

export type RebookStatus = 'new' | 'booked' | 'recent' | 'due' | 'lapsed'

export interface RebookClient {
  clientId: string
  name: string
  email?: string | null
  lastVisit: string | null
  visitCount: number
  intervalDays: number | null
  daysSinceLast: number | null
  status: RebookStatus
}

export interface RebookSummary {
  clients: RebookClient[]
  activeCount: number
  dueCount: number
  lapsedCount: number
  // Actionable list — clients with no upcoming booking who are past their gap
  // (due) or well past it (lapsed), most overdue first. "Who to contact."
  toContact: RebookClient[]
  avgIntervalWeeks: number | null
}

// Days a client is overdue beyond their usual gap (0 if not overdue).
export function overdueBy(c: RebookClient): number {
  const eff = c.intervalDays ?? DEFAULT_INTERVAL
  return Math.max(0, (c.daysSinceLast ?? 0) - eff)
}

export function computeRebooking(bookings: Booking[], now: number = Date.now()): RebookSummary {
  const byClient = new Map<string, Booking[]>()
  for (const b of bookings) {
    if (b.status === 'CANCELLED' || !b.clientId) continue
    const arr = byClient.get(b.clientId) ?? []
    arr.push(b)
    byClient.set(b.clientId, arr)
  }

  const clients: RebookClient[] = []
  for (const [clientId, bs] of byClient) {
    const sorted = bs.slice().sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    const past = sorted.filter((b) => new Date(b.startTime).getTime() <= now)
    const hasUpcoming = sorted.some((b) => new Date(b.startTime).getTime() > now)
    const client = sorted[sorted.length - 1].client
    const lastVisit = past.length ? past[past.length - 1].startTime : null

    let intervalDays: number | null = null
    if (past.length >= 2) {
      let totalGap = 0
      for (let i = 1; i < past.length; i++) {
        totalGap += (new Date(past[i].startTime).getTime() - new Date(past[i - 1].startTime).getTime()) / DAY
      }
      intervalDays = Math.round(totalGap / (past.length - 1))
    }

    const daysSinceLast = lastVisit ? Math.floor((now - new Date(lastVisit).getTime()) / DAY) : null
    const effInterval = intervalDays ?? DEFAULT_INTERVAL

    let status: RebookStatus
    if (!lastVisit) status = 'new'
    else if (hasUpcoming) status = 'booked'
    else if (daysSinceLast! > 2 * effInterval) status = 'lapsed'
    else if (daysSinceLast! >= effInterval) status = 'due'
    else status = 'recent'

    clients.push({
      clientId,
      name: `${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim() || 'Unknown',
      email: client?.email,
      lastVisit,
      visitCount: past.length,
      intervalDays,
      daysSinceLast,
      status,
    })
  }

  const withInterval = clients.filter((c) => c.intervalDays != null)
  const avgIntervalWeeks = withInterval.length
    ? withInterval.reduce((s, c) => s + (c.intervalDays as number), 0) / withInterval.length / 7
    : null

  return {
    clients,
    activeCount: clients.filter((c) => c.status !== 'lapsed').length,
    dueCount: clients.filter((c) => c.status === 'due').length,
    lapsedCount: clients.filter((c) => c.status === 'lapsed').length,
    toContact: clients
      .filter((c) => c.status === 'due' || c.status === 'lapsed')
      .sort((a, b) => overdueBy(b) - overdueBy(a)),
    avgIntervalWeeks,
  }
}
