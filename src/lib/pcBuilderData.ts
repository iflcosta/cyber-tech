import { supabase } from './supabase';

export interface PCBuilderOption {
  id: string;
  category: 'cpu' | 'gpu' | 'ram' | 'storage';
  name: string;
  price: number;
  description: string | null;
}

export type BuyerProfile = "Home Office" | "Gamer de Elite" | "Workstation Profissional" | "Entusiasta";

export const getSimulatorOptions = async (): Promise<PCBuilderOption[]> => {
  const { data, error } = await supabase
    .from('simulator_options')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error("Error fetching simulator options:", error);
    return [];
  }

  return data as PCBuilderOption[];
};

export function calculateProfile(selections: Record<string, PCBuilderOption>): { profile: BuyerProfile; color: string } {
  const cpu = selections.cpu?.name.toLowerCase() || "";
  const gpu = selections.gpu?.name.toLowerCase() || "";
  const ram = selections.ram?.name.toLowerCase() || "";

  // Logic based on names/descriptions since IDs might change in DB
  if (cpu.includes("i9") || cpu.includes("r9") || ram.includes("64gb") || gpu.includes("4080") || gpu.includes("4090")) {
    return { profile: "Workstation Profissional", color: "text-purple-400" };
  }

  if (gpu.includes("4070") || gpu.includes("7800") || (gpu.includes("4060") && ram.includes("32gb"))) {
    return { profile: "Gamer de Elite", color: "text-[var(--accent-primary)]" };
  }

  if (gpu.includes("integrado") || cpu.includes("i3") || cpu.includes("r3")) {
    return { profile: "Home Office", color: "text-blue-400" };
  }

  return { profile: "Entusiasta", color: "text-amber-400" };
}
