// app/properties/page.tsx

import { PropertySlider } from '@/modules/landing/components/Slider';
import { propertiesService } from '@/modules/properties/services/properties.service';
import PropertiesList from '@/modules/properties/components/PropertiesList'; 

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {

  // Fetch inicial en el servidor
  const response = await propertiesService.getFilteredProperties(searchParams);

  const items = response?.data || [];
  const total = response?.meta?.totalItems || 0;

  return (
    <main className="min-h-screen bg-[#e5e7e5] pb-20">
      <PropertySlider />

      <PropertiesList
        initialItems={items}
        initialTotal={total}
      />
    </main>
  );
}
