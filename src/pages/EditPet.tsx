import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { usePetStore } from '../store/petStore'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { DEFAULT_SPECIES_OPTIONS, mergeSpeciesOptions } from '../utils/speciesOptions'
import { getBreedOptionsForSpecies } from '../utils/breedOptions'
import {
  birthDateDisplayToISO,
  birthDateISOToDisplay,
  formatBirthDateDigits,
  isValidBirthDateDisplay,
} from '../utils/birthDate'

const editPetSchema = z
  .object({
    name: z.string().min(1, 'Nombre es obligatorio'),
    breed: z.string().min(1, 'Raza es obligatoria'),
    age: z.string().min(1, 'Edad es obligatoria'),
    birthDate: z.string().min(1, 'Fecha de nacimiento es obligatoria').refine(isValidBirthDateDisplay, {
      message: 'Escribe una fecha válida o usa el calendario',
    }),
    weight: z.string().min(1, 'Peso es obligatorio'),
    species: z.string().min(1, 'Especie es obligatoria'),
    medicalStatus: z.enum(['SANO', 'EN_TRATAMIENTO', 'NECESIDADES_ESPECIALES'] as const),
    medicalNotes: z.string().min(1, 'Notas médicas son obligatorias'),
    adoptionStatus: z.enum(['DISPONIBLE', 'EN_PROCESO', 'ADOPTADO'] as const),
    adopterName: z.string().optional(),
    adopterPhone: z.string().optional(),
    adopterAddress: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.adoptionStatus === 'ADOPTADO') {
      if (!data.adopterName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adopterName'],
          message: 'Nombre del adoptante es obligatorio',
        })
      }
      if (!data.adopterPhone?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adopterPhone'],
          message: 'Teléfono del adoptante es obligatorio',
        })
      }
      if (!data.adopterAddress?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adopterAddress'],
          message: 'Dirección del adoptante es obligatoria',
        })
      }
    }
  })

type EditPetForm = z.infer<typeof editPetSchema>

