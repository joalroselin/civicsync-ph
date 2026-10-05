/** @type {import('next').NextConfig} */
const nextConfig = {
  // Read from disk at request time: link-preview fonts, and the bill search
  // index (data/search, CS-306/903).
  outputFileTracingIncludes: { "/**": ["./assets/fonts/**/*", "./data/search/**/*"] },
  async headers() {
    return [
      {
        // Let the service worker update promptly after each deploy.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
