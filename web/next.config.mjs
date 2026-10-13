const basePath = process.env.BASE_PATH || "";

/** @type {import('next').NextConfig} */
export default {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  transpilePackages: ["@lb/core"],
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
