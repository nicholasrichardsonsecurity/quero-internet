/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/querointernet/admin',
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default nextConfig;
