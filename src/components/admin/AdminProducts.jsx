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

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)

  // Form de producto
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState('disponible')

  // Selección de categoría
  const [categoryId, setCategoryId] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Mover producto de categoría (por fila)
  const [movingProductId, setMovingProductId] = useState(null)

  // Eliminar categoría
  const [deletingCategoryId, setDeletingCategoryId] = useState(null)
  const [reassignTarget, setReassignTarget] = useState('')
  const [categoryActionMessage, setCategoryActionMessage] = useState('')
  const [categoryActionBusy, setCategoryActionBusy] = useState(false)

  async function fetchAll() {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('id, name, slug, description, price, image_url, status, category_id').order('created_at', { ascending: false }),
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
    setName('')
    setDescription('')
    setPrice('')
    setImageUrl('')
    setStatus('disponible')
    setCategoryId('')
    setCreatingCategory(false)
    setNewCategoryName('')
    setNewCategoryDesc('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !price) {
      setMessage('Falta el nombre o el precio.')
      return
    }
    if (!creatingCategory && !categoryId) {
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
      let finalCategoryId = categoryId

      if (creatingCategory) {
        // Si ya existe una categoría con ese nombre, la reutilizamos en vez de fallar
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

      const { error: prodError } = await supabase.from('products').insert({
        name: name.trim(),
        slug: slugify(name),
        description: description.trim(),
        price: Number(price),
        image_url: imageUrl.trim() || null,
        status,
        category_id: finalCategoryId,
      })

      if (prodError) {
        setMessage('No se pudo guardar el producto: ' + prodError.message)
        setSaving(false)
        return
      }

      setMessage('¡Producto creado con éxito!')
      resetForm()
      fetchAll()
    } catch (err) {
      setMessage('Algo salió mal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // --- Mover un producto a otra categoría ---
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
      // Si tiene productos, primero los reasignamos a la categoría elegida
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

      const { error: deleteError } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoryId)

      if (deleteError) {
        setCategoryActionMessage('No se pudo eliminar la categoría: ' + deleteError.message)
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
      <h2>Nuevo producto</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Descripción
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <label>
          Precio
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" />
        </label>

        <label>
          URL de la imagen
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </label>

        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="disponible">Disponible</option>
            <option value="agotado">Agotado</option>
          </select>
        </label>

        <div className="admin-form__categoria">
          <label>
            Categoría
            <select
              value={creatingCategory ? '__nueva__' : categoryId}
              onChange={(e) => {
                if (e.target.value === '__nueva__') {
                  setCreatingCategory(true)
                  setCategoryId('')
                } else {
                  setCreatingCategory(false)
                  setCategoryId(e.target.value)
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

        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Crear producto'}
        </button>

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
              <strong>{p.name}</strong> — ${p.price} — {p.status}
              {cat && <span className="label-mono"> · {cat.nombre}</span>}

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
                    <>
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
                    </>
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

