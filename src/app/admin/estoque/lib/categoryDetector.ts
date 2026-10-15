import { STOCK_CATEGORY_SUGGESTIONS } from '@/app/admin/types/database';

export const CATEGORY_ICONS: Record<string, string> = {
  'Adaptadores': '🔌',
  'Carregadores': '🔋',
  'Cabos': '🧵',
  'Fontes': '⚡',
  'Notebooks': '💻',
  'Computadores': '🖥️',
  'PC Pronta-Entrega': '🖥️',
  'Celulares / Smartphones': '📱',
  'SSDs': '💾',
  'Memórias': '🧠',
  'HDs': '💽',
  'Acessórios': '🎧',
  'Telas': '📱',
  'Baterias': '🔋',
  'Teclados': '⌨️',
  'Mouses': '🖱️',
  'Coolers': '❄️',
  'Processadores': '🔲',
  'Placas-mãe': '🎛️',
  'Placas de vídeo': '🎮',
  'Gabinetes': '📦',
};

/**
 * Analisa o nome/título do produto para deduzir com alta precisão
 * a categoria mais provável quando o item foi cadastrado sem categoria.
 */
export function detectCategoryFromName(name: string): string | null {
  if (!name) return null;
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Adaptadores & Conversores
  if (
    n.includes('adaptador') ||
    n.includes('adapter') ||
    n.includes('conversor') ||
    n.includes('converter') ||
    n.includes('hdmi para vga') ||
    n.includes('displayport para') ||
    n.includes('usb para') ||
    n.includes('leitor de cartao') ||
    n.includes('card reader')
  ) {
    return 'Adaptadores';
  }

  // 2. Carregadores & Fontes de celular/notebook
  if (
    n.includes('carregador') ||
    n.includes('charger') ||
    n.includes('fast charge') ||
    n.includes('power bank') ||
    n.includes('turbo power') ||
    n.includes('carregamento') ||
    n.includes('tomada usb')
  ) {
    return 'Carregadores';
  }

  // 3. Cabos
  if (
    n.includes('cabo') ||
    n.includes('cable') ||
    n.includes('lightning') ||
    n.includes('type c') ||
    n.includes('tipo c') ||
    n.includes('patch cord') ||
    n.includes('rj45') ||
    n.includes('p2') ||
    n.includes('auxiliar') ||
    n.includes('extensao usb')
  ) {
    return 'Cabos';
  }

  // 4. Fontes (Desktop / Notebook / Alimentação)
  if (
    n.includes('fonte') ||
    n.includes('power supply') ||
    n.includes('fonte atx') ||
    n.includes('fonte real') ||
    n.includes('fonte 500w') ||
    n.includes('fonte 600w') ||
    n.includes('fonte 400w') ||
    n.includes('fonte magsafe')
  ) {
    return 'Fontes';
  }

  // 5. SSDs
  if (
    n.includes('ssd') ||
    n.includes('nvme') ||
    n.includes('m.2') ||
    n.includes('pcie') ||
    n.includes('kingston a400') ||
    n.includes('wd green') ||
    n.includes('solid state')
  ) {
    return 'SSDs';
  }

  // 6. Memórias RAM
  if (
    n.includes('memoria') ||
    n.includes('ram') ||
    n.includes('ddr3') ||
    n.includes('ddr4') ||
    n.includes('ddr5') ||
    n.includes('dimm') ||
    n.includes('sodimm') ||
    n.includes('fury')
  ) {
    return 'Memórias';
  }

  // 7. HDs
  if (
    n.includes('hd ') ||
    n.includes('hdd') ||
    n.includes('hard disk') ||
    n.includes('disco rigido') ||
    n.includes('barracuda')
  ) {
    return 'HDs';
  }

  // 8. Notebooks
  if (
    n.includes('notebook') ||
    n.includes('laptop') ||
    n.includes('thinkpad') ||
    n.includes('macbook') ||
    n.includes('ultrabook') ||
    n.includes('chromebook') ||
    n.includes('ideapad') ||
    n.includes('dell inspiron')
  ) {
    return 'Notebooks';
  }

  // 9. Computadores & Desktops
  if (
    n.includes('computador') ||
    n.includes('desktop') ||
    n.includes('pc gamer') ||
    n.includes('pc completo') ||
    n.includes('cpu ') ||
    n.includes('all in one')
  ) {
    return 'Computadores';
  }

  // 10. Celulares / Smartphones
  if (
    n.includes('iphone') ||
    n.includes('celular') ||
    n.includes('smartphone') ||
    n.includes('samsung galaxy') ||
    n.includes('xiaomi') ||
    n.includes('redmi') ||
    n.includes('motorola moto')
  ) {
    return 'Celulares / Smartphones';
  }

  // 11. Teclados
  if (n.includes('teclado') || n.includes('keyboard')) {
    return 'Teclados';
  }

  // 12. Mouses
  if (n.includes('mouse') || n.includes('mousepad')) {
    return 'Mouses';
  }

  // 13. Baterias
  if (n.includes('bateria') || n.includes('battery')) {
    return 'Baterias';
  }

  // 14. Telas & Displays
  if (n.includes('tela ') || n.includes('display') || n.includes('touch screen') || n.includes('frontal')) {
    return 'Telas';
  }

  // 15. Coolers & Refrigeração
  if (n.includes('cooler') || n.includes('fan ') || n.includes('ventoinha') || n.includes('pasta termica') || n.includes('water cooler')) {
    return 'Coolers';
  }

  // 16. Placas de Vídeo
  if (n.includes('placa de video') || n.includes('geforce') || n.includes('gtx') || n.includes('rtx') || n.includes('radeon') || n.includes('rx 580') || n.includes('rx 550')) {
    return 'Placas de vídeo';
  }

  // 17. Placas-Mãe
  if (n.includes('placa-mae') || n.includes('placa mae') || n.includes('motherboard') || n.includes('b450') || n.includes('b550') || n.includes('h61') || n.includes('h81') || n.includes('h310') || n.includes('h510')) {
    return 'Placas-mãe';
  }

  // 18. Processadores
  if (n.includes('processador') || n.includes('intel core') || n.includes('ryzen 3') || n.includes('ryzen 5') || n.includes('ryzen 7') || n.includes('xeon')) {
    return 'Processadores';
  }

  // 19. Gabinetes
  if (n.includes('gabinete') || n.includes('case gamer')) {
    return 'Gabinetes';
  }

  // 20. Acessórios genéricos (fones, suportes, capas, etc.)
  if (n.includes('fone') || n.includes('headset') || n.includes('suporte') || n.includes('capa') || n.includes('pelicula') || n.includes('caixa de som')) {
    return 'Acessórios';
  }

  return null;
}
