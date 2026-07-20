import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  id: null,
  title: '',
  slug: '',
  description: '',
  file_url: '',
  cover_image_url: '',
  published: false,
}

export default function AdminRecursos() {
  const [recursos, setRecursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchRecursos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('recursos')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setRecursos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecursos() }, [])

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setFile(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(recurso) {
    setForm(recurso)
    setFile(null)
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.id && !file) {
      setError('Elegí un archivo PDF para subir.')
      return
    }

    setSaving(true)

    const slug = form.slug || slugify(form.title)
    let file_url = form.file_url

    if (file) {
      const path = `${slug}-${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('recursos')
        .upload(path, file, { contentType: 'application/pdf' })

      if (uploadError) {
        setSaving(false)
        setError(`Error al subir el archivo: ${uploadError.message}`)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('recursos').getPublicUrl(path)
      file_url = publicUrlData.publicUrl
    }

    const payload = {
      title: form.title,
      slug,
      description: form.description,
      file_url,
      cover_image_url: form.cover_image_url,
      published: form.published,
    }

    const query = form.id
      ? supabase.from('recursos').update(payload).eq('id', form.id)
      : supabase.from('recursos').insert(payload)

    const { error } = await query
    setSaving(false)

    if (error) {
      setError(error.message.includes('duplicate') ? 'Ya existe un recurso con ese slug.' : error.message)
      return
    }

    setShowForm(false)
    fetchRecursos()
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar este recurso? No se puede deshacer.')) return
    await supabase.from('recursos').delete().eq('id', id)
    fetchRecursos()
  }

  return (
    <div>
      <div className="admin-panel__header">
        <h2>Recursos gratis</h2>
        {!showForm && <button className="btn-primary" onClick={openNew}>+ Nuevo recurso</button>}
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
              placeholder="guia-de-plantas"
            />
          </label>

          <label>
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </label>

          <label>
            Archivo PDF {form.id && '(dejalo vacío para mantener el actual)'}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {form.id && form.file_url && !file && (
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Archivo actual: <a href={form.file_url} target="_blank" rel="noopener noreferrer">ver PDF</a>
              </span>
            )}
          </label>

          <label>
            URL de imagen de portada (opcional)
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

      {!loading && recursos.length === 0 && (
        <p className="admin-empty">Todavía no hay recursos cargados.</p>
      )}

      {!loading && recursos.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recursos.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.published ? 'Publicado' : 'Borrador'}</td>
                <td className="admin-table__actions">
                  <button className="btn-secondary" onClick={() => openEdit(r)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(r.id)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
