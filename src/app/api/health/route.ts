import { NextResponse } from 'next/server'
import { getInventorySummary } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Liveness plus a cheap read through the data layer, for container probes. */
export async function GET() {
  try {
    const summary = await getInventorySummary()
    return NextResponse.json({
      status: 'ok',
      catalogue: { skuCount: summary.skuCount, unitCount: summary.unitCount },
    })
  } catch {
    return NextResponse.json({ status: 'degraded' }, { status: 503 })
  }
}
