/**
 * Construtor de comandos ESC/POS.
 *
 * Puro — sem dependência de Node nem de DOM — roda tanto em Server
 * Component quanto em componente client (browser). Gera o payload de
 * bytes que o agente de impressão local (ver print-agent/) repassa pra
 * porta serial/Bluetooth da impressora térmica.
 *
 * Substitui o hack anterior de "texto puro com espaços simulando
 * layout" (necessário só porque o driver Windows "Generic / Text Only"
 * não entende nada além de ASCII cru). Com o agente falando direto com
 * a porta COM, a impressora recebe os comandos reais de negrito,
 * alinhamento e corte de papel que ela sempre suportou.
 *
 * Referência: a maioria das térmicas de 58/80mm vendidas no Brasil
 * (Bematech, Elgin, Daruma, clones genéricos) entende esse subconjunto
 * "comum" de ESC/POS, mesmo os modelos mais baratos.
 */

const ESC = 0x1b;
const GS = 0x1d;

/**
 * A maioria das térmicas baratas não tem codepage UTF-8/Latin-1
 * confiável habilitada por padrão — a forma mais robusta de garantir
 * que acento não vire caracter aleatório é remover o acento antes de
 * mandar (mesma estratégia já usada no gerador de etiqueta em texto
 * puro, que já se provou confiável em produção).
 */
export function normAscii(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '?');
}

/** Quebra um texto em linhas de no máximo `width` chars, por palavra. */
export function wrapText(text: string, width: number): string[] {
  const words = normAscii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}

export type Align = 'left' | 'center' | 'right';

export class EscPosBuilder {
  private bytes: number[] = [];

  /** ESC @ — reseta a impressora pro estado padrão. Sempre chamar primeiro. */
  init(): this {
    this.bytes.push(ESC, 0x40);
    return this;
  }

  /** ESC a n — alinhamento do texto seguinte. */
  align(mode: Align): this {
    const n = mode === 'center' ? 1 : mode === 'right' ? 2 : 0;
    this.bytes.push(ESC, 0x61, n);
    return this;
  }

  /** ESC E n — liga/desliga negrito. */
  bold(on: boolean): this {
    this.bytes.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  /** Texto cru, sem quebra de linha no final. */
  text(s: string): this {
    const ascii = normAscii(s);
    for (let i = 0; i < ascii.length; i++) this.bytes.push(ascii.charCodeAt(i) & 0xff);
    return this;
  }

  /** Texto + quebra de linha (LF). */
  line(s = ''): this {
    this.text(s);
    this.bytes.push(0x0a);
    return this;
  }

  /** Várias linhas de uma vez. */
  lines(arr: string[]): this {
    for (const l of arr) this.line(l);
    return this;
  }

  /** Linha divisória (ex: '-'.repeat(32)). */
  divider(char = '-', width = 32): this {
    return this.line(char.repeat(width));
  }

  /** Linha em branco. */
  blank(n = 1): this {
    for (let i = 0; i < n; i++) this.bytes.push(0x0a);
    return this;
  }

  /** ESC d n — avança n linhas (útil como margem de rasgo). */
  feed(n = 1): this {
    this.bytes.push(ESC, 0x64, n);
    return this;
  }

  /** GS V m — corta o papel. partial=true faz corte parcial (mais comum em térmica pequena). */
  cut(partial = true): this {
    this.bytes.push(GS, 0x56, partial ? 1 : 0);
    return this;
  }

  /**
   * GS k — código de barras nativo da impressora (renderizado pelo
   * hardware, não é desenho/imagem). Só isso já é um ganho que o hack
   * de texto puro nunca conseguiria: um "código de barras" desenhado
   * com caracteres não é escaneável por nenhum leitor.
   *
   * type: 'ean13' exige exatamente 12 ou 13 dígitos numéricos (o
   * dígito verificador é calculado pela própria impressora se vier
   * com 12). 'code128' aceita texto alfanumérico — é o formato certo
   * pro internal_sku quando o item não tem EAN13 de fabricante.
   */
  barcode(data: string, type: 'ean13' | 'code128' = 'code128', height = 64): this {
    const clean = type === 'ean13' ? data.replace(/\D/g, '') : data;
    if (!clean) return this;

    // GS h n — altura do codigo de barras em pontos
    this.bytes.push(GS, 0x68, Math.max(1, Math.min(255, height)));
    // GS w n — largura de cada barra (2 = padrao, boa leitura em 58mm)
    this.bytes.push(GS, 0x77, 2);
    // GS H n — posicao do texto legivel (2 = abaixo do codigo)
    this.bytes.push(GS, 0x48, 2);

    if (type === 'ean13') {
      // GS k m — m=2 (EAN13), aceita 12 ou 13 digitos + terminador NUL
      this.bytes.push(GS, 0x6b, 2);
      for (let i = 0; i < clean.length; i++) this.bytes.push(clean.charCodeAt(i));
      this.bytes.push(0x00);
    } else {
      // GS k m — m=73 (CODE128), formato "novo" com length-prefix:
      // {A seleciona subset A (alfanumerico + controle)
      const payload = '{A' + clean;
      this.bytes.push(GS, 0x6b, 73, payload.length);
      for (let i = 0; i < payload.length; i++) this.bytes.push(payload.charCodeAt(i) & 0xff);
    }
    return this;
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}
