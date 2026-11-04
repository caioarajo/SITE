import type { Metadata } from "next";
import ResetPassword from "@/components/casar/ResetPassword";
import "../lp-casar.css";

export const metadata: Metadata = { title: "Nova senha | LP Casar", robots: { index: false, follow: false } };

export default async function RedefinirPage({ searchParams }: { searchParams: Promise<{ token?: string; erro?: string }> }) {
  const { token, erro } = await searchParams;
  return <ResetPassword token={token} expired={Boolean(erro)} />;
}
