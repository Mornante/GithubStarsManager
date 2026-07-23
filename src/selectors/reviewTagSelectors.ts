import type { StarList } from '../types/github'

const LEGACY_SYSTEM_LIST_PREFIX = '#️⃣GSM:TAG:'

// Earlier versions of this app used real star lists prefixed with this marker
// for review/deploy tags. That data now lives in the GSM:STATE gist, but
// accounts that used the earlier version may still have these lists lingering
// — keep them out of the generic "Add to category" picker and out of the
// "categorized" filter calculation.
export function isLegacySystemListName(name: string): boolean {
  return name.startsWith(LEGACY_SYSTEM_LIST_PREFIX)
}

export function legacySystemListIds(lists: StarList[]): Set<string> {
  return new Set(lists.filter((l) => isLegacySystemListName(l.name)).map((l) => l.id))
}
