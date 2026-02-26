import { propertiesService } from '@/modules/properties/services/properties.service';
import { notFound } from 'next/navigation';
import PropertyDetail from './PropertyDetail';

interface PageProps {
  params: { id: string };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  try {
    const property = await propertiesService.getOne(Number(params.id));
    if (!property) notFound();
    return <PropertyDetail property={property} />;
  } catch {
    notFound();
  }
}