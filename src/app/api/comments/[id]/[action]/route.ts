import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string; action: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number(params.id)
    switch (params.action) {
      case 'approve':
        await execute("UPDATE blog_comments SET status = 'approved' WHERE id = ?", [id])
        return NextResponse.json({ success: true, message: 'Comment approved' })
      case 'reject':
        await execute("UPDATE blog_comments SET status = 'rejected' WHERE id = ?", [id])
        return NextResponse.json({ success: true, message: 'Comment rejected' })
      case 'delete':
        await execute('DELETE FROM blog_comments WHERE id = ?', [id])
        return NextResponse.json({ success: true, message: 'Comment deleted' })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
