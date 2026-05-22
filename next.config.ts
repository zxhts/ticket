import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.less": {
        loaders: ["less-loader"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
