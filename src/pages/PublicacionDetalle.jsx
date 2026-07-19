import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Publicaciones.css'

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

      <div className="post-detalle__contenido">
        {post.content}
      </div>
    </div>
  )
}

