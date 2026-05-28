import { useEffect, useRef, useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { useAuthStore } from '../store/authStore'
import { type Pet, usePetStore } from '../store/petStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { DEFAULT_SPECIES_OPTIONS, mergeSpeciesOptions } from '../utils/speciesOptions'
import { getBreedOptionsForSpecies, mergeBreedOptions } from '../utils/breedOptions'

const adoptionStatuses = ['DISPONIBLE', 'EN_PROCESO', 'ADOPTADO'] as const
type AdoptionStatus = (typeof adoptionStatuses)[number]

type ModalFormValues = {
  name?: string
  breed?: string
  age?: number | string
  weight?: number | string
  species?: Pet['species']
  medicalStatus?: Pet['medicalStatus']
  medicalNotes?: string
  adoptionStatus: AdoptionStatus
  adopterName?: string
  adopterPhone?: string
  adopterAddress?: string
}

const adopterFieldsSchema = z
  .object({
    adoptionStatus: z.enum(adoptionStatuses),
    adopterName: z.string().optional(),
    adopterPhone: z.string().optional(),
    adopterAddress: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.adoptionStatus === 'EN_PROCESO' || data.adoptionStatus === 'ADOPTADO') {
      if (!data.adopterName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adopterName'],
          message: 'Nombre del adoptante es obligatorio',
        })
      }

      if (!/^\d{10}$/.test(data.adopterPhone ?? '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adopterPhone'],
          message: 'El teléfono debe tener exactamente 10 dígitos',
        })
      }

      if ((data.adopterAddress ?? '').trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adopterAddress'],
          message: 'Por favor, escribe una dirección más detallada (mínimo 10 caracteres)',
        })
      }
    }
  })

const adminModalSchema = z
  .object({
    name: z.string().min(1, 'Nombre es obligatorio'),
    breed: z.string().min(1, 'Raza es obligatoria'),
    age: z
      .coerce
      .number()
      .int('La edad debe ser un número entero (ej. 2)')
      .min(0, 'La edad debe ser un número entero (ej. 2)'),
    weight: z.coerce.number().gt(0, 'El peso debe ser un número válido (ej. 4.5)'),
    species: z.string().min(1, 'Especie es obligatoria'),
    medicalStatus: z.enum(['SANO', 'EN_TRATAMIENTO', 'NECESIDADES_ESPECIALES'] as const),
    medicalNotes: z.string().min(1, 'Las notas médicas son obligatorias'),
  })
  .merge(adopterFieldsSchema)

const normalModalSchema = adopterFieldsSchema

function medicalBadge(status: Pet['medicalStatus']) {
  switch (status) {
    case 'SANO':
      return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">SANO</span>
    case 'EN_TRATAMIENTO':
      return <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">EN TRATAMIENTO</span>
    case 'NECESIDADES_ESPECIALES':
      return <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">NECESIDADES ESPECIALES</span>
    default:
      return null
  }
}

function getPetFormValues(pet: Pet, adoptionStatusOverride?: AdoptionStatus): ModalFormValues {
  const parsedAge = Number.parseInt(String(pet.age), 10)
  const parsedWeight = Number.parseFloat(String(pet.weight).replace(',', '.'))

  return {
    name: pet.name,
    breed: pet.breed,
    age: Number.isNaN(parsedAge) ? '' : String(parsedAge),
    weight: Number.isNaN(parsedWeight) ? '' : String(parsedWeight),
    species: pet.species,
    medicalStatus: pet.medicalStatus,
    medicalNotes: pet.medicalNotes,
    adoptionStatus: adoptionStatusOverride ?? pet.adoptionStatus,
    adopterName: pet.adopterName ?? '',
    adopterPhone: pet.adopterPhone ?? '',
    adopterAddress: pet.adopterAddress ?? '',
  }
}

