/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.1.16', '192.168.1.15', '10.45.145.187', '172.20.10.2'],
}

export default nextConfig
