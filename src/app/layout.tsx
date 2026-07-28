import type { Metadata } from "next";
import { MotionConfig } from "framer-motion";
import "./globals.css";

export const metadata: Metadata = {
  title: "LP Assessoria e Cerimonial | Lia Pontes",
  description:
    "Cerimonialista e assessora de eventos em Manaus. Casamentos, 15 anos, formaturas e eventos em geral, com mais de 15 anos de experiência.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
