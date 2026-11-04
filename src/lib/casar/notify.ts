import type { SiteData } from "./types";

// Aviso por e-mail aos noivos. Sem RESEND_API_KEY não envia nada: o painel continua
// mostrando as novidades pelo contador nos menus.

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function notifyCouple(data: SiteData, subject: string, lines: string[]) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LP_CASAR_EMAIL_FROM;
  const { email, address } = data.notifications;
  if (!key || !from || !email || !address) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: address,
        subject,
        html: lines.map((line) => `<p>${esc(line)}</p>`).join(""),
      }),
    });
    if (!res.ok) console.error("[casar] e-mail:", res.status);
  } catch (err) {
    // O convidado não pode ver erro porque o aviso falhou: a resposta dele já foi salva.
    console.error("[casar] e-mail:", (err as Error).message);
  }
}
