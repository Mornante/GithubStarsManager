import { describe, expect, it } from 'vitest'
import { DEFAULT_SORT_KEY, FILTER_DEFINITIONS, SORT_OPTIONS } from './filterDefinitions'

function defOf(key: string) {
  const def = FILTER_DEFINITIONS.find((d) => d.key === key)
  if (!def) throw new Error(`no filter definition for key "${key}"`)
  return def
}

describe('search filter (q)', () => {
  const def = defOf('q')

  it('serializes the default (empty) value to null', () => {
    expect(def.serialize(def.defaultValue)).toBeNull()
  })

  it('round-trips a search string', () => {
    const serialized = def.serialize('hello world')
    expect(def.deserialize(serialized)).toBe('hello world')
  })

  it('is only active when non-empty', () => {
    expect(def.isActive('')).toBe(false)
    expect(def.isActive('x')).toBe(true)
  })

  it('formats a pill label with quotes', () => {
    expect(def.toPillLabels('hello')).toEqual(['"hello"'])
    expect(def.toPillLabels('')).toEqual([])
  })
})

describe('multiselect filters (language)', () => {
  const def = defOf('language')

  it('serializes an empty selection to null', () => {
    expect(def.serialize([])).toBeNull()
  })

  it('round-trips values containing URL-unsafe characters', () => {
    const serialized = def.serialize(['C++', 'TypeScript'])
    expect(def.deserialize(serialized)).toEqual(['C++', 'TypeScript'])
  })

  it('is only active with a non-empty selection', () => {
    expect(def.isActive([])).toBe(false)
    expect(def.isActive(['Go'])).toBe(true)
  })
})

describe('select filters (list)', () => {
  const def = defOf('list')

  it('serializes the default (null) value to null', () => {
    expect(def.serialize(def.defaultValue)).toBeNull()
  })

  it('round-trips a selected value', () => {
    expect(def.deserialize(def.serialize('list1'))).toBe('list1')
  })

  it('falls back to the raw value when no matching option is found', () => {
    expect(def.toPillLabels('list1', [])).toEqual(['list1'])
    expect(def.toPillLabels('list1', [{ value: 'list1', label: 'Cool Stuff' }])).toEqual(['Cool Stuff'])
  })
})

describe('yes/no filters (deployed)', () => {
  const def = defOf('deployed')

  it('treats null as "any" and matches everything', () => {
    expect(def.isActive(null)).toBe(false)
    expect(def.predicate({} as never, null, { lists: [], reviewTags: {}, deployments: {} })).toBe(true)
  })

  it('round-trips yes/no', () => {
    expect(def.deserialize(def.serialize('yes'))).toBe('yes')
    expect(def.deserialize(def.serialize('no'))).toBe('no')
  })

  it('formats Yes/No pill labels', () => {
    expect(def.toPillLabels('yes')).toEqual(['Yes'])
    expect(def.toPillLabels('no')).toEqual(['No'])
    expect(def.toPillLabels(null)).toEqual([])
  })
})

describe('SORT_OPTIONS', () => {
  it('includes a default sort key that exists among the options', () => {
    expect(SORT_OPTIONS.some((o) => o.key === DEFAULT_SORT_KEY)).toBe(true)
  })
})
