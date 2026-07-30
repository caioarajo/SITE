import { createClient } from "@/lib/supabase/client";

/**
 * Registra (best-effort, sem bloquear a navegação para o wa.me) uma
 * oportunidade mínima no CRM quando alguém clica em um CTA de WhatsApp
 * "cru" do site (sem formulário). Não há integração com WhatsApp Business
 * API — isso só marca a intenção de contato, não a conversa em si.
 */
export function captureWhatsappClick() {
  try {
    const supabase = createClient();
    supabase
      .from("opportunities")
      .insert({
        name: "Contato via WhatsApp",
        source: "whatsapp",
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
