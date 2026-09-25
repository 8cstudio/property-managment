import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ezzi/ui", "@ezzi/env"],
};

export default nextConfig;
