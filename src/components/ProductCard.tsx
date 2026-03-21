import * as React from "react";
import Image from "next/image";
import { MessageSquare, Cpu, Zap, Package } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { PerformanceBadge } from "./PerformanceBadge";
import { brand } from "@/lib/brand";

export interface Product {
  id: string;
  name: string;
  category: "workstation_ai" | "gamer" | "office";
  specs: {
    cpu: string;
    gpu?: string;
    ram: string;
    storage: string;
    [key: string]: any;
  };
  price: number;
  price_estimate: number;
  performance_score: number;
  in_stock: boolean;
  image_urls?: string[];
  image_url?: string;
}

interface ProductCardProps {
  product: Product;
  onOpenGallery?: (images: string[]) => void;
  onInterest?: () => void;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onOpenGallery, onInterest, onAddToCart }: ProductCardProps) {
  return (
    <Card className="group flex flex-col h-full card-industrial border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-primary)]">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-elevated)]">
            <Package className="h-10 w-10 text-[var(--border-active)]" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge variant={product.in_stock ? "success" : "destructive"} className="rounded-[2px] font-display text-[8px] tracking-widest">
            {product.in_stock ? "EM ESTOQUE" : "ESGOTADO"}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4">
          <PerformanceBadge score={product.performance_score} />
        </div>
      </div>

      <CardContent className="flex-1 p-6">
        <div 
          className="mb-3 cursor-zoom-in"
          onClick={() => product.image_urls && onOpenGallery?.(product.image_urls)}
        >
          <Badge variant="secondary" className="text-[8px] font-display tracking-widest rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-subtle)]">
            {product.category.replace('_', ' ')}
          </Badge>
        </div>
        <h3 className="text-xl font-display font-bold mb-4 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors tracking-tight leading-tight cursor-pointer uppercase" onClick={onInterest}>
          {product.name}
        </h3>
        
        <div className="space-y-2 mb-8" onClick={onInterest}>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
            <Cpu size={12} className="text-[var(--text-primary)]" />
            <span>{product.specs.cpu}</span>
          </div>
          {product.specs.gpu && (
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
              <Zap size={12} className="text-[var(--text-primary)]" />
              <span>{product.specs.gpu}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
            <span className="text-[var(--text-primary)] font-black">{product.specs.ram} RAM</span> • 
            <span>{product.specs.storage}</span>
          </div>
        </div>

        <div className="text-2xl font-display font-bold tracking-tighter text-[var(--accent-primary)]">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price_estimate)}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm" className="w-full btn-ghost" onClick={onInterest}>
             SIMILAR
        </Button>
        <Button size="sm" className="w-full gap-2 btn-primary" onClick={onInterest}>
             <MessageSquare className="h-3 w-3" />
             ORÇAMENTO
        </Button>
      </CardFooter>
    </Card>
  );
}


