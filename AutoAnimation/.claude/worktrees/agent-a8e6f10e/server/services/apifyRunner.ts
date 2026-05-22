/**
 * Shared Apify Actor Runner — Extracted from brandDirector.ts for reuse
 * across competitor scraper, brand director, and other Apify-powered services.
 */

/**
 * Run an Apify actor and return the dataset items.
 * @param token   Apify API token
 * @param actorId Actor identifier (e.g. 'clockworks~free-tiktok-scraper')
 * @param input   Actor-specific input parameters
 * @param waitSec Maximum seconds to wait for the run to finish (default 120)
 */
export async function runApifyActor(
  token: string,
  actorId: string,
  input: Record<string, unknown>,
  waitSec = 120,
): Promise<unknown[]> {
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}&waitForFinish=${waitSec}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )

  if (!runRes.ok) {
    const errText = await runRes.text().catch(() => '')
    throw new Error(`Apify ${actorId} run failed (${runRes.status}): ${errText.slice(0, 200)}`)
  }

  const runData = (await runRes.json()) as {
    data?: { id?: string; defaultDatasetId?: string; status?: string }
  }
  const datasetId = runData.data?.defaultDatasetId
  const runId = runData.data?.id

  if (!datasetId) {
    throw new Error(
      `Apify ${actorId} run returned no dataset ID (runId=${runId}, status=${runData.data?.status})`,
    )
  }

  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`,
  )

  if (!itemsRes.ok) {
    throw new Error(`Apify dataset fetch failed (${itemsRes.status})`)
  }

  const items = await itemsRes.json()
  return Array.isArray(items) ? items : []
}

/** Get Apify token from env */
export function getApifyToken(): string | null {
  return process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN || null
}
