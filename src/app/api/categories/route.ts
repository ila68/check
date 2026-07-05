import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { generateSlug } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await query(`SELECT c.*, (SELECT COUNT(*) FROM blogs b WHERE b.category_id = c.id AND b.status = 'published') as blog_count FROM blog_categories c ORDER BY c.name`)
    return NextResponse.json({ categories })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { name, description, image, meta_title, meta_description, canonical_url, og_title, og_description } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const slug = generateSlug(body.slug || name)
    const exists = await queryOne('SELECT id FROM blog_categories WHERE slug = ?', [slug])
    if (exists) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    const result = await execute(`INSERT INTO blog_categories (name, slug, description, image, meta_title, meta_description, canonical_url, og_title, og_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, image || null, meta_title || name, meta_description || null, canonical_url || null, og_title || name, og_description || null])
    return NextResponse.json({ success: true, id: result.insertId })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
