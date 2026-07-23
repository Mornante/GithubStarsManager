export type TrendingWindow = 'today' | 'week' | 'month'

export function windowToCreatedCutoff(window: TrendingWindow, now = new Date()): string {
  const cutoff = new Date(now)
  if (window === 'today') cutoff.setDate(cutoff.getDate() - 1)
  else if (window === 'week') cutoff.setDate(cutoff.getDate() - 7)
  else cutoff.setMonth(cutoff.getMonth() - 1)

  return cutoff.toISOString().slice(0, 10)
}
