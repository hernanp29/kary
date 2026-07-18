import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  id: null,
  name: '',
  slug: '',
  description: '',
  price: '',
  image_url: '',
  status: 'disponible',
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

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

  function openEdit(product) {
    setForm({ ...product, price: String(product.price) })
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

    setSaving(true)

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      price: priceNum,
      image_url: form.image_url,
      status: form.status,
    }

    const query = form.id
      ? supabase.from('products').update(payload).eq('id', form.id)
      : supabase.from('products').insert(payload)

    const { error } = await query
    setSaving(false)

    if (error) {
      setError(error.message.includes('duplicate') ? 'Ya existe un producto con ese slug.' : error.message)
      return
    }

    setShowForm(false)
    fetchProducts()
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar este producto? No se puede deshacer.')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  return (
    <div>
      <div className="admin-panel__header">
        <h2>Tienda</h2>
        {!showForm && <button className="btn-primary" onClick={openNew}>+ Nuevo producto</button>}
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label>
            Slug (URL, se genera solo si lo dejás vacío)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="tintura-de-caléndula"
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

            <label>
              Estado
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="disponible">Disponible</option>
                <option value="agotado">Agotado</option>
              </select>
            </label>
          </div>

          <label>
            URL de imagen
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://…"
            />
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

      {!loading && products.length === 0 && (
        <p className="admin-empty">Todavía no hay productos cargados.</p>
      )}

      {!loading && products.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>${Number(p.price).toFixed(2)}</td>
                <td>{p.status}</td>
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
