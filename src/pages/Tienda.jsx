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
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categorias').select('id, nombre, descripcion').order('nombre'),
      supabase
        .from('products')
        .select('id, name, slug, description, price, image_url, stock, category_id')
        .order('created_at', { ascending: false }),
    ])
    setCategorias(cats || [])
    setProducts(prods || [])
    setLoading(false)
  }

  // Cuánto queda disponible de un producto, restando lo que ya está en el carrito
  function disponible(product) {
    const enCarrito = cart[product.id]?.qty || 0
    return Math.max(0, (product.stock ?? 0) - enCarrito)
  }

  function getDraftQty(product) {
    const max = disponible(product)
    const draft = qtyDraft[product.id] ?? (max > 0 ? 1 : 0)
    return Math.min(draft, max)
  }

  function setDraftQty(product, value) {
    const max = disponible(product)
    const n = Math.max(1, Math.min(Number(value) || 1, max))
    setQtyDraft((prev) => ({ ...prev, [product.id]: n }))
  }

  function addToCart(product) {
    const max = disponible(product)
    const qty = Math.min(getDraftQty(product), max)
    if (qty <= 0) return

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
    setQtyDraft((prev) => ({ ...prev, [product.id]: 1 }))
    setShowCart(true)
  }

  function changeCartQty(id, delta) {
    const product = products.find((p) => p.id === id)
    setCart((prev) => {
      const item = prev[id]
      if (!item) return prev
      const maxTotal = product ? product.stock ?? 0 : item.qty
      const nextQty = Math.min(item.qty + delta, maxTotal)
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

  async function cerrarCuenta() {
    if (cartItems.length === 0) return
    setCheckingOut(true)
    setCheckoutMessage('')

    try {
      // Descontar el stock de cada producto del pedido
      for (const item of cartItems) {
        const product = products.find((p) => p.id === item.id)
        const stockActual = product?.stock ?? 0
        const nuevoStock = Math.max(0, stockActual - item.qty)

        const { error } = await supabase
          .from('products')
          .update({ stock: nuevoStock })
          .eq('id', item.id)

        if (error) {
          setCheckoutMessage('No se pudo descontar el stock de "' + item.name + '": ' + error.message)
          setCheckingOut(false)
          return
        }
      }

      // Reflejar el nuevo stock localmente
      setProducts((prev) =>
        prev.map((p) => {
          const item = cart[p.id]
          if (!item) return p
          return { ...p, stock: Math.max(0, (p.stock ?? 0) - item.qty) }
        })
      )

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

      setCart({})
      setShowCart(false)
    } catch (err) {
      setCheckoutMessage('Algo salió mal: ' + err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  const gruposPorCategoria = categorias
    .map((cat) => ({
      ...cat,
      productos: products.filter((p) => p.category_id === cat.id),
    }))
    .filter((grupo) => grupo.productos.length > 0)

  const sinCategoria = products.filter((p) => !p.category_id)

  function ProductCard(p) {
    const max = disponible(p)
    const agotado = (p.stock ?? 0) <= 0

    return (
      <article key={p.id} className="product-card">
        {p.image_url && <img src={p.image_url} alt={p.name} className="product-card__image" />}
        <div className="product-card__body">
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <div
            className="product-card__footer"
            style={{
              flexWrap: 'wrap',
              gap: '10px',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span className="label-mono">${p.price}</span>

            {!agotado ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn-buy"
                    style={{ padding: '4px 10px' }}
                    disabled={getDraftQty(p) <= 1}
                    onClick={() => setDraftQty(p, getDraftQty(p) - 1)}
                  >
                    −
                  </button>
                  <span className="label-mono" style={{ minWidth: '18px', textAlign: 'center' }}>
                    {getDraftQty(p)}
                  </span>
                  <button
                    type="button"
                    className="btn-buy"
                    style={{ padding: '4px 10px' }}
                    disabled={getDraftQty(p) >= max}
                    onClick={() => setDraftQty(p, getDraftQty(p) + 1)}
                  >
                    +
                  </button>
                </div>
                <button className="btn-buy" disabled={max <= 0} onClick={() => addToCart(p)}>
                  {max <= 0 ? 'En el carrito' : 'Agregar'}
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
          Todavía no hay productos cargados. Agregá el primero desde el panel de admin.
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

          <button className="btn-buy" style={{ width: '100%' }} disabled={checkingOut} onClick={cerrarCuenta}>
            {checkingOut ? 'Descontando stock…' : 'Cerrar cuenta por WhatsApp'}
          </button>

          {checkoutMessage && (
            <p className="label-mono" style={{ color: '#d98a6a', marginTop: '10px' }}>{checkoutMessage}</p>
          )}
        </div>
      )}
    </div>
  )
}
