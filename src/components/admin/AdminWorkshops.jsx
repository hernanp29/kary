import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  id: null,
  title: '',
  slug: '',
  description: '',
  modality: 'online',
  event_date: '',
  capacity: '',
  price: '',
  content_url: '',
}

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchWorkshops() {
    setLoading(true)
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .order('event_date', { ascending: true })
    if (!error) setWorkshops(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchWorkshops() }, [])

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

  function openEdit(workshop) {
    setForm({
      ...workshop,
      price: String(workshop.price),
      capacity: workshop.capacity != null ? String(workshop.capacity) : '',
      event_date: workshop.event_date ? workshop.event_date.slice(0, 16) : '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const priceNum = Number(form.price)
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('El precio tiene que ser un número válido.')
      return
    }

    if (form.modality === 'presencial' && !form.capacity) {
      setError('Los talleres presenciales necesitan un cupo.')
      return
    }

    setSaving(true)

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description,
      modality: form.modality,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      capacity: form.capacity ? Number(form.capacity) : null,
      price: priceNum,
      content_url: form.content_url,
    }

    const query = form.id
      ? supabase.from('workshops').update(payload).eq('id', form.id)
      : supabase.from('workshops').insert(payload)

    const { error } = await query
    setSaving(false)

    if (error) {
      setError(error.message.includes('duplicate') ? 'Ya existe un taller con ese slug.' : error.message)
      return
    }

    setShowForm(false)
    fetchWorkshops()
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar este taller? No se puede deshacer.')) return
    await supabase.from('workshops').delete().eq('id', id)
    fetchWorkshops()
  }

  return (
    <div>
      <div className="admin-panel__header">
        <h2>Talleres</h2>
        {!showForm && <button className="btn-primary" onClick={openNew}>+ Nuevo taller</button>}
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
            />
          </label>

          <label>
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="admin-form__row">
            <label>
              Modalidad
              <select
                value={form.modality}
                onChange={(e) => setForm({ ...form, modality: e.target.value })}
              >
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
              </select>
            </label>

            <label>
              Fecha y hora
              <input
                type="datetime-local"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </label>
          </div>

          <div className="admin-form__row">
            <label>
              Precio
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>

            {form.modality === 'presencial' && (
              <label>
                Cupo
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  required
                />
              </label>
            )}

            {form.modality === 'online' && (
              <label>
                URL de material/video (tras el pago)
                <input
                  value={form.content_url}
                  onChange={(e) => setForm({ ...form, content_url: e.target.value })}
                  placeholder="https://…"
                />
              </label>
            )}
          </div>

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

      {!loading && workshops.length === 0 && (
        <p className="admin-empty">Todavía no hay talleres cargados.</p>
      )}

      {!loading && workshops.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Modalidad</th>
              <th>Fecha</th>
              <th>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workshops.map((w) => (
              <tr key={w.id}>
                <td>{w.title}</td>
                <td>{w.modality}</td>
                <td>{w.event_date ? new Date(w.event_date).toLocaleDateString('es-AR') : '—'}</td>
                <td>${Number(w.price).toFixed(2)}</td>
                <td className="admin-table__actions">
                  <button className="btn-secondary" onClick={() => openEdit(w)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(w.id)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
