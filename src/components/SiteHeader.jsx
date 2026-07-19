import { Link, useLocation } from 'react-router-dom'
import './SiteHeader.css'

export default function SiteHeader() {
  const { pathname } = useLocation()
  const isActive = (path) => pathname === path

  return (
    <div className="top-fixed">
      <header>
        <div className="wrap">
          <Link to="/" className="header-logo">
            <img src="https://i.ibb.co/KcGmwYzd/Gemini-Generated-Image-6w06pq6w06pq6w06.png" alt="Karina de la Lama" />
          </Link>
          <div className="brand-name">KARINA</div>
          <span className="brand-tag">— arte &amp; magia —</span>
        </div>
      </header>

      <nav>
        <Link to="/" className={isActive('/') ? 'is-active' : ''}>Inicio</Link>
        <Link to="/publicaciones" className={isActive('/publicaciones') ? 'is-active' : ''}>Blog</Link>
        <Link to="/tienda" className={isActive('/tienda') ? 'is-active' : ''}>Tienda</Link>
        <Link to="/talleres" className={isActive('/talleres') ? 'is-active' : ''}>Talleres</Link>
        <a href="#contacto">Contacto</a>
      </nav>
    </div>
  )
}
