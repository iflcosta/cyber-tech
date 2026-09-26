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
  runsTags: string[];
  imageUrl: string | null;
  priceCash: number | null;
  priceInstallment: string | null;
  inStockQty: number;
  fromErp: boolean;
}

function parseErpStockToShowroom(item: any): ShowroomPC {
  const rawNotes = String(item.notes || "");
  const extractField = (key: string, fallback: string) => {
    const regex = new RegExp(`${key}\\s*:\\s*([^\\n|]+)`, "i");
    const match = rawNotes.match(regex);
    return match ? match[1].trim() : fallback;
  };

  const nameLower = `${item.name || ""} ${item.model || ""} ${rawNotes}`.toLowerCase();
  let tier: "gamer" | "workstation" | "office" = "gamer";
  let tierLabel = "PC GAMER PRONTA-ENTREGA";
  let defaultRuns = ["CS2", "Valorant", "Warzone", "GTA V / FiveM", "Fortnite"];

  if (nameLower.includes("office") || nameLower.includes("escrit") || nameLower.includes("estudo")) {
    tier = "office";
    tierLabel = "LINHA OFFICE & ESTUDO";
    defaultRuns = [" Sistemas Comerciais", "Pacote Office", "Contabilidade", "Estudos", "2 Monitores"];
  } else if (nameLower.includes("workstation") || nameLower.includes("render") || nameLower.includes("arquitetura")) {
    tier = "workstation";
    tierLabel = "WORKSTATION & PROJETOS";
    defaultRuns = ["AutoCAD", "Revit", "SketchUp", "Lumion", "Premiere Pro", "Render 3D"];
  }

  const rawRuns = extractField("Roda", "");
  const runsTags = rawRuns
    ? rawRuns.split(/[,·/]/).map((s) => s.trim()).filter(Boolean)
    : defaultRuns;

  const extractedPhoto = extractField("Foto", "");
  const unitPrice = item.unit_price ? Number(item.unit_price) : null;
  const defaultInstallment = unitPrice
    ? `ou em até 12x de ${(unitPrice * 1.12 / 12).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} no cartão`
    : "Consulte condição à vista no PIX ou em até 12x no cartão";

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
    runsTags,
    imageUrl: extractedPhoto || item.image_url || null,
    priceCash: unitPrice,
    priceInstallment: extractField("Parcelamento", defaultInstallment),
    inStockQty: Math.max(1, Number(item.current_stock || 1)),
    fromErp: true,
  };
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_CRM_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: items, error } = await supabase
        .from("stock_items")
        .select("*")
        .eq("active", true)
        .gt("current_stock", 0)
        .or("category.ilike.%PC Pronta-Entrega%,category.ilike.%Showroom%,category.ilike.%Computador Montado%")
        .order("created_at", { ascending: false })
        .limit(9);

      if (!error && items && items.length > 0) {
        const erpPcs = items.map(parseErpStockToShowroom);
        return NextResponse.json({ pcs: erpPcs, source: "erp_live" });
      }
    }
  } catch (err) {
    console.warn("Aviso ao consultar showroom no ERP:", err);
  }

  // Sem mocks: retorna lista vazia caso não haja computadores ativos publicados no ERP
  return NextResponse.json({ pcs: [], source: "erp_empty" });
}
