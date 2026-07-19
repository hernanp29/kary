import { Link } from 'react-router-dom'
import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer id="contacto">

      <div className="socials">
        <a href="https://www.instagram.com/karinaarteymagia369?igsh=cWc5c3RjYzg0ZXlj" target="_blank" rel="noopener">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/161/62a8d3cdab074_instagram.png" alt="Instagram" />
        </a>
        <a href="#" target="_blank" rel="noopener">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/161/62a8d367aaa51_facebook.png" alt="Facebook" />
        </a>
        <a href="#" target="_blank" rel="noopener">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/161/62a8d3eb46d7e_yotube.png" alt="YouTube" />
        </a>
        <a href="https://wa.me/5491159377545" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-label="WhatsApp">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12.004 2C6.486 2 2 6.486 2 12.004c0 1.88.51 3.688 1.475 5.276L2 22l4.83-1.44a9.96 9.96 0 0 0 5.174 1.44h.004c5.518 0 10-4.486 10-10.004C22.008 6.486 17.522 2 12.004 2zm0 18.164h-.003a8.19 8.19 0 0 1-4.174-1.144l-.3-.178-2.866.854.86-2.792-.196-.312a8.15 8.15 0 0 1-1.253-4.588c0-4.508 3.668-8.176 8.183-8.176 2.186 0 4.24.85 5.786 2.397a8.13 8.13 0 0 1 2.396 5.783c0 4.509-3.667 8.176-8.183 8.176z" />
          </svg>
        </a>
      </div>
      <div className="footer-links">
        <a href="https://www.instagram.com/karinaarteymagia369/" target="_blank" rel="noopener">Nosotros</a>
        <a href="#contacto">Contacto</a>
        <a href="#">Términos y condiciones</a>
        <a href="#">Política de privacidad</a>
        <Link to="/login">Acceder</Link>
      </div>
      <div className="creado">© Karina De La Lama — Arte &amp; Magia</div>
    </footer>
  )
}
