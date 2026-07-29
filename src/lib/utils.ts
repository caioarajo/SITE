import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Formata uma data ISO (yyyy-mm-dd ou timestamp) no padrão brasileiro. */
export function formatDate(value: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), pattern, { locale: ptBR });
  } catch {
    return value;
  }
}

/** Formata data + hora. */
export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value, "dd/MM/yyyy 'às' HH:mm");
}

/** Junta classes condicionalmente (equivalente simples ao "clsx"). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  fechado: "Fechado",
};

export const roleLabels: Record<string, string> = {
  admin: "Administrador",
  usuario_avancado: "Usuário Avançado",
  cliente: "Cliente",
};

/** Valida a complexidade mínima exigida para senhas de usuários do painel:
 * 8+ caracteres, pelo menos uma letra, um número e um símbolo. Devolve a
 * mensagem de erro, ou null se a senha for válida. */
export function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) return "A senha precisa ter no mínimo 8 caracteres.";
  if (!/[a-zA-Z]/.test(password)) return "A senha precisa ter pelo menos uma letra.";
  if (!/[0-9]/.test(password)) return "A senha precisa ter pelo menos um número.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "A senha precisa ter pelo menos um símbolo.";
  return null;
}

/** Gera uma senha temporária forte (letras maiúsculas/minúsculas, números e
 * símbolo garantidos), sem caracteres visualmente ambíguos (0/O, 1/l/I). */
export function generateStrongPassword(length = 14): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%*?";
  const all = upper + lower + digits + symbols;

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pick(all));

  const passwordChars = [...required, ...rest];
  // Embaralha para não deixar os caracteres "garantidos" sempre no início.
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  return passwordChars.join("");
}
