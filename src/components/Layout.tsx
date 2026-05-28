import { Outlet, useNavigate, Link } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
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
    <div className="min-h-screen flex bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <aside className="w-64 flex flex-col justify-between bg-white shadow-md transition-colors dark:bg-gray-800 dark:text-gray-100">
        <div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-300">Huellitas MaJeMa</h2>
          </div>

          <nav className="px-4">
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="block rounded px-3 py-2 text-slate-700 hover:bg-blue-50 dark:text-gray-100 dark:hover:bg-gray-700">Panel</Link>
              </li>
              <li>
                <Link to="/add-pet" className="block rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">Registrar Mascota</Link>
              </li>
            </ul>

            <div className="mt-8 border-t border-slate-200 pt-4 dark:border-gray-700">
              <Link
                to="/settings"
                className="flex items-center gap-3 rounded px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Configuración</span>
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-slate-700 dark:text-gray-200">Hola, {user?.role ?? 'invitado'}</div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-red-100 px-4 py-2 text-red-700 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-blue-50 p-6 dark:bg-gray-900">
        <Outlet />
      </main>
    </div>
  )
}
