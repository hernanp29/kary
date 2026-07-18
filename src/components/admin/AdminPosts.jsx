import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  id: null,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  cover_image_url: '',
  published: false,
}

export default function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  function openNew() {
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(post) {
    setForm(post)
    setError('')
    setShowForm(true)
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      cover_image_url: form.cover_image_url,
      published: form.published,
      published_at: form.published ? new Date().toISOString() : null,
    }

    const query = form.id
      ? supabase.from('posts').update(payload).eq('id', form.id)
      : supabase.from('posts').insert(payload)

    const { error } = await query
    setSaving(false)

    if (error) {
      setError(error.message.includes('duplicate') ? 'Ya existe un post con ese slug.' : error.message)
      return
    }

    setShowForm(false)
    fetchPosts()
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar esta publicación? No se puede deshacer.')) return
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts()
  }

  return (
    <div>
      <div className="admin-panel__header">
        <h2>Publicaciones</h2>
        {!showForm && <button className="btn-primary" onClick={openNew}>+ Nueva publicación</button>}
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Título
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>

          <label>
            Slug (URL, se genera solo si lo dejás vacío)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="mi-primer-post"
            />
          </label>

          <label>
            Categoría
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="plantas medicinales, recetas, casos de uso…"
            />
          </label>

          <label>
            Resumen (excerpt)
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </label>

          <label>
            Contenido
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              style={{ minHeight: 180 }}
            />
          </label>

          <label>
            URL de imagen de portada
            <input
              value={form.cover_image_url}
              onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
              placeholder="https://…"
            />
          </label>

          <label className="admin-form__checkbox" style={{ flexDirection: 'row' }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publicado (visible en el sitio)
          </label>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-form__actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && <p className="admin-empty">Cargando…</p>}

      {!loading && posts.length === 0 && (
        <p className="admin-empty">Todavía no hay publicaciones cargadas.</p>
      )}

      {!loading && posts.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.category || '—'}</td>
                <td>{p.published ? 'Publicado' : 'Borrador'}</td>
                <td className="admin-table__actions">
                  <button className="btn-secondary" onClick={() => openEdit(p)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(p.id)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
