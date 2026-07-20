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
            <img src="https://i.ibb.co/93zSQRcp/logokary-removebg-preview.png" alt="Karina de la Lama" />
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
        <Link to="/servicios" className={isActive('/servicios') ? 'is-active' : ''}>Servicios</Link>
        <a href="#contacto">Contacto</a>
      </nav>
    </div>
  )
}
