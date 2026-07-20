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

    // Enviar el email de bienvenida con el material, usando tu Gmail
    const pdfUrl = process.env.PDF_URL
    const imagenUrl = 'https://i.ibb.co/BK7VkRX6/ni-a-jpg.jpg'

    try {
      const info = await transporter.sendMail({
        from: `"Karina de la Lama" <${process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: 'Bienvenida al círculo sagrado 🌙',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <img src="${imagenUrl}" alt="" style="width: 100%; border-radius: 8px; margin-bottom: 20px; display: block;" />

            <p style="margin: 0 0 16px; line-height: 1.7;">Qué alegría saber que hoy nuestras sendas se encontraron.</p>
            <p style="margin: 0 0 16px; line-height: 1.7;">Te doy la bienvenida a este espacio que nació del amor por las plantas, los ciclos de la naturaleza, la sabiduría del cuerpo y la magia de volver a recordar quiénes somos.</p>
            <p style="margin: 0 0 16px; line-height: 1.7;">Si estás aquí, quizás también sientas el llamado de caminar más despacio, de escuchar la voz de la Tierra y de habitar cada estación de tu vida con mayor conciencia.</p>
            <p style="margin: 0 0 16px; line-height: 1.7;">Cada vez que nos encontremos en tu correo compartiré reflexiones sobre las lunaciones, rituales sencillos para acompañar los cambios, enseñanzas sobre medicina herbal, recetas, historias, inspiración y pequeñas semillas para cultivar una vida más conectada con lo esencial.</p>
            <p style="margin: 0 0 16px; line-height: 1.7;">No busco darte respuestas. Mi intención es abrir preguntas, compartir mi experiencia y acompañarte para que encuentres tu propia medicina.</p>
            <p style="margin: 0 0 16px; line-height: 1.7;">Gracias por confiar y por regalarme un lugar en tu bandeja de entrada.</p>
            <p style="margin: 0 0 28px; line-height: 1.7;">Deseo que cada correo sea como una taza de infusión compartida entre mujeres: un momento de pausa, presencia y encuentro.</p>

            <div style="border-top: 1px solid #ccc; padding-top: 24px;">
              ${pdfUrl ? `
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${pdfUrl}" target="_blank" style="display: inline-block; background: #B7924A; color: #1B241D; text-decoration: none; font-weight: bold; padding: 14px 32px; border-radius: 6px;">
                  Descargar mi PDF
                </a>
              </div>
              ` : ''}

              <p style="margin: 0 0 16px; line-height: 1.6;">
                Espero de corazón que lo disfrutes y te sea muy útil. Si te dan ganas, respondeme a este mail y contame qué te pareció, ¡me encantaría leerte!
              </p>

              <p style="margin: 0;">
                Te mando un abrazo grande,<br/>
                Karina<br/>
                <em>—Arte y Magia—</em>
              </p>
            </div>
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