function normalizeText(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function hasCompleteAdopterData(pet: Pet | null | undefined) {
  if (!pet) return false

  return (
    Boolean(pet.adopterName?.trim()) &&
    /^\d{10}$/.test(pet.adopterPhone ?? '') &&
    (pet.adopterAddress ?? '').trim().length >= 10
  )
}

function buildCertificateFileName(petName: string) {
  const safePetName = petName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')

  return `Certificado_Adopcion_${safePetName || 'Mascota'}.pdf`
}

function buildClinicalFileName(petName: string) {
  const safePetName = petName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')

  return `Ficha_Clinica_${safePetName || 'Mascota'}.pdf`
}

export default function Dashboard() {
  const pets = usePetStore((state) => state.pets)
  const updatePet = usePetStore((state) => state.updatePet)
  const deletePet = usePetStore((state) => state.deletePet)
  const speciesOptions = useSettingsStore((state) => state.speciesOptions)
  const user = useAuthStore((state) => state.user)
  const isNormalUser = user?.role === 'normal'

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingConfirmData, setPendingConfirmData] = useState<ModalFormValues | null>(null)
  const [draggedPet, setDraggedPet] = useState<Pet | null>(null)
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null)
  const [showClinicalSheet, setShowClinicalSheet] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [isDownloadingClinicalSheet, setIsDownloadingClinicalSheet] = useState(false)
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false)
  const clinicalSheetRef = useRef<HTMLDivElement | null>(null)
  const certificateRef = useRef<HTMLDivElement | null>(null)

  const modalSchema = (isNormalUser ? normalModalSchema : adminModalSchema) as any

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(modalSchema) as any,
    defaultValues: getPetFormValues({
      id: '',
      name: '',
      breed: '',
      age: '',
      weight: '',
      species: 'Perro',
      medicalStatus: 'SANO',
      medicalNotes: '',
      adoptionStatus: 'DISPONIBLE',
    }),
  })

  const adoptionStatus = (watch('adoptionStatus') as AdoptionStatus) ?? 'DISPONIBLE'
  const currentSpecies = watch('species') as string
  const currentBreed = watch('breed') as string
  const breedChoices = currentSpecies === selectedPet?.species
    ? mergeBreedOptions(getBreedOptionsForSpecies(currentSpecies), currentBreed)
    : getBreedOptionsForSpecies(currentSpecies)
  const speciesChoices = mergeSpeciesOptions(
    speciesOptions.length > 0 ? speciesOptions : [...DEFAULT_SPECIES_OPTIONS],
    selectedPet?.species,
  )

  useEffect(() => {
    if (!currentBreed || !breedChoices.some((breed) => breed === currentBreed)) {
      setValue('breed', breedChoices[0] ?? 'Mestizo', { shouldValidate: true })
    }
  }, [breedChoices, currentBreed, setValue])

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border px-3 py-2 ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500'
        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
    }`

  const selectClass = (hasError?: boolean) =>
    `${inputClass(hasError)} bg-white text-slate-900 dark:border-blue-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400`

  const errorText = (field: string) => String(errors?.[field]?.message ?? '')

  const hasValidAdopterData = hasCompleteAdopterData(draggedPet)

  const canDropIntoAdopted =
    Boolean(draggedPet) &&
    draggedPet?.adoptionStatus === 'EN_PROCESO' &&
    hasValidAdopterData

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setIsConfirmModalOpen(false)
    setPendingConfirmData(null)
    setSelectedPet(null)
    setDraggedPet(null)
    setShowClinicalSheet(false)
  }

  const closeDeleteModal = () => {
    setPetToDelete(null)
  }

  const closeClinicalSheet = () => {
    setShowClinicalSheet(false)
  }

  const handleDownloadClinicalSheet = async () => {
    if (!selectedPet || !clinicalSheetRef.current) return

    try {
      setIsDownloadingClinicalSheet(true)

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(clinicalSheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageData = canvas.toDataURL('image/png', 1)

      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight)
      pdf.save(buildClinicalFileName(selectedPet.name))

      toast.success('Ficha médica descargada en PDF')
    } catch (error) {
      console.error('Error generando PDF de ficha médica:', error)
      toast.error('No se pudo generar el PDF de la ficha médica')
    } finally {
      setIsDownloadingClinicalSheet(false)
    }
  }

  const openCertificate = () => {
    setShowCertificate(true)
  }

  const closeCertificate = () => {
    setShowCertificate(false)
  }

  const handleDownloadCertificate = async () => {
    if (!selectedPet || !certificateRef.current) return

    try {
      setIsDownloadingCertificate(true)
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fbf6ee',
      })

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageData = canvas.toDataURL('image/png', 1)

      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight)
      pdf.save(buildCertificateFileName(selectedPet.name))

      toast.success('Certificado descargado en PDF')
    } catch (error) {
      console.error('Error generando PDF de certificado:', error)
      toast.error('No se pudo generar el PDF del certificado')
    } finally {
      setIsDownloadingCertificate(false)
    }
  }

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false)
    setPendingConfirmData(null)
  }

  const openAdoptionConfirm = (pet: Pet) => {
    if (!hasCompleteAdopterData(pet)) {
      toast.error('Completa nombre, teléfono y dirección del adoptante antes de marcarla como adoptada.')
      return false
    }

    setSelectedPet(pet)
    setPendingConfirmData(getPetFormValues(pet, 'ADOPTADO'))
    setIsConfirmModalOpen(true)
    return true
  }

  const onDragStart = (start: { draggableId: string }) => {
    const pet = pets.find((item) => item.id === start.draggableId)
    setDraggedPet(pet ?? null)
  }

  const requestDeletePet = (pet: Pet) => {
    if (pet.adoptionStatus !== 'ADOPTADO') {
      toast.error('Solo se pueden eliminar mascotas adoptadas')
      return
    }

    setPetToDelete(pet)
  }

  const confirmDeletePet = async () => {
    if (!petToDelete || petToDelete.adoptionStatus !== 'ADOPTADO') {
      closeDeleteModal()
      toast.error('Solo se pueden eliminar mascotas adoptadas')
      return
    }

    try {
      await deletePet(petToDelete.id)
      closeDeleteModal()
      toast.success('Mascota eliminada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la mascota')
    }
  }

  const commitPetUpdate = async (pet: Pet, data: ModalFormValues, finalStatus: AdoptionStatus) => {
    const adopterPayload =
      finalStatus === 'EN_PROCESO'
        ? {
            adopterName: normalizeText(data.adopterName),
            adopterPhone: normalizeText(data.adopterPhone),
            adopterAddress: normalizeText(data.adopterAddress),
          }
        : {
            adopterName: normalizeText(data.adopterName) ?? normalizeText(pet.adopterName),
            adopterPhone: normalizeText(data.adopterPhone) ?? normalizeText(pet.adopterPhone),
            adopterAddress: normalizeText(data.adopterAddress) ?? normalizeText(pet.adopterAddress),
          }

    if (isNormalUser) {
      await updatePet(pet.id, {
        adoptionStatus: finalStatus,
        adopterName: adopterPayload.adopterName,
        adopterPhone: adopterPayload.adopterPhone,
        adopterAddress: adopterPayload.adopterAddress,
      })
      return
    }

    await updatePet(pet.id, {
      name: data.name ?? pet.name,
      breed: data.breed ?? pet.breed,
      age: String(data.age ?? pet.age),
      weight: String(data.weight ?? pet.weight),
      species: data.species ?? pet.species,
      medicalStatus: data.medicalStatus ?? pet.medicalStatus,
      medicalNotes: data.medicalNotes ?? pet.medicalNotes,
      adoptionStatus: finalStatus,
      adopterName: adopterPayload.adopterName,
      adopterPhone: adopterPayload.adopterPhone,
      adopterAddress: adopterPayload.adopterAddress,
    })
  }

  const openEditModal = (pet: Pet, adoptionStatusOverride?: AdoptionStatus) => {
    setSelectedPet(pet)
    setPendingConfirmData(null)
    setIsConfirmModalOpen(false)
    reset(getPetFormValues(pet, adoptionStatusOverride))
    setIsEditModalOpen(true)
  }

  const onSubmit = async (data: ModalFormValues) => {
    if (!selectedPet) return

    if (data.adoptionStatus === 'ADOPTADO') {
      setPendingConfirmData(data)
      setIsConfirmModalOpen(true)
      return
    }

    try {
      await commitPetUpdate(selectedPet, data, data.adoptionStatus)
      closeEditModal()
      toast.success('Mascota actualizada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la mascota')
    }
  }

  const handleConfirmAdoption = async () => {
    if (!selectedPet) return

    const data = pendingConfirmData ?? getPetFormValues(selectedPet, 'ADOPTADO')
    try {
      await commitPetUpdate(selectedPet, data, 'ADOPTADO')
      closeEditModal()
      toast.success('Mascota actualizada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la mascota')
    }
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    setDraggedPet(null)

    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const pet = pets.find((item) => item.id === draggableId)
    if (!pet) return

    const nextStatus = destination.droppableId as AdoptionStatus

    if (nextStatus === 'EN_PROCESO') {
      // If adopter data already present, persist the status change immediately.
      const hasAdopter = Boolean(pet.adopterName?.trim()) && /\d{10}/.test(pet.adopterPhone ?? '') && (pet.adopterAddress ?? '').trim().length >= 10
      if (hasAdopter) {
        void updatePet(pet.id, {
          adoptionStatus: 'EN_PROCESO',
          adopterName: pet.adopterName,
          adopterPhone: pet.adopterPhone,
          adopterAddress: pet.adopterAddress,
        }).catch(() => toast.error('No se pudo actualizar la mascota'))
        return
      }

      openEditModal(pet, 'EN_PROCESO')
      return
    }

    if (nextStatus === 'ADOPTADO') {
      if (source.droppableId === 'DISPONIBLE') {
        toast.error('Primero mueve la mascota a "En Proceso" y completa los datos del adoptante.')
        return
      }

      if (!openAdoptionConfirm(pet)) {
        return
      }
      return
    }

    void updatePet(pet.id, {
      adoptionStatus: 'DISPONIBLE',
      adopterName: undefined,
      adopterPhone: undefined,
      adopterAddress: undefined,
    }).catch(() => toast.error('No se pudo actualizar la mascota'))
  }

  const columns: Array<{ id: AdoptionStatus; title: string }> = [
    { id: 'DISPONIBLE', title: 'Disponibles' },
    { id: 'EN_PROCESO', title: 'En Proceso' },
    { id: 'ADOPTADO', title: 'Adoptados' },
  ]

  const adopterPhoneField = register('adopterPhone', {
    onChange: (event: any) => {
      const digits = String(event.target.value ?? '').replace(/\D/g, '').slice(0, 10)
      event.target.value = digits
    },
  })
  const showAdopterSection = adoptionStatus === 'EN_PROCESO' || adoptionStatus === 'ADOPTADO'
  const showAdopterRequiredCopy = adoptionStatus === 'EN_PROCESO'
  const isAdopterSectionReadOnly = adoptionStatus === 'ADOPTADO'

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Panel de Adopciones</h1>
      </header>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {columns.map((column) => {
            const petsInColumn = pets.filter((pet) => pet.adoptionStatus === column.id)

            return (
              <Droppable droppableId={column.id} isDropDisabled={column.id === 'ADOPTADO' && !canDropIntoAdopted} key={column.id}>
                {(provided, snapshot) => (
                  <section
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-2xl border border-dashed p-4 transition-colors ${
                      snapshot.isDraggingOver
                        ? 'border-blue-300 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/50'
                        : 'border-slate-200 bg-transparent dark:border-blue-900 dark:bg-blue-950/20'
                    }`}
                  >
                    <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{column.title}</h2>

                    <div className="space-y-4">
                      {petsInColumn.length === 0 && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">No hay mascotas en esta columna.</div>
                      )}

                      {petsInColumn.map((pet, index) => (
                        <Draggable draggableId={pet.id} index={index} key={pet.id}>
                          {(draggableProvided, snapshot) => (
                            <article
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all dark:border-blue-900 dark:bg-blue-950/60 dark:shadow-none ${
                                snapshot.isDragging ? 'bg-blue-50/50 shadow-2xl ring-2 ring-blue-200 dark:bg-blue-900/70 dark:ring-blue-400' : ''
                              }`}
                              style={draggableProvided.draggableProps.style}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(pet)}
                                    className="text-left text-lg font-bold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-300"
                                  >
                                    {pet.name}
                                  </button>
                                  <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {pet.species} • {pet.breed}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Edad: {pet.age} • Peso: {pet.weight}
                                  </p>
                                </div>

                                <div>{medicalBadge(pet.medicalStatus)}</div>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="text-sm text-slate-500 dark:text-slate-400">{pet.medicalNotes}</div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(pet)}
                                    className="rounded px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                                  >
                                    Editar
                                  </button>

                                  {user?.role === 'admin' && pet.adoptionStatus === 'ADOPTADO' && (
                                    <button
                                      type="button"
                                      onClick={() => requestDeletePet(pet)}
                                      className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </article>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </section>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      {isEditModalOpen && selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-blue-950 dark:text-slate-100 dark:shadow-none dark:ring-1 dark:ring-blue-800">
            <button
              type="button"
              onClick={closeEditModal}
              className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-blue-900 dark:hover:text-slate-100"
              aria-label="Cerrar modal"
            >
              X
            </button>

            <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">{selectedPet.name}</h3>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit as any)}>
              {!isNormalUser && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                      <input {...register('name')} className={inputClass(Boolean(errors.name))} />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errorText('name')}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Edad</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        {...register('age')}
                        className={inputClass(Boolean(errors.age))}
                      />
                      {errors.age && <p className="mt-1 text-sm text-red-500">{errorText('age')}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Peso</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register('weight')}
                        className={inputClass(Boolean(errors.weight))}
                      />
                      {errors.weight && <p className="mt-1 text-sm text-red-500">{errorText('weight')}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Especie</label>
                      <select {...register('species')} className={selectClass(Boolean(errors.species))}>
                        {speciesChoices.map((species) => (
                          <option key={species} value={species}>
                            {species}
                          </option>
                        ))}
                      </select>
                      {errors.species && <p className="mt-1 text-sm text-red-500">{errorText('species')}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Raza</label>
                      <select {...register('breed')} className={selectClass(Boolean(errors.breed))}>
                        {breedChoices.map((breed) => (
                          <option key={breed} value={breed}>
                            {breed}
                          </option>
                        ))}
                      </select>
                      {errors.breed && <p className="mt-1 text-sm text-red-500">{errorText('breed')}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Estado Médico</label>
                      <select {...register('medicalStatus')} className={selectClass(Boolean(errors.medicalStatus))}>
                        <option value="SANO">SANO</option>
                        <option value="EN_TRATAMIENTO">EN_TRATAMIENTO</option>
                        <option value="NECESIDADES_ESPECIALES">NECESIDADES_ESPECIALES</option>
                      </select>
                      {errors.medicalStatus && <p className="mt-1 text-sm text-red-500">{errorText('medicalStatus')}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notas Médicas</label>
                    <textarea
                      {...register('medicalNotes')}
                      rows={3}
                      className={inputClass(Boolean(errors.medicalNotes))}
                    />
                    {errors.medicalNotes && <p className="mt-1 text-sm text-red-500">{errorText('medicalNotes')}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Estado de adopción</label>
                <select {...register('adoptionStatus')} className={selectClass(Boolean(errors.adoptionStatus))}>
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="EN_PROCESO">EN_PROCESO</option>
                  <option value="ADOPTADO">ADOPTADO</option>
                </select>
                {errors.adoptionStatus && <p className="mt-1 text-sm text-red-500">{errorText('adoptionStatus')}</p>}
              </div>

              {showAdopterSection && (
                <div className="rounded-md border border-blue-200 bg-blue-50/50 p-4 transition-shadow shadow-sm">
                  <div className="mb-3 flex items-start gap-2">
                    <div className="shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 10-1.5 0v3.25c0 .414.336.75.75.75h1.5a.75.75 0 100-1.5H10V6.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-blue-800">
                        Datos del adoptante{showAdopterRequiredCopy ? ' (requeridos)' : ''}
                      </div>
                      {showAdopterRequiredCopy && (
                        <div className="mt-1 text-xs text-blue-700/80">
                          Completa nombre, teléfono y dirección para confirmar el proceso de adopción.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Adoptante</label>
                      <input
                        {...register('adopterName')}
                        readOnly={isAdopterSectionReadOnly}
                        className={`${inputClass(Boolean(errors.adopterName))} bg-transparent ${isAdopterSectionReadOnly ? 'cursor-not-allowed bg-blue-50/60 text-slate-700' : ''}`}
                      />
                      {errors.adopterName && <p className="mt-1 text-sm text-red-500">{errorText('adopterName')}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        {...adopterPhoneField}
                        readOnly={isAdopterSectionReadOnly}
                        className={`${inputClass(Boolean(errors.adopterPhone))} bg-transparent ${isAdopterSectionReadOnly ? 'cursor-not-allowed bg-blue-50/60 text-slate-700' : ''}`} 
                      />
                      {errors.adopterPhone && <p className="mt-1 text-sm text-red-500">{errorText('adopterPhone')}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
                      <input
                        {...register('adopterAddress')}
                        readOnly={isAdopterSectionReadOnly}
                        className={`${inputClass(Boolean(errors.adopterAddress))} bg-transparent ${isAdopterSectionReadOnly ? 'cursor-not-allowed bg-blue-50/60 text-slate-700' : ''}`}
                      />
                      {errors.adopterAddress && <p className="mt-1 text-sm text-red-500">{errorText('adopterAddress')}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-blue-800 dark:text-slate-200 dark:hover:bg-blue-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setShowClinicalSheet(true)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-blue-800 dark:text-slate-200 dark:hover:bg-blue-900"
                >
                  📄 Exportar Ficha Clínica
                </button>
                {selectedPet?.adoptionStatus === 'ADOPTADO' && (
                  <button
                    type="button"
                    onClick={openCertificate}
                    className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-300 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/50"
                  >
                    📜 Imprimir Certificado de Adopción
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmModalOpen && selectedPet && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Confirmar adopción</h3>
            <p className="mt-2 text-sm text-slate-600">
              Vas a marcar a <span className="font-semibold text-slate-900">{selectedPet.name}</span> como adoptado.
              Esta acción consolidará el cambio.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdoption}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {petToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Eliminar mascota</h3>
            <p className="mt-2 text-sm text-slate-600">
              ¿Seguro que deseas eliminar a <span className="font-semibold text-slate-900">{petToDelete.name}</span>?
              Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePet}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showClinicalSheet && selectedPet && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 print:shadow-none print:p-0 flex flex-col">
            <div className="mb-4 flex items-center justify-between print:hidden">
              <h3 className="text-lg font-bold">Vista previa: Ficha Clínica — {selectedPet.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeClinicalSheet}
                  className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadClinicalSheet}
                  disabled={isDownloadingClinicalSheet}
                  className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {isDownloadingClinicalSheet ? 'Generando PDF...' : '📥 Descargar Ficha Médica PDF'}
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[80vh] w-full">
              <div
                ref={clinicalSheetRef}
                className="mx-auto w-full max-w-[210mm] rounded-lg p-8"
                style={{ backgroundColor: '#fff9eb', color: '#1f2937' }}
              >
                <div
                  className="flex h-full w-full flex-col rounded-sm border-8 border-double p-6 text-left"
                  style={{ borderColor: '#d97706', backgroundColor: '#fbf6ee', color: '#1f2937' }}
                >
                <div className="mb-6 rounded-xl border-2 px-5 py-4 text-center" style={{ borderColor: '#d1d5db', backgroundColor: '#fffaf0' }}>
                  <div className="text-xs uppercase tracking-[0.2em]" style={{ color: '#92400e' }}>Documento Oficial</div>
                  <h1 className="mt-2 text-xl font-bold">Expediente Clínico de Ingreso y Cuidados - Huellitas MaJeMa</h1>
                  <div className="mt-2 text-sm" style={{ color: '#4b5563' }}>Fecha de emisión: {new Date().toLocaleString()}</div>
                </div>

                <div className="mb-5 rounded-lg border p-4" style={{ borderColor: '#d1d5db', backgroundColor: '#fffdf8' }}>
                  <div className="text-sm font-semibold uppercase tracking-wide text-center" style={{ color: '#92400e' }}>
                    Constancia Clínica
                  </div>
                  <p className="mt-4 text-center text-base leading-relaxed">
                    Este documento reúne los datos de ingreso, adopción y cuidados médicos de la mascota registrada.
                  </p>
                </div>

                <section className="mb-4">
                  <div className="mb-2 rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                    Información General
                  </div>
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      <tr>
                        <td className="w-1/3 border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Nombre</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{selectedPet.name}</td>
                        <td className="w-1/3 border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Especie</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{selectedPet.species}</td>
                      </tr>
                      <tr>
                        <td className="border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Raza</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{selectedPet.breed}</td>
                        <td className="border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Edad</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{Number.parseInt(String(selectedPet.age) ?? '0', 10)}</td>
                      </tr>
                      <tr>
                        <td className="border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Peso (kg)</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{Number.parseFloat(String(selectedPet.weight).replace(',', '.')).toFixed(2)}</td>
                        <td className="border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Estado de adopción</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{selectedPet.adoptionStatus}</td>
                      </tr>
                      <tr>
                        <td className="border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Adoptante</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{selectedPet.adopterName ?? '-'}</td>
                        <td className="border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Teléfono</td>
                        <td className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{selectedPet.adopterPhone ?? '-'}</td>
                      </tr>
                      <tr>
                        <td className="border px-2 py-2 font-semibold" style={{ borderColor: '#d1d5db' }}>Dirección</td>
                        <td colSpan={3} className="border px-2 py-2" style={{ borderColor: '#d1d5db' }}>{selectedPet.adopterAddress ?? '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section className="mb-4">
                  <div className="mb-2 rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                    Sección Médica
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-semibold">Estado de salud: </span>
                    {selectedPet.medicalStatus}
                  </div>
                  <div className="rounded-lg border p-4 text-sm leading-relaxed" style={{ borderColor: '#d1d5db', backgroundColor: '#fffdf8' }}>
                    {selectedPet.medicalNotes || 'Sin notas registradas.'}
                  </div>
                </section>

                <footer className="mt-auto border-t pt-4 text-xs" style={{ borderColor: '#d1d5db', color: '#4b5563' }}>
                  <div className="mb-3 text-center text-xs uppercase tracking-[0.2em]" style={{ color: '#92400e' }}>
                    Archivo clínico interno
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="text-center">
                      <div className="mb-2 h-0.5 w-2/3 mx-auto" style={{ backgroundColor: '#94a3b8' }} />
                      <div className="text-sm">Firma del Refugio</div>
                    </div>
                    <div className="text-center">
                      <div className="mb-2 h-0.5 w-2/3 mx-auto" style={{ backgroundColor: '#94a3b8' }} />
                      <div className="text-sm">Firma del Adoptante</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">Documento generado por Huellitas MaJeMa — Versión para impresión y archivo clínico</div>
                </footer>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate modal (horizontal / diploma) */}
      {showCertificate && selectedPet && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-5xl">
            <div
              ref={certificateRef}
              className="mx-auto aspect-[1.414/1] w-full max-w-275 rounded-lg p-7"
              style={{ backgroundColor: '#fff9eb', color: '#1f2937' }}
            >
              <div
                className="flex h-full w-full flex-col items-center justify-between rounded-sm border-8 border-double p-8 text-center"
                style={{ borderColor: '#d97706', backgroundColor: '#fbf6ee', color: '#1f2937' }}
              >
                <header className="mb-4 rounded-xl border-2 px-5 py-3" style={{ borderColor: '#d1d5db', backgroundColor: '#fffaf0' }}>
                  <div className="text-xs uppercase tracking-[0.2em]" style={{ color: '#92400e' }}>Documento Oficial</div>
                  <h2 className="mt-2 text-xl font-serif font-bold">Certificado Oficial de Adopción - Huellitas MaJeMa</h2>
                  <div className="mt-2 text-sm" style={{ color: '#4b5563' }}>Fecha de emisión: {new Date().toLocaleDateString()}</div>
                </header>

                <main className="w-full max-w-none text-center" style={{ color: '#1f2937' }}>
                  <div className="mb-4 rounded-lg border p-4" style={{ borderColor: '#d1d5db', backgroundColor: '#fffdf8' }}>
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#92400e' }}>Constancia de Adopción</div>
                    <p className="mt-3 text-base leading-relaxed">
                      A través de este certificado, hacemos constar que
                    </p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: '#111827' }}>{selectedPet.name}</p>
                    <p className="mt-3 text-base leading-relaxed">
                      ha encontrado un hogar lleno de amor y ha sido oficialmente adoptado(a) por
                    </p>
                    <p className="mt-2 text-xl font-semibold" style={{ color: '#111827' }}>
                      {selectedPet.adopterName ?? '—'}
                    </p>
                    <p className="mt-3 text-sm">el día {new Date().toLocaleDateString()}.</p>
                    <p className="mt-4 text-xs leading-relaxed">
                      Gracias por abrir tu corazón y brindarle una segunda oportunidad de vida.
                    </p>
                  </div>
                </main>

                <footer className="mt-2 w-full border-t pt-3 pb-1" style={{ borderColor: '#d1d5db' }}>
                  <div className="mb-2 text-center text-[11px] uppercase tracking-[0.2em]" style={{ color: '#92400e' }}>
                    Sección de Firmas
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="mb-4 h-0.5" style={{ backgroundColor: '#94a3b8' }} />
                      <div className="text-xs">Firma del Refugio</div>
                    </div>

                    <div className="text-center">
                      <div className="mb-4 h-0.5" style={{ backgroundColor: '#94a3b8' }} />
                      <div className="text-xs">Firma del Adoptante</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center text-[11px]" style={{ color: '#4b5563' }}>
                    Documento generado por Huellitas MaJeMa — Archivo de adopción
                  </div>
                </footer>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCertificate}
                className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleDownloadCertificate}
                disabled={isDownloadingCertificate}
                className="rounded bg-amber-600 px-3 py-1 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDownloadingCertificate ? 'Generando PDF...' : '📥 Descargar Certificado PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}