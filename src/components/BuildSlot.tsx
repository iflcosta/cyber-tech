import * as React from "react";
import { Plus, Check, ChevronDown, X } from "lucide-react";
import { Card } from "./ui/Card";
import { cn } from "./ui/Button";

interface BuildSlotProps {
  label: string;
  icon: React.ReactNãode;
  selected?: any;
  onSelect: () => void;
  onClear: () => void;
}

export function BuildSlot({ label, icon, selected, onSelect, onClear }: BuildSlotProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-[#888888] flex items-center gap-2">
          {icon}
          {label}
        </label>
        {selected && (
          <button onClick={onClear} className="text-[#AAAAAA] hover:text-red-600 transition-colors">
            <X size={12} />
          </button>
        )}
      </div>

      <Card 
        onClick={onSelect}
        className={cn(
          "relative group cursor-pointer border border-[#D4D2CF] hover:border-[#1A1A1A] transition-all min-h-[80px] flex flex-col justify-center px-6 py-4",
          selected ? "bg-white border-[#1A1A1A]" : "bg-white/50 border-dashed"
        )}
      >
        {!selected ? (
          <div className="flex items-center justify-between text-[#AAAAAA] group-hover:text-[#1A1A1A] transition-colors">
            <span className="text-[10px] font-display font-bold uppercase tracking-[0.15em]">Selecionar {label}</span>
            <Plus className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              <h4 className="font-display font-bold uppercase tracking-tight text-[#1A1A1A] leading-tight truncate">
                {selected.model}
              </h4>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-xs font-bold text-[#1A1A1A]">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selected.price)}
                </span>
                <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                  <Check size={8} /> OK
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#888888]" />
          </div>
        )}
      </Card>
    </div>
  );
}
