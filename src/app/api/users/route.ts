import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const users = await query(`
      SELECT id, name, email, role, is_active, created_at,
        (SELECT COUNT(*) FROM blogs WHERE author_id = users.id) as blog_count
      FROM users ORDER BY created_at DESC
    `)
    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const { name, email, password, role } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
    }
    const exists = await queryOne('SELECT id FROM users WHERE email = ?', [email])
    if (exists) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })

    const hash = await bcrypt.hash(password, 10)
    const result = await execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role || 'admin']
    )
    return NextResponse.json({ success: true, id: result.insertId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
