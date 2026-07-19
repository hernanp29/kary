import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Cliente de Supabase con la service_role key: corre solo en el servidor,
// nunca se expone al navegador, y bypassea RLS para poder insertar en
// la tabla "suscriptores" (que no tiene policies públicas).
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Transportador de Gmail: usa tu propio Gmail + un "App Password"
// (NO tu contraseña normal de Google). Se genera en
// myaccount.google.com/apppasswords con la verificación en 2 pasos activada.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // ej: poncehernan29@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD, // el App Password de 16 caracteres
  },
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  }

  const { name, email } = req.body || {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Falta el nombre.' })
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'El email no es válido.' })
  }

  const fullName = name.trim().slice(0, 200)
  const cleanEmail = email.trim().toLowerCase().slice(0, 200)

  try {
    // Guardar (o actualizar el nombre si ya existía el email)
    const { error: dbError } = await supabase
      .from('suscriptores')
      .upsert({ full_name: fullName, email: cleanEmail }, { onConflict: 'email' })

    if (dbError) {
      console.error('Supabase error:', dbError)
      return res.status(500).json({ error: 'No se pudo guardar tu suscripción. Probá de nuevo.' })
    }

    // Enviar el email con el material, usando tu Gmail
    const pdfUrl = process.env.PDF_URL

    try {
      const info = await transporter.sendMail({
        from: `"Karina de la Lama" <${process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: 'Bienvenida al círculo sagrado 🌙',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>¡Bienvenida, ${fullName}!</h2>
            <p>Gracias por sumarte a la comunidad. Acá tenés tu material:</p>
            ${pdfUrl ? `<p><a href="${pdfUrl}" target="_blank">Descargar PDF</a></p>` : ''}
            <p>Un abrazo,<br/>Karina</p>
          </div>
        `,
      })
      console.log('Email enviado correctamente:', info.messageId)
    } catch (emailErr) {
      console.error('Error al enviar email con Gmail:', emailErr)
      return res.status(500).json({ error: 'No se pudo enviar el email: ' + emailErr.message })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error en /api/suscribir:', err)
    return res.status(500).json({ error: 'Algo salió mal. Probá de nuevo en un momento.' })
  }
}
