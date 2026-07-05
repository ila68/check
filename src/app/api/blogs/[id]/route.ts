import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { generateSlug, generateExcerpt, sanitizeHtml, generateArticleSchema, generateBreadcrumbSchema, buildCanonicalUrl } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const blog = await queryOne(`
      SELECT b.*, u.name as author_name, c.name as category_name, c.slug as category_slug
      FROM blogs b LEFT JOIN users u ON b.author_id = u.id LEFT JOIN blog_categories c ON b.category_id = c.id
      WHERE b.id = ?`, [Number(params.id)])
    if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ blog })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const id = Number(params.id)
    const existing = await queryOne<any>('SELECT * FROM blogs WHERE id = ?', [id])
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { title, slug, content, category_id, tags, status, featured_image, featured_image_alt,
      meta_title, meta_description, focus_keyword, canonical_url, og_title, og_description, og_image, scheduled_at } = body

    const finalSlug = generateSlug(slug || title)
    const slugExists = await queryOne('SELECT id FROM blogs WHERE slug = ? AND id != ?', [finalSlug, id])
    if (slugExists) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const excerpt = generateExcerpt(content || '', 200)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const canonUrl = canonical_url || buildCanonicalUrl(siteUrl, `/blog/${finalSlug}`)
    const userId = (session.user as any).id
    const user = await queryOne<any>('SELECT name FROM users WHERE id = ?', [userId])

    const articleSchema = JSON.stringify(generateArticleSchema({ ...body, slug: finalSlug, author_name: user?.name }, siteUrl))
    const breadcrumbSchema = JSON.stringify(generateBreadcrumbSchema([
      { name: 'Home', url: siteUrl }, { name: 'Blog', url: `${siteUrl}/blogs` },
      { name: title, url: `${siteUrl}/blog/${finalSlug}` },
    ]))

    const publishedAt = status === 'published' && existing.status !== 'published'
      ? new Date().toISOString().slice(0, 19).replace('T', ' ') : existing.published_at

    if (existing.category_id && existing.category_id !== category_id) {
      await execute('UPDATE blog_categories SET blog_count = GREATEST(0, blog_count - 1) WHERE id = ?', [existing.category_id])
    }
    if (category_id && category_id !== existing.category_id) {
      await execute('UPDATE blog_categories SET blog_count = blog_count + 1 WHERE id = ?', [category_id])
    }

    await execute(`
      UPDATE blogs SET title=?, slug=?, excerpt=?, content=?, category_id=?, tags=?, status=?,
        scheduled_at=?, featured_image=?, featured_image_alt=?, meta_title=?, meta_description=?,
        focus_keyword=?, canonical_url=?, og_title=?, og_description=?, og_image=?,
        article_schema=?, breadcrumb_schema=?, published_at=?
      WHERE id=?
    `, [title, finalSlug, excerpt, sanitizeHtml(content || ''), category_id || null,
        tags || '[]', status || 'draft', scheduled_at || null,
        featured_image || null, featured_image_alt || null,
        meta_title || title, meta_description || excerpt, focus_keyword || null, canonUrl,
        og_title || title, og_description || excerpt, og_image || featured_image || null,
        articleSchema, breadcrumbSchema, publishedAt, id])

    return NextResponse.json({ success: true, slug: finalSlug })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await execute("UPDATE blogs SET status = 'trashed' WHERE id = ?", [Number(params.id)])
    return NextResponse.json({ success: true, message: 'Blog moved to trash' })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
