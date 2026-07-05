import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const media = await query('SELECT * FROM media_library ORDER BY created_at DESC')
    return NextResponse.json({ media })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
