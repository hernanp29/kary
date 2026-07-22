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
        <span className="eyebrow"></span>
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

function SobreMi() {
  return (
    <section className="sobre-mi">
      <div className="sobre-mi__texto">
        <span className="eyebrow"></span>
        <p className="sobre-mi__firma-nombre">Soy Karina De La Lama.</p>
        <p>
            Entre plantas, preparados, símbolos y libros, fusiono la sabiduría de la medicina verde, la geometría sagrada y el arte para crear un espacio de sanación y autodescubrimiento.

        </p>
        <p>
            Mi propósito: Acompaño a mujeres comprometidas a profundizar en sí mismas, reconectar con su magia interna y habitar su vida desde el amor, la calma y el equilibrio personal.
        </p>
      </div>
      <div className="sobre-mi__imagen">
        <img src="https://i.ibb.co/7J2hL8fQ/Gemini-Generated-Image-uyka02uyka02uyka.png" alt="Karina De La Lama" />
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

      <SobreMi />

      <section className="hero" id="inicio">
        <span className="eyebrow">Círculo sagrado</span>
        <h2>Sé parte de esta comunidad</h2>
        <p style="text-indent: 30px;">
            Únete ahora para obtener acceso anticipado a ejercicios, mensajes del universo
          y consejos para manifestar la vida que realmente deseas tener.
            Con tu registro te enviamos un PDF gratuito de "plantas medicinales y usos mágicos "
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

    </div>
  )
}

