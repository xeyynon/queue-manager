import type { NextConfig } from "next";

// Cache Components is deliberately OFF (MD/decisions.md DEC-004): every screen in
// this app is per-user live data, so there is no static shell worth prerendering.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
