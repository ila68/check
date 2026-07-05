import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const rows = await query<any>('SELECT setting_key, value FROM seo_settings')
    const settings: Record<string, string> = {}
    rows.forEach((r: any) => { settings[r.setting_key] = r.value })
    return NextResponse.json({ settings })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    for (const [k, v] of Object.entries(body)) {
      await execute('INSERT INTO seo_settings (setting_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?', [k, v || null, v || null])
    }
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
