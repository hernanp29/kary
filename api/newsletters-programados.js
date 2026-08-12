import { supabase } from '../lib/newsletter-core.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'karinaarteymagia@gmail.com'

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
  const user = await getAuthorizedUser(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'No autorizado.' })
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('newsletters_programados')
      .select('id, subject, scheduled_at, status, destinatarios, resultado, sent_at, created_at')
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Error al leer programados:', error)
      return res.status(500).json({ error: 'No se pudo obtener la lista de programados.' })
    }
    return res.status(200).json({ programados: data || [] })
  }

  if (req.method === 'POST') {
    const { subject, message, attachments, destinatarios, scheduled_at } = req.body || {}

    if (!subject || !subject.trim()) return res.status(400).json({ error: 'Falta el asunto.' })
    if (!message || !message.trim()) return res.status(400).json({ error: 'Falta el mensaje.' })
    if (!scheduled_at) return res.status(400).json({ error: 'Falta la fecha y hora de envío.' })

    const fecha = new Date(scheduled_at)
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'La fecha no es válida.' })
    }
    if (fecha.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'La fecha tiene que ser futura.' })
    }
    if (!Array.isArray(destinatarios) || destinatarios.length === 0) {
      return res.status(400).json({ error: 'Elegí al menos un destinatario.' })
    }

    const { data, error } = await supabase
      .from('newsletters_programados')
      .insert({
        subject: subject.trim(),
        message,
        attachments: Array.isArray(attachments) ? attachments : [],
        destinatarios,
        scheduled_at: fecha.toISOString(),
        status: 'pendiente',
      })
      .select()
      .single()

    if (error) {
      console.error('Error al programar newsletter:', error)
      return res.status(500).json({ error: 'No se pudo programar el envío.' })
    }
    return res.status(200).json({ ok: true, programado: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Falta el id.' })

    // Solo se puede cancelar lo que sigue pendiente (no lo ya enviado).
    const { data, error } = await supabase
      .from('newsletters_programados')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .eq('status', 'pendiente')
      .select()

    if (error) {
      console.error('Error al cancelar programado:', error)
      return res.status(500).json({ error: 'No se pudo cancelar.' })
    }
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'No se encontró un envío pendiente con ese id.' })
    }
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, POST, DELETE')
  return res.status(405).json({ error: 'Método no permitido.' })
}
