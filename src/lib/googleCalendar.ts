// Integração opcional com o Google Agenda. Sem as variáveis de ambiente
// configuradas, tudo fica desligado e o agendamento segue só no admin.
//
// Variáveis: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
// GOOGLE_CALENDAR_ID (opcional, padrão "primary").

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TIME_ZONE = "America/Manaus";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

export function buildConsentUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google recusou o código (${res.status}).`);
  return (await res.json()) as { access_token: string; refresh_token?: string };
}

async function accessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Falha ao renovar acesso ao Google (${res.status}).`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export type CalendarEventInput = {
  summary: string;
  description: string;
  start: Date;
  end: Date;
};

/** Cria o evento no Google Agenda. Retorna o id do evento criado. */
export async function createCalendarEvent(input: CalendarEventInput): Promise<string> {
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
  const token = await accessToken();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: TIME_ZONE },
      end: { dateTime: input.end.toISOString(), timeZone: TIME_ZONE },
    }),
  });
  if (!res.ok) throw new Error(`Google recusou o evento (${res.status}).`);
  return ((await res.json()) as { id: string }).id;
}
