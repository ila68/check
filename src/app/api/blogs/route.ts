import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { generateSlug, generateExcerpt, sanitizeHtml, generateArticleSchema, generateBreadcrumbSchema, buildCanonicalUrl } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const perPage = Number(searchParams.get('perPage') || 10)
    const status = searchParams.get('status') || 'published'
    const categorySlug = searchParams.get('category') || ''
    const q = searchParams.get('q') || ''
    const offset = (page - 1) * perPage

    let where = 'WHERE b.deleted_at IS NULL'
    const params: any[] = []

    if (status !== 'all') { where += ' AND b.status = ?'; params.push(status) }
    if (categorySlug) { where += ' AND c.slug = ?'; params.push(categorySlug) }
    if (q) { where += ' AND (b.title LIKE ? OR b.excerpt LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }

    const countResult = await queryOne<any>(`SELECT COUNT(*) as c FROM blogs b LEFT JOIN blog_categories c ON b.category_id = c.id ${where}`, params)
    const total = countResult?.c || 0

    const blogs = await query(`
      SELECT b.id, b.title, b.slug, b.excerpt, b.featured_image, b.status,
             b.published_at, b.created_at, b.views, b.tags,
             b.meta_title, b.meta_description, b.canonical_url, b.og_title, b.og_description, b.og_image,
             u.name as author_name, c.name as category_name, c.slug as category_slug,
             (SELECT AVG(rating) FROM blog_ratings WHERE blog_id = b.id) as avg_rating,
             (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id AND status = 'approved') as comment_count
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      LEFT JOIN blog_categories c ON b.category_id = c.id
      ${where}
      ORDER BY b.published_at DESC, b.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, perPage, offset])

    return NextResponse.json({ blogs, total, page, perPage, totalPages: Math.ceil(total / perPage) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, slug, content, category_id, tags, status, featured_image, featured_image_alt,
      meta_title, meta_description, focus_keyword, canonical_url, og_title, og_description, og_image, scheduled_at } = body

    if (!title || !slug) return NextResponse.json({ error: 'Title and slug required' }, { status: 400 })

    const finalSlug = generateSlug(slug || title)
    const existing = await queryOne('SELECT id FROM blogs WHERE slug = ?', [finalSlug])
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

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

    const result = await execute(`
      INSERT INTO blogs (title, slug, excerpt, content, category_id, author_id, tags, status, scheduled_at,
        featured_image, featured_image_alt, meta_title, meta_description, focus_keyword, canonical_url,
        og_title, og_description, og_image, article_schema, breadcrumb_schema, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, finalSlug, excerpt, sanitizeHtml(content || ''), category_id || null, userId,
        tags || '[]', status || 'draft', scheduled_at || null,
        featured_image || null, featured_image_alt || null,
        meta_title || title, meta_description || excerpt, focus_keyword || null, canonUrl,
        og_title || title, og_description || excerpt, og_image || featured_image || null,
        articleSchema, breadcrumbSchema,
        status === 'published' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null])

    if (category_id) {
      await execute('UPDATE blog_categories SET blog_count = blog_count + 1 WHERE id = ?', [category_id])
    }

    return NextResponse.json({ success: true, id: result.insertId, slug: finalSlug })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
