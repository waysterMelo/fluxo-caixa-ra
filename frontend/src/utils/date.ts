/**
 * Utilitário centralizado para manipulação de datas
 * Resolve problemas de timezone e garante exibição correta no formato brasileiro
 */

/**
 * Retorna a data atual no formato YYYY-MM-DD usando o timezone local do navegador
 * Evita o bug do toISOString() que retorna data em UTC
 */
export function getTodayLocal(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formata uma data no formato YYYY-MM-DD para o padrão brasileiro DD/MM/YYYY
 * Interpreta a data como data local (não UTC)
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '';

  try {
    // Interpreta a data como meia-noite no timezone local
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch {
    return '';
  }
}

/**
 * Formata uma data no formato YYYY-MM-DD para o padrão DD/MM/AAAA com hora
 * Útil para timestamps de auditoria (created_at, updated_at)
 */
export function formatDateTimeBR(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Retorna o timezone detectado pelo navegador (ex: "America/Sao_Paulo")
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Converte uma data local para o formato YYYY-MM-DD
 */
export function dateToLocalString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
