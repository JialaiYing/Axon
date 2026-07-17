/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Default bottom-left dev indicator sits directly on top of the sidebar's
  // collapse button — move it out of the way.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
