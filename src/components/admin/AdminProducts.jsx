import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // saca acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  stock: '0',
  categoryId: '',
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)

  // Form de producto (sirve tanto para crear como para editar)
  const [form, setForm] = useState(EMPTY_FORM)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Mover producto de categoría (por fila, en la lista)
  const [movingProductId, setMovingProductId] = useState(null)

  // Eliminar categoría
  const [deletingCategoryId, setDeletingCategoryId] = useState(null)
  const [reassignTarget, setReassignTarget] = useState('')
  const [categoryActionMessage, setCategoryActionMessage] = useState('')
  const [categoryActionBusy, setCategoryActionBusy] = useState(false)

  async function fetchAll() {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('id, name, slug, description, price, image_url, stock, category_id').order('created_at', { ascending: false }),
      supabase.from('categorias').select('id, nombre, descripcion').order('nombre'),
    ])
    setProducts(prods || [])
    setCategorias(cats || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  function resetForm() {
    setForm(EMPTY_FORM)
    setCreatingCategory(false)
    setNewCategoryName('')
    setNewCategoryDesc('')
    setMessage('')
  }

  function openEdit(product) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      imageUrl: product.image_url || '',
      stock: String(product.stock ?? 0),
      categoryId: product.category_id || '',
    })
    setCreatingCategory(false)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      setMessage('Falta el nombre o el precio.')
      return
    }
    if (!creatingCategory && !form.categoryId) {
      setMessage('Elegí una categoría o creá una nueva.')
      return
    }
    if (creatingCategory && !newCategoryName.trim()) {
      setMessage('Ponele un nombre a la nueva categoría.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      let finalCategoryId = form.categoryId

      if (creatingCategory) {
        const { data: existing } = await supabase
          .from('categorias')
          .select('id')
          .ilike('nombre', newCategoryName.trim())
          .maybeSingle()

        if (existing) {
          finalCategoryId = existing.id
        } else {
          const { data: catData, error: catError } = await supabase
            .from('categorias')
            .insert({ nombre: newCategoryName.trim(), descripcion: newCategoryDesc.trim() })
            .select()
            .single()

          if (catError) {
            setMessage('No se pudo crear la categoría: ' + catError.message)
            setSaving(false)
            return
          }
          finalCategoryId = catData.id
        }
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        image_url: form.imageUrl.trim() || null,
        stock: Math.max(0, Number(form.stock) || 0),
        category_id: finalCategoryId,
      }

      let prodError
      if (form.id) {
        // Editar producto existente
        ;({ error: prodError } = await supabase.from('products').update(payload).eq('id', form.id))
      } else {
        // Crear producto nuevo
        ;({ error: prodError } = await supabase.from('products').insert({
          ...payload,
          slug: slugify(form.name),
        }))
      }

      if (prodError) {
        setMessage('No se pudo guardar el producto: ' + prodError.message)
        setSaving(false)
        return
      }

      setMessage(form.id ? '¡Producto actualizado!' : '¡Producto creado con éxito!')
      resetForm()
      fetchAll()
    } catch (err) {
      setMessage('Algo salió mal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // --- Mover un producto a otra categoría (desde la lista) ---
  async function handleMoveProduct(productId, newCategoryId) {
    if (!newCategoryId) return
    setMovingProductId(productId)
    const { error } = await supabase
      .from('products')
      .update({ category_id: newCategoryId })
      .eq('id', productId)

    if (error) {
      setMessage('No se pudo mover el producto: ' + error.message)
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, category_id: newCategoryId } : p))
      )
    }
    setMovingProductId(null)
  }

  function productCountInCategory(categoryId) {
    return products.filter((p) => p.category_id === categoryId).length
  }

  // --- Eliminar categoría ---
  function startDeleteCategory(categoryId) {
    setDeletingCategoryId(categoryId)
    setReassignTarget('')
    setCategoryActionMessage('')
  }

  function cancelDeleteCategory() {
    setDeletingCategoryId(null)
    setReassignTarget('')
    setCategoryActionMessage('')
  }

  async function confirmDeleteCategory(categoryId) {
    const count = productCountInCategory(categoryId)

    if (count > 0 && !reassignTarget) {
      setCategoryActionMessage('Esta categoría tiene productos. Elegí a dónde moverlos antes de borrar.')
      return
    }

    setCategoryActionBusy(true)
    setCategoryActionMessage('')

    try {
      if (count > 0) {
        const { error: moveError } = await supabase
          .from('products')
          .update({ category_id: reassignTarget })
          .eq('category_id', categoryId)

        if (moveError) {
          setCategoryActionMessage('No se pudieron mover los productos: ' + moveError.message)
          setCategoryActionBusy(false)
          return
        }
      }

      const { error: deleteError, count: deletedCount } = await supabase
        .from('categorias')
        .delete({ count: 'exact' })
        .eq('id', categoryId)

      if (deleteError) {
        setCategoryActionMessage('No se pudo eliminar la categoría: ' + deleteError.message)
        setCategoryActionBusy(false)
        return
      }

      if (!deletedCount) {
        setCategoryActionMessage(
          'Supabase no dio error, pero no se borró ninguna fila. Esto suele ser un permiso de RLS faltante para DELETE en la tabla categorias — revisá las políticas.'
        )
        setCategoryActionBusy(false)
        return
      }

      cancelDeleteCategory()
      fetchAll()
    } catch (err) {
      setCategoryActionMessage('Algo salió mal: ' + err.message)
    } finally {
      setCategoryActionBusy(false)
    }
  }

  return (
    <div className="admin-section">
      <h2>{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>

        <label>
          Descripción
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </label>

        <label>
          Precio
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            min="0"
            step="0.01"
          />
        </label>

        <label>
          URL de la imagen
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </label>

        <label>
          Stock (unidades disponibles)
          <input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            min="0"
            step="1"
          />
        </label>

        <div className="admin-form__categoria">
          <label>
            Categoría
            <select
              value={creatingCategory ? '__nueva__' : form.categoryId}
              onChange={(e) => {
                if (e.target.value === '__nueva__') {
                  setCreatingCategory(true)
                  setForm({ ...form, categoryId: '' })
                } else {
                  setCreatingCategory(false)
                  setForm({ ...form, categoryId: e.target.value })
                }
              }}
            >
              <option value="">Elegí una categoría…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
              <option value="__nueva__">+ Crear nueva categoría</option>
            </select>
          </label>

          {creatingCategory && (
            <div className="admin-form__nueva-categoria">
              <label>
                Nombre de la categoría nueva
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ej: Jabones artesanales"
                  required
                />
              </label>
              <label>
                Descripción de la categoría
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  rows={2}
                  placeholder="Un texto corto que se va a mostrar arriba de estos productos en la Tienda"
                />
              </label>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {form.id && (
            <button type="button" className="btn" disabled={saving} onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>

        {message && <p className="admin-form__mensaje">{message}</p>}
      </form>

      <h2>Productos cargados</h2>
      {loading && <p className="label-mono">Cargando…</p>}
      {!loading && products.length === 0 && <p>Todavía no hay productos.</p>}

      <ul className="admin-list">
        {products.map((p) => {
          const cat = categorias.find((c) => c.id === p.category_id)
          return (
            <li key={p.id} className="admin-list__item">
              <strong>{p.name}</strong> — ${p.price}
              <span className="label-mono"> · stock: {p.stock ?? 0}</span>
              {cat && <span className="label-mono"> · {cat.nombre}</span>}

              <button
                type="button"
                className="btn"
                style={{ marginLeft: 12 }}
                onClick={() => openEdit(p)}
              >
                Editar
              </button>

              <select
                value={p.category_id || ''}
                disabled={movingProductId === p.id}
                onChange={(e) => handleMoveProduct(p.id, e.target.value)}
                style={{ marginLeft: 12 }}
                title="Mover a otra categoría"
              >
                <option value="" disabled>Mover a…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === p.category_id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>

      <h2>Categorías</h2>
      <ul className="admin-list">
        {categorias.map((c) => {
          const count = productCountInCategory(c.id)
          const isDeleting = deletingCategoryId === c.id

          return (
            <li key={c.id} className="admin-list__item">
              <strong>{c.nombre}</strong>
              <span className="label-mono"> · {count} producto{count === 1 ? '' : 's'}</span>

              {!isDeleting && (
                <button
                  type="button"
                  className="btn"
                  style={{ marginLeft: 12 }}
                  onClick={() => startDeleteCategory(c.id)}
                >
                  Eliminar
                </button>
              )}

              {isDeleting && (
                <div style={{ marginTop: 8 }}>
                  {count > 0 && (
                    <label>
                      Mover sus {count} producto{count === 1 ? '' : 's'} a
                      <select
                        value={reassignTarget}
                        onChange={(e) => setReassignTarget(e.target.value)}
                        style={{ marginLeft: 8 }}
                      >
                        <option value="">Elegí una categoría destino…</option>
                        {categorias
                          .filter((other) => other.id !== c.id)
                          .map((other) => (
                            <option key={other.id} value={other.id}>{other.nombre}</option>
                          ))}
                      </select>
                    </label>
                  )}

                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      disabled={categoryActionBusy}
                      onClick={() => confirmDeleteCategory(c.id)}
                    >
                      {categoryActionBusy ? 'Eliminando…' : count > 0 ? 'Mover y eliminar' : 'Confirmar eliminación'}
                    </button>
                    <button type="button" className="btn" disabled={categoryActionBusy} onClick={cancelDeleteCategory}>
                      Cancelar
                    </button>
                  </div>

                  {categoryActionMessage && (
                    <p className="admin-form__mensaje">{categoryActionMessage}</p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
