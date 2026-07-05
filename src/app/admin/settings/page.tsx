'use client'
import { useState } from 'react'
import { Save, Lock, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      })
      const data = await res.json()
      if (data.success) { toast.success('Password changed successfully!'); setPwForm({ current: '', newPw: '', confirm: '' }) }
      else toast.error(data.error || 'Failed to change password')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Manage your account and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} color="var(--primary)" /> Change Password
          </h3>
          <form onSubmit={changePassword} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required autoComplete="current-password" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} required minLength={6} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <span className="spinner" /> : <Save size={14} />} Update Password
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="var(--primary)" /> System Info
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'CMS Version', value: '1.0.0' },
              { label: 'Database', value: 'MySQL' },
              { label: 'Framework', value: 'Next.js 14' },
              { label: 'Authentication', value: 'NextAuth.js (JWT)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--ink-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(67,97,238,0.05)', borderRadius: 8, border: '1px solid rgba(67,97,238,0.15)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a href="/api/sitemap" target="_blank" style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none' }}>📄 View Sitemap XML</a>
              <a href="/api/robots" target="_blank" style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none' }}>🤖 View Robots.txt</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
