import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer id="contacto">
      <div className="section-title" style={{ marginBottom: '14px' }}>Sígueme</div>
      <div
        className="socials"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '22px', marginBottom: '30px' }}
      >
        <a href="https://www.instagram.com/karinaarteymagia369?igsh=cWc5c3RjYzg0ZXlj" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--dorado, #B7924A)" strokeWidth="1.6" aria-label="Instagram">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.4" cy="6.6" r="1.1" fill="var(--dorado, #B7924A)" stroke="none" />
          </svg>
        </a>
        <a href="https://www.facebook.com/share/1BMr1Fg3vq/" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="var(--dorado, #B7924A)" aria-label="Facebook">
            <path d="M15.5 8.5H13.8c-.6 0-1 .5-1 1.1V12h2.6l-.35 2.7H12.8V22H9.9v-7.3H7.7V12h2.2V9.4C9.9 6.9 11.4 5.5 13.7 5.5c1.1 0 2 .1 2.3.1v2.9z" />
          </svg>
        </a>
        <a href="https://www.youtube.com/@karinadelalama369" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--dorado, #B7924A)" strokeWidth="1.6" aria-label="YouTube">
            <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
            <path d="M10.3 9.6l5 2.4-5 2.4z" fill="var(--dorado, #B7924A)" stroke="none" />
          </svg>
        </a>
        <a href="https://wa.me/5491159377545" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="var(--dorado, #B7924A)" aria-label="WhatsApp">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12.004 2C6.486 2 2 6.486 2 12.004c0 1.88.51 3.688 1.475 5.276L2 22l4.83-1.44a9.96 9.96 0 0 0 5.174 1.44h.004c5.518 0 10-4.486 10-10.004C22.008 6.486 17.522 2 12.004 2zm0 18.164h-.003a8.19 8.19 0 0 1-4.174-1.144l-.3-.178-2.866.854.86-2.792-.196-.312a8.15 8.15 0 0 1-1.253-4.588c0-4.508 3.668-8.176 8.183-8.176 2.186 0 4.24.85 5.786 2.397a8.13 8.13 0 0 1 2.396 5.783c0 4.509-3.667 8.176-8.183 8.176z" />
          </svg>
        </a>
      </div>
      <div className="creado">© Karina De La Lama — Arte &amp; Magia</div>
    </footer>
  )
}
