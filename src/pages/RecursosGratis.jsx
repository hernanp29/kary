import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Publicaciones.css'

export default function RecursosGratis() {
  const [recursos, setRecursos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecursos() {
      setLoading(true)
      const { data, error } = await supabase
        .from('recursos')
        .select('id, title, slug, description, file_url, cover_image_url')
        .eq('published', true)
        .order('created_at', { ascending: false })
      if (!error) setRecursos(data || [])
      setLoading(false)
    }
    fetchRecursos()
  }, [])

  return (
    <div className="container publicaciones">
      <header className="publicaciones__header">
        <span className="label-mono">Recursos gratis</span>
        <h1>Imprimibles y guías para llevarte</h1>
      </header>

      {loading && <p className="label-mono">Cargando recursos…</p>}
      {!loading && recursos.length === 0 && (
        <p className="publicaciones__empty">
          Todavía no hay recursos cargados. Agregá el primero desde el panel de admin.
        </p>
      )}

      <div className="publicaciones__grid">
        {recursos.map((r) => (
          <article key={r.id} className="post-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {r.cover_image_url && (
              <img src={r.cover_image_url} alt="" className="post-card__image" />
            )}
            <h3>{r.title}</h3>
            <p>{r.description}</p>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <a
                href={r.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                Descargar
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
