import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  /* config options here */
  // reactStrictMode: true,
    env: {
      ABLY_API_KEY: process.env.ABLY_API_KEY,
      DATABASE_URL: process.env.DATABASE_URL

    },
};

export default nextConfig;
