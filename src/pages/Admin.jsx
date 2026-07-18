import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminPosts from '../components/admin/AdminPosts'
import AdminProducts from '../components/admin/AdminProducts'
import AdminWorkshops from '../components/admin/AdminWorkshops'
import './Admin.css'

const TABS = [
  { key: 'posts', label: 'Publicaciones' },
  { key: 'products', label: 'Tienda' },
  { key: 'workshops', label: 'Talleres' },
]

export default function Admin() {
  const { profile, signOut } = useAuth()
  const [tab, setTab] = useState('posts')

  return (
    <div className="container admin">
      <header className="admin__header">
        <div>
          <span className="label-mono">Panel de administrador</span>
          <h1>Hola, {profile?.full_name || 'admin'}</h1>
        </div>
        <button className="admin__logout" onClick={signOut}>Cerrar sesión</button>
      </header>

      <nav className="admin__tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin__tab ${tab === t.key ? 'admin__tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="admin__content">
        {tab === 'posts' && <AdminPosts />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'workshops' && <AdminWorkshops />}
      </div>
    </div>
  )
}
