/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes moved out of experimental in Next.js 16
  typedRoutes: true,
  // Allow remote product images from Unsplash (mock data) and any future CDN.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "**.s3.**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.storage.yandexcloud.net" }
    ],
    formats: ["image/avif", "image/webp"]
  },
  // Production hardening
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Reduce bundle: only ship the icons we use
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
