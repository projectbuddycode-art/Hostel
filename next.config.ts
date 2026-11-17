import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "*": ["./prisma/build.db"],
    "/*": ["./prisma/build.db"],
    "/**/*": ["./prisma/build.db"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
