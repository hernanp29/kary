import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Vive en /lib (no en /api) a propósito: los archivos dentro de /api se
// convierten automáticamente en endpoints públicos en Vercel. Este módulo
// es solo lógica compartida, no tiene que ser una ruta.

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// Misma convención simple que ya se usa en el contenido del blog:
// "## " al inicio de línea = subtítulo. Línea en blanco = separa párrafos.
// Además, [texto](url) dentro de un párrafo se convierte en un link real.
function convertirLinks(texto) {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g
  return texto.replace(
    linkRegex,
    (_, textoLink, url) =>
      `<a href="${url}" style="color:#b7924a;text-decoration:underline;" target="_blank" rel="noopener noreferrer">${textoLink}</a>`
  )
}

export function mensajeAHtml(mensaje) {
  const bloques = mensaje.split('\n')
  const partes = []
  let parrafoActual = []

  function cerrarParrafo() {
    if (parrafoActual.length > 0) {
      partes.push(`<p style="margin:0 0 16px;line-height:1.6;">${convertirLinks(parrafoActual.join(' '))}</p>`)
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

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Envía un newsletter a los destinatarios indicados (o a todos los
 * suscriptores si no se pasa una lista puntual).
 *
 * Lanza un Error si falta algo esencial (asunto, mensaje, destinatarios
 * válidos) — eso es lo que el que llama debe atrapar y mostrar. Los fallos
 * de un destinatario puntual (ej: email inválido) NO cortan el envío al
 * resto; quedan listados en "fallidos".
 */
export async function enviarATodos({ subject, message, attachments, destinatarios }) {
  if (!subject || !subject.trim()) throw new Error('Falta el asunto.')
  if (!message || !message.trim()) throw new Error('Falta el contenido del mensaje.')

  const { data: todosSuscriptores, error: dbError } = await supabase
    .from('suscriptores')
    .select('email, full_name')

  if (dbError) {
    console.error('Error al leer suscriptores:', dbError)
    throw new Error('No se pudo obtener la lista de suscriptores.')
  }

  if (!todosSuscriptores || todosSuscriptores.length === 0) {
    throw new Error('No hay suscriptores para enviar.')
  }

  // Si se eligieron destinatarios puntuales, filtramos contra la lista real
  // de suscriptores (nunca confiamos ciegamente en una lista de emails suelta).
  let suscriptores = todosSuscriptores
  if (Array.isArray(destinatarios) && destinatarios.length > 0) {
    const set = new Set(destinatarios)
    suscriptores = todosSuscriptores.filter((s) => set.has(s.email))
  }

  if (suscriptores.length === 0) {
    throw new Error('No hay destinatarios seleccionados.')
  }

  // Separar adjuntos: las imágenes se embeben en el cuerpo (cid),
  // el resto (PDF, docs, etc.) va como adjunto normal para descargar.
  const archivosAdjuntos = Array.isArray(attachments) ? attachments : []
  const nodemailerAttachments = []
  const imagenesInlineHtml = []

  archivosAdjuntos.forEach((file, i) => {
    const esImagen = (file.contentType || '').startsWith('image/')
    const buffer = Buffer.from(file.content, 'base64')

    if (esImagen) {
      const cid = `imagen-${i}`
      nodemailerAttachments.push({
        filename: file.filename,
        content: buffer,
        contentType: file.contentType,
        cid,
      })
      imagenesInlineHtml.push(
        `<img src="cid:${cid}" alt="${file.filename}" style="max-width:100%;margin-top:16px;border-radius:8px;" />`
      )
    } else {
      nodemailerAttachments.push({
        filename: file.filename,
        content: buffer,
        contentType: file.contentType,
      })
    }
  })

  const cuerpoHtml = mensajeAHtml(message.trim())
  const imagenesHtml = imagenesInlineHtml.join('\n')

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
            ${imagenesHtml}
            <p style="margin-top:28px;">Con amor<br/>Karina De La Lama<br/>-arte & magia-</p>
          </div>
        `,
        attachments: nodemailerAttachments,
      })
      enviados++
    } catch (err) {
      console.error('Error al enviar a', s.email, err)
      fallidos.push(s.email)
    }
    await esperar(300)
  }

  return { total: suscriptores.length, enviados, fallidos }
}
