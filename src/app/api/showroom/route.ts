import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export interface ShowroomPC {
  id: string;
  sku: string;
  tier: "gamer" | "workstation" | "office";
  tierLabel: string;
  badge: string;
  name: string;
  subtitle: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  psuCase: string;
  priceCash: number | null;
  priceInstallment: string | null;
  inStockQty: number;
  fromErp: boolean;
}

const DEFAULT_SHOWROOM_PCS: ShowroomPC[] = [
  {
    id: "shw-office-nvme",
    sku: "CYB-SHW-01",
    tier: "office",
    tierLabel: "LINHA OFFICE & ESTUDO",
    badge: "PRONTA-ENTREGA",
    name: "Cyber Office Pro NVMe",
    subtitle: "Inicialização em 8 segundos para escritórios, clínicas, comércio e estudos.",
    cpu: "AMD Ryzen 5 4600G / 5600G (6 Núcleos / 12 Threads)",
    gpu: "Radeon Vega Graphics Integrada (Suporte a 2 Monitores HDMI/DP)",
    ram: "16GB DDR4 3200MHz Dual-Channel",
    storage: "SSD 480GB / 500GB NVMe M.2 Alta Velocidade",
    psuCase: "Fonte Real Certificada + Gabinete Compacto Preto Fosco",
    priceCash: null,
    priceInstallment: "Consulte condição à vista no Pix ou em até 12x no cartão",
    inStockQty: 2,
    fromErp: false,
  },
  {
    id: "shw-gamer-fhd",
    sku: "CYB-SHW-02",
    tier: "gamer",
    tierLabel: "GAMER FULL HD & COMPETITIVO",
    badge: "MONTADO NO SHOWROOM",
    name: "Cyber Stealth RTX 4060",
    subtitle: "Alto FPS em CS2, Valorant, Warzone, GTA V, Fortnite e lançamentos em 1080p Ultra.",
    cpu: "AMD Ryzen 5 5600 ou Intel Core i5-12400F (6 Núcleos / 12 Threads)",
    gpu: "NVIDIA GeForce RTX 4060 8GB GDDR6 (DLSS 3 + Ray Tracing)",
    ram: "16GB ou 32GB DDR4 3200MHz Dual-Channel",
    storage: "SSD 1TB NVMe M.2 PCIe Gen4",
    psuCase: "Fonte 600W 80 Plus + Gabinete Aquário Vidro Temperado",
    priceCash: null,
    priceInstallment: "Alteramos RAM, SSD ou Gabinete na hora no balcão",
    inStockQty: 1,
    fromErp: false,
  },
  {
    id: "shw-workstation-ultra",
    sku: "CYB-SHW-03",
    tier: "workstation",
    tierLabel: "WORKSTATION & GAMER QUAD HD",
    badge: "ALTA PERFORMANCE",
    name: "Cyber Workstation & Render",
    subtitle: "Projetada para AutoCAD, Revit, SketchUp, V-Ray, Premiere Pro e jogos em 1440p/4K.",
    cpu: "AMD Ryzen 7 5700X / 7700 ou Intel Core i7 (8+ Núcleos)",
    gpu: "NVIDIA GeForce RTX 4060 Ti / RTX 4070 Super",
    ram: "32GB DDR4/DDR5 Dual-Channel Alta Frequência",
    storage: "SSD 1TB NVMe Gen4 (Leitura até 7000 MB/s)",
    psuCase: "Fonte 650W/750W 80 Plus + Water Cooler 240mm",
    priceCash: null,
    priceInstallment: "Montagem limpa com teste de estresse térmico completo",
    inStockQty: 1,
    fromErp: false,
  },
];

function parseErpStockToShowroom(item: any): ShowroomPC {
  const rawNotes = String(item.notes || "");
  const extractField = (key: string, fallback: string) => {
    const regex = new RegExp(`${key}\\s*:\\s*([^\\n|]+)`, "i");
    const match = rawNotes.match(regex);
    return match ? match[1].trim() : fallback;
  };

  const nameLower = `${item.name || ""} ${item.model || ""} ${rawNotes}`.toLowerCase();
  let tier: "gamer" | "workstation" | "office" = "gamer";
  let tierLabel = "COMPUTADOR PRONTA-ENTREGA";

  if (nameLower.includes("office") || nameLower.includes("escrit") || nameLower.includes("estudo")) {
    tier = "office";
    tierLabel = "LINHA OFFICE & ESTUDO";
  } else if (nameLower.includes("workstation") || nameLower.includes("render") || nameLower.includes("arquitetura")) {
    tier = "workstation";
    tierLabel = "WORKSTATION & PROJETOS";
  } else {
    tier = "gamer";
    tierLabel = "PC GAMER PRONTA-ENTREGA";
  }

  return {
    id: item.id,
    sku: item.internal_sku || "CYB-PC",
    tier,
    tierLabel,
    badge: item.current_stock > 0 ? "DISPONÍVEL NA BANCADA" : "SOB ENCOMENDA",
    name: item.name,
    subtitle: extractField("Resumo", item.model || "Máquina montada, testada e pronta para retirada na loja física."),
    cpu: extractField("CPU", extractField("Processador", item.brand || "Processador AMD Ryzen / Intel Core")),
    gpu: extractField("GPU", extractField("Placa de Vídeo", "Consulte configuração gráfica")),
    ram: extractField("RAM", extractField("Memória", "16GB / 32GB Dual-Channel")),
    storage: extractField("SSD", extractField("Armazenamento", "SSD NVMe M.2 Alta Velocidade")),
    psuCase: extractField("Gabinete", extractField("Fonte", "Fonte 80 Plus Certificada + Gabinete Ventilado")),
    priceCash: item.unit_price ? Number(item.unit_price) : null,
    priceInstallment: "Disponível para testar na hora na loja · Garantia CDC 90 dias",
    inStockQty: Math.max(1, Number(item.current_stock || 1)),
    fromErp: true,
  };
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_CRM_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY;

    if (url && key) {
      const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: items, error } = await supabase
        .from("stock_items")
        .select("*")
        .eq("active", true)
        .or("category.ilike.%PC Pronta-Entrega%,category.ilike.%Showroom%,category.ilike.%Computador Montado%")
        .order("created_at", { ascending: false })
        .limit(9);

      if (!error && items && items.length > 0) {
        const erpPcs = items.map(parseErpStockToShowroom);
        // Se tiver menos de 3 cadastrados no ERP, complementa com as referências de vitrine
        const combined =
          erpPcs.length >= 3
            ? erpPcs
            : [...erpPcs, ...DEFAULT_SHOWROOM_PCS.slice(0, 3 - erpPcs.length)];
        return NextResponse.json({ pcs: combined, source: "erp_live" });
      }
    }
  } catch (err) {
    console.warn("Aviso ao consultar showroom no ERP:", err);
  }

  return NextResponse.json({ pcs: DEFAULT_SHOWROOM_PCS, source: "curated_default" });
}
