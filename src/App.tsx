import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AddPet from './pages/AddPet'
import EditPet from './pages/EditPet'
import Settings from './pages/Settings'
import { useAuthStore } from './store/authStore'
import { usePetStore } from './store/petStore'
import { useSettingsStore } from './store/useSettingsStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />
	}

	return children
}

// Dashboard component is imported from src/pages/Dashboard

export default function App() {
	const isDarkMode = useSettingsStore((state) => state.isDarkMode)
	const loadPets = usePetStore((state) => state.loadPets)
	const loadCatalogs = useSettingsStore((state) => state.loadCatalogs)

	useEffect(() => {
		document.documentElement.classList.toggle('dark', isDarkMode)
	}, [isDarkMode])

	useEffect(() => {
		void loadPets().catch(() => undefined)
	}, [loadPets])

	useEffect(() => {
		void loadCatalogs().catch(() => undefined)
	}, [loadCatalogs])

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<Login />} />

				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route index element={<Dashboard />} />
				</Route>

				<Route
					path="/add-pet"
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route index element={<AddPet />} />
				</Route>

				<Route
					path="/edit-pet/:id"
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route index element={<EditPet />} />
				</Route>

				<Route
					path="/settings"
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route index element={<Settings />} />
				</Route>

				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
			<ToastContainer position="top-right" autoClose={3000} theme="light" />
		</BrowserRouter>
	)
}
