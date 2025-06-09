// src/utils/format.ts

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}
