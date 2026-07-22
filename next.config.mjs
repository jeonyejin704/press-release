/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Uploaded files are served from /public/uploads in the MVP (local storage).
  // For production, swap the storage adapter (see src/lib/storage).
};

export default nextConfig;
