/**
 * Utilitário de formatação de moeda (BRL)
 * Formatação premium para valores financeiros
 */

/**
 * Formata um número como moeda brasileira (R$)
 * Ex: 1234.56 → "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata um número como moeda compacta
 * Ex: 1234567 → "R$ 1,2M"
 */
export function formatCurrencyCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Parse de string de moeda para número
 * Ex: "R$ 1.234,56" → 1234.56
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata diferença percentual com sinal
 * Ex: 15.5 → "+15,5%"
 */
export function formatPercentDiff(value: number, suffix = '%'): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
  
  return value >= 0 ? `+${formatted}${suffix}` : `-${formatted}${suffix}`;
}

/**
 * Retorna classe CSS baseada no valor (positivo/negativo)
 */
export function getValueColorClass(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-error';
  return 'text-muted';
}

/**
 * Retorna ícone de tendência baseado no valor
 */
export function getTrendIcon(value: number): 'up' | 'down' | 'neutral' {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}
