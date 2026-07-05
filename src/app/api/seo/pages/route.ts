import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const pages = await query('SELECT * FROM page_seo ORDER BY page_name')
    return NextResponse.json({ pages })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { page_name, page_identifier, slug } = await req.json()
    if (!page_name) return NextResponse.json({ error: 'Page name required' }, { status: 400 })
    const result = await execute('INSERT INTO page_seo (page_name, page_identifier, slug) VALUES (?, ?, ?)',
      [page_name, page_identifier || page_name.toLowerCase().replace(/\s+/g, '-'), slug || `/${page_identifier}`])
    return NextResponse.json({ success: true, id: result.insertId })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
