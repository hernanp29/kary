import { Routes, Route } from 'react-router-dom'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Publicaciones from './pages/Publicaciones'
import Tienda from './pages/Tienda'
import Talleres from './pages/Talleres'
import Servicios from './pages/Servicios'
import RecursosGratis from './pages/RecursosGratis'
import Login from './pages/Login'
import Admin from './pages/Admin'
import PublicacionDetalle from './pages/PublicacionDetalle'

export default function App() {
  return (
    <div className="site">
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/publicaciones/:slug" element={<PublicacionDetalle />} />
          <Route path="/publicaciones" element={<Publicaciones />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/talleres" element={<Talleres />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/recursos-gratis" element={<RecursosGratis />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  )
}


