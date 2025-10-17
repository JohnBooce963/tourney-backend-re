import type { NextConfig } from "next";
const fs = require('fs');


const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));



const nextConfig: NextConfig = {
  /* config options here */
  // reactStrictMode: true,
  env: env
};

export default nextConfig;
