import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'karinaarteymagia@gmail.com'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

async function getAuthorizedUser(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

// Misma convención simple que ya usás en el contenido del blog:
// "## " al inicio de línea = subtítulo. Línea en blanco = separa párrafos.
function mensajeAHtml(mensaje) {
  const bloques = mensaje.split('\n')
  const partes = []
  let parrafoActual = []

  function cerrarParrafo() {
    if (parrafoActual.length > 0) {
      partes.push(`<p style="margin:0 0 16px;line-height:1.6;">${parrafoActual.join(' ')}</p>`)
      parrafoActual = []
    }
  }

  bloques.forEach((linea) => {
    const trimmed = linea.trim()
    if (trimmed.startsWith('## ')) {
      cerrarParrafo()
      partes.push(`<h2 style="font-size:20px;margin:28px 0 12px;">${trimmed.slice(3)}</h2>`)
    } else if (trimmed === '') {
      cerrarParrafo()
    } else {
      parrafoActual.push(trimmed)
    }
  })
  cerrarParrafo()

  return partes.join('\n')
}

// Pausa entre envíos para no saturar el límite de Gmail (evita que te
// marque la cuenta como spam por mandar todo de golpe).
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

  const { subject, message } = req.body || {}
  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: 'Falta el asunto.' })
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Falta el contenido del mensaje.' })
  }

  const { data: suscriptores, error: dbError } = await supabase
    .from('suscriptores')
    .select('email, full_name')

  if (dbError) {
    console.error('Error al leer suscriptores:', dbError)
    return res.status(500).json({ error: 'No se pudo obtener la lista de suscriptores.' })
  }

  if (!suscriptores || suscriptores.length === 0) {
    return res.status(400).json({ error: 'No hay suscriptores para enviar.' })
  }

  const cuerpoHtml = mensajeAHtml(message.trim())

  let enviados = 0
  const fallidos = []

  for (const s of suscriptores) {
    const nombre = s.full_name || ''
    try {
      await transporter.sendMail({
        from: `"Karina de la Lama" <${process.env.GMAIL_USER}>`,
        to: s.email,
        subject: subject.trim(),
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            ${nombre ? `<p style="margin:0 0 16px;">Hola ${nombre},</p>` : ''}
            ${cuerpoHtml}
            <p style="margin-top:28px;">Un abrazo,<br/>Karina</p>
          </div>
        `,
      })
      enviados++
    } catch (err) {
      console.error('Error al enviar a', s.email, err)
      fallidos.push(s.email)
    }
    // Pequeña pausa entre envíos (Gmail no anda bien con ráfagas grandes)
    await esperar(300)
  }

  return res.status(200).json({
    ok: true,
    total: suscriptores.length,
    enviados,
    fallidos,
  })
}
