const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Validación client-side previa a subir una imagen (el backend rechaza con 400/502
 * archivos no-imagen o mayores a 5MB — validar acá evita el viaje de red).
 * Devuelve un mensaje de error listo para toast, o null si el archivo es válido.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return `"${file.name}" no es una imagen. Solo se permiten archivos de imagen.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `"${file.name}" pesa más de ${MAX_IMAGE_SIZE_MB}MB. Elegí una imagen más liviana.`;
  }
  return null;
}
