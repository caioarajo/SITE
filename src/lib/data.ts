import { createClient } from "@/lib/supabase/server";
import type { ServiceRow, PortfolioItemRow, TestimonialRow, FaqRow } from "@/lib/types";

/**
 * Funções usadas pela home (Server Component) para buscar o conteúdo do
 * Supabase. Cada uma devolve um array vazio (em vez de quebrar a página)
 * se o Supabase ainda não estiver configurado — assim o site continua no
 * ar mesmo antes do banco estar pronto.
 */

export async function getServices(): Promise<ServiceRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[getServices]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPortfolioItems(): Promise<PortfolioItemRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[getPortfolioItems]", error.message);
    return [];
  }
  return (data as PortfolioItemRow[] | null) ?? [];
}

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[getTestimonials]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getFaqs(): Promise<FaqRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[getFaqs]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("site_settings").select("*");

  const fallback = {
    phone: "92 99266-2890",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5592992662890",
    email: "liapontesa@gmail.com",
    instagram: "@lpcerimonial_",
  };

  if (error || !data) {
    if (error) console.error("[getSiteSettings]", error.message);
    return fallback;
  }

  const settings = { ...fallback };
  for (const row of data) {
    if (row.value) settings[row.key as keyof typeof settings] = row.value;
  }
  return settings;
}
