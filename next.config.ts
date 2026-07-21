import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheHandlers: {
    remote: require.resolve("./cache-handlers/remote-handler.js"),
  },
  cacheLife: {
    finance_hot: {
      stale: 300,
      revalidate: 60,
      expire: 3600,
    },
    finance_warm: {
      stale: 300,
      revalidate: 300,
      expire: 86400,
    },
  },
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
