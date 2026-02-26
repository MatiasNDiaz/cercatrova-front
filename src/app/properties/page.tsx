import { propertiesService } from '@/modules/properties/services/properties.service';
import PropertiesCatalog from './Propertiescatalog'; 

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {

  // Fetch inicial en el servidor con los filtros que vienen de la URL
  const response = await propertiesService.getFilteredProperties({
    page: Number(searchParams.page) || 1,
    limit: Number(searchParams.limit) || 12,
    ...searchParams,
  });

  const initialItems = response?.data || [];
  const initialTotal = response?.meta?.totalItems || 0;

  return (
    <main className="min-h-screen bg-[#e5e7e5]">
      <PropertiesCatalog
        initialItems={initialItems}
        initialTotal={initialTotal}
      />
    </main>
  );
}