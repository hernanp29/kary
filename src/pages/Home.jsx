import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Home.css'

const POPULARES = [
  { img: 'https://d1yei2z3i6k35z.cloudfront.net/161/62a985f6df449_magic-mind-KqyZo6r1Z34-unsplash.jpg', label: 'Jugos orgánicos' },
  { img: 'https://d1yei2z3i6k35z.cloudfront.net/161/62a986bef0898_magic-mind-MjzsWqkkShI-unsplash.jpg', label: 'Shots revitalizantes' },
  { img: 'https://d1yei2z3i6k35z.cloudfront.net/161/62a986c53e5cd_magic-mind-R8AQe2XwzPc-unsplash.jpg', label: 'Productos de abejas' },
  { img: 'https://d1yei2z3i6k35z.cloudfront.net/161/62a986ccd7181_magic-mind-teFigICGOwY-unsplash.jpg', label: 'Espirulina' },
]

const INSTA_IMAGES = [
  'https://d1yei2z3i6k35z.cloudfront.net/18220893/6a4d71a22a9e82.27004821_ritual1.jpeg',
  'https://d1yei2z3i6k35z.cloudfront.net/18220893/6a4d6fefcffdf1.74658003_fotoperfil.jpeg',
  'https://d1yei2z3i6k35z.cloudfront.net/18220893/6a4d6fc25ea911.95892194_logo2.jpg',
  'https://d1yei2z3i6k35z.cloudfront.net/18220893/6a4d71f593fd09.60174968_zentangle.jpeg',
  'https://d1yei2z3i6k35z.cloudfront.net/18220893/6a4d72187e7be3.17605290_escoba.jpg',
  'https://d1yei2z3i6k35z.cloudfront.net/18220893/6a4d723ad4edd9.87116894_infusion.jpg',
]

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
      <section className="hero" id="inicio">
        <span className="eyebrow">Círculo sagrado</span>
        <h2>Sé parte de esta comunidad</h2>
        <p>
          Únete ahora para obtener acceso anticipado a ejercicios, mensajes del universo
          y consejos para manifestar la vida que realmente deseas tener.
        </p>
        <SubscribeForm />
      </section>

      <section>
        <div className="section-title">Más popular</div>
        <div className="populares-grid">
          {POPULARES.map((p) => (
            <div className="card-pop" key={p.label}>
              <img src={p.img} alt={p.label} />
              <div className="etiqueta">{p.label}</div>
            </div>
          ))}
        </div>
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
            <Link to="/publicaciones" className="blog-card" key={post.id}>
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
          <a className="handle" href="https://www.instagram.com/karinaarteymagia369/" target="_blank" rel="noopener">
            @karinaarteymagia369
          </a>
        </div>
        <div className="insta-grid">
          {INSTA_IMAGES.map((src) => (
            <a href="https://www.instagram.com/karinaarteymagia369/" target="_blank" rel="noopener" key={src}>
              <img src={src} alt="" />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
