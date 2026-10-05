import { describe, it, expect } from 'vitest';
import {
  generateDeviceSku,
  formatDeviceTitle,
  calculateInstallment,
  encodeDeviceNotes,
  parseDeviceNotes,
  isDeviceItem,
  getDeviceType,
  DeviceSpecs,
} from '@/app/admin/lib/deviceSpecs';

describe('Módulo de Cadastro de Aparelhos (Notebooks, Computadores e Celulares)', () => {
  it('Gera SKUs padronizados com os prefixos corretos para cada categoria', () => {
    const notSku = generateDeviceSku('notebook');
    expect(notSku).toMatch(/^CY-NOT-\d{5}$/);

    const pcSku = generateDeviceSku('computador');
    expect(pcSku).toMatch(/^CY-PC-\d{5}$/);

    const celSku = generateDeviceSku('celular');
    expect(celSku).toMatch(/^CY-CEL-\d{5}$/);
  });

  it('Formata títulos limpos e informativos automaticamente', () => {
    const notTitle = formatDeviceTitle('notebook', 'Lenovo', 'ThinkPad T480', {
      cpu: 'Intel Core i5-8250U 3.4GHz',
      ram: '16GB DDR4',
      storage: '512GB SSD NVMe',
    });
    expect(notTitle).toBe('Lenovo ThinkPad T480 - Intel Core i5-8250U 3.4GHz / 16GB DDR4 / 512GB SSD NVMe');

    const celTitle = formatDeviceTitle('celular', 'Apple', 'iPhone 13', {
      storage: '128GB',
      color: 'Preto',
      batteryHealth: '88%',
    });
    expect(celTitle).toBe('Apple iPhone 13 128GB - Preto - Saúde 88%');

    const pcTitle = formatDeviceTitle('computador', 'Cyber Custom', 'PC Gamer Stealth', {
      cpu: 'Ryzen 5 5600',
      gpu: 'RTX 4060 8GB',
      ram: '16GB',
      storage: '1TB SSD',
    });
    expect(pcTitle).toBe('PC Gamer Stealth (Ryzen 5 5600 / RTX 4060 8GB / 16GB / 1TB SSD)');
  });

  it('Calcula condições de parcelamento no cartão corretamente', () => {
    const res = calculateInstallment(2190);
    expect(res.count).toBe(12);
    expect(res.installmentValue).toBeGreaterThan(0);
    expect(res.text).toContain('12x de R$');
  });

  it('Codifica e decodifica notas estruturadas com integridade total (Roundtrip)', () => {
    const specs: DeviceSpecs = {
      type: 'notebook',
      condition: 'Seminovo Grade A+',
      warranty: '90 Dias Garantia Cyber',
      cpu: 'Intel Core i5-8250U',
      ram: '16GB DDR4',
      storage: '512GB SSD NVMe',
      gpu: 'Intel UHD 620',
      screen: '14" Full HD IPS',
      battery: 'Excelente (Saúde 95%)',
      serialNumber: '8XF9120',
    };

    const encoded = encodeDeviceNotes('Aparelho revisado na bancada.', specs);
    expect(encoded).toContain('--- FICHA TÉCNICA ---');
    expect(encoded).toContain('<!--DEVICE_SPECS:');

    const { humanNotes, specs: parsed } = parseDeviceNotes(encoded);
    expect(humanNotes).toBe('Aparelho revisado na bancada.');
    expect(parsed?.type).toBe('notebook');
    expect(parsed?.cpu).toBe('Intel Core i5-8250U');
    expect(parsed?.ram).toBe('16GB DDR4');
    expect(parsed?.storage).toBe('512GB SSD NVMe');
    expect(parsed?.condition).toBe('Seminovo Grade A+');
  });

  it('Faz fallback inteligente para notas antigas do showroom de computadores', () => {
    const oldNotes = 'Resumo: PC Gamer\nCPU: Ryzen 5 5600\nGPU: RTX 4060 8GB\nRAM: 16GB DDR4\nSSD: 1TB NVMe';
    const { specs } = parseDeviceNotes(oldNotes);
    expect(specs).not.toBeNull();
    expect(specs?.cpu).toBe('Ryzen 5 5600');
    expect(specs?.gpu).toBe('RTX 4060 8GB');
    expect(specs?.ram).toBe('16GB DDR4');
    expect(specs?.storage).toBe('1TB NVMe');
  });

  it('Detecta corretamente se um item é um aparelho pelas categorias e notas', () => {
    expect(isDeviceItem('Notebooks')).toBe(true);
    expect(isDeviceItem('Computadores')).toBe(true);
    expect(isDeviceItem('Celulares / Smartphones')).toBe(true);
    expect(isDeviceItem('PC Pronta-Entrega')).toBe(true);
    expect(isDeviceItem('Cabos')).toBe(false);
    expect(isDeviceItem(null, 'CPU: i5 8th\nGPU: GTX 1650')).toBe(true);

    expect(getDeviceType('Notebooks')).toBe('notebook');
    expect(getDeviceType('Computadores')).toBe('computador');
    expect(getDeviceType('Celulares / Smartphones')).toBe('celular');
    expect(getDeviceType('Cabos')).toBeNull();
  });
});
