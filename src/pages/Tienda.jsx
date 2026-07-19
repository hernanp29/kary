import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Tienda.css'

export default function Tienda() {
  const [categorias, setCategorias] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categorias').select('id, nombre, descripcion').order('nombre'),
        supabase
          .from('products')
          .select('id, name, slug, description, price, image_url, status, category_id')
          .order('created_at', { ascending: false }),
      ])
      setCategorias(cats || [])
      setProducts(prods || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  // Agrupar productos por categoría
  const gruposPorCategoria = categorias
    .map((cat) => ({
      ...cat,
      productos: products.filter((p) => p.category_id === cat.id),
    }))
    .filter((grupo) => grupo.productos.length > 0)

  // Productos sin categoría asignada (por si quedó alguno viejo)
  const sinCategoria = products.filter((p) => !p.category_id)

  return (
    <div className="container tienda">
      <header className="tienda__header">
        <span className="label-mono">Flor y fruto — Tienda</span>
        <h1>Lo que se cosecha, se lleva</h1>
      </header>

      {loading && <p className="label-mono">Cargando catálogo…</p>}

      {!loading && products.length === 0 && (
        <p className="tienda__empty">
          Todavía no hay productos cargados. Agregá el primero desde el panel de admin
          — no hace falta gestión de stock automática para empezar, marcás "disponible/agotado" a mano.
        </p>
      )}

      {gruposPorCategoria.map((grupo) => (
        <section key={grupo.id} className="tienda__categoria">
          <div className="tienda__categoria-header">
            <h2>{grupo.nombre}</h2>
            {grupo.descripcion && <p className="tienda__categoria-desc">{grupo.descripcion}</p>}
          </div>
          <div className="tienda__grid">
            {grupo.productos.map((p) => (
              <article key={p.id} className="product-card">
                {p.image_url && <img src={p.image_url} alt={p.name} className="product-card__image" />}
                <div className="product-card__body">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="product-card__footer">
                    <span className="label-mono">${p.price}</span>
                    <button className="btn-buy" disabled={p.status === 'agotado'}>
                      {p.status === 'agotado' ? 'Agotado' : 'Comprar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {sinCategoria.length > 0 && (
        <section className="tienda__categoria">
          <div className="tienda__categoria-header">
            <h2>Otros</h2>
          </div>
          <div className="tienda__grid">
            {sinCategoria.map((p) => (
              <article key={p.id} className="product-card">
                {p.image_url && <img src={p.image_url} alt={p.name} className="product-card__image" />}
                <div className="product-card__body">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="product-card__footer">
                    <span className="label-mono">${p.price}</span>
                    <button className="btn-buy" disabled={p.status === 'agotado'}>
                      {p.status === 'agotado' ? 'Agotado' : 'Comprar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

