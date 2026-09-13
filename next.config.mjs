/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `better-sqlite3` is a native module used by the life core (`lib/index`).
  // It must run as real server code, never be bundled for the client or the edge.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
