// Server Component - no necesita "use client"
import { propertiesService } from '@/modules/properties/services/properties.service';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function FeaturedProperties() {
  const response = await propertiesService.getFilteredProperties({ page: '1', limit: '6' });
  const items = response?.data || [];

  return (
    <section className="container rounded-2xl  w-[95%] py-20 mx-auto">

      {/* ── HEADER ── */}
      <div id="propiedades" className="text-center mb-12">
        <span className="text-sm tracking-widest uppercase text-[#0b7a4b] font-medium">
          propiedades destacadas
        </span>
        <h2 className="text-4xl md:text-5xl font-semibold mt-4 text-gray-900">
          Propiedades elegidas por su ubicación, calidad y potencial.
        </h2>
        <div className="w-28 h-0.5 bg-[#0b7a4b] mx-auto mt-8" />
      </div>

      {/* ── GRID ── */}
      {items.length === 0 ? (
        <p className="text-center text-gray-500">No hay propiedades disponibles en este momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}

      {/* ── CTA → ver todas ── */}
      <div className="flex justify-center mt-10">
        <Link
          href="/properties"
          className="group relative overflow-hidden flex items-center gap-2 px-10 py-4 text-lg font-bold text-white bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] rounded-full shadow-lg active:scale-95 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          <span className="relative">Ver todas las propiedades</span>
          <ArrowRight size={20} className="relative group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>

    </section>
  );
}