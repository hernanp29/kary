import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Publicaciones.css'

function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Convención simple para el contenido guardado como texto plano:
// - Una línea que empieza con "## " se muestra como subtítulo.
// - Una línea en blanco separa párrafos.
function renderContenido(content) {
  if (!content) return null

  const bloques = content.split('\n')
  const elementos = []
  let parrafoActual = []

  function cerrarParrafo(key) {
    if (parrafoActual.length > 0) {
      elementos.push(
        <p key={`p-${key}`}>{parrafoActual.join(' ')}</p>
      )
      parrafoActual = []
    }
  }

  bloques.forEach((linea, i) => {
    const trimmed = linea.trim()

    if (trimmed.startsWith('## ')) {
      cerrarParrafo(i)
      elementos.push(
        <h2 key={`h-${i}`} className="post-detalle__subtitulo">
          {trimmed.slice(3)}
        </h2>
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

export default function PublicacionDetalle() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      setLoading(true)
      setNotFound(false)
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, content, category, cover_image_url, published_at')
        .eq('slug', slug)
        .eq('published', true)
        .single()
      if (error || !data) {
        setNotFound(true)
        setPost(null)
      } else {
        setPost(data)
      }
      setLoading(false)
    }
    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="container publicaciones">
        <p className="label-mono">Cargando publicación…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="container publicaciones">
        <p className="publicaciones__empty">
          No encontramos esta publicación. Puede que haya sido movida o eliminada.
        </p>
        <Link to="/publicaciones" className="ver-todo">← Volver a publicaciones</Link>
      </div>
    )
  }

  return (
    <div className="container publicaciones publicacion-detalle">
      <Link to="/publicaciones" className="ver-todo">← Volver a publicaciones</Link>
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="post-detalle__image"
        />
      )}
      <span className="label-mono">{post.category}</span>
      <h1>{post.title}</h1>
      {post.published_at && (
        <p className="post-detalle__fecha label-mono">{formatearFecha(post.published_at)}</p>
      )}
      <div className="post-detalle__contenido">
        {renderContenido(post.content)}
      </div>
    </div>
  )
}
