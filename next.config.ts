import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  // The SQLite DB is downloaded at runtime (GitHub pull-push) — never bundle
  // the local db files into the standalone trace, which also avoids copying a
  // possibly-locked development.db during build.
  outputFileTracingIgnores: ["**/db/**", "**/*.db"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;