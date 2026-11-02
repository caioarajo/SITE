/** @type {import('next').NextConfig} */
const nextConfig = {
  // Só vale em `next dev`: libera celulares na mesma rede local para testar
  // a LP Memórias (/lp-memorias) pelo IP do computador.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
