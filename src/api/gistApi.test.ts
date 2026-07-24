import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findOrCreateGsmStateGist } from './gistApi'
import { CURRENT_SCHEMA_VERSION } from '../types/gsmState'

const TOKEN = 'token'
const GIST_ID = 'g1'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('findOrCreateGsmStateGist', () => {
  it('migrates a legacy gist, snapshotting the original content alongside the upgraded file', async () => {
    const legacyContent = JSON.stringify({
      version: 1,
      reviewTags: { r1: 'REVIEW_REQUIRED' },
      deployments: {},
      notes: {},
    })

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: GIST_ID,
            description: 'GSM:STATE',
            files: { 'gsm-state.json': { filename: 'gsm-state.json' } },
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: GIST_ID,
          description: 'GSM:STATE',
          files: { 'gsm-state.json': { filename: 'gsm-state.json', content: legacyContent } },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}))

    const result = await findOrCreateGsmStateGist(TOKEN)

    expect(result.gistId).toBe(GIST_ID)
    expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.state.repos).toEqual({ r1: { reviewTag: 'REVIEW_REQUIRED' } })

    // Third call is the migration PATCH — verify it wrote both the upgraded
    // live file and a snapshot of the exact pre-migration content.
    const patchCall = fetchMock.mock.calls[2]
    expect(patchCall[0]).toBe(`https://api.github.com/gists/${GIST_ID}`)
    const patchBody = JSON.parse((patchCall[1] as RequestInit).body as string) as {
      files: Record<string, { content: string }>
    }
    expect(Object.keys(patchBody.files).sort()).toEqual(['gsm-state.json', 'gsm-state.snapshot-v0.0.0.json'])
    expect(JSON.parse(patchBody.files['gsm-state.snapshot-v0.0.0.json'].content)).toEqual(
      JSON.parse(legacyContent),
    )
    expect(JSON.parse(patchBody.files['gsm-state.json'].content).repos).toEqual({
      r1: { reviewTag: 'REVIEW_REQUIRED' },
    })
  })

  it('does not touch the gist when it is already at the current schema version', async () => {
    const currentContent = JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      kind: 'GSM:STATE',
      repos: { r1: { reviewTag: 'REVIEWED' } },
    })

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: GIST_ID,
            description: 'GSM:STATE',
            files: { 'gsm-state.json': { filename: 'gsm-state.json' } },
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: GIST_ID,
          description: 'GSM:STATE',
          files: { 'gsm-state.json': { filename: 'gsm-state.json', content: currentContent } },
        }),
      )

    const result = await findOrCreateGsmStateGist(TOKEN)

    expect(result.state.repos).toEqual({ r1: { reviewTag: 'REVIEWED' } })
    // Only the list + full-gist reads — no PATCH fired.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not overwrite a snapshot that a previous upgrade already wrote', async () => {
    const legacyContent = JSON.stringify({ version: 1, reviewTags: { r1: 'REVIEWED' } })

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: GIST_ID,
            description: 'GSM:STATE',
            files: { 'gsm-state.json': { filename: 'gsm-state.json' } },
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: GIST_ID,
          description: 'GSM:STATE',
          files: {
            'gsm-state.json': { filename: 'gsm-state.json', content: legacyContent },
            'gsm-state.snapshot-v0.0.0.json': {
              filename: 'gsm-state.snapshot-v0.0.0.json',
              content: '{"already":"here"}',
            },
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}))

    await findOrCreateGsmStateGist(TOKEN)

    const patchCall = fetchMock.mock.calls[2]
    const patchBody = JSON.parse((patchCall[1] as RequestInit).body as string) as {
      files: Record<string, unknown>
    }
    expect(Object.keys(patchBody.files)).toEqual(['gsm-state.json'])
  })
})
