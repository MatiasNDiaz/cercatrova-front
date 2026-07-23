import { propertiesService } from '@/modules/properties/services/properties.service';
import { notFound } from 'next/navigation';
import PropertyDetail from './PropertyDetail';

interface PageProps {
  // En Next.js 15 `params` es una Promise: hay que await-earla antes de leer
  // sus propiedades (antes se accedía a `params.id` directo y tiraba warning).
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  try {
    const property = await propertiesService.getOne(Number(id));
    if (!property) notFound();
    return <PropertyDetail property={property} />;
  } catch {
    notFound();
  }
}