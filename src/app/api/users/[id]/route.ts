import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const id = Number(params.id)
    const { name, email, password, role, is_active } = await req.json()

    const exists = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, id])
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await execute(
        'UPDATE users SET name=?, email=?, password=?, role=?, is_active=? WHERE id=?',
        [name, email, hash, role, is_active ? 1 : 0, id]
      )
    } else {
      await execute(
        'UPDATE users SET name=?, email=?, role=?, is_active=? WHERE id=?',
        [name, email, role, is_active ? 1 : 0, id]
      )
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id
    if ((session?.user as any)?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const id = Number(params.id)
    if (String(id) === String(currentUserId)) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }
    // Set author_id null on their blogs
    await execute('UPDATE blogs SET author_id = NULL WHERE author_id = ?', [id])
    await execute('DELETE FROM users WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
