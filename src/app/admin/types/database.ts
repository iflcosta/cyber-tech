/**
 * Tipos TypeScript inferidos do schema do Supabase.
 *
 * Manter sincronizado com /supabase/migrations/0001_init.sql.
 *
 * Apos rodar a migration, o ideal e gerar este arquivo via:
 *   npx supabase gen types typescript --project-id avfcsuyackxiaglldyvo \
 *     > admin/types/database.ts
 *
 * Por enquanto, escrevemos manualmente para nao depender do CLI.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'owner' | 'technician';
          active: boolean;
          can_delete: boolean;
          commission_rate: number;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: 'owner' | 'technician';
          active?: boolean;
          can_delete?: boolean;
          commission_rate?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          phone_search: string;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      service_orders: {
        Row: {
          id: string;
          os_number: string | null;
          short_id: string;
          customer_id: string;
          equipment_type: 'computador' | 'notebook' | 'celular' | 'tablet' | 'outro';
          equipment_brand: string | null;
          equipment_model: string | null;
          equipment_color: string | null;
          equipment_serial: string | null;
          equipment_password: string | null;
          reported_defect: string;
          entry_checklist: Record<string, boolean | string>;
          accessories_in: string | null;
          equipment_photos: string[];
          status:
            | 'awaiting_approval'
            | 'approved'
            | 'in_progress'
            | 'waiting_part'
            | 'ready'
            | 'delivered'
            | 'cancelled';
          blocking_reason: string | null;
          estimated_value: number | null;
          labor_cost: number | null;
          technician_id: string | null;
          estimated_ready_at: string | null;
          payment_status: 'pending' | 'partial' | 'paid';
          payment_method: 'cash' | 'pix' | 'card' | 'transfer' | 'other' | null;
          paid_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          os_number?: string | null;
          short_id?: string;
          customer_id: string;
          equipment_type:
            | 'computador'
            | 'notebook'
            | 'celular'
            | 'tablet'
            | 'outro';
          equipment_brand?: string | null;
          equipment_model?: string | null;
          equipment_color?: string | null;
          equipment_serial?: string | null;
          equipment_password?: string | null;
          reported_defect: string;
          entry_checklist?: Record<string, boolean | string>;
          accessories_in?: string | null;
          equipment_photos?: string[];
          status?:
            | 'awaiting_approval'
            | 'approved'
            | 'in_progress'
            | 'waiting_part'
            | 'ready'
            | 'delivered'
            | 'cancelled';
          blocking_reason?: string | null;
          estimated_value?: number | null;
          labor_cost?: number | null;
          technician_id?: string | null;
          estimated_ready_at?: string | null;
          payment_status?: 'pending' | 'partial' | 'paid';
          payment_method?: 'cash' | 'pix' | 'card' | 'transfer' | 'other' | null;
          paid_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          delivered_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['service_orders']['Insert']>;
      };
      service_order_events: {
        Row: {
          id: string;
          service_order_id: string;
          event_type:
            | 'created'
            | 'status_changed'
            | 'assigned'
            | 'note_added'
            | 'checklist_updated'
            | 'part_resolved'
            | 'delivered';
          from_value: string | null;
          to_value: string | null;
          note: string | null;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_order_id: string;
          event_type:
            | 'created'
            | 'status_changed'
            | 'assigned'
            | 'note_added'
            | 'checklist_updated'
            | 'part_resolved'
            | 'delivered';
          from_value?: string | null;
          to_value?: string | null;
          note?: string | null;
          author_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_order_events']['Insert']>;
      };
      service_order_payments: {
        Row: {
          id: string;
          service_order_id: string;
          amount: number;
          payment_method: 'cash' | 'pix' | 'card' | 'transfer' | 'other';
          notes: string | null;
          author_id: string;
          paid_at: string;
        };
        Insert: {
          id?: string;
          service_order_id: string;
          amount: number;
          payment_method: 'cash' | 'pix' | 'card' | 'transfer' | 'other';
          notes?: string | null;
          author_id: string;
          paid_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_order_payments']['Insert']>;
      };
      stock_items: {
        Row: {
          id: string;
          ean13: string | null;
          name: string;
          category: string | null;
          brand: string | null;
          model: string | null;
          unit_cost: number | null;
          unit_price: number;
          current_stock: number;
          min_stock: number;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ean13?: string | null;
          name: string;
          category?: string | null;
          brand?: string | null;
          model?: string | null;
          unit_cost?: number | null;
          unit_price: number;
          current_stock?: number;
          min_stock?: number;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stock_items']['Insert']>;
      };
      stock_movements: {
        Row: {
          id: string;
          stock_item_id: string;
          movement_type: 'in' | 'out' | 'adjust' | 'sale';
          quantity: number;
          unit_price: number | null;
          total_amount: number | null;
          reference: string | null;
          service_order_id: string | null;
          notes: string | null;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          stock_item_id: string;
          movement_type: 'in' | 'out' | 'adjust' | 'sale';
          quantity: number;
          unit_price?: number | null;
          total_amount?: number | null;
          reference?: string | null;
          service_order_id?: string | null;
          notes?: string | null;
          author_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          sale_number: string;
          subtotal: number;
          discount: number;
          total: number;
          payment_method: 'cash' | 'pix' | 'card' | 'transfer' | 'other';
          customer_name: string | null;
          customer_phone: string | null;
          customer_id: string | null;
          notes: string | null;
          author_id: string;
          created_at: string;
          voided_at: string | null;
          voided_by: string | null;
          voided_reason: string | null;
        };
        Insert: {
          id?: string;
          sale_number?: string;
          subtotal: number;
          discount?: number;
          total: number;
          payment_method: 'cash' | 'pix' | 'card' | 'transfer' | 'other';
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_id?: string | null;
          notes?: string | null;
          author_id: string;
          created_at?: string;
          voided_at?: string | null;
          voided_by?: string | null;
          voided_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          stock_item_id: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          stock_item_id: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>;
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          notes: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          notes?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };
      part_orders: {
        Row: {
          id: string;
          part_description: string;
          part_variant: string | null;
          supplier_id: string;
          part_value: number;
          service_order_id: string | null;
          context_note: string | null;
          status:
            | 'ordered'
            | 'received'
            | 'applied'
            | 'return_pending'
            | 'returned'
            | 'awaiting_exchange'
            | 'cancelled';
          return_reason:
            | 'not_the_issue'
            | 'defective'
            | 'wrong_item'
            | 'customer_cancelled'
            | null;
          requested_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          part_description: string;
          part_variant?: string | null;
          supplier_id: string;
          part_value: number;
          service_order_id?: string | null;
          context_note?: string | null;
          status?:
            | 'ordered'
            | 'received'
            | 'applied'
            | 'return_pending'
            | 'returned'
            | 'awaiting_exchange'
            | 'cancelled';
          return_reason?:
            | 'not_the_issue'
            | 'defective'
            | 'wrong_item'
            | 'customer_cancelled'
            | null;
          requested_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['part_orders']['Insert']>;
      };
      part_order_events: {
        Row: {
          id: string;
          part_order_id: string;
          event_type:
            | 'created'
            | 'received'
            | 'applied'
            | 'return_signaled'
            | 'returned'
            | 'exchange_awaited'
            | 'exchange_received'
            | 'value_adjusted'
            | 'note_added'
            | 'cancelled';
          from_value: string | null;
          to_value: string | null;
          note: string | null;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          part_order_id: string;
          event_type:
            | 'created'
            | 'received'
            | 'applied'
            | 'return_signaled'
            | 'returned'
            | 'exchange_awaited'
            | 'exchange_received'
            | 'value_adjusted'
            | 'note_added'
            | 'cancelled';
          from_value?: string | null;
          to_value?: string | null;
          note?: string | null;
          author_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['part_order_events']['Insert']>;
      };
      commission_ledger: {
        Row: {
          id: string;
          service_order_id: string;
          technician_id: string;
          technician_name: string;
          labor_amount: number;
          commission_rate: number;
          commission_amount: number;
          os_payment_status: string;
          status: 'pending' | 'paid_out';
          payout_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_order_id: string;
          technician_id: string;
          technician_name: string;
          labor_amount?: number;
          commission_rate?: number;
          commission_amount?: number;
          os_payment_status?: string;
          status?: 'pending' | 'paid_out';
          payout_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['commission_ledger']['Insert']>;
      };
    };
    Views: {
      service_orders_with_stale: {
        Row: Database['public']['Tables']['service_orders']['Row'] & {
          customer_name: string;
          customer_phone: string | null;
          technician_name: string | null;
          technician_commission_rate: number | null;
          days_since_update: number;
        };
      };
      stock_low_alert: {
        Row: Database['public']['Tables']['stock_items']['Row'] & {
          units_to_reorder: number;
        };
      };
      part_orders_pending_return: {
        Row: Database['public']['Tables']['part_orders']['Row'] & {
          supplier_name: string;
          days_since_signaled: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/* ---------- Helpers de tipos ---------- */

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type ServiceOrder = Database['public']['Tables']['service_orders']['Row'];
export type ServiceOrderEvent = Database['public']['Tables']['service_order_events']['Row'];
export type ServiceOrderPayment = Database['public']['Tables']['service_order_payments']['Row'];
export type ServiceOrderWithStale = Database['public']['Views']['service_orders_with_stale']['Row'];
export type StockItem = Database['public']['Tables']['stock_items']['Row'];
export type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
export type StockLowAlert = Database['public']['Views']['stock_low_alert']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'];
export type SaleItem = Database['public']['Tables']['sale_items']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type PartOrder = Database['public']['Tables']['part_orders']['Row'];
export type PartOrderEvent = Database['public']['Tables']['part_order_events']['Row'];
export type PartOrderPendingReturn = Database['public']['Views']['part_orders_pending_return']['Row'];

