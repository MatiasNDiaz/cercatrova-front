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
    <div className="container mx-auto">
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {data.items.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
}
