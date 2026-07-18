import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Publicaciones.css'

export default function Publicaciones() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('todas')

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, category, cover_image_url, published_at')
        .eq('published', true)
        .order('published_at', { ascending: false })

      if (!error) setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  const categories = ['todas', ...new Set(posts.map((p) => p.category).filter(Boolean))]
  const visible = category === 'todas' ? posts : posts.filter((p) => p.category === category)

  return (
    <div className="container publicaciones">
      <header className="publicaciones__header">
        <span className="label-mono">Hojas — Publicaciones</span>
        <h1>Lo que aprendo, lo comparto</h1>
      </header>

      <div className="publicaciones__filters">
        {categories.map((c) => (
          <button
            key={c}
            className={`filter-pill ${category === c ? 'is-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="label-mono">Cargando publicaciones…</p>}

      {!loading && visible.length === 0 && (
        <p className="publicaciones__empty">
          Todavía no hay publicaciones {category !== 'todas' ? `en "${category}"` : ''}. Cargá la primera desde el panel de admin.
        </p>
      )}

      <div className="publicaciones__grid">
        {visible.map((post) => (
          <article key={post.id} className="post-card">
            {post.cover_image_url && (
              <img src={post.cover_image_url} alt="" className="post-card__image" />
            )}
            <span className="label-mono">{post.category}</span>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
