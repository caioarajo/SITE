import { createClient } from "@/lib/supabase/client";

/**
 * Registra (best-effort, sem bloquear a navegação para o wa.me) uma
 * oportunidade mínima no CRM quando alguém clica no CTA de WhatsApp da
 * página de bio do Instagram (/instagram). Mesma ideia de
 * captureWhatsappClick, mas com origem "instagram" — permite medir,
 * no painel de CRM, quanto contato vem de quem chegou pelo Instagram.
 */
export function captureInstagramClick() {
  try {
    const supabase = createClient();
    supabase
      .from("opportunities")
      .insert({
        name: "Contato via Instagram",
        source: "instagram",
        stage: "novo",
      })
      .then(
        () => {},
        () => {}
      );
  } catch {
    // best-effort — nunca deve impedir o clique de abrir o WhatsApp
  }
}
