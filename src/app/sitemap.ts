import { MetadataRoute } from 'next';
import { propertiesService } from '@/modules/properties/services/properties.service';

const SITE_URL = 'https://inmobiliariacercatrova.com';

// Los 6 slugs reales de `(public)/servicios/[id]/page.tsx` (objeto `serviciosData`).
const SERVICIOS_SLUGS = ['venta', 'alquiler', 'tasaciones', 'asesoramiento', 'comercializacion', 'legal'];

// El catálogo cambia con cada alta/baja de propiedad: se regenera como máximo
// una vez por hora en vez de pegarle a la API en cada request a /sitemap.xml.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/properties`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/publicaciones`, changeFrequency: 'daily', priority: 0.6 },
    ...SERVICIOS_SLUGS.map((slug) => ({
      url: `${SITE_URL}/servicios/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];

  // Si la API no responde, el sitemap sale igual con las rutas estáticas en
  // vez de romper /sitemap.xml entero.
  const properties = await propertiesService.getAllAvailable().catch(() => []);

  const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${SITE_URL}/properties/${property.id}`,
    lastModified: property.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
