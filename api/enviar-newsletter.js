import { createClient } from '@supabase/supabase-js'
import { enviarATodos } from '../lib/newsletter-core.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'karinaarteymagia@gmail.com'

// Vercel limita el tamaño del body de las funciones API — subimos el límite
// por defecto (1mb) para poder mandar imágenes/archivos adjuntos en base64.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
}

async function getAuthorizedUser(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  }

  const user = await getAuthorizedUser(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'No autorizado.' })
  }

  const { subject, message, attachments, destinatarios } = req.body || {}

  try {
    const resultado = await enviarATodos({ subject, message, attachments, destinatarios })
    return res.status(200).json({ ok: true, ...resultado })
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}
