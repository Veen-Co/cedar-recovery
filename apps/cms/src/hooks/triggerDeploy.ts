import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

// Fires apps/web's Vercel deploy hook so the static site rebuilds whenever
// content is published. Known tradeoff: rapid successive edits fire
// multiple rebuilds — acceptable for a low-traffic site, a debounce/queue
// is a future refinement, not needed now.
async function fireDeployHook() {
  const url = process.env.DEPLOY_HOOK_URL
  if (!url) {
    console.log('[triggerDeploy] DEPLOY_HOOK_URL not set — skipping (expected in local dev).')
    return
  }

  try {
    await fetch(url, { method: 'POST' })
    console.log('[triggerDeploy] Deploy hook fired.')
  } catch (err) {
    // Never fail the actual save/publish just because the deploy hook is
    // unreachable.
    console.error('[triggerDeploy] Failed to trigger deploy hook:', err)
  }
}

// Use on collections with drafts (Posts, Pages): only rebuild once a
// document is actually published, not on every draft save.
export const triggerDeployOnPublish: CollectionAfterChangeHook = async ({ doc }) => {
  if (doc._status === 'published') {
    await fireDeployHook()
  }
  return doc
}

// Use on collections without drafts (Categories): every save is already
// "live", so every change should trigger a rebuild.
export const triggerDeployAlways: CollectionAfterChangeHook = async ({ doc }) => {
  await fireDeployHook()
  return doc
}

export const triggerDeployAfterDelete: CollectionAfterDeleteHook = async () => {
  await fireDeployHook()
}

export const triggerDeployGlobalOnPublish: GlobalAfterChangeHook = async ({ doc }) => {
  if (doc._status === 'published') {
    await fireDeployHook()
  }
  return doc
}
