'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Save, Eye, EyeOff, ShieldCheck, User, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access to everything', color: '#4361ee', bg: '#eef1fd' },
  { value: 'admin', label: 'Admin', desc: 'Blog add/edit/delete only', color: '#d97706', bg: '#fef3c7' },
  { value: 'editor', label: 'Editor', desc: 'Write and edit blogs', color: '#059669', bg: '#d1fae5' },
  { value: 'author', label: 'Author', desc: 'Write own blogs only', color: '#7c3aed', bg: '#ede9fe' },
]

const emptyForm = { name: '', email: '', password: '', role: 'admin', is_active: true }

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [showPw, setShowPw] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) setUsers(data.users)
      else toast.error(data.error || 'Failed to load users')
    } catch { toast.error('Error loading users') }
    setLoading(false)
  }

  const openAdd = () => { setEditUser(null); setForm({ ...emptyForm }); setShowForm(true) }
  const openEdit = (user: any) => { setEditUser(user); setForm({ name: user.name, email: user.email, password: '', role: user.role, is_active: !!user.is_active }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditUser(null) }
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return }
    if (!editUser && !form.password) { toast.error('Password is required for new user'); return }
    if (form.password && form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSaving(true)
    try {
      const res = await fetch(editUser ? `/api/users/${editUser.id}` : '/api/users', {
        method: editUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editUser ? 'User updated successfully!' : 'User created! They can now login.')
        closeForm(); fetchUsers()
      } else toast.error(data.error || 'Failed')
    } catch { toast.error('Something went wrong') }
    setSaving(false)
  }

  const toggleActive = async (user: any) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, is_active: !user.is_active }),
    })
    const data = await res.json()
    if (data.success) { toast.success(user.is_active ? 'User deactivated' : 'User activated'); fetchUsers() }
    else toast.error(data.error || 'Failed')
  }

  const deleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"? Their blogs will be unlinked.`)) return
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success('User deleted'); fetchUsers() }
    else toast.error(data.error || 'Failed')
  }

  const getRoleInfo = (role: string) => ROLES.find(r => r.value === role) || ROLES[1]

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>User Management</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{users.length} users — Share access and assign roles</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><Plus size={15} /> Add New User</button>
      </div>

      {/* Role info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {ROLES.map(role => (
          <div key={role.value} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem 1rem', borderLeft: `3px solid ${role.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={14} color={role.color} />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: role.color }}>{role.label}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.4 }}>{role.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
        {/* Table */}
        <div className="card p-0">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th><th>Role</th>
                    <th className="hide-mobile">Blogs</th>
                    <th>Status</th>
                    <th className="hide-mobile">Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const roleInfo = getRoleInfo(user.role)
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: roleInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: roleInfo.color, fontSize: '0.9rem', flexShrink: 0 }}>
                              {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>{user.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: roleInfo.bg, color: roleInfo.color, borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>
                            <ShieldCheck size={11} /> {roleInfo.label}
                          </span>
                        </td>
                        <td className="hide-mobile" style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{user.blog_count} blogs</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: user.is_active ? '#d1fae5' : '#fee2e2', color: user.is_active ? '#059669' : '#dc2626', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>
                            {user.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="hide-mobile" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openEdit(user)} className="btn btn-secondary btn-sm" title="Edit"><Edit size={13} /></button>
                            <button onClick={() => toggleActive(user)} className="btn btn-sm" title={user.is_active ? 'Deactivate' : 'Activate'}
                              style={{ background: user.is_active ? '#fef3c7' : '#d1fae5', color: user.is_active ? '#d97706' : '#059669', border: 'none' }}>
                              {user.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button onClick={() => deleteUser(user)} className="btn btn-danger btn-sm" title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
                  <User size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p>No users found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1.75rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="var(--primary)" />
                {editUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. John Smith" autoComplete="off" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" autoComplete="off" />
            </div>
            <div className="form-group">
              <label className="form-label">
                Password {editUser && <span style={{ color: 'var(--ink-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(leave blank to keep current)</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} className="form-input" value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder={editUser ? 'New password (optional)' : 'Min 6 characters'} style={{ paddingRight: 40 }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
              </select>
            </div>

            {form.role && (
              <div style={{ padding: '0.75rem', background: getRoleInfo(form.role).bg, border: `1px solid ${getRoleInfo(form.role).color}30`, borderRadius: 8, marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <ShieldCheck size={13} color={getRoleInfo(form.role).color} />
                  <span style={{ fontWeight: 700, color: getRoleInfo(form.role).color }}>{getRoleInfo(form.role).label}</span>
                </div>
                <div style={{ color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                  {form.role === 'super_admin' && '✅ Full access — Categories, Comments, Media, SEO, Users, Settings & Blogs'}
                  {form.role === 'admin' && '✅ Can add, edit and delete blogs\n❌ No access to SEO, Categories, Media'}
                  {form.role === 'editor' && '✅ Can write and edit blogs'}
                  {form.role === 'author' && '✅ Can write their own blogs only'}
                </div>
              </div>
            )}

            <div className="form-group mb-0">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink)' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                Active (user can login)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary">
                {saving ? <span className="spinner" /> : <Save size={14} />}
                {editUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
