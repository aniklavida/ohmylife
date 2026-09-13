/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `better-sqlite3` is a native module used by the life core (`lib/index`).
  // It must run as real server code, never be bundled for the client or the edge.
  serverExternalPackages: ["better-sqlite3"],
  // `next dev` otherwise appends its own instructional block to this
  // repository's AGENTS.md on every run — a file this project already
  // curates deliberately (docs/STRUCTURE.md's public/private split, and
  // AGENTS.md's own "Tests" section). Disabled so a contributor's `git
  // status` reflects only changes they made.
  agentRules: false,
};

export default nextConfig;
