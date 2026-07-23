import { propertiesService } from '@/modules/properties/services/properties.service';
import PropertiesCatalog from './Propertiescatalog'; 

interface PageProps {
  // En Next.js 15 searchParams es una Promise: hay que await-earla antes de
  // leer sus propiedades (antes se accedía directo y tiraba warning en consola).
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Fetch inicial en el servidor con los filtros que vienen de la URL.
  // El spread va primero para que page/limit queden como números; antes iba
  // último y pisaba ambos con el string crudo de la URL (equivalente en la
  // query string final, pero al revés de lo que el código parecía hacer).
  const response = await propertiesService.getFilteredProperties({
    ...params,
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 12,
  });

  const initialItems = response?.data || [];
  const initialTotal = response?.meta?.totalItems || 0;

  // El fondo ya NO es uniforme: `PropertiesCatalog` arma 2 secciones full-bleed
  // con su propio color (hero+filtros claro / resultados verde suave) — ver
  // ese componente. `bg-white` acá es solo un fallback de base.
  return (
    <main className="min-h-screen bg-white">
      <PropertiesCatalog
        initialItems={initialItems}
        initialTotal={initialTotal}
      />
    </main>
  );
}