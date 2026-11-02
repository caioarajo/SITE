/** @type {import('next').NextConfig} */
const nextConfig = {
  // Só vale em `next dev`: libera celulares na mesma rede local para testar
  // o protótipo do telão (/prototipo-telao) pelo IP do computador.
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
