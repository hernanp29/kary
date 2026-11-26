import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Talleres.css'

const WHATSAPP_NUMBER = '5491159377545'

const formatPrice = (n) => new Intl.NumberFormat('es-AR').format(n)

// Misma convención que Publicaciones (texto plano):
// - Una línea que empieza con "## " se muestra como subtítulo.
// - Una línea ![alt](url) se muestra como imagen, a todo el ancho por defecto.
// - Se le puede agregar "izquierda" o "derecha" después de la URL para que
//   el texto la rodee al costado: ![alt](url) izquierda
// - Una línea en blanco separa párrafos.
function renderDescripcion(content) {
  if (!content) return null

  const lineas = content.split('\n')
  const elementos = []
  let parrafoActual = []
  const imagenRegex = /^!\[(.*?)\]\((.+?)\)(?:\s+(izquierda|derecha))?$/i

  function cerrarParrafo(key) {
    if (parrafoActual.length > 0) {
      elementos.push(<p key={`p-${key}`}>{parrafoActual.join(' ')}</p>)
      parrafoActual = []
    }
  }

  lineas.forEach((linea, i) => {
    const trimmed = linea.trim()
    const matchImagen = trimmed.match(imagenRegex)

    if (trimmed.startsWith('## ')) {
      cerrarParrafo(i)
      elementos.push(
        <h4 key={`h-${i}`} className="workshop-row__subtitulo">
          {trimmed.slice(3)}
        </h4>
      )
    } else if (matchImagen) {
      cerrarParrafo(i)
      const [, alt, url, posicion] = matchImagen
      const clases = ['workshop-row__inline-image']
      if (posicion) clases.push(`workshop-row__inline-image--${posicion.toLowerCase()}`)
      elementos.push(
        <img key={`img-${i}`} src={url} alt={alt} className={clases.join(' ')} />
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

export default function Talleres() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWorkshops() {
      setLoading(true)
      const { data, error } = await supabase
        .from('workshops')
        .select('id, title, slug, description, modality, event_date, capacity, price, cover_image_url')
        .order('event_date', { ascending: true })

      if (!error) setWorkshops(data || [])
      setLoading(false)
    }
    fetchWorkshops()
  }, [])

  function inscribirme(w) {
    const fecha = w.event_date
      ? new Date(w.event_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })
      : ''

    const mensaje = [
      `Hola! Quiero inscribirme al taller "${w.title}".`,
      fecha ? `Vi que es el ${fecha}.` : '',
      w.price != null ? `El precio que vi es $${formatPrice(w.price)}.` : '',
    ].filter(Boolean).join(' ')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <div className="container talleres">
      <header className="talleres__header">
        <span className="label-mono">Raíz — Talleres</span>
      </header>

      {loading && <p className="label-mono">Cargando talleres…</p>}

      {!loading && workshops.length === 0 && (
        <p className="talleres__empty">
          Todavía no hay talleres cargados.
        </p>
      )}

      <div className="talleres__list">
        {workshops.map((w) => (
          <article key={w.id} className="workshop-row">
            <div className="workshop-row__date label-mono">
              {w.event_date
                ? new Date(w.event_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                : 'A confirmar'}
            </div>
            <div className="workshop-row__body">
              <span className={`modality-tag modality-tag--${w.modality}`}>{w.modality}</span>
              {w.cover_image_url && (
                <img
                  src={w.cover_image_url}
                  alt={w.title}
                  className="workshop-row__image"
                />
              )}
              <h3>{w.title}</h3>
              <div className="workshop-row__descripcion">{renderDescripcion(w.description)}</div>
              {w.modality === 'presencial' && w.capacity && (
                <span className="label-mono">Cupo: {w.capacity} personas</span>
              )}
            </div>
            <div className="workshop-row__action">
              <span className="label-mono">${w.price}</span>
              <button className="btn-enroll" onClick={() => inscribirme(w)}>Inscribirme</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
