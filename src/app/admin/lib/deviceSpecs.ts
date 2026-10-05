export type DeviceType = 'notebook' | 'computador' | 'celular';

export interface DeviceSpecs {
  type: DeviceType;
  condition: string; // 'Novo Lacrado' | 'Seminovo Grade A+' | 'Seminovo Grade A' | 'Seminovo Grade B' | 'Novo Montado'
  warranty?: string; // '90 Dias Balcão Cyber' | '6 Meses' | '1 Ano'
  // Notebook & PC specs:
  cpu?: string;
  ram?: string;
  storage?: string; // SSD principal
  storageSecondary?: string; // HD ou 2º SSD
  gpu?: string;
  screen?: string;
  battery?: string; // Estado / Saúde
  charger?: string;
  os?: string;
  motherboard?: string;
  powerSupply?: string;
  caseType?: string;
  runsGames?: string;
  // Celular specs:
  color?: string;
  batteryHealth?: string; // Ex: '100%', '88%', 'Nova'
  imei?: string;
  serialNumber?: string;
  accessories?: string[];
  cameraCondition?: string;
  screenCondition?: string;
  installmentInfo?: string;
  showInShowroom?: boolean;
}

const SPECS_TAG_START = '<!--DEVICE_SPECS:';
const SPECS_TAG_END = ':DEVICE_SPECS-->';

export function generateDeviceSku(type: DeviceType): string {
  const prefix = type === 'notebook' ? 'CY-NOT' : type === 'computador' ? 'CY-PC' : 'CY-CEL';
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
}

