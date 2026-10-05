'use client';

import { useState, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import {
  DeviceType,
  DeviceSpecs,
  generateDeviceSku,
  formatDeviceTitle,
  calculateInstallment,
  encodeDeviceNotes,
} from '@/app/admin/lib/deviceSpecs';

function formatBRLInput(v: string): string {
  return v.replace(/\./g, '').replace(',', '.');
}

function parseBRLInput(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(formatBRLInput(v));
  return Number.isFinite(n) ? n : null;
}

export function DeviceRegisterForm() {
  const router = useRouter();
  const [deviceType, setDeviceType] = useState<DeviceType>('notebook');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<{ id: string; name: string; sku: string; price: number } | null>(null);

  // Campos Básicos / Gerais
  const [brand, setBrand] = useState('Lenovo');
  const [model, setModel] = useState('ThinkPad T480');
  const [condition, setCondition] = useState('Seminovo Grade A+');
  const [warranty, setWarranty] = useState('90 Dias Garantia Cyber');
  const [shelfLocation, setShelfLocation] = useState('Vitrine Principal Balcão');
  const [unitCost, setUnitCost] = useState('1200,00');
  const [unitPrice, setUnitPrice] = useState('2190,00');
  const [customTitle, setCustomTitle] = useState('');
  const [autoTitleEnabled, setAutoTitleEnabled] = useState(true);
  const [sku, setSku] = useState(() => generateDeviceSku('notebook'));
  const [ean13, setEan13] = useState('');
  const [initialStock, setInitialStock] = useState('1');
  const [extraNotes, setExtraNotes] = useState('');

  // Specs Notebook
  const [notCpu, setNotCpu] = useState('Intel Core i5-8250U 3.4GHz');
  const [notRam, setNotRam] = useState('16GB DDR4');
  const [notSsd, setNotSsd] = useState('512GB SSD NVMe');
  const [notGpu, setNotGpu] = useState('Intel UHD Graphics 620');
  const [notScreen, setNotScreen] = useState('14" Full HD IPS');
  const [notBattery, setNotBattery] = useState('Excelente (Saúde 92% ~3h)');
  const [notCharger, setNotCharger] = useState('Fonte Original Lenovo USB-C inclusa');
  const [notOs, setNotOs] = useState('Windows 11 Pro Original');
  const [notSerial, setNotSerial] = useState('');

  // Specs Computador
  const [pcCategory, setPcCategory] = useState<'gamer' | 'office' | 'workstation'>('gamer');
  const [pcCpu, setPcCpu] = useState('AMD Ryzen 5 5600 (6-Core / 12-Thread 4.4GHz)');
  const [pcMotherboard, setPcMotherboard] = useState('B550M Aorus Elite');
  const [pcRam, setPcRam] = useState('16GB DDR4 3200MHz Dual-Channel');
  const [pcSsd, setPcSsd] = useState('SSD 1TB NVMe M.2 Gen4');
  const [pcSsd2, setPcSsd2] = useState('');
  const [pcGpu, setPcGpu] = useState('GeForce RTX 4060 8GB GDDR6');
  const [pcPowerSupply, setPcPowerSupply] = useState('Fonte 600W 80 Plus Bronze');
  const [pcCase, setPcCase] = useState('Gabinete Aquário Vidro Temperado + Fans ARGB');
  const [pcOs, setPcOs] = useState('Windows 11 Pro 64-bit');
  const [pcRuns, setPcRuns] = useState('CS2, Valorant, Warzone, GTA V / FiveM, Fortnite');
  const [pcShowroom, setPcShowroom] = useState(true);

  // Specs Celular
  const [celStorage, setCelStorage] = useState('128GB');
  const [celColor, setCelColor] = useState('Preto');
  const [celBatteryHealth, setCelBatteryHealth] = useState('88%');
  const [celImei, setCelImei] = useState('');
  const [celSerial, setCelSerial] = useState('');
  const [celAccessories, setCelAccessories] = useState<string[]>([
    'Cabo Original / Turbo',
    'Fonte Carregadora',
    'Película 3D Aplicada',
  ]);
  const [celScreenCondition, setCelScreenCondition] = useState('Original impecável');

  // Troca de tipo de aparelho e reconfiguração de defaults inteligentes
  function switchDeviceType(t: DeviceType) {
    setDeviceType(t);
    setSku(generateDeviceSku(t));
    if (t === 'notebook') {
      setBrand('Lenovo');
      setModel('ThinkPad T480');
      setCondition('Seminovo Grade A+');
      setShelfLocation('Vitrine Notebooks');
      setUnitCost('1200,00');
      setUnitPrice('2190,00');
    } else if (t === 'computador') {
      setBrand('Cyber Custom');
      setModel('PC Gamer Stealth RTX 4060');
      setCondition('Novo (Montagem Cyber)');
      setShelfLocation('Showroom Térreo');
      setUnitCost('3100,00');
      setUnitPrice('4390,00');
    } else if (t === 'celular') {
      setBrand('Apple');
      setModel('iPhone 13');
      setCondition('Seminovo Grade A+');
      setShelfLocation('Vitrine Celulares / Cofre');
      setUnitCost('1900,00');
      setUnitPrice('2790,00');
    }
  }

  // Prepara objeto consolidado de especificações
  const currentSpecs: DeviceSpecs = {
    type: deviceType,
    condition,
    warranty,
    showInShowroom: deviceType === 'computador' && pcShowroom,
    ...(deviceType === 'notebook'
      ? {
          cpu: notCpu,
          ram: notRam,
          storage: notSsd,
          gpu: notGpu,
          screen: notScreen,
          battery: notBattery,
          charger: notCharger,
          os: notOs,
          serialNumber: notSerial,
        }
      : deviceType === 'computador'
        ? {
            cpu: pcCpu,
            motherboard: pcMotherboard,
            ram: pcRam,
            storage: pcSsd,
            storageSecondary: pcSsd2,
            gpu: pcGpu,
            powerSupply: pcPowerSupply,
            caseType: pcCase,
            os: pcOs,
            runsGames: pcRuns,
          }
        : {
            storage: celStorage,
            color: celColor,
            batteryHealth: celBatteryHealth,
            imei: celImei,
            serialNumber: celSerial,
            accessories: celAccessories,
            screenCondition: celScreenCondition,
          }),
  };

  // Cálculo automático do título do produto
  const computedTitle = formatDeviceTitle(deviceType, brand, model, currentSpecs);
  const activeTitle = autoTitleEnabled ? computedTitle : customTitle;

  // Cálculos financeiros em tempo real
  const priceNum = parseBRLInput(unitPrice) || 0;
  const costNum = parseBRLInput(unitCost) || 0;
  const profit = priceNum - costNum;
  const marginPercent = priceNum > 0 ? ((profit / priceNum) * 100).toFixed(1) : '0';
  const installment = calculateInstallment(priceNum, 12);

  // Acessórios de celular
  function toggleAccessory(acc: string) {
    if (celAccessories.includes(acc)) {
      setCelAccessories(celAccessories.filter((a) => a !== acc));
    } else {
      setCelAccessories([...celAccessories, acc]);
    }
  }

  async function handleSave() {
    if (!activeTitle.trim()) {
      setError('O título do item não pode estar vazio.');
      return;
    }
    if (priceNum <= 0) {
      setError('Preço de venda é obrigatório e deve ser maior que zero.');
      return;
    }

    const eanClean = ean13.trim().replace(/\s/g, '') || null;
    if (eanClean && !/^\d{8,13}$/.test(eanClean)) {
      setError('EAN-13 inválido (deve conter entre 8 e 13 dígitos numéricos).');
      return;
    }

    const categoryName =
      deviceType === 'notebook'
        ? 'Notebooks'
        : deviceType === 'computador'
          ? (pcShowroom ? 'PC Pronta-Entrega' : 'Computadores')
          : 'Celulares / Smartphones';

    const compiledNotes = encodeDeviceNotes(extraNotes, {
      ...currentSpecs,
      installmentInfo: installment.text,
    });

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createCRMBrowserClient();
      const stockQty = parseInt(initialStock, 10) || 1;

      const { data, error: insErr } = await supabase
        .from('stock_items')
        .insert({
          internal_sku: sku.trim() || generateDeviceSku(deviceType),
          ean13: eanClean,
          name: activeTitle.trim(),
          category: categoryName,
          brand: brand.trim() || null,
          model: model.trim() || null,
          shelf_location: shelfLocation.trim() || null,
          unit_cost: costNum > 0 ? costNum : null,
          unit_price: priceNum,
          current_stock: stockQty,
          min_stock: 1,
          notes: compiledNotes,
          active: true,
        })
        .select('id, name, internal_sku, unit_price')
        .single();

      if (insErr) {
        // Trata erro de colisão de SKU gerando outro
        if (insErr.code === '23505' && insErr.message.includes('internal_sku')) {
          setSku(generateDeviceSku(deviceType));
          throw new Error('O SKU gerado coincidiu com outro item existente. Geramos um novo código; clique em salvar novamente.');
        }
        throw insErr;
      }

      setSuccessItem({
        id: data.id,
        name: data.name,
        sku: data.internal_sku || sku,
        price: data.unit_price,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // TELA DE SUCESSO APÓS CADASTRO
  if (successItem) {
    return (
      <div className="border-4 border-zinc-950 bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 border-b-2 border-zinc-950 pb-4">
          <div className="flex h-12 w-12 items-center justify-center bg-emerald-600 text-2xl text-white font-bold">
            ✓
          </div>
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
              Dispositivo cadastrado com sucesso!
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
              {successItem.name}
            </h2>
          </div>
        </div>

        <div className="my-6 grid gap-4 sm:grid-cols-3 font-mono text-xs">
          <div className="border border-zinc-300 bg-zinc-50 p-3">
            <span className="text-zinc-500 block uppercase font-bold text-[10px]">SKU Interno</span>
            <strong className="text-base text-zinc-950">{successItem.sku}</strong>
          </div>
          <div className="border border-zinc-300 bg-zinc-50 p-3">
            <span className="text-zinc-500 block uppercase font-bold text-[10px]">Preço de Venda</span>
            <strong className="text-base text-emerald-700">
              R$ {successItem.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="border border-zinc-300 bg-zinc-50 p-3">
            <span className="text-zinc-500 block uppercase font-bold text-[10px]">Saldo no Estoque</span>
            <strong className="text-base text-zinc-950">{initialStock} un disponível</strong>
          </div>
        </div>

        <p className="font-mono text-xs text-zinc-600 mb-6 bg-zinc-100 p-3 border border-zinc-300">
          O equipamento já está pronto no sistema para venda imediata no PDV, inclusão em Ordem de Serviço ou exibição.
          Imprima agora a etiqueta técnica para colar no aparelho ou colocar no expositor.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/estoque/${successItem.id}/label`}
            target="_blank"
            className="flex-1 text-center bg-zinc-950 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-md"
          >
            🏷️ Imprimir Etiqueta da Máquina (Térmica / Vitrine) →
          </Link>

          <button
            type="button"
            onClick={() => {
              setSuccessItem(null);
              setSku(generateDeviceSku(deviceType));
              setCustomTitle('');
              setAutoTitleEnabled(true);
            }}
            className="border-2 border-zinc-950 bg-white px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
          >
            + Cadastrar Outro Aparelho
          </button>

          <Link
            href={`/admin/estoque/${successItem.id}`}
            className="border border-zinc-400 bg-zinc-100 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-200 transition"
          >
            Ver Item no Estoque
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. SELETOR DE CATEGORIA DO DISPOSITIVO */}
      <div className="grid grid-cols-3 gap-2 border-2 border-zinc-950 bg-zinc-100 p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => switchDeviceType('notebook')}
          className={`flex items-center justify-center gap-2 py-3 px-3 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            deviceType === 'notebook'
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-white text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <span className="text-base">💻</span>
          <span className="hidden sm:inline">Notebook / Laptop</span>
          <span className="sm:hidden">Notebook</span>
        </button>

        <button
          type="button"
          onClick={() => switchDeviceType('computador')}
          className={`flex items-center justify-center gap-2 py-3 px-3 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            deviceType === 'computador'
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-white text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <span className="text-base">🖥️</span>
          <span className="hidden sm:inline">Computador / PC</span>
          <span className="sm:hidden">Desktop PC</span>
        </button>

        <button
          type="button"
          onClick={() => switchDeviceType('celular')}
          className={`flex items-center justify-center gap-2 py-3 px-3 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            deviceType === 'celular'
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-white text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <span className="text-base">📱</span>
          <span className="hidden sm:inline">Celular / Smartphone</span>
          <span className="sm:hidden">Celular</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* COLUNA ESQUERDA: FORMULÁRIO TÉCNICO */}
        <div className="lg:col-span-8 border-2 border-zinc-950 bg-white p-5 sm:p-6 shadow-sm space-y-6">
          
          {/* Identificação Geral */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-2">
              1. Identificação &amp; Estado
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Marca *">
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="form-input"
                  placeholder={deviceType === 'celular' ? 'Apple, Samsung...' : 'Lenovo, Dell, Acer...'}
                />
                {/* Presets rápidos de marca */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {(deviceType === 'notebook'
                    ? ['Dell', 'Lenovo', 'HP', 'Acer', 'Asus', 'Apple']
                    : deviceType === 'computador'
                      ? ['Cyber Custom', 'Dell OptiPlex', 'Lenovo', 'Pichau']
                      : ['Apple', 'Samsung', 'Xiaomi', 'Motorola']
                  ).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className="px-2 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[10px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Modelo / Linha *">
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="form-input"
                  placeholder={
                    deviceType === 'celular'
                      ? 'iPhone 13, Galaxy S23...'
                      : deviceType === 'notebook'
                        ? 'ThinkPad T480, Inspiron 15...'
                        : 'Stealth RTX 4060, Gamer Starter...'
                  }
                />
              </Field>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Condição do Aparelho *">
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="form-input font-bold"
                >
                  <option value="Novo Lacrado">Novo (Lacrado na Caixa)</option>
                  <option value="Novo (Montagem Cyber)">Novo (Montagem Loja / Peças Novas)</option>
                  <option value="Seminovo Grade A+">Seminovo Grade A+ (Impecável sem marcas)</option>
                  <option value="Seminovo Grade A">Seminovo Grade A (Excelente estado)</option>
                  <option value="Seminovo Grade B">Seminovo Grade B (Marcas leves de uso)</option>
                </select>
              </Field>

              <Field label="Garantia Oferecida">
                <select
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="form-input font-bold"
                >
                  <option value="90 Dias Garantia Cyber">✦ 90 Dias Garantia Cyber (Padrão)</option>
                  <option value="6 Meses Garantia Loja">✦ 6 Meses Garantia Loja</option>
                  <option value="1 Ano Garantia Fabricante">✦ 1 Ano Garantia Fabricante</option>
                  <option value="30 Dias">✦ 30 Dias</option>
                </select>
              </Field>
            </div>
          </div>

          {/* 2. ESPECIFICAÇÕES ESPECÍFICAS DE CADA TIPO */}
          {deviceType === 'notebook' && (
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-2">
                2. Ficha Técnica do Notebook
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Processador (CPU) *">
                  <input
                    value={notCpu}
                    onChange={(e) => setNotCpu(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Intel Core i5-8250U 3.4GHz"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['i5-8250U', 'i5-1135G7', 'i7-1165G7', 'Ryzen 5 5500U', 'Apple M1'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNotCpu(c)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Memória RAM *">
                  <input
                    value={notRam}
                    onChange={(e) => setNotRam(e.target.value)}
                    className="form-input"
                    placeholder="Ex: 16GB DDR4 Dual-Channel"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['8GB DDR4', '16GB DDR4', '32GB DDR4', '16GB LPDDR5'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNotRam(r)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Armazenamento (SSD / NVMe) *">
                  <input
                    value={notSsd}
                    onChange={(e) => setNotSsd(e.target.value)}
                    className="form-input"
                    placeholder="Ex: 512GB SSD NVMe M.2"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['256GB SSD', '512GB SSD NVMe', '1TB SSD NVMe', '240GB SATA'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNotSsd(s)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Placa de Vídeo / Gráficos">
                  <input
                    value={notGpu}
                    onChange={(e) => setNotGpu(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Intel UHD 620 ou RTX 3050 4GB"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['Intel UHD 620', 'Intel Iris Xe', 'Radeon Graphics', 'RTX 3050 4GB'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setNotGpu(g)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Tela &amp; Resolução">
                  <input
                    value={notScreen}
                    onChange={(e) => setNotScreen(e.target.value)}
                    className="form-input"
                    placeholder='Ex: 14" Full HD IPS Anti-reflexo'
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['14" Full HD IPS', '15.6" Full HD', '13.3" Retina', '15.6" HD'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNotScreen(t)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Saúde / Autonomia da Bateria">
                  <input
                    value={notBattery}
                    onChange={(e) => setNotBattery(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Excelente (Saúde 95% ~3-4h)"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['Excelente (~3-4h)', 'Bateria Nova 100%', 'Boa (~2h)', 'Uso na tomada'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setNotBattery(b)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Carregador / Fonte">
                  <input
                    value={notCharger}
                    onChange={(e) => setNotCharger(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Fonte Original inclusa"
                  />
                </Field>

                <Field label="Sistema Operacional">
                  <input
                    value={notOs}
                    onChange={(e) => setNotOs(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Windows 11 Pro"
                  />
                </Field>

                <Field label="Serial / Service Tag">
                  <input
                    value={notSerial}
                    onChange={(e) => setNotSerial(e.target.value)}
                    className="form-input font-mono"
                    placeholder="Ex: 8XF9120..."
                  />
                </Field>
              </div>
            </div>
          )}

          {deviceType === 'computador' && (
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                  2. Ficha Técnica do Computador Desktop
                </h3>
                <label className="flex items-center gap-1.5 font-mono text-xs text-zinc-950 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pcShowroom}
                    onChange={(e) => setPcShowroom(e.target.checked)}
                  />
                  Publicar na Vitrine Showroom do Site (#showroom)
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Processador (CPU) *">
                  <input
                    value={pcCpu}
                    onChange={(e) => setPcCpu(e.target.value)}
                    className="form-input"
                    placeholder="Ex: AMD Ryzen 5 5600 6-Core"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['Ryzen 5 5600', 'Ryzen 7 5700X3D', 'Core i5-12400F', 'Core i5-10400', 'Ryzen 5 4600G'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPcCpu(c)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Placa de Vídeo (GPU) *">
                  <input
                    value={pcGpu}
                    onChange={(e) => setPcGpu(e.target.value)}
                    className="form-input"
                    placeholder="Ex: GeForce RTX 4060 8GB"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['RTX 4060 8GB', 'RTX 3060 12GB', 'RX 6600 8GB', 'GTX 1650 4GB', 'Vídeo Integrado Vega 7'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPcGpu(g)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Placa-Mãe">
                  <input
                    value={pcMotherboard}
                    onChange={(e) => setPcMotherboard(e.target.value)}
                    className="form-input"
                    placeholder="Ex: B550M Aorus Elite ou H610M"
                  />
                </Field>

                <Field label="Memória RAM *">
                  <input
                    value={pcRam}
                    onChange={(e) => setPcRam(e.target.value)}
                    className="form-input"
                    placeholder="Ex: 16GB DDR4 3200MHz Dual-Channel"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['16GB DDR4 (2x8GB)', '32GB DDR4 (2x16GB)', '16GB DDR5', '32GB DDR5'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setPcRam(r)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Armazenamento Primário (SSD NVMe) *">
                  <input
                    value={pcSsd}
                    onChange={(e) => setPcSsd(e.target.value)}
                    className="form-input"
                    placeholder="Ex: SSD 1TB NVMe M.2 Gen4"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['SSD 512GB NVMe', 'SSD 1TB NVMe M.2', 'SSD 2TB NVMe', 'SSD 480GB SATA'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPcSsd(s)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Fonte de Alimentação &amp; Gabinete">
                  <input
                    value={`${pcPowerSupply} + ${pcCase}`}
                    onChange={(e) => {
                      const parts = e.target.value.split('+');
                      setPcPowerSupply(parts[0]?.trim() || '');
                      setPcCase(parts[1]?.trim() || '');
                    }}
                    className="form-input"
                    placeholder="Ex: Fonte 600W 80 Plus + Gabinete Aquário"
                  />
                </Field>
              </div>

              <div className="mt-3">
                <Field label="Jogos &amp; Softwares Recomendados">
                  <input
                    value={pcRuns}
                    onChange={(e) => setPcRuns(e.target.value)}
                    className="form-input"
                    placeholder="Ex: CS2, Valorant, GTA V / FiveM, Fortnite, EA FC"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPcRuns('CS2, Valorant, Warzone, GTA V / FiveM, Fortnite, EA FC 24')}
                      className="px-2 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[10px] font-bold text-zinc-800 hover:bg-zinc-200 cursor-pointer"
                    >
                      + Preset Gamer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPcRuns('AutoCAD, Revit, SketchUp, Lumion, Premiere Pro, Render 3D')}
                      className="px-2 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[10px] font-bold text-zinc-800 hover:bg-zinc-200 cursor-pointer"
                    >
                      + Preset Workstation / Edição
                    </button>
                    <button
                      type="button"
                      onClick={() => setPcRuns('Sistemas de Gestão, Pacote Office, Contabilidade, 2 Monitores')}
                      className="px-2 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[10px] font-bold text-zinc-800 hover:bg-zinc-200 cursor-pointer"
                    >
                      + Preset Escritório
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {deviceType === 'celular' && (
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-2">
                2. Ficha Técnica do Celular / Smartphone
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Armazenamento Interno *">
                  <select
                    value={celStorage}
                    onChange={(e) => setCelStorage(e.target.value)}
                    className="form-input font-bold"
                  >
                    <option value="64GB">64 GB</option>
                    <option value="128GB">128 GB</option>
                    <option value="256GB">256 GB</option>
                    <option value="512GB">512 GB</option>
                    <option value="1TB">1 TB</option>
                  </select>
                </Field>

                <Field label="Cor do Aparelho *">
                  <input
                    value={celColor}
                    onChange={(e) => setCelColor(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Preto Espacial, Azul, Branco..."
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['Preto', 'Branco', 'Azul', 'Dourado', 'Grafite', 'Verde'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCelColor(c)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Saúde da Bateria *">
                  <input
                    value={celBatteryHealth}
                    onChange={(e) => setCelBatteryHealth(e.target.value)}
                    className="form-input font-bold text-emerald-700"
                    placeholder="Ex: 88% ou 100%"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['100%', '95%', '90%', '88%', '85%', 'Nova Trocada'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setCelBatteryHealth(b)}
                        className="px-1.5 py-0.5 border border-zinc-300 bg-zinc-50 font-mono text-[9px] text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="IMEI 1 / Serial (Crucial para Procedência/Garantia)">
                  <input
                    value={celImei}
                    onChange={(e) => setCelImei(e.target.value)}
                    className="form-input font-mono"
                    placeholder="Ex: 354892019284712"
                    maxLength={16}
                  />
                </Field>

                <Field label="Estado da Tela / Face ID">
                  <input
                    value={celScreenCondition}
                    onChange={(e) => setCelScreenCondition(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Tela Original sem marcas, Face ID 100% OK"
                  />
                </Field>
              </div>

              <div className="mt-3">
                <span className="block font-mono text-xs font-bold uppercase text-zinc-700 mb-1.5">
                  Acessórios Inclusos no Pacote:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Cabo Original / Turbo',
                    'Fonte Carregadora',
                    'Caixa Original',
                    'Película 3D Aplicada',
                    'Capinha Anti-impacto',
                    'Chave de Gaveta Chip',
                  ].map((acc) => {
                    const checked = celAccessories.includes(acc);
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => toggleAccessory(acc)}
                        className={`px-2.5 py-1 font-mono text-xs font-bold border transition cursor-pointer ${
                          checked
                            ? 'border-zinc-950 bg-zinc-950 text-white'
                            : 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '}
                        {acc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. LOCALIZAÇÃO E ANOTAÇÕES EXTRAS */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-2">
              3. Localização &amp; Observações
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Localização / Expositor">
                <input
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Vitrine Balcão 01, Gaveta 03..."
                />
              </Field>

              <Field label="Quantidade Inicial (Unidades)">
                <input
                  type="number"
                  min="1"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="form-input font-mono font-bold"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Observações Internas (Opcional)">
                <textarea
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  className="form-input"
                  rows={2}
                  placeholder="Ex: Pegamos na troca do cliente Marcos, formatado e higienizado com pasta térmica nova."
                />
              </Field>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: PREÇO, MARGEM E PRÉVIA DO PRODUTO */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card de Precificação & Margem */}
          <div className="border-2 border-zinc-950 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-zinc-950 border-b-2 border-zinc-950 pb-2 flex items-center justify-between">
              <span>Valores &amp; Margem</span>
              <span className="text-[10px] text-zinc-500 font-normal">Cálculo em tempo real</span>
            </h3>

            <Field label="Custo de Compra / Montagem (R$)">
              <input
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="form-input font-mono text-sm"
                placeholder="0,00"
                inputMode="decimal"
              />
            </Field>

            <Field label="Preço à Vista / Pix (R$) *">
              <input
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="form-input font-mono text-base font-black text-emerald-800 bg-emerald-50/50"
                placeholder="0,00"
                inputMode="decimal"
              />
            </Field>

            {/* Quadro de Margem Bruta */}
            <div className="border border-zinc-300 bg-zinc-50 p-3 font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-600">
                <span>Lucro Bruto:</span>
                <span className={`font-black ${profit > 0 ? 'text-emerald-700' : 'text-zinc-950'}`}>
                  R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Margem de Lucro:</span>
                <span className="font-black text-zinc-950">{marginPercent}%</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-zinc-800">
                <span>Condição no Cartão:</span>
                <span className="font-bold text-zinc-950">{installment.text}</span>
              </div>
            </div>

            {/* Código de Identificação / SKU */}
            <div className="border-t border-zinc-200 pt-3 space-y-2">
              <Field label="SKU do Aparelho (Automático)">
                <div className="flex items-center gap-1.5">
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="form-input font-mono font-black tracking-wider text-xs bg-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setSku(generateDeviceSku(deviceType))}
                    title="Gerar outro código"
                    className="px-2 py-1.5 border border-zinc-950 bg-white font-mono text-xs hover:bg-zinc-100 cursor-pointer"
                  >
                    🔄
                  </button>
                </div>
              </Field>

              <Field label="EAN-13 (Código de barras opcional)">
                <input
                  value={ean13}
                  onChange={(e) => setEan13(e.target.value)}
                  className="form-input font-mono text-xs"
                  placeholder="Automático via SKU se vazio"
                  maxLength={13}
                />
              </Field>
            </div>
          </div>

          {/* Card de Prévia do Nome Padronizado */}
          <div className="border-2 border-zinc-950 bg-zinc-950 text-white p-4 shadow-sm font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-bold uppercase tracking-wider text-[10px]">Título Gerado no Sistema:</span>
              <button
                type="button"
                onClick={() => {
                  setAutoTitleEnabled(!autoTitleEnabled);
                  if (autoTitleEnabled) setCustomTitle(computedTitle);
                }}
                className="text-[10px] text-zinc-300 underline hover:text-white cursor-pointer"
              >
                {autoTitleEnabled ? 'Editar Manualmente' : 'Restaurar Automático'}
              </button>
            </div>

            {autoTitleEnabled ? (
              <div className="font-black text-sm text-emerald-400 leading-snug">
                {computedTitle}
              </div>
            ) : (
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 text-white font-bold text-xs"
              />
            )}

            <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span>SKU: <strong className="text-white">{sku}</strong></span>
              <span>Categoria: <strong className="text-white">
                {deviceType === 'notebook' ? 'Notebooks' : deviceType === 'computador' ? 'Computadores' : 'Celulares'}
              </strong></span>
            </div>
          </div>

          {error && (
            <div className="border-2 border-red-600 bg-red-50 p-3 font-mono text-xs font-bold text-red-900">
              [ERRO] {error}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="w-full bg-zinc-950 py-3.5 px-4 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer shadow-md text-center"
            >
              {submitting ? 'Gravando no Estoque…' : '✓ Cadastrar Aparelho & Liberar Etiqueta'}
            </button>

            <Link
              href="/admin/estoque"
              className="text-center border border-zinc-400 bg-white py-2 px-3 font-mono text-xs font-bold uppercase text-zinc-700 hover:bg-zinc-100 transition"
            >
              Cancelar e Voltar
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0px;
          border: 1px solid rgb(161 161 170);
          padding: 0.45rem 0.65rem;
          font-size: 0.8125rem;
          line-height: 1.4;
          color: rgb(9 9 11);
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: rgb(9 9 11);
          box-shadow: 0 0 0 1px rgb(9 9 11);
        }
        .form-input::placeholder {
          color: rgb(161 161 170);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