export default function EditPet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const pets = usePetStore((s) => s.pets)
  const updatePet = usePetStore((s) => s.updatePet)
  const user = useAuthStore((s) => s.user)
  const speciesOptions = useSettingsStore((s) => s.speciesOptions)
  const breedOptions = useSettingsStore((s) => s.breedOptions)
  const birthDatePickerRef = useRef<HTMLInputElement | null>(null)

  const pet = pets.find((p) => p.id === id)
  const isNormal = user?.role === 'normal'
  const speciesChoices = mergeSpeciesOptions(
    speciesOptions.length > 0 ? speciesOptions : [...DEFAULT_SPECIES_OPTIONS],
    pet?.species,
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditPetForm>({
    resolver: zodResolver(editPetSchema),
    defaultValues: {
      name: '',
      breed: '',
      age: '',
      birthDate: '',
      weight: '',
      species: 'Perro',
      medicalStatus: 'SANO',
      medicalNotes: '',
      adoptionStatus: 'DISPONIBLE',
      adopterName: '',
      adopterPhone: '',
      adopterAddress: '',
    },
  })

  useEffect(() => {
    if (!pet) return

    reset({
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      birthDate: birthDateISOToDisplay(pet.birthDate),
      weight: pet.weight,
      species: pet.species,
      medicalStatus: pet.medicalStatus,
      medicalNotes: pet.medicalNotes,
      adoptionStatus: pet.adoptionStatus,
      adopterName: pet.adopterName ?? '',
      adopterPhone: pet.adopterPhone ?? '',
      adopterAddress: pet.adopterAddress ?? '',
    })
  }, [pet, reset])

  const currentSpecies = watch('species')
  const currentBreed = watch('breed')
  const breedChoices = getBreedOptionsForSpecies(currentSpecies, breedOptions)
  const birthDateValue = watch('birthDate')

  useEffect(() => {
    if (!currentBreed || !breedChoices.some((breed) => breed === currentBreed)) {
      setValue('breed', breedChoices[0] ?? 'Mestizo', { shouldValidate: true })
    }
  }, [breedChoices, currentBreed, setValue])

  const openBirthDatePicker = () => {
    birthDatePickerRef.current?.showPicker?.() ?? birthDatePickerRef.current?.click()
  }

  const currentAdoptionStatus = watch('adoptionStatus')

  const onSubmit = async (data: EditPetForm) => {
    if (!id) return

    try {
      await updatePet(id, {
        name: data.name,
        breed: data.breed,
        age: data.age,
        birthDate: birthDateDisplayToISO(data.birthDate),
        weight: data.weight,
        species: data.species,
        medicalStatus: data.medicalStatus,
        medicalNotes: data.medicalNotes,
        adoptionStatus: data.adoptionStatus,
        adopterName: data.adoptionStatus === 'ADOPTADO' ? data.adopterName : undefined,
        adopterPhone: data.adoptionStatus === 'ADOPTADO' ? data.adopterPhone : undefined,
        adopterAddress: data.adoptionStatus === 'ADOPTADO' ? data.adopterAddress : undefined,
      })

      toast.success('Cambios guardados')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los cambios')
    }
  }

  if (!pet) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Mascota no encontrada</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Editar Mascota</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Datos Generales</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
              <input
                {...register('name')}
                disabled={isNormal}
                className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Edad</label>
              <input
                {...register('age')}
                disabled={isNormal}
                className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
              {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de nacimiento</label>
              <div className="flex gap-2">
                <input
                  value={birthDateValue ?? ''}
                  onChange={(event) => setValue('birthDate', formatBirthDateDigits(event.target.value), { shouldValidate: true, shouldDirty: true })}
                  placeholder="DD / MM / AAAA"
                  inputMode="numeric"
                  disabled={isNormal}
                  className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={openBirthDatePicker}
                  disabled={isNormal}
                  className="rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Calendario
                </button>
                <input
                  ref={birthDatePickerRef}
                  type="date"
                  aria-hidden="true"
                  tabIndex={-1}
                  value={birthDateDisplayToISO(birthDateValue ?? '')}
                  onChange={(event) => setValue('birthDate', birthDateISOToDisplay(event.target.value), { shouldValidate: true, shouldDirty: true })}
                  className="sr-only"
                />
              </div>
              {errors.birthDate && <p className="mt-1 text-sm text-red-500">{errors.birthDate.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Peso</label>
              <input
                {...register('weight')}
                disabled={isNormal}
                className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
              {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Especie</label>
              <select
                {...register('species')}
                disabled={isNormal}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {speciesChoices.map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Raza</label>
              <select
                {...register('breed')}
                disabled={isNormal}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {breedChoices.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
              {errors.breed && <p className="mt-1 text-sm text-red-500">{errors.breed.message}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Datos Clínicos</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estado Médico</label>
              <select
                {...register('medicalStatus')}
                disabled={isNormal}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="SANO">SANO</option>
                <option value="EN_TRATAMIENTO">EN_TRATAMIENTO</option>
                <option value="NECESIDADES_ESPECIALES">NECESIDADES_ESPECIALES</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Notas Médicas</label>
              <textarea
                {...register('medicalNotes')}
                rows={4}
                disabled={isNormal}
                className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
              {errors.medicalNotes && (
                <p className="mt-1 text-sm text-red-500">{errors.medicalNotes.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Estado de Adopción</h3>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estatus</label>
            <select
              {...register('adoptionStatus')}
              className="w-full rounded border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="DISPONIBLE">DISPONIBLE</option>
              <option value="EN_PROCESO">EN_PROCESO</option>
              <option value="ADOPTADO">ADOPTADO</option>
            </select>
          </div>

          {currentAdoptionStatus === 'ADOPTADO' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del Adoptante</label>
                <input
                  {...register('adopterName')}
                  disabled={isNormal}
                  className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                {errors.adopterName && (
                  <p className="mt-1 text-sm text-red-500">{errors.adopterName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  {...register('adopterPhone')}
                  disabled={isNormal}
                  className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                {errors.adopterPhone && (
                  <p className="mt-1 text-sm text-red-500">{errors.adopterPhone.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
                <input
                  {...register('adopterAddress')}
                  disabled={isNormal}
                  className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                {errors.adopterAddress && (
                  <p className="mt-1 text-sm text-red-500">{errors.adopterAddress.message}</p>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  )
}
