import type { Metadata } from "next";
import AuthForm from "@/components/casar/AuthForm";
import "../lp-casar.css";

export const metadata: Metadata = { title: "Entrar | LP Casar", robots: { index: false, follow: false } };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const { modo } = await searchParams;
  return <AuthForm initialMode={modo === "criar" ? "signup" : "login"} />;
}
