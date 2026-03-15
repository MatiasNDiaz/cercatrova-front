'use client';
import { use } from 'react';
import PropertyForm from '../PropertyForm';

export default function EditarPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PropertyForm propertyId={Number(id)} />;
}