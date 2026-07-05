'use client'
import { useState, useEffect } from 'react'
import { Check, X, Trash2, Star, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateShort } from '@/lib/utils'

export default function CommentsPage() {
  const [comments, setComments] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchComments() }, [filter])

  const fetchComments = async () => {
    setLoading(true)
    const res = await fetch(`/api/comments?status=${filter === 'all' ? '' : filter}`)
    const data = await res.json()
    setComments(data.comments || [])
    setLoading(false)
  }

  const action = async (id: number, act: string) => {
    const res = await fetch(`/api/comments/${id}/${act}`, { method: 'POST' })
    const data = await res.json()
    if (data.success) { toast.success(data.message || 'Done'); fetchComments() }
    else toast.error(data.error || 'Failed')
  }

  const del = async (id: number) => {
    if (!confirm('Delete this comment?')) return
    action(id, 'delete')
  }

  const filters = [
    { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Comments</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{comments.length} comments</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}><span className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {comments.map((c: any) => (
            <div key={c.id} className="card">
              <div className="flex items-start gap-3">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(67,97,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageSquare size={18} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{c.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{c.email}</span>
                    {c.rating && (
                      <span className="flex items-center gap-1" style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                        {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                      </span>
                    )}
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', margin: '0.25rem 0' }}>{c.comment}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                    on: <strong>{c.blog_title}</strong> · {formatDateShort(c.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.status !== 'approved' && (
                    <button onClick={() => action(c.id, 'approve')} className="btn btn-success btn-sm" title="Approve">
                      <Check size={13} />
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button onClick={() => action(c.id, 'reject')} className="btn btn-secondary btn-sm" title="Reject">
                      <X size={13} />
                    </button>
                  )}
                  <button onClick={() => del(c.id)} className="btn btn-danger btn-sm" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>No comments found.</div>
          )}
        </div>
      )}
    </div>
  )
}
