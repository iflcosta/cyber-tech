"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "./ui/Badge";
import { cn } from "./ui/Button";

const categories = [
  { id: "all", label: "TUDO" },
  { id: "workstation_ai", label: "WORKSTATION IA" },
  { id: "gamer", label: "GAMER" },
  { id: "office", label: "OFFICE" },
];

export function FilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get("category") || "all";

  const handleFilter = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("category");
    } else {
      params.set("category", id);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-4 p-4 bg-[#F8F7F5] border border-[#D4D2CF] rounded-[2px] mb-8">
      <span className="text-[10px] font-display font-bold text-[#888888] uppercase tracking-[0.2em] mr-2">
        Filtrar por:
      </span>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleFilter(cat.id)}
          className={cn(
            "px-4 py-1.5 rounded-[2px] text-[10px] font-display font-bold uppercase tracking-[0.15em] transition-all duration-130",
            currentCategory === cat.id
              ? "bg-[#1A1A1A] text-white"
              : "bg-white text-[#555555] border border-[#ECEAE6] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
