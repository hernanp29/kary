import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const MAX_TOTAL_MB = 12 // dejamos margen bajo el límite de 15mb del endpoint

function leerArchivoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // reader.result viene como "data:image/png;base64,AAAA..." — nos quedamos solo con la parte base64
      const base64 = reader.result.split(',')[1]
      resolve({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        content: base64,
        size: file.size,
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AdminNewsletter() {
  const [suscriptores, setSuscriptores] = useState([])
  const [totalSuscriptores, setTotalSuscriptores] = useState(null)
  const [loadingCount, setLoadingCount] = useState(true)
  const [errorLista, setErrorLista] = useState('')

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [archivos, setArchivos] = useState([]) // [{filename, contentType, content, size}]
  const [archivoError, setArchivoError] = useState('')

  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCount()
  }, [])

  async function authHeader() {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function fetchCount() {
    setLoadingCount(true)
    setErrorLista('')
    try {
      const headers = await authHeader()
      const res = await fetch('/api/suscriptores-admin', { headers })
      const data = await res.json()
      if (res.ok) {
        setTotalSuscriptores(data.total)
        setSuscriptores(data.suscriptores || [])
      } else {
        setErrorLista(data.error || 'No se pudo cargar la lista de suscriptores.')
      }
    } catch (err) {
      console.error(err)
      setErrorLista('No se pudo cargar la lista de suscriptores.')
    }
    setLoadingCount(false)
  }

  async function handleFileChange(e) {
    setArchivoError('')
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const nuevos = await Promise.all(files.map(leerArchivoComoBase64))

    const totalBytes = [...archivos, ...nuevos].reduce((sum, f) => sum + f.size, 0)
    if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
      setArchivoError(`El total de archivos no puede superar los ${MAX_TOTAL_MB}MB (Gmail y el servidor tienen límite).`)
      return
    }

    setArchivos((prev) => [...prev, ...nuevos])
    e.target.value = '' // permite volver a elegir el mismo archivo si lo saca y lo quiere agregar de nuevo
  }

  function quitarArchivo(index) {
    setArchivos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSend() {
    setSending(true)
    setError('')
    setResult(null)

    try {
      const headers = await authHeader()
      const res = await fetch('/api/enviar-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          subject,
          message,
          attachments: archivos.map(({ filename, contentType, content }) => ({ filename, contentType, content })),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo enviar el newsletter.')
      } else {
        setResult(data)
        setSubject('')
        setMessage('')
        setArchivos([])
      }
    } catch (err) {
      setError('Algo salió mal: ' + err.message)
    }

    setSending(false)
    setConfirming(false)
  }

  return (
    <div>
      <div className="admin-panel__header">
        <h2>Newsletter</h2>
      </div>

      <p className="label-mono">
        {loadingCount ? 'Cargando…' : `${totalSuscriptores ?? 0} suscriptor${totalSuscriptores === 1 ? '' : 'es'} registrado${totalSuscriptores === 1 ? '' : 's'}`}
      </p>

      {errorLista && <p className="admin-error">{errorLista}</p>}

      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault()
          setConfirming(true)
        }}
      >
        <label>
          Asunto
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </label>

        <label>
          Mensaje
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            required
            placeholder={'Escribí acá el contenido.\n\nUsá "## " al inicio de una línea para un subtítulo, y una línea vacía para separar párrafos — igual que en el blog.'}
          />
        </label>

        <label>
          Imágenes o archivos adjuntos (opcional)
          <input type="file" multiple onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
        </label>

        {archivoError && <p className="admin-error">{archivoError}</p>}

        {archivos.length > 0 && (
          <ul className="admin-list">
            {archivos.map((f, i) => (
              <li key={i} className="admin-list__item">
                {f.contentType.startsWith('image/') ? '🖼️' : '📎'} {f.filename}
                <span className="label-mono"> · {(f.size / 1024).toFixed(0)}kb</span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginLeft: 12 }}
                  onClick={() => quitarArchivo(i)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {!confirming && (
          <button type="submit" className="btn-primary" disabled={sending || !totalSuscriptores}>
            Enviar a {totalSuscriptores ?? 0} suscriptor{totalSuscriptores === 1 ? '' : 'es'}
          </button>
        )}

        {confirming && (
          <div className="admin-form__actions">
            <p className="admin-error" style={{ width: '100%' }}>
              ¿Confirmás el envío a los {totalSuscriptores} suscriptores? No se puede deshacer.
            </p>
            <button type="button" className="btn-primary" disabled={sending} onClick={handleSend}>
              {sending ? 'Enviando…' : 'Sí, enviar ahora'}
            </button>
            <button type="button" className="btn-secondary" disabled={sending} onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </div>
        )}

        {error && <p className="admin-error">{error}</p>}

        {result && (
          <p className="admin-form__mensaje">
            Enviado a {result.enviados} de {result.total}.
            {result.fallidos.length > 0 && ` Fallaron: ${result.fallidos.join(', ')}`}
          </p>
        )}
      </form>

      <h2 style={{ marginTop: '2.5rem' }}>Suscriptores</h2>

      {!loadingCount && suscriptores.length > 0 && (
        <div style={{ maxHeight: '420px', overflowY: 'auto', border: '0.5px solid var(--linea, rgba(255,255,255,0.15))', borderRadius: '8px' }}>
          <table className="admin-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Suscripto el</th>
              </tr>
            </thead>
            <tbody>
              {suscriptores.map((s) => (
                <tr key={s.email}>
                  <td>{s.full_name || '—'}</td>
                  <td>{s.email}</td>
                  <td>{s.created_at ? new Date(s.created_at).toLocaleDateString('es-AR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loadingCount && suscriptores.length === 0 && !errorLista && (
        <p className="admin-empty">Todavía no hay suscriptores.</p>
      )}
    </div>
  )
}
