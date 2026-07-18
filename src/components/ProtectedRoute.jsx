import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return <p className="label-mono" style={{ padding: '48px 24px' }}>Verificando sesión…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '48px 0' }}>
        <p>No tenés permisos de administrador para ver esta página.</p>
      </div>
    )
  }

  return children
}
