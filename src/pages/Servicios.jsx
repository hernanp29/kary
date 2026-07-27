import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const { slug: slugDeUrl } = useParams()
  const navigate = useNavigate()

  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandidos, setExpandidos] = useState({})
  const [copiado, setCopiado] = useState(null)

  const cardsRef = useRef({})
  const descRef = useRef({})
  const [desbordan, setDesbordan] = useState({})

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

  // Detecta qué descripciones son más largas que el alto de la tarjeta,
  // para mostrar el botón "Leer más" solo donde realmente hace falta.
  useEffect(() => {
    if (loading) return
    const resultado = {}
    servicios.forEach((s) => {
      const el = descRef.current[s.slug]
      if (el) resultado[s.slug] = el.scrollHeight > el.clientHeight + 4
    })
    setDesbordan(resultado)
  }, [loading, servicios])

  // Si se entra directo a /servicios/:slug (por un link compartido),
  // esa tarjeta arranca abierta y hacemos scroll hasta ella.
  useEffect(() => {
    if (!loading && slugDeUrl) {
      setExpandidos((prev) => ({ ...prev, [slugDeUrl]: true }))
      const el = cardsRef.current[slugDeUrl]
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      }
    }
  }, [loading, slugDeUrl])

  function toggleExpandido(servicio) {
    const abrir = !expandidos[servicio.slug]
    setExpandidos((prev) => ({ ...prev, [servicio.slug]: abrir }))
    navigate(abrir ? `/servicios/${servicio.slug}` : '/servicios', { replace: true })
  }

  function compartir(servicio) {
    const url = `${window.location.origin}/servicios/${servicio.slug}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiado(servicio.slug)
        setTimeout(() => setCopiado(null), 2000)
      })
    } else {
      window.prompt('Copiá el enlace de este servicio:', url)
    }
  }

  function contratar() {
    const mensaje = '¡Hola! 👋 Me interesa contratar uno de tus servicios y quisiera consultar disponibilidad de fechas y valores. ¡Espero tu respuesta! 🌿'
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
        {servicios.map((s) => {
          const abierta = !!expandidos[s.slug]
          const necesitaToggle = !!desbordan[s.slug]

          return (
            <article
              key={s.id}
              id={s.slug}
              ref={(el) => { cardsRef.current[s.slug] = el }}
              className={`post-card servicio-card ${abierta ? 'servicio-card--expandida' : ''}`}
            >
              {s.cover_image_url && (
                <img src={s.cover_image_url} alt="" className="post-card__image" />
              )}

              <div className="servicio-card__top">
                <h3>{s.title}</h3>
                <button
                  type="button"
                  className="servicio-card__compartir"
                  onClick={() => compartir(s)}
                >
                  {copiado === s.slug ? '¡Copiado!' : 'Compartir'}
                </button>
              </div>

              <div
                className={`servicio-card__descripcion ${abierta ? 'is-expandida' : ''}`}
                ref={(el) => { descRef.current[s.slug] = el }}
              >
                {renderDescripcion(s.description)}
              </div>

              {(necesitaToggle || abierta) && (
                <button
                  type="button"
                  className="servicio-card__toggle"
                  onClick={() => toggleExpandido(s)}
                >
                  {abierta ? 'Leer menos' : 'Leer más'}
                </button>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <div className="servicio-card__precio-row">
                  <span className="servicio-card__precio">
                    {s.price != null ? `$${formatPrice(s.price)}` : 'Consultar'}
                  </span>
                  <button type="button" className="btn-buy" onClick={contratar}>
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
          )
        })}
      </div>
    </div>
  )
}
