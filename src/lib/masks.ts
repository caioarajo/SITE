// Máscaras de formatação para campos de documento/contato usados nos
// formulários do admin. Cada função recebe o valor bruto (já parcialmente
// digitado) e devolve a versão formatada — pensadas para uso direto em
// onChange, reaplicando a máscara a cada tecla digitada.

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCPF(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function maskCNPJ(value: string): string {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

/** CPF se tiver até 11 dígitos, CNPJ a partir do 12º — para o campo
 * "document" único que serve tanto para pessoa física quanto jurídica. */
export function maskDocument(value: string): string {
  const digits = onlyDigits(value);
  return digits.length > 11 ? maskCNPJ(value) : maskCPF(value);
}

export function maskCEP(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2-$3");
}

/** Fixo (XX) XXXX-XXXX até 10 dígitos, celular/WhatsApp (XX) 9XXXX-XXXX
 * a partir do 11º — a máscara certa aparece conforme o usuário digita. */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^\((\d{2})\) (\d{4})(\d)/, "($1) $2-$3");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^\((\d{2})\) (\d{5})(\d)/, "($1) $2-$3");
}
