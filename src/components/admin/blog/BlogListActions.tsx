'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Eye, RotateCcw, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { blogId: number; blogSlug: string; status: string }

export default function BlogListActions({ blogId, blogSlug, status }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAction = async (action: 'trash' | 'restore' | 'delete') => {
    if (action === 'delete' && !confirm('Permanently delete this blog? This action cannot be undone.')) return
    if (action === 'trash' && !confirm('Move this blog to trash?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/blogs/${blogId}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Done')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5" style={{ flexWrap: 'nowrap' }}>
      <Link href={`/blog/${blogSlug}`} target="_blank" className="btn btn-secondary btn-sm" title="View">
        <Eye size={13} />
      </Link>
      <Link href={`/admin/blogs/edit/${blogId}`} className="btn btn-secondary btn-sm" title="Edit">
        <Edit size={13} />
      </Link>
      {status !== 'trashed' && (
        <button onClick={() => handleAction('trash')} disabled={loading} className="btn btn-danger btn-sm" title="Move to Trash">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}
