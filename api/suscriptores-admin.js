import { createClient } from '@supabase/supabase-js'

// Mismo patrón que /api/suscribir: service_role corre solo en el servidor
// y bypassea RLS para poder leer la tabla "suscriptores".
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'karinaarteymagia@gmail.com'

async function getAuthorizedUser(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Método no permitido.' })
  }

  const user = await getAuthorizedUser(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'No autorizado.' })
  }

  const { data, error } = await supabase
    .from('suscriptores')
    .select('email, full_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al leer suscriptores:', error)
    return res.status(500).json({ error: 'No se pudo obtener la lista de suscriptores.' })
  }

  return res.status(200).json({ suscriptores: data || [], total: (data || []).length })
}
