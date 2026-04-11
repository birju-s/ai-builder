import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

export const dynamic = 'force-dynamic'

const TELEMETRY_DIR = path.join(process.cwd(), '.siteforge', 'telemetry')

async function readJsonl(filepath: string) {
  if (!fs.existsSync(filepath)) return []
  const items = []
  const rl = readline.createInterface({
    input: fs.createReadStream(filepath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      items.push(JSON.parse(line))
    } catch {
      // Ignore invalid JSON lines
    }
  }
  return items
}

export async function GET() {
  try {
    const pipelines = await readJsonl(path.join(TELEMETRY_DIR, 'pipeline_runs.jsonl'))
    const fixes = await readJsonl(path.join(TELEMETRY_DIR, 'pipeline_fixes.jsonl'))
    const tokens = await readJsonl(path.join(TELEMETRY_DIR, 'token_usage.jsonl'))

    // 1. Pipeline Success Rate
    const totalRuns = pipelines.length
    const successfulRuns = pipelines.filter((p: Record<string, unknown>) => p.success).length
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100

    // 2. Telemetry Fixes (Layers A, B, C)
    const layerStats = fixes.reduce((acc: Record<string, { total: number; success: number; failed: number }>, f: Record<string, unknown>) => {
      const layer = (f.layer as string) || 'Unknown'
      if (!acc[layer]) acc[layer] = { total: 0, success: 0, failed: 0 }
      acc[layer].total++
      if (f.success) acc[layer].success++
      else acc[layer].failed++
      return acc
    }, {})

    // 3. Token Usage and Cache Metrics
    const agentTokens = tokens.reduce((acc: Record<string, { inputTokens: number; outputTokens: number; cacheHitTokens: number; calls: number }>, t: Record<string, unknown>) => {
      const agent = (t.agent as string) || 'unknown'
      if (!acc[agent]) {
        acc[agent] = { inputTokens: 0, outputTokens: 0, cacheHitTokens: 0, calls: 0 }
      }
      acc[agent].calls++
      acc[agent].inputTokens += (t.inputTokens as number) || 0
      acc[agent].outputTokens += (t.outputTokens as number) || 0
      acc[agent].cacheHitTokens += (t.cacheReadInputTokens as number) || 0
      return acc
    }, {})

    const totalCacheRead = tokens.reduce((sum: number, t: Record<string, unknown>) => sum + ((t.cacheReadInputTokens as number) || 0), 0)
    const totalInputTokens = tokens.reduce((sum: number, t: Record<string, unknown>) => sum + ((t.inputTokens as number) || 0), 0)
    const cacheHitRate = totalInputTokens > 0 ? (totalCacheRead / (totalInputTokens + totalCacheRead)) * 100 : 0

    return new Response(JSON.stringify({
      pipeline: {
        totalRuns,
        successfulRuns,
        successRatePercent: Math.round(successRate * 100) / 100,
      },
      fixes: layerStats,
      tokens: {
        byAgent: agentTokens,
        totalCacheRead,
        totalInputTokens,
        cacheHitRatePercent: Math.round(cacheHitRate * 100) / 100,
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
