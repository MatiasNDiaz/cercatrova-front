/**
 * ⚠️ PÁGINA TEMPORAL DE DIAGNÓSTICO — BORRAR ANTES DE COMMITEAR.
 */
import { FichaContent } from '../[id]/FichaContent';
import type { FichaProperty } from '../[id]/types';

const MOCK: FichaProperty = {
  id: 17,
  title: 'Alquila un depto de un dormitorio en Nva Cba a precio de mercado " PERO" con el plus de estar todo amoblado !!!!!',
  description:
    'Departamento totalmente amoblado, listo para mudarte.\nInstalaciones de luz, agua y gas nuevas a estrenar.\n\nA metros de la Plaza. Consultar disponibilidad de cochera en el edificio.',
  price: 700000,
  currency: 'ARS',
  operationType: 'alquiler',
  status: 'disponible',
  typeOfProperty: { id: 1, name: 'Departamento' },
  provincia: 'Cordoba',
  localidad: 'Cordoba',
  barrio: 'Nueva Cordoba',
  direccion: 'Rondeau 430',
  zone: 'Centro',
  rooms: 1,
  bathrooms: 1,
  supTotal: 40,
  supCubierta: 40,
  antiquity: 0,
  garage: false,
  patio: false,
  aptoMascotas: false,
  expensas: 125000,
  property_deed: true,
  tractoAbreviado: false,
  boleto: true,
  images: [
    { id: 1, url: '/CasaSider.png', isCover: true },
    { id: 2, url: '/HappyFamili.png' },
    { id: 3, url: '/hipolitoYrigoyen.png' },
    { id: 4, url: '/chicaNuevoDpto.png' },
    { id: 5, url: '/familiaNuevImagen.png' },
  ],
  created_at: '2026-08-11T12:00:00.000Z',
  updated_at: '2026-08-11T12:00:00.000Z',
};

export default function FichaDiagPage() {
  return <FichaContent p={MOCK} />;
}
