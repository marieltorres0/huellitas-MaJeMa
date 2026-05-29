import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { usePetStore } from '../store/petStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { DEFAULT_SPECIES_OPTIONS } from '../utils/speciesOptions'
import { getBreedOptionsForSpecies } from '../utils/breedOptions'
import {
  birthDateDisplayToISO,
  birthDateISOToDisplay,
  formatBirthDateDigits,
  isValidBirthDateDisplay,
} from '../utils/birthDate'

const addPetSchema = z.object({
  name: z.string().min(1, 'Nombre es obligatorio'),
  breed: z.string().min(1, 'Raza es obligatoria'),
  age: z.coerce.number().refine((v) => Number.isInteger(v) && v >= 0, { message: 'La edad debe ser un número entero (ej. 2)' }),
  birthDate: z.string().min(1, 'Fecha de nacimiento es obligatoria').refine(isValidBirthDateDisplay, {
    message: 'Escribe una fecha válida o usa el calendario',
  }),
  weight: z.coerce.number().refine((v) => typeof v === 'number' && v > 0, { message: 'El peso debe ser un número válido (ej. 4.5)' }),
  species: z.string().min(1, 'Especie es obligatoria'),
  medicalStatus: z.enum(['SANO', 'EN_TRATAMIENTO', 'NECESIDADES_ESPECIALES'] as const).optional(),
  medicalNotes: z.string().min(1, 'Notas médicas son obligatorias'),
})

type AddPetFormInput = z.input<typeof addPetSchema>
type AddPetFormOutput = z.output<typeof addPetSchema>

export default function AddPet() {
  const addPet = usePetStore((s) => s.addPet)
  const speciesOptions = useSettingsStore((s) => s.speciesOptions)
  const breedOptions = useSettingsStore((s) => s.breedOptions)
  const navigate = useNavigate()
  const birthDatePickerRef = useRef<HTMLInputElement | null>(null)
  const speciesChoices = speciesOptions.length > 0 ? speciesOptions : [...DEFAULT_SPECIES_OPTIONS]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddPetFormInput, unknown, AddPetFormOutput>({
    resolver: zodResolver(addPetSchema),
    defaultValues: {
      species: speciesChoices[0] ?? 'Perro',
      breed: getBreedOptionsForSpecies(speciesChoices[0] ?? 'Perro')[0] ?? 'Mestizo',
      birthDate: '',
      medicalStatus: 'SANO',
      medicalNotes: '',
    },
  })

  const selectedSpecies = watch('species')
  const breedChoices = getBreedOptionsForSpecies(selectedSpecies, breedOptions)
  const birthDateValue = watch('birthDate')

  useEffect(() => {
    const currentBreed = watch('breed')
    if (!currentBreed || !breedChoices.some((breed) => breed === currentBreed)) {
      setValue('breed', breedChoices[0] ?? 'Mestizo', { shouldValidate: true })
    }
  }, [breedChoices, setValue, watch])

  const openBirthDatePicker = () => {
    birthDatePickerRef.current?.showPicker?.() ?? birthDatePickerRef.current?.click()
  }

  const hasError = (field: keyof AddPetFormInput) => !!errors[field]

  const inputClass = (field: keyof AddPetFormInput) =>
    `w-full rounded border px-3 py-2 ${hasError(field) ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'}`

  const onSubmit = async (data: AddPetFormOutput) => {
    try {
      const petToAdd = {
        name: data.name,
        breed: data.breed,
        age: String(data.age),
        birthDate: birthDateDisplayToISO(data.birthDate),
        weight: String(data.weight),
        species: data.species,
        medicalStatus: data.medicalStatus ?? 'SANO',
        medicalNotes: data.medicalNotes,
        adoptionStatus: 'DISPONIBLE' as const,
      }

      await addPet(petToAdd)
      toast.success('Mascota registrada')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar la mascota')
    }
  }

  return (
    <div className="max-w-3xl rounded-xl bg-white p-6 shadow-md transition-colors dark:bg-gray-900 dark:text-gray-100 dark:shadow-none dark:ring-1 dark:ring-gray-700">
      <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-gray-100">Registrar Nueva Mascota</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4 rounded-2xl bg-slate-50 p-4 transition-colors dark:bg-blue-950/30 dark:ring-1 dark:ring-blue-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Datos Generales</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Nombre</label>
              <input {...register('name')} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400" />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Edad</label>
              <input placeholder="2" type="number" step="1" min="0" {...register('age')} className={`${inputClass('age')} bg-white dark:bg-gray-950 dark:text-gray-100 dark:border-blue-800 dark:focus:border-blue-400 dark:focus:ring-blue-400`} />
              {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Fecha de nacimiento</label>
              <div className="flex gap-2">
                <input
                  value={birthDateValue ?? ''}
                  onChange={(event) => setValue('birthDate', formatBirthDateDigits(event.target.value), { shouldValidate: true, shouldDirty: true })}
                  placeholder="DD / MM / AAAA"
                  inputMode="numeric"
                  className={`${inputClass('birthDate')} bg-white dark:bg-gray-950 dark:text-gray-100 dark:border-blue-800 dark:focus:border-blue-400 dark:focus:ring-blue-400`}
                />
                <button
                  type="button"
                  onClick={openBirthDatePicker}
                  className="rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-blue-800 dark:text-gray-100 dark:hover:bg-blue-900"
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
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Peso</label>
              <input placeholder="4.50" type="number" step="0.01" min="0.01" {...register('weight')} className={`${inputClass('weight')} bg-white dark:bg-gray-950 dark:text-gray-100 dark:border-blue-800 dark:focus:border-blue-400 dark:focus:ring-blue-400`} />
              {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Especie</label>
              <select {...register('species')} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400">
                {speciesChoices.map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Raza</label>
              <select {...register('breed')} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400">
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

        <section className="space-y-4 rounded-2xl bg-slate-50 p-4 transition-colors dark:bg-blue-950/30 dark:ring-1 dark:ring-blue-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Datos Clínicos</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Estado Médico</label>
              <select {...register('medicalStatus')} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400">
                <option value="SANO">SANO</option>
                <option value="EN_TRATAMIENTO">EN_TRATAMIENTO</option>
                <option value="NECESIDADES_ESPECIALES">NECESIDADES_ESPECIALES</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-200">Notas Médicas</label>
              <textarea {...register('medicalNotes')} rows={4} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"></textarea>
              {errors.medicalNotes && <p className="mt-1 text-sm text-red-500">{errors.medicalNotes.message}</p>}
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400">Registrar Mascota</button>
        </div>
      </form>
    </div>
  )
}
