import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  id: null,
  title: '',
  slug: '',
  description: '',
  price: '',
  payment_info: '',
  cover_image_url: '',
  published: false,
}

export default function AdminServices() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchServicios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setServicios(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchServicios() }, [])

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(servicio) {
    setForm({ ...servicio, price: servicio.price != null ? String(servicio.price) : '' })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description,
      price: form.price ? Number(form.price) : null,
      payment_info: form.payment_info,
      cover_image_url: form.cover_image_url,
      published: form.published,
    }

    const query = form.id
      ? supabase.from('servicios').update(payload).eq('id', form.id)
      : supabase.from('servicios').insert(payload)

    const { error } = await query
    setSaving(false)

    if (error) {
      setError(error.message.includes('duplicate') ? 'Ya existe un servicio con ese slug.' : error.message)
      return
    }

    setShowForm(false)
    fetchServicios()
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar este servicio? No se puede deshacer.')) return
    await supabase.from('servicios').delete().eq('id', id)
    fetchServicios()
  }

  return (
    <div>
      <div className="admin-panel__header">
        <h2>Servicios</h2>
        {!showForm && <button className="btn-primary" onClick={openNew}>+ Nuevo servicio</button>}
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
              placeholder="lectura-de-cartas"
            />
          </label>

          <label>
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              required
              placeholder={'Usá "## " al inicio de una línea para un subtítulo, y una línea vacía para separar párrafos — igual que en el blog.'}
            />
          </label>

          <label>
            Precio (opcional, dejalo vacío si preferís "a consultar")
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>

          <label>
            Formas de pago (opcional)
            <input
              value={form.payment_info}
              onChange={(e) => setForm({ ...form, payment_info: e.target.value })}
              placeholder='ej: "2 cuotas de $5.000" o "Efectivo o transferencia"'
            />
          </label>

          <label>
            URL de imagen
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

      {!loading && servicios.length === 0 && (
        <p className="admin-empty">Todavía no hay servicios cargados.</p>
      )}

      {!loading && servicios.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Precio</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.price != null ? `$${s.price}` : 'A consultar'}</td>
                <td>{s.published ? 'Publicado' : 'Borrador'}</td>
                <td className="admin-table__actions">
                  <button className="btn-secondary" onClick={() => openEdit(s)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(s.id)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

