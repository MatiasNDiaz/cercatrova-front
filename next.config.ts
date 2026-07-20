/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite construir a un directorio alternativo (NEXT_DIST_DIR=.next-build npm run build)
  // para no pelear con el `.next` que bloquea el dev server en Windows.
  // Sin la variable, el comportamiento es exactamente el de siempre.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images3.alphacoders.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.unc.edu.ar', 
        port: '',
        pathname: '/**',
      },
    ],
  },
};


export default nextConfig;
