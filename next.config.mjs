/** @type {import('next').NextConfig} */
const nextConfig = {
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
