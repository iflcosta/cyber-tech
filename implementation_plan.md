# Cyber Informática Ecosystem Refactor Plan

This plan outlines the total refactor of the cyberinformatica.tech ecosystem to focus on local conversion in Bragança Paulista.

## User Review Required

> [!IMPORTANT]
> The refactor strictly avoids e-commerce features (cart, checkout) in favor of WhatsApp/Local visits. 
> Existing voucher systems and the `/api/catalog` endpoint will be preserved as requested.

## Proposed Changes

### Visual Foundation & Layout

#### [MODIFY] [globals.css](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/app/globals.css)
- Update CSS variables with the new chrome/metallic palette.
- Implement industrial styling: dark background with noise texture, metallic borders, and subtle glows.
- Define typography tokens for `Rajdhani` (Headings), `DM Sans` (Body), and `JetBrains Mono` (Specs).

#### [MODIFY] [layout.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/app/layout.tsx)
- Load `Rajdhani`, `DM Sans`, and `JetBrains Mono` using `next/font/google`.
- Update metadata and SEO tags.

---

### Phase 1: Conversion Components

#### [MODIFY] [Header.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/components/Header.tsx)
- Add "Store Availability Widget" showing real-time status (Open/Closing/Closed).
- Update navigation to include: Produtos, Manutenção, PC Builder, Calculadora.
- Ensure WhatsApp button is prominent on mobile.

#### [MODIFY] [LeadModal.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/components/LeadModal.tsx)
- Transform into a 2-step intent-based funnel (Repair vs. Buy).
- Implement exit-intent logic (mouseleave) and UTM tracking.
- Persist state in `localStorage` to avoid re-displaying for 24h.

#### [MODIFY] [CyberIA.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/components/CyberIA.tsx)
- Refactor the Gemini Pro 1.5 prompt for technical diagnostic (max 3 questions).
- Integrate dynamic labor prices and stock levels into the prompt.
- Implement automatic intent classification (`compra_imediata`, etc.).

---

### Phase 2: Interactive Tools

#### [MODIFY] [PCBuilder.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/components/PCBuilder.tsx)
- Filter components by real-time stock (`stock > 0`).
- Add compatibility checks and hardware-specific badges.
- Implement "Finish to WhatsApp" feature.

#### [NEW] [manutencao/page.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/app/manutencao/page.tsx)
- SEO-focused landing page for "conserto notebook Bragança Paulista".

#### [NEW] [calculadora/page.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/app/calculadora/page.tsx)
- Tool to help users decide between repairing or buying, using `config.labor_prices`.

---

### Phase 3: Administration

#### [MODIFY] [admin/page.tsx](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/app/admin/page.tsx)
- Implement prioritized lead triage view.
- Add daily summary dashboard showing leads by category and estimated revenue.

---

### Database Migration

#### [MODIFY] [schema.sql](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/schema.sql) (Local reference)
- Add `intent_type` column to `leads` table.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure TypeScript and Next.js integrity.
- Verify Supabase connection and schema updates using a script.

### Manual Verification
1. **Visual Check**: Inspect [globals.css](file:///c:/Users/Iago%20Lopes/.gemini/antigravity/scratch/nexus-tech/src/app/globals.css) application on the Home page.
2. **Lead Funnel**: Trigger `LeadModal` via exit intent and verify the 2-step flow.
3. **Cyber IA**: Test a "notebook won't turn on" diagnostic flow.
4. **PC Builder**: Verify that only in-stock items are selectable.
5. **Calculadora**: Test various inputs to ensure logic correctly identifies "Value for Repair".
6. **Mobile**: Verify Header and WhatsApp Floating button responsiveness.
