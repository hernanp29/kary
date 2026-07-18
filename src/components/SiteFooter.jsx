import { Link } from 'react-router-dom'
import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer id="contacto">
      <div className="brand-name">KARINA DE LA LAMA</div>
      <div className="socials">
        <a href="https://www.instagram.com/karinaarteymagia369?igsh=cWc5c3RjYzg0ZXlj" target="_blank" rel="noopener">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/161/62a8d3cdab074_instagram.png" alt="Instagram" />
        </a>
        <a href="#" target="_blank" rel="noopener">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/161/62a8d367aaa51_facebook.png" alt="Facebook" />
        </a>
        <a href="#" target="_blank" rel="noopener">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/161/63ae9e97153ee_pinterest-round-logo.svg" alt="Pinterest" />
        </a>
        <a href="#" target="_blank" rel="noopener">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/161/62a8d3eb46d7e_yotube.png" alt="YouTube" />
        </a>
      </div>
      <div className="footer-links">
        <a href="https://www.instagram.com/karinaarteymagia369/" target="_blank" rel="noopener">Nosotros</a>
        <a href="#contacto">Contacto</a>
        <a href="#">Términos y condiciones</a>
        <a href="#">Política de privacidad</a>
        <Link to="/login">Acceder</Link>
      </div>
      <div className="creado">© Karina de la Lama — Arte &amp; Magia</div>
    </footer>
  )
}
