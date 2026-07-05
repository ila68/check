import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const blog = await queryOne(`
      SELECT b.*, u.name as author_name, u.avatar as author_avatar, u.bio as author_bio,
             c.name as category_name, c.slug as category_slug
      FROM blogs b LEFT JOIN users u ON b.author_id = u.id LEFT JOIN blog_categories c ON b.category_id = c.id
      WHERE b.slug = ? AND b.status = 'published'`, [params.slug]) as any
    if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await execute('UPDATE blogs SET views = views + 1 WHERE slug = ?', [params.slug])

    const comments = await query(`SELECT * FROM blog_comments WHERE blog_id = ? AND status = 'approved' ORDER BY created_at DESC`, [blog.id])
    const ratings = await queryOne(`SELECT AVG(rating) as avg, COUNT(*) as count FROM blog_ratings WHERE blog_id = ?`, [blog.id])
    const related = await query(`SELECT id, title, slug, featured_image, excerpt, published_at FROM blogs WHERE category_id = ? AND id != ? AND status = 'published' ORDER BY published_at DESC LIMIT 3`, [blog.category_id, blog.id])

    return NextResponse.json({ blog, comments, ratings, related })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
