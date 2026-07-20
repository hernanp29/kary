import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './SiteHeader.css'

export default function SiteHeader() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isActive = (path) => pathname === path

  function irA() {
    setMenuOpen(false)
  }

  return (
    <div className="top-fixed">
      <header>
        <div className="wrap">
          <Link to="/" className="header-logo">
            <img src="https://i.ibb.co/93zSQRcp/logokary-removebg-preview.png" alt="Karina de la Lama" />
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
        <Link to="/tienda" className={isActive('/tienda') ? 'is-active' : ''} onClick={irA}>Tienda</Link>
        <Link to="/talleres" className={isActive('/talleres') ? 'is-active' : ''} onClick={irA}>Talleres</Link>
        <Link to="/servicios" className={isActive('/servicios') ? 'is-active' : ''} onClick={irA}>Servicios</Link>
        <a href="#contacto" onClick={irA}>Contacto</a>
      </nav>
    </div>
  )
}