export function calculateInstallment(
  price: number,
  installments = 12,
  rate = 0.145, // Taxa média padrão de parcelamento em 12x
): { count: number; installmentValue: number; text: string } {
  if (!price || price <= 0) {
    return { count: 12, installmentValue: 0, text: 'Consulte parcelamento' };
  }
  const totalWithCard = price * (1 + rate);
  const perMonth = Math.ceil((totalWithCard / installments) * 100) / 100;
  return {
    count: installments,
    installmentValue: perMonth,
    text: `${installments}x de R$ ${perMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };
}

export function formatDeviceTitle(
  type: DeviceType,
  brand: string,
  model: string,
  specs: Partial<DeviceSpecs>,
): string {
  const b = brand.trim();
  const m = model.trim();

  if (type === 'notebook') {
    const parts = [
      b,
      m,
      specs.cpu ? specs.cpu.replace(/\(.*?\)/g, '').trim() : '',
      specs.ram ? specs.ram.trim() : '',
      specs.storage ? specs.storage.trim() : '',
    ].filter(Boolean);
    return parts.length > 2 ? `${b} ${m} - ${[specs.cpu?.replace(/\(.*?\)/g, '').trim(), specs.ram, specs.storage].filter(Boolean).join(' / ')}` : `${b} ${m}`.trim();
  }

  if (type === 'computador') {
    const pcName = m || (b ? `${b} Custom` : 'PC Gamer Cyber');
    const highlights = [
      specs.cpu ? specs.cpu.replace(/\(.*?\)/g, '').trim() : '',
      specs.gpu ? specs.gpu.trim() : '',
      specs.ram ? specs.ram.trim() : '',
      specs.storage ? specs.storage.trim() : '',
    ].filter(Boolean);
    return highlights.length > 0 ? `${pcName} (${highlights.join(' / ')})` : pcName;
  }

  if (type === 'celular') {
    const phoneName = [b, m].filter(Boolean).join(' ');
    const extras = [
      specs.storage ? specs.storage.trim() : '',
      specs.color ? specs.color.trim() : '',
      specs.batteryHealth ? `Saúde ${specs.batteryHealth.trim()}` : '',
    ].filter(Boolean);
    return extras.length > 0 ? `${phoneName} ${extras.join(' - ')}` : phoneName;
  }

  return [b, m].filter(Boolean).join(' ');
}

export function encodeDeviceNotes(humanNotes: string, specs: DeviceSpecs): string {
  const jsonStr = JSON.stringify(specs);

  const lines: string[] = [];
  lines.push(`Dispositivo: ${specs.type.toUpperCase()}`);
  lines.push(`Condição: ${specs.condition || 'Seminovo'}`);
  if (specs.warranty) lines.push(`Garantia: ${specs.warranty}`);

  if (specs.cpu) lines.push(`Processador: ${specs.cpu}`);
  if (specs.ram) lines.push(`RAM: ${specs.ram}`);
  if (specs.storage) lines.push(`Armazenamento: ${specs.storage}`);
  if (specs.storageSecondary) lines.push(`Armazenamento 2: ${specs.storageSecondary}`);
  if (specs.gpu) lines.push(`Placa de Vídeo: ${specs.gpu}`);
  if (specs.screen) lines.push(`Tela: ${specs.screen}`);
  if (specs.battery) lines.push(`Bateria: ${specs.battery}`);
  if (specs.charger) lines.push(`Carregador: ${specs.charger}`);
  if (specs.os) lines.push(`Sistema: ${specs.os}`);
  if (specs.motherboard) lines.push(`Placa-Mãe: ${specs.motherboard}`);
  if (specs.powerSupply) lines.push(`Fonte: ${specs.powerSupply}`);
  if (specs.caseType) lines.push(`Gabinete: ${specs.caseType}`);
  if (specs.runsGames) lines.push(`Roda: ${specs.runsGames}`);

  if (specs.color) lines.push(`Cor: ${specs.color}`);
  if (specs.batteryHealth) lines.push(`Saúde Bateria: ${specs.batteryHealth}`);
  if (specs.imei) lines.push(`IMEI: ${specs.imei}`);
  if (specs.serialNumber) lines.push(`Serial / Service Tag: ${specs.serialNumber}`);
  if (specs.accessories && specs.accessories.length > 0) {
    lines.push(`Acessórios: ${specs.accessories.join(', ')}`);
  }
  if (specs.installmentInfo) lines.push(`Parcelamento: ${specs.installmentInfo}`);

  const formattedSpecs = lines.join('\n');
  const h = humanNotes.trim();

  return [
    h,
    h ? '\n--- FICHA TÉCNICA ---' : 'FICHA TÉCNICA:',
    formattedSpecs,
    `\n${SPECS_TAG_START}${jsonStr}${SPECS_TAG_END}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function parseDeviceNotes(notesText: string | null | undefined): {
  humanNotes: string;
  specs: DeviceSpecs | null;
} {
  if (!notesText) {
    return { humanNotes: '', specs: null };
  }

  // 1. Tenta extrair JSON delimitado
  const startIdx = notesText.indexOf(SPECS_TAG_START);
  const endIdx = notesText.indexOf(SPECS_TAG_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const rawJson = notesText.slice(startIdx + SPECS_TAG_START.length, endIdx);
    try {
      const parsed = JSON.parse(rawJson) as DeviceSpecs;
      const cleanHumanNotes = notesText
        .slice(0, startIdx)
        .replace(/--- FICHA TÉCNICA ---[\s\S]*$/, '')
        .replace(/FICHA TÉCNICA:[\s\S]*$/, '')
        .trim();
      return { humanNotes: cleanHumanNotes, specs: parsed };
    } catch {
      // Ignora erro e tenta fallback
    }
  }

  // 2. Fallback: Parse de linhas com chaves conhecidas (ex: CPU:, GPU:, etc.)
  const lines = notesText.split('\n');
  const specsFallback: Partial<DeviceSpecs> = {};
  let isDevice = false;

  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith('CPU:')) {
      specsFallback.cpu = l.replace(/^CPU:\s*/, '');
      isDevice = true;
    } else if (l.startsWith('GPU:')) {
      specsFallback.gpu = l.replace(/^GPU:\s*/, '');
      isDevice = true;
    } else if (l.startsWith('RAM:')) {
      specsFallback.ram = l.replace(/^RAM:\s*/, '');
      isDevice = true;
    } else if (l.startsWith('SSD:') || l.startsWith('Armazenamento:')) {
      specsFallback.storage = l.replace(/^(SSD|Armazenamento):\s*/, '');
      isDevice = true;
    } else if (l.startsWith('Tela:')) {
      specsFallback.screen = l.replace(/^Tela:\s*/, '');
      isDevice = true;
    } else if (l.startsWith('Bateria:') || l.startsWith('Saúde Bateria:')) {
      specsFallback.batteryHealth = l.replace(/^(Bateria|Saúde Bateria):\s*/, '');
      isDevice = true;
    } else if (l.startsWith('IMEI:')) {
      specsFallback.imei = l.replace(/^IMEI:\s*/, '');
      isDevice = true;
    } else if (l.startsWith('Gabinete:')) {
      specsFallback.caseType = l.replace(/^Gabinete:\s*/, '');
      isDevice = true;
    } else if (l.startsWith('Roda:')) {
      specsFallback.runsGames = l.replace(/^Roda:\s*/, '');
      isDevice = true;
    }
  }

  if (isDevice) {
    return {
      humanNotes: notesText,
      specs: {
        type: 'computador',
        condition: 'Seminovo / Revisado',
        ...specsFallback,
      } as DeviceSpecs,
    };
  }

  return { humanNotes: notesText, specs: null };
}

export function isDeviceItem(category?: string | null, notes?: string | null): boolean {
  if (category) {
    const c = category.toLowerCase();
    if (
      c.includes('notebook') ||
      c.includes('computador') ||
      c.includes('pc ') ||
      c.includes('celular') ||
      c.includes('smartphone') ||
      c.includes('showroom')
    ) {
      return true;
    }
  }
  if (notes && (notes.includes(SPECS_TAG_START) || notes.includes('CPU:') || notes.includes('IMEI:'))) {
    return true;
  }
  return false;
}

export function getDeviceType(category?: string | null, notes?: string | null): DeviceType | null {
  if (notes) {
    const { specs } = parseDeviceNotes(notes);
    if (specs?.type) return specs.type;
  }
  if (category) {
    const c = category.toLowerCase();
    if (c.includes('celular') || c.includes('smartphone') || c.includes('iphone')) return 'celular';
    if (c.includes('notebook') || c.includes('laptop') || c.includes('macbook')) return 'notebook';
    if (c.includes('computador') || c.includes('pc') || c.includes('desktop') || c.includes('gamer'))
      return 'computador';
  }
  return null;
}
