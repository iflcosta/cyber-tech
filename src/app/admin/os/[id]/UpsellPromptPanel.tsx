'use client';

interface UpsellPromptPanelProps {
  defect: string;
  equipmentType: string;
  status: string;
}

function getUpsellSuggestions(defect: string, type: string): string[] {
  const d = defect.toLowerCase();
  const t = type.toLowerCase();
  const suggestions: string[] = [];

  if (/format|windows|sistema|backup/.test(d)) {
    suggestions.push('💿 Oferecer upgrade SSD NVMe (HD→SSD) — R$ 180~350 instalado');
    suggestions.push('☁️ Backup em HD Externo ou Pen Drive de qualidade');
  }
  if (/tela|vidro|display|oca|laminação/.test(d) || /smartphone|celular|iphone/.test(t)) {
    suggestions.push('🛡️ Película protetora premium — R$ 25~45');
    suggestions.push('📦 Capa protetora militarizada');
  }
  if (/limpeza|pasta|térmica|superaquecendo|calor|fan/.test(d)) {
    suggestions.push('❄️ Cooler de alta performance — R$ 45~120');
    suggestions.push('🖥️ Suporte de notebook com elevação (airflow)');
  }
  if (/carregador|fonte|cabo|alimentação/.test(d)) {
    suggestions.push('⚡ Cabo de Força Blindado NBR 14136 certificado — R$ 25');
    suggestions.push('🔌 Adaptador / extensão certificado');
  }
  if (/gpu|placa de vídeo|bga|reballing/.test(d)) {
    suggestions.push('🖥️ Cabo DisplayPort 1.4 / HDMI 2.1 certificado — R$ 45~80');
    suggestions.push('🌡️ Pasta térmica Kingpin/Thermal Grizzly premium');
  }
  if (/notebook/.test(t) || /notebook/.test(d)) {
    suggestions.push('⚡ Carregador GaN 65W compacto USB-C — R$ 89~149');
    suggestions.push('🖱️ Mouse sem fio ergonômico para trabalho');
  }

  // Sugestão universal
  suggestions.push('🔧 Manutenção Preventiva agendada em 3~6 meses');

  return suggestions.slice(0, 4); // máx 4 sugestões por vez
}

export default function UpsellPromptPanel({ defect, equipmentType, status }: UpsellPromptPanelProps) {
  if (!['ready', 'delivered'].includes(status)) return null;

  const suggestions = getUpsellSuggestions(defect, equipmentType);
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-amber-50 border border-amber-200">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 font-mono">
        💰 Script de Upsell na Entrega
      </h3>
      <p className="text-[11px] text-amber-700 mb-3">
        Ofereça ao cliente na retirada — aumente o ticket médio:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <span
            key={i}
            className="text-xs bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-1.5 font-medium"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}