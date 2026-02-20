

import { PropertySlider } from '@/modules/landing/components/Slider';
import { propertiesService } from '@/modules/properties/services/properties.service';
import PropertiesList from '@/modules/properties/components/PropertiesList'; 
import Servicios from '@/modules/landing/components/Servicios';
import Resenas from '@/modules/landing/components/Reseñas';
import Nosotros from '@/modules/landing/components/Nosotros';
import RealEstateFAQ from '@/modules/landing/components/RealEstateFAQ';


interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {

  // Fetch inicial en el servidor
  const response = await propertiesService.getFilteredProperties(searchParams);

  const items = response?.data || [];
  const total = response?.meta?.totalItems || 0;

  return (
    <main id='inicio' className="min-h-screen bg-[#e5e7e5] pb-20">
      <PropertySlider />

      <PropertiesList
        initialItems={items}
        initialTotal={total}
      />

      <Servicios />

      <Resenas />
      <Nosotros/> 
      <RealEstateFAQ/>
    </main>
  );
}
