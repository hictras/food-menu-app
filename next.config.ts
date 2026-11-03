import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["192.168.18.9", "localhost:3000"],
  serverExternalPackages: ["@google/generative-ai", "tesseract.js"], // <-- ADD THIS
};

export default nextConfig;
