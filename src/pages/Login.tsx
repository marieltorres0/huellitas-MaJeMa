import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const loginSchema = z.object({
  role: z.enum(['admin', 'normal'] as const),
  password: z.string().min(6, 'La contraseña es muy corta'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'admin',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormValues) => {
    if (data.password === '123456') {
      const role = data.role
      const user = {
        id: role === 'admin' ? 'admin-1' : 'normal-1',
        name: role === 'admin' ? 'Administrador' : 'Voluntario',
        email: role === 'admin' ? 'admin@majema.com' : 'voluntario@majema.com',
        role: role,
      }

      login(user)
      navigate('/dashboard')
      return
    }

    toast.error('Credenciales incorrectas')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Huellitas MaJeMa
          </h1>
          <p className="mt-2 text-sm text-slate-500">Acceso al sistema</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
              Seleccionar rol
            </label>
            <select
              id="role"
              {...register('role')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Administrador</option>
              <option value="normal">Voluntario</option>
            </select>
            {errors.role && (
              <p className="mt-2 text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  )
}