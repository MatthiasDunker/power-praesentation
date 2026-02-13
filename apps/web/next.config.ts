import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@power/contracts", "@power/shared", "@power/ui"]
};

export default nextConfig;
