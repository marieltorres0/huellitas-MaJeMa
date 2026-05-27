import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white shadow-md flex flex-col justify-between">
        <div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-600">Huellitas MaJeMa</h2>
          </div>

          <nav className="px-4">
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="block rounded px-3 py-2 text-slate-700 hover:bg-blue-50">Panel</Link>
              </li>
              <li>
                <Link to="/add-pet" className="block rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">Registrar Mascota</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-slate-700">Hola, {user?.role ?? 'invitado'}</div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-blue-50 p-6">
        <Outlet />
      </main>
    </div>
  )
}
