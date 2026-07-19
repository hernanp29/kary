import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Home.css'

function SubscribeForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'No se pudo completar la suscripción.')

      setStatus('success')
      setMessage('¡Listo! Revisá tu correo, te acabamos de enviar el material.')
      setName('')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Algo salió mal. Probá de nuevo en un momento.')
    }
  }

  if (status === 'success') {
    return <p className="subscribe__feedback subscribe__feedback--success">{message}</p>
  }

  return (
    <form className="subscribe-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" className="btn" disabled={status === 'loading'}>
        {status === 'loading' ? 'Enviando…' : '¡Quiero entrar!'}
      </button>
      {status === 'error' && (
        <p className="subscribe__feedback subscribe__feedback--error">{message}</p>
      )}
    </form>
  )
}

function Bienvenida() {
  return (
    <section className="bienvenida">
      <div className="bienvenida__imagen">
        <img src="https://i.ibb.co/KxBt7YHJ/reja.jpg" alt="Jardín secreto" />
      </div>
      <div className="bienvenida__texto">
        <span className="eyebrow">Bienvenida</span>
        <h2>Bienvenida a mi jardín secreto</h2>
        <p>
          Este espacio nació del deseo de compartir los saberes y las experiencias que han
          transformado mi manera de habitar el mundo. Es un jardín cultivado con paciencia,
          donde cada planta, cada símbolo y cada ritual guarda una historia que merece ser contada.
        </p>
        <p>
          Aquí encontrarás la medicina de las plantas, la belleza de la geometría sagrada, la
          sabiduría de los ciclos de la naturaleza y pequeños rituales para volver a lo esencial.
          También compartiré recetas, libros, imprimibles y reflexiones que forman parte de mi camino.
        </p>
        <p>
          No pretendo tener todas las respuestas. Mi intención es abrir un espacio de encuentro,
          donde el conocimiento ancestral dialogue con la experiencia cotidiana y donde cada
          persona pueda descubrir su propia forma de conectar con la naturaleza.
        </p>
        <p>
          Gracias por llegar hasta acá. Espero que este jardín sea un refugio para detenerte un
          instante, aprender algo nuevo y recordar que también somos naturaleza.
        </p>
        <p>Las puertas quedan abiertas.</p>
        <p className="bienvenida__firma">
          Con amor,<br />
          Karina De La Lama<br />
          <em>—arte &amp; magia—</em>
        </p>
      </div>
    </section>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    async function fetchLatest() {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, published_at')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(3)

      if (!error) setPosts(data || [])
      setLoadingPosts(false)
    }
    fetchLatest()
  }, [])

  return (
    <div className="home">
      <Bienvenida />

      <section className="hero" id="inicio">
        <span className="eyebrow">Círculo sagrado</span>
        <h2>Sé parte de esta comunidad</h2>
        <p>
          Únete ahora para obtener acceso anticipado a ejercicios, mensajes del universo
          y consejos para manifestar la vida que realmente deseas tener.
        </p>
        <SubscribeForm />
      </section>

      <section id="blog">
        <div className="blog-header">
          <div className="section-title">Últimas publicaciones de blog</div>
          <Link to="/publicaciones" className="ver-todo">Ver todo</Link>
        </div>

        {loadingPosts && <p className="label-mono">Cargando…</p>}

        {!loadingPosts && posts.length === 0 && (
          <p className="blog-empty label-mono">Todavía no hay publicaciones cargadas.</p>
        )}

        <div className="blog-grid">
          {posts.map((post, i) => (
            <Link to={`/publicaciones/${post.slug}`} className="blog-card" key={post.id}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="insta-header">
          <div className="section-title" style={{ marginBottom: '14px' }}>Sígueme</div>
          <div
            className="socials"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '22px', marginTop: '20px' }}
          >
            <a href="https://www.instagram.com/karinaarteymagia369?igsh=cWc5c3RjYzg0ZXlj" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--dorado, #B7924A)" strokeWidth="1.6" aria-label="Instagram">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="var(--dorado, #B7924A)" stroke="none" />
              </svg>
            </a>
            <a href="#" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="var(--dorado, #B7924A)" aria-label="Facebook">
                <path d="M15.5 8.5H13.8c-.6 0-1 .5-1 1.1V12h2.6l-.35 2.7H12.8V22H9.9v-7.3H7.7V12h2.2V9.4C9.9 6.9 11.4 5.5 13.7 5.5c1.1 0 2 .1 2.3.1v2.9z" />
              </svg>
            </a>
            <a href="https://www.youtube.com/@karinadelalama369" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--dorado, #B7924A)" strokeWidth="1.6" aria-label="YouTube">
                <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
                <path d="M10.3 9.6l5 2.4-5 2.4z" fill="var(--dorado, #B7924A)" stroke="none" />
              </svg>
            </a>
            <a href="https://wa.me/5491159377545" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="var(--dorado, #B7924A)" aria-label="WhatsApp">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12.004 2C6.486 2 2 6.486 2 12.004c0 1.88.51 3.688 1.475 5.276L2 22l4.83-1.44a9.96 9.96 0 0 0 5.174 1.44h.004c5.518 0 10-4.486 10-10.004C22.008 6.486 17.522 2 12.004 2zm0 18.164h-.003a8.19 8.19 0 0 1-4.174-1.144l-.3-.178-2.866.854.86-2.792-.196-.312a8.15 8.15 0 0 1-1.253-4.588c0-4.508 3.668-8.176 8.183-8.176 2.186 0 4.24.85 5.786 2.397a8.13 8.13 0 0 1 2.396 5.783c0 4.509-3.667 8.176-8.183 8.176z" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
