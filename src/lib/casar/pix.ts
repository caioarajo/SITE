import type { PixKeyType } from "./types";

// Monta o "Pix copia e cola" estático (BR Code, padrão EMV do Banco Central).

const ascii = (text: string, max: number) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, max);

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC16-CCITT-FALSE, o exigido no campo 63 do BR Code. */
export function crc16(text: string) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function normalizePixKey(type: PixKeyType, key: string) {
  const trimmed = key.trim();
  const digits = trimmed.replace(/\D/g, "");
  switch (type) {
    case "cpf":
    case "cnpj":
      return digits;
    case "phone":
      return digits.startsWith("55") && digits.length >= 12 ? `+${digits}` : `+55${digits}`;
    case "email":
    case "random":
      return trimmed.toLowerCase();
  }
}

export function pixKeyError(type: PixKeyType, key: string) {
  const value = key.trim();
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (type === "cpf" && digits.length !== 11) return "O CPF precisa ter 11 dígitos.";
  if (type === "cnpj" && digits.length !== 14) return "O CNPJ precisa ter 14 dígitos.";
  if (type === "phone" && (digits.length < 10 || digits.length > 13)) return "Informe o celular com DDD.";
  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "E-mail inválido.";
  if (type === "random" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return "A chave aleatória tem o formato 00000000-0000-0000-0000-000000000000.";
  }
  return "";
}

export function pixPayload(input: { keyType: PixKeyType; key: string; holder: string; city: string; amount: number; description?: string }) {
  const account = field("00", "br.gov.bcb.pix") + field("01", normalizePixKey(input.keyType, input.key));
  const description = input.description ? ascii(input.description, 40) : "";
  const body =
    field("00", "01") +
    field("26", account + (description ? field("02", description) : "")) +
    field("52", "0000") +
    field("53", "986") +
    (input.amount > 0 ? field("54", input.amount.toFixed(2)) : "") +
    field("58", "BR") +
    field("59", ascii(input.holder, 25).toUpperCase() || "NOIVOS") +
    field("60", ascii(input.city, 15).toUpperCase() || "BRASIL") +
    field("62", field("05", "***")) +
    "6304";
  return body + crc16(body);
}