/* ---------- Constantes de UI ---------- */

export const OS_STATUSES = [
  { value: 'awaiting_approval', label: 'Aguardando aprovação', color: 'amber' },
  { value: 'approved', label: 'Aprovado', color: 'blue' },
  { value: 'in_progress', label: 'Em bancada', color: 'indigo' },
  { value: 'waiting_part', label: 'Aguardando peça', color: 'orange' },
  { value: 'ready', label: 'Pronto', color: 'emerald' },
  { value: 'delivered', label: 'Entregue', color: 'slate' },
  { value: 'cancelled', label: 'Cancelada', color: 'red' },
] as const;

export type OSStatusValue = (typeof OS_STATUSES)[number]['value'];

// Garantia padrão sobre o reparo executado (dias, a partir da entrega).
export const WARRANTY_DAYS = 90;

// Como o cliente aprovou o orçamento — registrado no evento de
// aprovação (status awaiting_approval -> approved) pra não depender
// de ninguém lembrar depois "combinei por WhatsApp" sem prova nenhuma.
export const APPROVAL_METHODS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefone' },
  { value: 'in_person', label: 'Presencial' },
  { value: 'other', label: 'Outro' },
] as const;

export type ApprovalMethodValue = (typeof APPROVAL_METHODS)[number]['value'];

