import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Tienda.css'

const WHATSAPP_NUMBER = '5491159377545'

export default function Tienda() {
  const [categorias, setCategorias] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Cantidad elegida por producto antes de agregar al carrito (por id)
  const [qtyDraft, setQtyDraft] = useState({})

  // Carrito acumulado: { [productId]: { id, name, price, qty } }
  const [cart, setCart] = useState({})
  const [showCart, setShowCart] = useState(false)

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

  function getDraftQty(id) {
    return qtyDraft[id] ?? 1
  }

  function setDraftQty(id, value) {
    const n = Math.max(1, Number(value) || 1)
    setQtyDraft((prev) => ({ ...prev, [id]: n }))
  }

  function addToCart(product) {
    const qty = getDraftQty(product.id)
    setCart((prev) => {
      const existing = prev[product.id]
      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          price: product.price,
          qty: (existing?.qty || 0) + qty,
        },
      }
    })
    setShowCart(true)
  }

  function changeCartQty(id, delta) {
    setCart((prev) => {
      const item = prev[id]
      if (!item) return prev
      const nextQty = item.qty + delta
      if (nextQty <= 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: { ...item, qty: nextQty } }
    })
  }

  function removeFromCart(id) {
    setCart((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  const cartItems = Object.values(cart)
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.qty * Number(i.price), 0),
    [cartItems]
  )

  function cerrarCuenta() {
    if (cartItems.length === 0) return

    const lineas = cartItems.map(
      (i) => `- ${i.name} x${i.qty} — $${(i.qty * Number(i.price)).toLocaleString('es-AR')}`
    )
    const mensaje = [
      'Hola! Quiero hacer este pedido:',
      '',
      ...lineas,
      '',
      `Total: $${cartTotal.toLocaleString('es-AR')}`,
    ].join('\n')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  // Agrupar productos por categoría
  const gruposPorCategoria = categorias
    .map((cat) => ({
      ...cat,
      productos: products.filter((p) => p.category_id === cat.id),
    }))
    .filter((grupo) => grupo.productos.length > 0)

  // Productos sin categoría asignada (por si quedó alguno viejo)
  const sinCategoria = products.filter((p) => !p.category_id)

  function ProductCard(p) {
    return (
      <article key={p.id} className="product-card">
        {p.image_url && <img src={p.image_url} alt={p.name} className="product-card__image" />}
        <div className="product-card__body">
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <div className="product-card__footer" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <span className="label-mono">${p.price}</span>

            {p.status !== 'agotado' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn-buy"
                    style={{ padding: '4px 10px' }}
                    onClick={() => setDraftQty(p.id, getDraftQty(p.id) - 1)}
                  >
                    −
                  </button>
                  <span className="label-mono" style={{ minWidth: '18px', textAlign: 'center' }}>
                    {getDraftQty(p.id)}
                  </span>
                  <button
                    type="button"
                    className="btn-buy"
                    style={{ padding: '4px 10px' }}
                    onClick={() => setDraftQty(p.id, getDraftQty(p.id) + 1)}
                  >
                    +
                  </button>
                </div>
                <button className="btn-buy" onClick={() => addToCart(p)}>
                  Agregar
                </button>
              </div>
            ) : (
              <button className="btn-buy" disabled>
                Agotado
              </button>
            )}
          </div>
        </div>
      </article>
    )
  }

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
            {grupo.productos.map((p) => ProductCard(p))}
          </div>
        </section>
      ))}

      {sinCategoria.length > 0 && (
        <section className="tienda__categoria">
          <div className="tienda__categoria-header">
            <h2>Otros</h2>
          </div>
          <div className="tienda__grid">
            {sinCategoria.map((p) => ProductCard(p))}
          </div>
        </section>
      )}

      {/* Botón flotante del carrito */}
      {cartCount > 0 && (
        <button
          type="button"
          onClick={() => setShowCart((v) => !v)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 40,
            borderRadius: '999px',
            padding: '14px 20px',
            border: '1px solid var(--dorado, #B7924A)',
            background: 'var(--verde-noche, #1B241D)',
            color: 'var(--dorado-claro, #B7924A)',
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          🛒 {cartCount}
        </button>
      )}

      {/* Panel del carrito */}
      {showCart && cartCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            zIndex: 40,
            width: '300px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--verde-noche, #1B241D)',
            border: '1px solid var(--linea, rgba(255,255,255,0.15))',
            borderRadius: '10px',
            padding: '18px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
          }}
        >
          <div className="label-mono" style={{ marginBottom: '12px' }}>Tu pedido</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '0.85rem', flex: 1 }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button className="btn-buy" style={{ padding: '2px 8px' }} onClick={() => changeCartQty(item.id, -1)}>−</button>
                  <span className="label-mono" style={{ minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                  <button className="btn-buy" style={{ padding: '2px 8px' }} onClick={() => changeCartQty(item.id, 1)}>+</button>
                  <button
                    className="btn-buy"
                    style={{ padding: '2px 8px', opacity: 0.7 }}
                    onClick={() => removeFromCart(item.id)}
                    title="Quitar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--linea, rgba(255,255,255,0.15))', paddingTop: '12px', marginBottom: '14px' }}>
            <div className="label-mono" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total</span>
              <span>${cartTotal.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <button className="btn-buy" style={{ width: '100%' }} onClick={cerrarCuenta}>
            Cerrar cuenta por WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}

