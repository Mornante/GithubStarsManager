// Deployment records live in the GSM:STATE gist (see store/gsmStateStore.ts),
// keyed by repo id — this config just labels the feature.
export const DEPLOY_TAG = {
  key: 'DEPLOYED' as const,
  shortLabel: 'Deployed',
  description: 'Currently deployed to an environment',
}
