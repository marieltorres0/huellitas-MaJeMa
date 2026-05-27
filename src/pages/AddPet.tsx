import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { usePetStore } from '../store/petStore'

const addPetSchema = z.object({
  name: z.string().min(1, 'Nombre es obligatorio'),
  breed: z.string().min(1, 'Raza es obligatoria'),
  age: z.coerce.number().refine((v) => Number.isInteger(v) && v >= 0, { message: 'La edad debe ser un número entero (ej. 2)' }),
  weight: z.coerce.number().refine((v) => typeof v === 'number' && v > 0, { message: 'El peso debe ser un número válido (ej. 4.5)' }),
  species: z.enum(['Perro', 'Gato', 'Otro'] as const),
  medicalStatus: z.enum(['SANO', 'EN_TRATAMIENTO', 'NECESIDADES_ESPECIALES'] as const).optional(),
  medicalNotes: z.string().optional(),
})

type AddPetFormInput = z.input<typeof addPetSchema>
type AddPetFormOutput = z.output<typeof addPetSchema>

export default function AddPet() {
  const addPet = usePetStore((s) => s.addPet)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddPetFormInput, unknown, AddPetFormOutput>({
    resolver: zodResolver(addPetSchema),
    defaultValues: {
      species: 'Perro',
      medicalStatus: 'SANO',
      medicalNotes: '',
    },
  })

  const hasError = (field: keyof AddPetFormInput) => !!errors[field]

  const inputClass = (field: keyof AddPetFormInput) =>
    `w-full rounded border px-3 py-2 ${hasError(field) ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'}`

  const onSubmit = (data: AddPetFormOutput) => {

    const petToAdd = {
      name: data.name,
      breed: data.breed,
      age: String(data.age),
      weight: String(data.weight),
      species: data.species,
      medicalStatus: data.medicalStatus ?? 'SANO',
      medicalNotes: data.medicalNotes ?? '',
      adoptionStatus: 'DISPONIBLE' as const,
    }

    addPet(petToAdd)
    toast.success('Mascota registrada')
    navigate('/dashboard')
  }

  return (
    <div className="max-w-3xl rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Registrar Nueva Mascota</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Datos Generales</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
              <input {...register('name')} className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Raza</label>
              <input {...register('breed')} className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
              {errors.breed && <p className="mt-1 text-sm text-red-500">{errors.breed.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Edad</label>
              <input placeholder="2" type="number" step="1" min="0" {...register('age')} className={inputClass('age')} />
              {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Peso</label>
              <input placeholder="4.50" type="number" step="0.01" min="0.01" {...register('weight')} className={inputClass('weight')} />
              {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Especie</label>
              <select {...register('species')} className="w-full rounded border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Datos Clínicos</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estado Médico</label>
              <select {...register('medicalStatus')} className="w-full rounded border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                <option value="SANO">SANO</option>
                <option value="EN_TRATAMIENTO">EN_TRATAMIENTO</option>
                <option value="NECESIDADES_ESPECIALES">NECESIDADES_ESPECIALES</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Notas Médicas</label>
              <textarea {...register('medicalNotes')} rows={4} className="w-full rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">Registrar Mascota</button>
        </div>
      </form>
    </div>
  )
}
