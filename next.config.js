/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "flagcdn.com"],
  },
  // Evitar errores de permisos en OneDrive
  swcMinify: true,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

module.exports = nextConfig;
