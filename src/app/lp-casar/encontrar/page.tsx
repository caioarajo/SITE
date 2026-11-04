import type { Metadata } from "next";
import FindWedding from "@/components/casar/FindWedding";
import "../lp-casar.css";

export const metadata: Metadata = { title: "Encontre um casamento | LP Casar", robots: { index: false, follow: false } };

export default function EncontrarPage() {
  return <FindWedding />;
}