export const EQUIPMENT_TYPES = [
  { value: 'computador', label: 'Computador' },
  { value: 'notebook', label: 'Notebook' },
  { value: 'celular', label: 'Celular' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'outro', label: 'Outro' },
] as const;

export type EquipmentTypeValue = (typeof EQUIPMENT_TYPES)[number]['value'];

export const ENTRY_CHECKLIST_FIELDS = [
  { key: 'liga', label: 'Liga' },
  { key: 'tela_ok', label: 'Tela OK' },
  { key: 'carrega', label: 'Carrega' },
  { key: 'carregador', label: 'Acompanha carregador/fonte' },
  { key: 'riscos', label: 'Riscos/avarias no chassi' },
  { key: 'pecas_faltantes', label: 'Peças faltantes/aberto' },
  { key: 'molhou', label: 'Teve contato com líquido' },
  { key: 'queda', label: 'Sofreu queda' },
  { key: 'senha_conhecida', label: 'Senha conhecida' },
] as const;

export const STOCK_MOVEMENT_TYPES = [
  { value: 'in', label: 'Entrada (compra)', color: 'emerald' },
  { value: 'out', label: 'Saída (uso)', color: 'orange' },
  { value: 'adjust', label: 'Ajuste', color: 'slate' },
  { value: 'sale', label: 'Venda', color: 'blue' },
] as const;

export type StockMovementTypeValue = (typeof STOCK_MOVEMENT_TYPES)[number]['value'];

export const STOCK_CATEGORY_SUGGESTIONS = [
  'Cabos',
  'Fontes',
  'Memórias',
  'SSDs',
  'HDs',
  'Acessórios',
  'Telas',
  'Baterias',
  'Teclados',
  'Mouses',
  'Adaptadores',
  'Carregadores',
  'Processadores',
  'Placas-mãe',
  'Placas de vídeo',
  'Gabinetes',
  'Coolers',
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'card', label: 'Cartão' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'other', label: 'Outro' },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]['value'];

/* ---------- Pedido de Peça (fornecedores) ---------- */

export const PART_ORDER_STATUSES = [
  { value: 'ordered', label: 'Pedido', color: 'blue' },
  { value: 'received', label: 'Recebido', color: 'indigo' },
  { value: 'applied', label: 'Aplicado na OS', color: 'emerald' },
  { value: 'return_pending', label: 'Devolução sinalizada', color: 'orange' },
  { value: 'awaiting_exchange', label: 'Aguardando troca', color: 'amber' },
  { value: 'returned', label: 'Devolvido', color: 'slate' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' },
] as const;

export type PartOrderStatusValue = (typeof PART_ORDER_STATUSES)[number]['value'];

export const RETURN_REASONS = [
  { value: 'not_the_issue', label: 'Não era o problema' },
  { value: 'defective', label: 'Veio com defeito' },
  { value: 'wrong_item', label: 'Peça errada' },
  { value: 'customer_cancelled', label: 'Cliente desistiu' },
] as const;

export type ReturnReasonValue = (typeof RETURN_REASONS)[number]['value'];

// Motivos que dão direito a troca (fornecedor repõe) — os outros são
// devolução definitiva, sem reposição.
export const EXCHANGE_ELIGIBLE_REASONS: ReturnReasonValue[] = ['defective', 'wrong_item'];

// Variação de peça = dois eixos independentes que se combinam (ex:
// "Com aro" + "OLED"), não uma lista única — uma tela pode ser
// com/sem aro E ao mesmo tempo original/OLED/incell.
export const PART_FRAME_OPTIONS = ['Com aro', 'Sem aro'] as const;

export const PART_FINISH_OPTIONS = [
  'Original',
  'OLED',
  'Incell',
  'Compatível',
  'Original recondicionada',
] as const;

// Dias sem confirmar devolução até o item virar alerta na lista
// (risco de ficar esquecido na bancada).
export const PART_ORDER_STALE_DAYS = 5;
