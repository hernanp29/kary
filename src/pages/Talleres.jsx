import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Talleres.css'

export default function Talleres() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWorkshops() {
      setLoading(true)
      const { data, error } = await supabase
        .from('workshops')
        .select('id, title, slug, description, modality, event_date, capacity, price')
        .order('event_date', { ascending: true })

      if (!error) setWorkshops(data || [])
      setLoading(false)
    }
    fetchWorkshops()
  }, [])

  return (
    <div className="container talleres">
      <header className="talleres__header">
        <span className="label-mono">Raíz — Talleres</span>
        <h1>Donde se aprende con las manos en la tierra</h1>
      </header>

      {loading && <p className="label-mono">Cargando talleres…</p>}

      {!loading && workshops.length === 0 && (
        <p className="talleres__empty">
          Todavía no hay talleres cargados. Agregá el primero desde el panel de admin,
          con su modalidad, fecha y cupo si es presencial.
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
              <h3>{w.title}</h3>
              <p>{w.description}</p>
              {w.modality === 'presencial' && w.capacity && (
                <span className="label-mono">Cupo: {w.capacity} personas</span>
              )}
            </div>
            <div className="workshop-row__action">
              <span className="label-mono">${w.price}</span>
              <button className="btn-enroll">Inscribirme</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
