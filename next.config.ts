import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",
  
  // Server external packages
  serverExternalPackages: ["knex", "pg"],
};

export default nextConfig;
