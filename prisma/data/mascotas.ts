// prisma/data/mascotas.ts
import { AdoptionStatus, MedicalStatus } from "../../generated/prisma";

export const initialPetsSeed = [
  {
    name: 'Firulais',
    breed: 'Labrador',
    age: '3',
    weight: '20kg',
    species: 'Perro',
    medicalStatus: 'SANO' as MedicalStatus,
    medicalNotes: 'Vacunado y desparasitado',
    adoptionStatus: 'DISPONIBLE' as AdoptionStatus,
  },
  {
    name: 'Michi',
    breed: 'Siamés',
    age: '2',
    weight: '4kg',
    species: 'Gato',
    medicalStatus: 'EN_TRATAMIENTO' as MedicalStatus,
    medicalNotes: 'Tratamiento por dermatitis en curso',
    adoptionStatus: 'EN_PROCESO' as AdoptionStatus,
    adopterName: 'Juan Pérez',
    adopterPhone: '555-1234',
    adopterAddress: 'Calle Falsa 123',
  },
];