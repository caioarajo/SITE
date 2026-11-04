import type { Metadata } from "next";
import ConfirmEmail from "@/components/casar/ConfirmEmail";
import "../lp-casar.css";

export const metadata: Metadata = { title: "Confirmar e-mail | LP Casar", robots: { index: false, follow: false } };

export default async function ConfirmarPage({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const { token_hash: tokenHash } = await searchParams;
  return <ConfirmEmail tokenHash={tokenHash} />;
}
