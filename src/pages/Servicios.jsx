import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Publicaciones.css'

const WHATSAPP_NUMBER = '5491159377545'

const formatPrice = (n) => new Intl.NumberFormat('es-AR').format(n)

// Misma convención que en el blog:
// - Una línea que empieza con "## " se muestra como subtítulo.
// - Una línea en blanco separa párrafos.
function renderDescripcion(texto) {
  if (!texto) return null

  const bloques = texto.split('\n')
  const elementos = []
  let parrafoActual = []

  function cerrarParrafo(key) {
    if (parrafoActual.length > 0) {
      elementos.push(<p key={`p-${key}`}>{parrafoActual.join(' ')}</p>)
      parrafoActual = []
    }
  }

  bloques.forEach((linea, i) => {
    const trimmed = linea.trim()
    if (trimmed.startsWith('## ')) {
      cerrarParrafo(i)
      elementos.push(
        <h4 key={`h-${i}`} className="servicio-card__subtitulo">
          {trimmed.slice(3)}
        </h4>
      )
    } else if (trimmed === '') {
      cerrarParrafo(i)
    } else {
      parrafoActual.push(trimmed)
    }
  })

  cerrarParrafo('final')
  return elementos
}

export default function Servicios() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchServicios() {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicios')
        .select('id, title, slug, description, price, payment_info, cover_image_url')
        .eq('published', true)
        .order('created_at', { ascending: false })
      if (!error) setServicios(data || [])
      setLoading(false)
    }
    fetchServicios()
  }, [])

  function contratar(servicio) {
    const opcionesPago = servicio.payment_info
      ? servicio.payment_info.split('\n').map((l) => l.trim()).filter(Boolean).join(', ')
      : ''

    const mensaje = [
      `¡Hola! 👋 Me interesa contratar uno de tus servicios y quisiera consultar disponibilidad de fechas y valores. ¡Espero tu respuesta! 🌿`,
      ].filter(Boolean).join(' ')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <div className="container publicaciones">
      <header className="publicaciones__header">
        <span className="label-mono">Servicios</span>
        <h1>Cómo puedo acompañarte</h1>
      </header>

      {loading && <p className="label-mono">Cargando servicios…</p>}
      {!loading && servicios.length === 0 && (
        <p className="publicaciones__empty">
          Todavía no hay servicios cargados. Agregá el primero desde el panel de admin.
        </p>
      )}

      <div className="publicaciones__grid">
        {servicios.map((s) => (
          <article key={s.id} className="post-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {s.cover_image_url && (
              <img src={s.cover_image_url} alt="" className="post-card__image" />
            )}
            <h3>{s.title}</h3>
            <div className="servicio-card__descripcion">{renderDescripcion(s.description)}</div>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <div className="servicio-card__precio-row">
                <span className="servicio-card__precio">
                  {s.price != null ? `$${formatPrice(s.price)}` : 'Consultar'}
                </span>
                <button type="button" className="btn-buy" onClick={() => contratar(s)}>
                  Quiero contratar
                </button>
              </div>
              <ul className="servicio-card__pagos">
                {s.payment_info &&
                  s.payment_info
                    .split('\n')
                    .map((linea) => linea.trim())
                    .filter(Boolean)
                    .map((linea, i) => <li key={i}>{linea}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
