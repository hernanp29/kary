import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Tienda.css'

export default function Tienda() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, price, image_url, status')
        .order('created_at', { ascending: false })

      if (!error) setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

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

      <div className="tienda__grid">
        {products.map((p) => (
          <article key={p.id} className="product-card">
            {p.image_url && <img src={p.image_url} alt={p.name} className="product-card__image" />}
            <div className="product-card__body">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="product-card__footer">
                <span className="label-mono">${p.price}</span>
                <button
                  className="btn-buy"
                  disabled={p.status === 'agotado'}
                >
                  {p.status === 'agotado' ? 'Agotado' : 'Comprar'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
