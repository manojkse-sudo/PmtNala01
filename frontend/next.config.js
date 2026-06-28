/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow HMR from any local network IP (phones/tablets on the same WiFi).
  // This only affects the dev server — has no effect in production builds.
  allowedDevOrigins: [
    "192.168.1.0/24",   // common home/office subnet
    "192.168.0.0/24",
    "10.0.0.0/24",
    "172.16.0.0/12",
  ],
};

module.exports = nextConfig;
