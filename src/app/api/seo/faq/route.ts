import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const faqs = await query('SELECT * FROM faq_schema WHERE page_id IS NULL ORDER BY sort_order')
    return NextResponse.json({ faqs })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { faqs } = await req.json()
    await execute('DELETE FROM faq_schema WHERE page_id IS NULL')
    for (let i = 0; i < (faqs || []).length; i++) {
      const f = faqs[i]
      if (f.question && f.answer) await execute('INSERT INTO faq_schema (question, answer, sort_order) VALUES (?, ?, ?)', [f.question, f.answer, i])
    }
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
