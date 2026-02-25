import { PropertySlider } from '@/modules/landing/components/Slider';
import FeaturedProperties from '@/modules/landing/components/Featuredproperties';
import Servicios from '@/modules/landing/components/Servicios';
import Resenas from '@/modules/landing/components/Reseñas';
import Nosotros from '@/modules/landing/components/Nosotros';
import RealEstateFAQ from '@/modules/landing/components/RealEstateFAQ';
import { BackToTopButton } from '@/modules/landing/components/BackToTopButton';

export default async function PropertiesPage() {

  return (
    <main id='inicio' className="min-h-screen bg-[#e5e7e5] pb-20">
      <PropertySlider />
      <FeaturedProperties/>
      <Servicios />
      <Resenas />
      <Nosotros/> 
      <RealEstateFAQ/>
      <BackToTopButton />
    </main>
  );
}
