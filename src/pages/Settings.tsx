import { useEffect, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { normalizeSpeciesOption } from '../utils/speciesOptions'
import { DEFAULT_BREED_OPTIONS } from '../utils/breedOptions'

export default function Settings() {
  const profile = useSettingsStore((state) => state.profile)
  const setProfile = useSettingsStore((state) => state.setProfile)
  const speciesOptions = useSettingsStore((state) => state.speciesOptions)
  const breedOptions = useSettingsStore((state) => state.breedOptions)
  const saveCatalogs = useSettingsStore((state) => state.saveCatalogs)
  const userRole = useAuthStore((state) => state.user?.role ?? 'normal')
  const isAdmin = userRole === 'admin'
  const [notifications, setNotifications] = useState(true)
  const [formData, setFormData] = useState(profile)
  const [speciesDraft, setSpeciesDraft] = useState([...speciesOptions])
  const [breedDraft, setBreedDraft] = useState(structuredClone(breedOptions))
  const [catalogSpecies, setCatalogSpecies] = useState(speciesOptions[0] ?? 'Perro')
  const [newSpecies, setNewSpecies] = useState('')
  const [newBreed, setNewBreed] = useState('')
  const isDarkMode = useSettingsStore((state) => state.isDarkMode)
  const toggleDarkMode = useSettingsStore((state) => state.toggleDarkMode)

  useEffect(() => {
    setFormData(profile)
  }, [profile])

  useEffect(() => {
    setSpeciesDraft([...speciesOptions])
  }, [speciesOptions])

  useEffect(() => {
    setBreedDraft(structuredClone(breedOptions))
  }, [breedOptions])

  useEffect(() => {
    if (!speciesDraft.includes(catalogSpecies)) {
      setCatalogSpecies(speciesDraft[0] ?? 'Perro')
    }
  }, [catalogSpecies, speciesDraft])

  const hasChanges =
    JSON.stringify(formData) !== JSON.stringify(profile) ||
    JSON.stringify(speciesDraft) !== JSON.stringify(speciesOptions) ||
    JSON.stringify(breedDraft) !== JSON.stringify(breedOptions)

  const toggleClasses = (isActive: boolean) =>
    `flex h-7 w-12 items-center rounded-full p-1 transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`

  const knobClasses = (isActive: boolean) =>
    `h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-full' : 'translate-x-0'}`

  const handleAddSpecies = () => {
    const normalizedSpecies = normalizeSpeciesOption(newSpecies)

    if (!normalizedSpecies) {
      toast.error('Escribe una especie válida antes de agregarla')
      return
    }

    const alreadyExists = speciesDraft.some((option) => option.toLowerCase() === normalizedSpecies.toLowerCase())
    if (alreadyExists) {
      toast.error('Esa especie ya existe')
      return
    }

    setSpeciesDraft((current) => [...current, normalizedSpecies])
    setNewSpecies('')
    toast.info(`Se agregará ${normalizedSpecies} al guardar`)
  }

  const handleRemoveSpecies = (species: string) => {
    if (speciesDraft.length <= 1) {
      toast.error('Debe existir al menos una especie')
      return
    }

    setSpeciesDraft((current) => current.filter((option) => option.toLowerCase() !== species.trim().toLowerCase()))
    toast.info(`Se eliminará ${species} al guardar`)
  }

  const handleAddBreed = () => {
    const normalizedBreed = normalizeSpeciesOption(newBreed)

    if (!normalizedBreed) {
      toast.error('Escribe una raza válida antes de agregarla')
      return
    }

    const currentBreeds = breedDraft[catalogSpecies] ?? []
    const alreadyExists = currentBreeds.some((breed) => breed.toLowerCase() === normalizedBreed.toLowerCase())
    if (alreadyExists) {
      toast.error('Esa raza ya existe para esta especie')
      return
    }

    setBreedDraft((current) => ({
      ...current,
      [catalogSpecies]: [...(current[catalogSpecies] ?? []), normalizedBreed],
    }))
    setNewBreed('')
    toast.info(`Se agregará ${normalizedBreed} al guardar`)
  }

  const handleRemoveBreed = (breed: string) => {
    const currentBreeds = breedDraft[catalogSpecies] ?? []
    if (currentBreeds.length <= 1) {
      toast.error('Debe existir al menos una raza para esta especie')
      return
    }

    setBreedDraft((current) => ({
      ...current,
      [catalogSpecies]: currentBreeds.filter((option) => option.toLowerCase() !== breed.trim().toLowerCase()),
    }))
    toast.info(`Se eliminará ${breed} al guardar`)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 rounded-3xl bg-slate-50 p-1 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-950/40">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">Configuración del Refugio</h1>
            <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">Administra las preferencias generales del sistema</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-lg bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 transition-colors dark:bg-blue-950/40 dark:shadow-none dark:ring-blue-800">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Perfil del Refugio</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Información pública y de contacto del refugio.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Refugio</label>
              <input
                type="text"
                value={formData.nombre}
                disabled={!isAdmin}
                onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono Principal</label>
              <input
                type="text"
                value={formData.telefono}
                disabled={!isAdmin}
                onChange={(event) => setFormData({ ...formData, telefono: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección Pública</label>
              <textarea
                rows={3}
                value={formData.direccion}
                disabled={!isAdmin}
                onChange={(event) => setFormData({ ...formData, direccion: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              />
            </div>
          </div>
        </article>

        <article className="rounded-lg bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 transition-colors dark:bg-blue-950/40 dark:shadow-none dark:ring-blue-800">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Preferencias del Sistema</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ajustes visuales y notificaciones del panel.</p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-colors dark:border-blue-800 dark:bg-blue-950/60">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-50">Notificaciones de Nueva Adopción</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Recibe alertas cuando una mascota sea adoptada.</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                aria-pressed={notifications}
                aria-label="Alternar notificaciones de nueva adopción"
                className={toggleClasses(notifications)}
              >
                <span className={knobClasses(notifications)} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-colors dark:border-blue-800 dark:bg-blue-950/60">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-50">Activar Modo Oscuro</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Alterna el tema visual del sistema.</p>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-pressed={isDarkMode}
                aria-label="Alternar modo oscuro"
                className={toggleClasses(isDarkMode)}
              >
                <span className={knobClasses(isDarkMode)} />
              </button>
            </div>
          </div>
        </article>
      </section>

      {isAdmin && (
        <article className="rounded-lg bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 transition-colors dark:bg-blue-950/40 dark:shadow-none dark:ring-blue-800">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Catálogos de campos de mascota</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Administra las opciones que aparecerán en los formularios de mascotas.</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newSpecies}
                onChange={(event) => setNewSpecies(event.target.value)}
                placeholder="Ej. Conejo"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={handleAddSpecies}
                className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Agregar especie
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {speciesDraft.map((species) => (
                <span
                  key={species}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-100"
                >
                  {species}
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecies(species)}
                    className="rounded-full px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-blue-900"
                    aria-label={`Eliminar especie ${species}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Razas por especie</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Selecciona una especie y administra sus razas disponibles.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Especie</label>
                  <select
                    value={catalogSpecies}
                    onChange={(event) => setCatalogSpecies(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  >
                    {speciesDraft.map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newBreed}
                    onChange={(event) => setNewBreed(event.target.value)}
                    placeholder="Ej. Beagle"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddBreed}
                    className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    Agregar raza
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(breedDraft[catalogSpecies] ?? DEFAULT_BREED_OPTIONS[catalogSpecies] ?? ['Mestizo']).map((breed) => (
                    <span
                      key={breed}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-100"
                    >
                      {breed}
                      <button
                        type="button"
                        onClick={() => handleRemoveBreed(breed)}
                        className="rounded-full px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-blue-900"
                        aria-label={`Eliminar raza ${breed}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>
      )}

      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={async () => {
              try {
                setProfile(formData)
                await saveCatalogs({ speciesOptions: speciesDraft, breedOptions: breedDraft })
                toast.success('¡Configuración guardada con éxito!')
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los catálogos')
              }
            }}
            disabled={!hasChanges}
            className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-blue-950/40 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  )
}