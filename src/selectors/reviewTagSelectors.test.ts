import { describe, expect, it } from 'vitest'
import { isLegacySystemListName, legacySystemListIds } from './reviewTagSelectors'
import type { StarList } from '../types/github'

// Built from code points (rather than a pasted glyph) so the test can't drift
// from the source's exact prefix: '#' + VARIATION SELECTOR-16 + COMBINING
// ENCLOSING KEYCAP + "GSM:TAG:".
const LEGACY_PREFIX = String.fromCodePoint(0x23, 0xfe0f, 0x20e3) + 'GSM:TAG:'

function list(id: string, name: string): StarList {
  return { id, name, description: null, isPrivate: false, repoIds: [] }
}

describe('isLegacySystemListName', () => {
  it('matches names using the legacy GSM:TAG marker', () => {
    expect(isLegacySystemListName(`${LEGACY_PREFIX}REVIEWED`)).toBe(true)
  })

  it('does not match ordinary star list names', () => {
    expect(isLegacySystemListName('Cool Stuff')).toBe(false)
  })
})

describe('legacySystemListIds', () => {
  it('returns only the ids of legacy-tagged lists', () => {
    const lists = [
      list('l1', `${LEGACY_PREFIX}REVIEWED`),
      list('l2', 'Cool Stuff'),
      list('l3', `${LEGACY_PREFIX}IN_REVIEW`),
    ]
    expect(legacySystemListIds(lists)).toEqual(new Set(['l1', 'l3']))
  })

  it('returns an empty set when there are no legacy lists', () => {
    expect(legacySystemListIds([list('l1', 'Cool Stuff')])).toEqual(new Set())
  })
})
