import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const blogId = searchParams.get('blogId') || ''
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (status) { where += ' AND bc.status = ?'; params.push(status) }
    if (blogId) { where += ' AND bc.blog_id = ?'; params.push(Number(blogId)) }
    const comments = await query(`
      SELECT bc.*, b.title as blog_title,
        (SELECT rating FROM blog_ratings WHERE blog_id = bc.blog_id AND email = bc.email LIMIT 1) as rating
      FROM blog_comments bc LEFT JOIN blogs b ON bc.blog_id = b.id
      ${where} ORDER BY bc.created_at DESC`, params)
    return NextResponse.json({ comments })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { blog_id, name, email, comment, rating } = body
    if (!blog_id || !name || !email || !comment) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    const blog = await queryOne("SELECT id FROM blogs WHERE id = ? AND status = 'published'", [Number(blog_id)])
    if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    const result = await execute(`INSERT INTO blog_comments (blog_id, name, email, comment, status) VALUES (?, ?, ?, ?, 'pending')`, [Number(blog_id), name, email, comment])
    if (rating && rating >= 1 && rating <= 5) {
      await execute('INSERT INTO blog_ratings (blog_id, email, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?', [Number(blog_id), email, Number(rating), Number(rating)])
    }
    return NextResponse.json({ success: true, id: result.insertId, message: 'Comment submitted for review' })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
