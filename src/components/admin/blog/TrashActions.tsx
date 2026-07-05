'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrashActions({ blogId }: { blogId: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAction = async (action: 'restore' | 'delete') => {
    if (action === 'delete' && !confirm('Permanently delete this blog? This action cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/blogs/${blogId}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) { toast.success(data.message); router.refresh() }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => handleAction('restore')} disabled={loading} className="btn btn-success btn-sm">
        <RotateCcw size={13} /> Restore
      </button>
      <button onClick={() => handleAction('delete')} disabled={loading} className="btn btn-danger btn-sm">
        <Trash2 size={13} /> Delete
      </button>
    </div>
  )
}
