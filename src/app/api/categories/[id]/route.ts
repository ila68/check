import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { generateSlug } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { name, description, image, meta_title, meta_description, canonical_url, og_title, og_description } = body
    const slug = generateSlug(body.slug || name)
    const exists = await queryOne('SELECT id FROM blog_categories WHERE slug = ? AND id != ?', [slug, Number(params.id)])
    if (exists) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    await execute(`UPDATE blog_categories SET name=?, slug=?, description=?, image=?, meta_title=?, meta_description=?, canonical_url=?, og_title=?, og_description=? WHERE id=?`,
      [name, slug, description || null, image || null, meta_title || name, meta_description || null, canonical_url || null, og_title || name, og_description || null, Number(params.id)])
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const countRow = await queryOne<any>('SELECT COUNT(*) as c FROM blogs WHERE category_id = ?', [Number(params.id)])
    if (countRow?.c > 0) return NextResponse.json({ error: `Cannot delete: ${countRow.c} blogs use this category` }, { status: 400 })
    await execute('DELETE FROM blog_categories WHERE id = ?', [Number(params.id)])
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
