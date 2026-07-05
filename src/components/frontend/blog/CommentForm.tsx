'use client'
import { useState } from 'react'
import { MessageSquare, Send, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CommentForm({ blogId }: { blogId: number }) {
  const [form, setForm] = useState({ name: '', email: '', comment: '', rating: 0 })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.comment) { toast.error('All fields are required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, blog_id: blogId }),
      })
      const data = await res.json()
      if (data.success) { setSubmitted(true); toast.success('Comment submitted for review!') }
      else toast.error(data.error || 'Failed to submit comment')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#d1fae5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
        <p style={{ fontWeight: 600, color: '#065f46' }}>Thank you for your comment!</p>
        <p style={{ color: '#047857', fontSize: '0.875rem', marginTop: '0.25rem' }}>Your comment is pending review and will appear once approved.</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginTop: '1.5rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquare size={18} color="var(--primary)" /> Leave a Comment
      </h3>

      <div className="form-group">
        <label className="form-label">Your Rating</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button"
              onClick={() => set('rating', n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '1.5rem', color: n <= (hoverRating || form.rating) ? '#f59e0b' : '#d1d5db', transition: 'color 0.1s' }}>
              ★
            </button>
          ))}
          {form.rating > 0 && <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginLeft: 6 }}>{form.rating} / 5</span>}
        </div>
      </div>

      <form onSubmit={submit} autoComplete="off">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Comment *</label>
          <textarea className="form-textarea" value={form.comment} onChange={e => set('comment', e.target.value)} placeholder="Share your thoughts..." style={{ minHeight: 120 }} required />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Submitting...</> : <><Send size={14} /> Post Comment</>}
        </button>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>Your email will not be published. Comments are reviewed before appearing.</p>
      </form>
    </div>
  )
}
