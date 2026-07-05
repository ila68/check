import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string; action: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number(params.id)
    switch (params.action) {
      case 'trash':
        await execute("UPDATE blogs SET status = 'trashed' WHERE id = ?", [id])
        return NextResponse.json({ success: true, message: 'Blog moved to trash' })
      case 'restore':
        await execute("UPDATE blogs SET status = 'draft' WHERE id = ?", [id])
        return NextResponse.json({ success: true, message: 'Blog restored' })
      case 'delete':
        const blog = await queryOne<any>('SELECT category_id FROM blogs WHERE id = ?', [id])
        if (blog?.category_id) await execute('UPDATE blog_categories SET blog_count = GREATEST(0, blog_count - 1) WHERE id = ?', [blog.category_id])
        await execute('DELETE FROM blog_comments WHERE blog_id = ?', [id])
        await execute('DELETE FROM blog_ratings WHERE blog_id = ?', [id])
        await execute('DELETE FROM blogs WHERE id = ?', [id])
        return NextResponse.json({ success: true, message: 'Blog permanently deleted' })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
