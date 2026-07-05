import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    if (newPassword.length < 6) return NextResponse.json({ error: 'Password too short' }, { status: 400 })
    const userId = (session.user as any).id
    const user = await queryOne<any>('SELECT password FROM users WHERE id = ?', [userId])
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password incorrect' }, { status: 400 })
    const hash = await bcrypt.hash(newPassword, 10)
    await execute('UPDATE users SET password = ? WHERE id = ?', [hash, userId])
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
