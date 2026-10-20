'use client';

import { use } from 'react';
import PostForm from '../PostForm';

/** Edición de una Publicación — mismo patrón que `propiedades/[id]`. */
export default function EditarPublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PostForm postId={Number(id)} />;
}
