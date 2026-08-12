import { supabase, enviarATodos } from '../lib/newsletter-core.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'karinaarteymagia@gmail.com'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
}

// Autoriza dos casos:
// 1) El cron job de Vercel: si existe la env var CRON_SECRET, Vercel manda
//    automáticamente "Authorization: Bearer <CRON_SECRET>" en cada invocación.
// 2) Un click manual del admin desde el panel (mismo login que el resto).
async function estaAutorizado(req) {
  const authHeader = req.headers.authorization || ''

  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const { data, error } = await supabase.auth.getUser(token)
    if (!error && data?.user?.email === ADMIN_EMAIL) return true
  }

  return false
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  }

  if (!(await estaAutorizado(req))) {
    return res.status(403).json({ error: 'No autorizado.' })
  }

  const ahora = new Date().toISOString()

  const { data: pendientes, error } = await supabase
    .from('newsletters_programados')
    .select('*')
    .eq('status', 'pendiente')
    .lte('scheduled_at', ahora)

  if (error) {
    console.error('Error al leer programados vencidos:', error)
    return res.status(500).json({ error: 'No se pudo leer la lista de programados.' })
  }

  const resultados = []

  for (const n of pendientes || []) {
    try {
      const resultado = await enviarATodos({
        subject: n.subject,
        message: n.message,
        attachments: n.attachments || [],
        destinatarios: n.destinatarios || [],
      })

      await supabase
        .from('newsletters_programados')
        .update({ status: 'enviado', resultado, sent_at: new Date().toISOString() })
        .eq('id', n.id)

      resultados.push({ id: n.id, subject: n.subject, ...resultado })
    } catch (err) {
      console.error('Error al enviar programado', n.id, err)

      await supabase
        .from('newsletters_programados')
        .update({ status: 'error', resultado: { error: String(err.message || err) } })
        .eq('id', n.id)

      resultados.push({ id: n.id, subject: n.subject, error: String(err.message || err) })
    }
  }

  return res.status(200).json({ ok: true, procesados: resultados.length, resultados })
}
