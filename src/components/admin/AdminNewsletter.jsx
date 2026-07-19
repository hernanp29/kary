import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminNewsletter() {
  const [totalSuscriptores, setTotalSuscriptores] = useState(null)
  const [loadingCount, setLoadingCount] = useState(true)

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
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
    try {
      const headers = await authHeader()
      const res = await fetch('/api/suscriptores-admin', { headers })
      const data = await res.json()
      if (res.ok) {
        setTotalSuscriptores(data.total)
      }
    } catch (err) {
      console.error(err)
    }
    setLoadingCount(false)
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
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo enviar el newsletter.')
      } else {
        setResult(data)
        setSubject('')
        setMessage('')
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
    </div>
  )
}
