import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './SiteHeader.css'

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function SiteHeader() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [tiendaOpen, setTiendaOpen] = useState(false)
  const [categorias, setCategorias] = useState([])
  const isActive = (path) => pathname === path

  useEffect(() => {
    supabase
      .from('categorias')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setCategorias(data || []))
  }, [])

  function irA() {
    setMenuOpen(false)
    setTiendaOpen(false)
  }

  return (
    <div className="top-fixed">
      <header>
        <div className="wrap">
          <Link to="/" className="header-logo">
            <img src="https://i.ibb.co/cXy0GSn4/triqueta-verde-transparente-1.png" alt="Karina de la Lama" />
          </Link>
          <div className="brand-name">KARINA</div>
          <span className="brand-tag">— arte &amp; magia —</span>

          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <nav className={menuOpen ? 'nav--open' : ''}>
        <Link to="/" className={isActive('/') ? 'is-active' : ''} onClick={irA}>Inicio</Link>
        <Link to="/publicaciones" className={isActive('/publicaciones') ? 'is-active' : ''} onClick={irA}>Blog</Link>

        <div className={`nav-item--dropdown ${tiendaOpen ? 'is-open' : ''}`}>
          <Link
            to="/tienda"
            className={isActive('/tienda') ? 'is-active' : ''}
            onClick={() => setTiendaOpen(true)}
          >
            Tienda
          </Link>

          {categorias.length > 0 && (
            <ul className="nav-item--dropdown__menu">
              {categorias.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/tienda#${slugify(cat.nombre)}`} onClick={irA}>
                    {cat.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to="/talleres" className={isActive('/talleres') ? 'is-active' : ''} onClick={irA}>Talleres</Link>
        <Link to="/servicios" className={isActive('/servicios') ? 'is-active' : ''} onClick={irA}>Servicios</Link>
        <Link to="/recursos-gratis" className={isActive('/recursos-gratis') ? 'is-active' : ''} onClick={irA}>Recursos gratis</Link>
        <a href="#contacto" onClick={irA}>Contacto</a>
      </nav>
    </div>
  )
}
