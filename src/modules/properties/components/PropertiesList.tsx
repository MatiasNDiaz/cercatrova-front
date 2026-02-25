'use client';

import { useEffect, useState } from 'react';
import { usePropertyFilters } from '@/modules/properties/hooks/usePropertyFilters';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import { Property } from '../interfaces/propertyInterface';

interface Props {
  initialItems: Property[];
  initialTotal: number;
}

interface PropertiesState {
  items: Property[];
  total: number;
}

export default function PropertiesList({ initialItems, initialTotal }: Props) {

  const { filters } = usePropertyFilters();

  const [data, setData] = useState<PropertiesState>({
    items: initialItems,
    total: initialTotal
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const response = await propertiesService.getFilteredProperties(filters);

      setData({
        items: response?.data || [],
        total: response?.meta?.totalItems || 0
      });

      setLoading(false);
    };

    fetchData();
  }, [filters]);

  return (
    <div className="container rounded-2xl mb-10 w-[95%] min-h-screen mt-20 mx-auto">
      <div id="propiedades" className="text-center mb-20">
          <span className="text-sm tracking-widest uppercase text-[#0b7a4b] font-medium">
            propiedades destacadas
          </span>
          <h2 id="propiedades" className="text-4xl md:text-5xl font-semibold mt-4 text-gray-900">
            Propiedades elegidas por su ubicación, calidad y potencial.
          </h2>
          <div className="w-28 h-0.5 bg-[#0b7a4b] mx-auto mt-8"></div>
        </div>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div  className="grid grid-cols-4 gap-4">
          {data.items.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
}
