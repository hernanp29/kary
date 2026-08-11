import { useEffect, useRef, useState } from 'react'
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
  const [busqueda, setBusqueda] = useState('')
  const [seleccionados, setSeleccionados] = useState(new Set())

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [archivos, setArchivos] = useState([]) // [{filename, contentType, content, size}]
  const [archivoError, setArchivoError] = useState('')

  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const mensajeRef = useRef(null)

  function insertarLink() {
    const url = window.prompt('Pegá la URL a la que tiene que apuntar (http:// o https://):')
    if (!url) return
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      window.alert('El link tiene que empezar con http://, https:// o mailto:')
      return
    }
    const texto = window.prompt('¿Qué texto querés que se muestre (ej: "Ver el taller")?', '') || url

    const snippet = `[${texto}](${url})`
    const textarea = mensajeRef.current
    const actual = message

    if (!textarea) {
      setMessage(actual + snippet)
      return
    }

    const inicio = textarea.selectionStart
    const fin = textarea.selectionEnd
    const nuevoMensaje = actual.slice(0, inicio) + snippet + actual.slice(fin)
    setMessage(nuevoMensaje)

    requestAnimationFrame(() => {
      const posicion = inicio + snippet.length
      textarea.focus()
      textarea.setSelectionRange(posicion, posicion)
    })
  }

  useEffect(() => {
    fetchCount()
  }, [])

  const suscriptoresFiltrados = suscriptores.filter((s) => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return true
    return s.email.toLowerCase().includes(q) || (s.full_name || '').toLowerCase().includes(q)
  })

  const todosFiltradosSeleccionados =
    suscriptoresFiltrados.length > 0 && suscriptoresFiltrados.every((s) => seleccionados.has(s.email))

  function toggleUno(email) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  function toggleTodosFiltrados() {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (todosFiltradosSeleccionados) {
        suscriptoresFiltrados.forEach((s) => next.delete(s.email))
      } else {
        suscriptoresFiltrados.forEach((s) => next.add(s.email))
      }
      return next
    })
  }

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
        setSeleccionados(new Set((data.suscriptores || []).map((s) => s.email)))
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
          destinatarios: Array.from(seleccionados),
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
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            Mensaje
            <button
              type="button"
              className="btn-secondary"
              onClick={insertarLink}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              + Insertar link
            </button>
          </span>
          <textarea
            ref={mensajeRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            required
            placeholder={'Escribí acá el contenido.\n\nUsá "## " al inicio de una línea para un subtítulo, y una línea vacía para separar párrafos — igual que en el blog.\n\nPara un link, usá el botón "+ Insertar link" o escribí [texto](https://ejemplo.com) a mano.'}
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
          <button type="submit" className="btn-primary" disabled={sending || seleccionados.size === 0}>
            Enviar a {seleccionados.size} de {totalSuscriptores ?? 0} suscriptor{totalSuscriptores === 1 ? '' : 'es'}
          </button>
        )}

        {confirming && (
          <div className="admin-form__actions">
            <p className="admin-error" style={{ width: '100%' }}>
              ¿Confirmás el envío a los {seleccionados.size} contactos seleccionados? No se puede deshacer.
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
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '10px 0 14px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar por nombre o email…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: '1 1 240px',
                padding: '8px 10px',
                borderRadius: 6,
                border: '0.5px solid var(--linea, rgba(255,255,255,0.15))',
                background: 'transparent',
                color: 'inherit',
              }}
            />
            <button type="button" className="btn-secondary" onClick={toggleTodosFiltrados}>
              {todosFiltradosSeleccionados ? 'Deseleccionar' : 'Seleccionar'} {busqueda ? 'estos' : 'todos'}
            </button>
            <span className="label-mono">{seleccionados.size} seleccionados</span>
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto', border: '0.5px solid var(--linea, rgba(255,255,255,0.15))', borderRadius: '8px' }}>
            <table className="admin-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      checked={todosFiltradosSeleccionados}
                      onChange={toggleTodosFiltrados}
                    />
                  </th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Suscripto el</th>
                </tr>
              </thead>
              <tbody>
                {suscriptoresFiltrados.map((s) => (
                  <tr key={s.email}>
                    <td>
                      <input
                        type="checkbox"
                        checked={seleccionados.has(s.email)}
                        onChange={() => toggleUno(s.email)}
                      />
                    </td>
                    <td>{s.full_name || '—'}</td>
                    <td>{s.email}</td>
                    <td>{s.created_at ? new Date(s.created_at).toLocaleDateString('es-AR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {suscriptoresFiltrados.length === 0 && (
            <p className="admin-empty">Ningún suscriptor coincide con "{busqueda}".</p>
          )}
        </>
      )}

      {!loadingCount && suscriptores.length === 0 && !errorLista && (
        <p className="admin-empty">Todavía no hay suscriptores.</p>
      )}
    </div>
  )
}
