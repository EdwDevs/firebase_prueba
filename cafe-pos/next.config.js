/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para exportación estática (Firebase Hosting)
  output: 'export',
  distDir: 'dist',
  // Configuración para rutas dinámicas
  trailingSlash: true,
}

module.exports = nextConfig
