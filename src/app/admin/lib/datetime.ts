/**
 * Formatação de datas no horário de Brasília.
 *
 * Bug que isso corrige: `new Date(x).toLocaleString('pt-BR')` sem `timeZone`
 * explícito formata no fuso do ambiente de execução — em produção (Vercel),
 * isso é UTC, não America/Sao_Paulo. Resultado: todo horário exibido pro
 * cliente (recibo de entrega, timeline da OS, etc) saía 3h adiantado.
 * O dado no banco sempre esteve certo (timestamptz em UTC); o bug era só
 * na hora de mostrar.
 *
 * Use estas funções pra QUALQUER timestamptz (created_at, updated_at,
 * delivered_at, voided_at, warrantyStart/End...). Pra colunas `date` puras
 * do Postgres (sem hora — hoje só `estimated_ready_at`), use
 * `formatDateOnlyBR`, que não passa por conversão de fuso nenhuma.
 */

const TZ = 'America/Sao_Paulo';

/** "06/08/2026" — timestamptz formatado no horário de Brasília. */
export function formatDateBR(value: string | Date): string {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: TZ });
}

/** "06/08/2026 16:42:24" — timestamptz completo no horário de Brasília. */
export function formatDateTimeBR(
  value: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleString('pt-BR', { timeZone: TZ, ...opts });
}

/** "16:42" — só a hora, no horário de Brasília. */
export function formatTimeBR(
  value: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
    ...opts,
  });
}

/** "06/08, 16:42" — versão curta usada nas timelines de eventos. */
export function formatDateTimeShortBR(value: string | Date): string {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: TZ,
  });
}

/**
 * "06/08/2026" a partir de uma coluna `date` pura do Postgres (formato
 * "YYYY-MM-DD", sem hora — ex: estimated_ready_at). NÃO usa `new Date(...)`
 * + timeZone: isso reintroduziria o mesmo tipo de bug ao contrário —
 * "YYYY-MM-DD" vira meia-noite UTC, e convertendo pra America/Sao_Paulo
 * (UTC-3) o dia "voltaria" pro dia anterior. Como não há hora armazenada,
 * a data já é a data certa — só reformata o texto.
 */
export function formatDateOnlyBR(value: string): string {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

// --- Limites de dia/mês pro fuso de Brasília (usado em filtros "hoje",
// "essa semana", "esse mês" no dashboard e na lista de vendas) ---
//
// Brasil não tem mais horário de verão desde 2019, então o offset de
// America/Sao_Paulo é sempre UTC-3, o ano inteiro. Isso permite calcular
// o instante UTC correspondente à meia-noite de Brasília sem depender de
// nenhuma lib de fuso horário.
const BR_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

function brazilDateParts(reference: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

/**
 * Meia-noite de Brasília (do dia de `reference`) como instante UTC — pra
 * usar direto em filtros `.gte('created_at', startOfDayBR().toISOString())`.
 * Sem timeZone explícito, "meia-noite" vira meia-noite do fuso do servidor
 * (UTC na Vercel), 3h adiantada da meia-noite real de Brasília.
 */
export function startOfDayBR(reference: Date = new Date()): Date {
  const { y, m, d } = brazilDateParts(reference);
  return new Date(Date.UTC(y, m - 1, d) + BR_UTC_OFFSET_MS);
}

/** Meia-noite de Brasília do dia 1 do mês de `reference`, como instante UTC. */
export function startOfMonthBR(reference: Date = new Date()): Date {
  const { y, m } = brazilDateParts(reference);
  return new Date(Date.UTC(y, m - 1, 1) + BR_UTC_OFFSET_MS);
}

/** "YYYY-MM-DD" da data atual em Brasília (não do fuso do servidor) — pra montar links tipo ?from=...&to=... */
export function todayBR(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference);
}

/** "YYYY-MM-01" do mês atual em Brasília. */
export function startOfMonthBRStr(reference: Date = new Date()): string {
  return `${todayBR(reference).slice(0, 7)}-01`;
}
