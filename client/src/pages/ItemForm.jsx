import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

const inputCls = 'w-full border rounded px-2 py-1'

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit mode: load the item and fill the form.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setError('')
    api
      .get(`/items/${id}`)
      .then((res) => {
        if (cancelled) return
        const item = res.data
        setForm({
          title: item.title ?? '',
          status: item.status ?? defaults.status,
          category: item.category ?? defaults.category,
          location: item.location ?? '',
          description: item.description ?? '',
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message || err.message || 'Could not load item')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // Every input has a `name` matching a key in `form`.
  function onChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Send only the five editable fields — never `reportedBy` (server rejects it).
    const { title, status, category, location, description } = form
    const payload = { title, status, category, location, description }

    try {
      if (id) await api.patch(`/items/${id}`, payload)
      else await api.post('/items', payload)
      nav('/items')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-sm mb-1">Title</label>
          <input
            id="title"
            name="title"
            className={inputCls}
            value={form.title}
            onChange={onChange}
            placeholder="Black backpack"
            required
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm mb-1">Status</label>
          <select id="status" name="status" className={inputCls} value={form.status} onChange={onChange}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm mb-1">Category</label>
          <select id="category" name="category" className={inputCls} value={form.category} onChange={onChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm mb-1">Location (optional)</label>
          <input
            id="location"
            name="location"
            className={inputCls}
            value={form.location}
            onChange={onChange}
            placeholder="Library 2nd floor"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm mb-1">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            className={inputCls}
            rows={4}
            value={form.description}
            onChange={onChange}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}