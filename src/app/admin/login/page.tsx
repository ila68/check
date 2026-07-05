'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, FileText, Lock, Mail, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.ok) {
      toast.success('Welcome back!')
      router.push('/admin/dashboard')
    } else {
      toast.error('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecff 100%)', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: '#4361ee', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <FileText size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>Admin Panel</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 8px 40px rgba(67,97,238,0.1)', border: '1px solid #e8ecf0' }}>
          <form onSubmit={handleLogin} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ paddingLeft: 38 }}
                  autoComplete="new-email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: '#4361ee', color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '0.5rem', opacity: loading ? 0.8 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}>
              {loading ? <><Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#9ca3af', marginTop: '1.5rem' }}>
          &larr; <a href="/" style={{ color: '#4361ee', textDecoration: 'none' }}>Back to website</a>
        </p>
      </div>
    </div>
  )
}
