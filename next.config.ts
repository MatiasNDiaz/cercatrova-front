/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: 'img.magnific.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cordobapropiedades.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blog.tokkobroker.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.unc.edu.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'www.destinocordoba.com.ar',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Proxy: el navegador le pega a /api/* (mismo dominio que el frontend),
  // Vercel reenvía por detrás al backend real en Railway. Así la cookie de
  // sesión queda en el dominio del front y el middleware puede leerla.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;