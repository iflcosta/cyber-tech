# AGENTS.md — CRM da Cyber Informática

> Modulo `/admin` do site institucional `cyberinformatica.tech`. CRM interno de
> assistencia tecnica para uso de Felipe (dono), Iago (tecnico senior) e Jefferson
> (tecnico de celulares). NAO e o sistema publico de leads / voucher
> (`maintenance_orders`) que esta em producao na raiz do site.

---

## 1. Quem usa

| Usuario | Funcao | Onde fica | Permissao |
| --- | --- | --- | --- |
| Felipe | Dono | Balcao dos fundos (PC) | Ve e edita tudo. Pode criar/excluir OS, gerenciar tecnicos |
| Iago | Tecnico senior (PC/notebook) | Bancada do salao | Ve todas as OS, edita so as atribudas a ele |
| Jefferson | Tecnico (celulares) | Mezanino | Ve todas as OS, edita so as atribudas a ele |

Quando Iago nao esta no balcao, Jefferson (e Felipe) olham o sistema em vez de ligar.

## 2. Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Linguagem**: TypeScript
- **UI**: Tailwind 4, Framer Motion, Lucide React
- **Backend / DB**: Supabase (projeto NOVO, isolado) — `avfcsuyackxiaglldyvo.supabase.co`
- **Auth**: Supabase Auth (e-mail + senha), com "manter logado" (sessao 30 dias)
- **Deploy**: Vercel (mesmo projeto de `cyberinformatica.tech`, rota `/admin/*`)
- **Repositorio**: `iflcosta/cyber-tech` (branch `feat/crm-admin` enquanto em desenvolvimento)
- **Testes**: Vitest (unit) + Playwright (e2e) — herdado do projeto principal

## 3. Principios

1. **Celular e cidadao de primeira classe.** O tecnico usa o celular no
   mezanino com a mao suja de pasta termica. Botoes grandes, sem hover, sem
   tooltip, sem confirmacao com clique duplo.
2. **Cadastro rapido > cadastro bonito.** Em 3 toques: cliente -> aparelho ->
   defeito. Detalhes (checklist, acessorios, senha) podem ser expandidos depois.
3. **Linha do tempo e lei.** Toda mudanca de status, atribuicao, peca
   resolvida vira um evento com timestamp + autor. Ninguem precisa perguntar
   "cade meu notebook" — a resposta esta na timeline.
4. **Dono tem visao, tecnico tem escopo.** Felipe ve tudo (sempre); Iago e
   Jefferson veem tudo tambem, mas so editam OS atribudas a eles. RLS no
   Supabase garante isso no banco, nao no front.
5. **Sem estoque.** Cabo do iPhone 4 que ninguem usa vira texto livre no
   campo "o que falta pra concluir". Nao ha tabela de pecas.
6. **Sem financeiro no MVP.** Comissao, valor, pagamento -> fase 2.

## 4. Estrutura de pastas

```
cyber-tech/                      ← repo raiz (ja existe, NAO MODIFICAR)
├── src/app/                     ← site publico em producao
├── src/components/              ← componentes compartilhados
├── supabase/                    ← schema do projeto publico
└── admin/                       ← ESTE MODULO (novo)
    ├── app/
    │   ├── login/page.tsx       ← tela de login
    │   ├── os/
    │   │   ├── page.tsx         ← lista de OS
    │   │   ├── new/page.tsx     ← cadastro rapido
    │   │   └── [id]/
    │   │       ├── page.tsx     ← detalhe + timeline
    │   │       └── print/page.tsx ← comprovante A4
    │   └── layout.tsx           ← shell do admin (header + nav)
    ├── components/              ← OSList, OSCard, OSTimeline, OSForm, etc.
    ├── lib/
    │   └── supabase/            ← client (browser) + server (cookies)
    └── types/
        └── database.ts          ← tipos inferidos do schema
```

## 5. Banco de dados (Supabase novo)

Migrations em `supabase/migrations/0001_init.sql` (e futuras). Rodar via
**SQL Editor do painel do Supabase** (nao temos CLI rodando). A ordem importa.

### 5.1 Tabelas principais

#### `profiles` (1:1 com `auth.users`)
- `id` uuid PK = `auth.users.id`
- `full_name` text NOT NULL
- `email` text NOT NULL UNIQUE
- `role` text NOT NULL CHECK in ('owner', 'technician')
- `active` boolean DEFAULT true
- `created_at` timestamptz DEFAULT now()

#### `customers` (clientes que aparecem em OS)
- `id` uuid PK
- `name` text NOT NULL
- `phone` text (formato livre, ex: `(11) 99999-9999`)
- `phone_search` text (so digitos, para busca rapida)
- `email` text NULL
- `notes` text NULL
- `created_at` timestamptz DEFAULT now()

#### `service_orders` (a OS em si)
- `id` uuid PK
- `os_number` text NOT NULL UNIQUE (formato `OS-2026-0001`)
- `customer_id` uuid FK -> customers
- `equipment_type` text NOT NULL CHECK in ('computador', 'notebook', 'celular', 'tablet', 'outro')
- `equipment_brand` text NULL
- `equipment_model` text NULL
- `equipment_color` text NULL
- `equipment_serial` text NULL (IMEI / serial number)
- `equipment_password` text NULL (senha, padrao, PIN — criptografar PII em fase 2)
- `reported_defect` text NOT NULL (o que o cliente disse)
- `entry_checklist` jsonb DEFAULT '{}' — ex: `{"liga": true, "tela": false, "carrega": true, "molhou": false}`
- `accessories_in` text NULL (ex: "carregador + capa")
- `status` text NOT NULL DEFAULT 'awaiting_approval' CHECK in (
    'awaiting_approval', 'approved', 'in_progress', 'waiting_part',
    'ready', 'delivered', 'cancelled'
  )
- `assigned_to` uuid NULL FK -> profiles (tecnico responsavel)
- `blocking_reason` text NULL (ex: "cabo iPhone 4" — campo livre, NAO estoque)
- `estimated_value` numeric(10,2) NULL (orcamento — so exibicao, sem financeiro)
- `estimated_ready_at` date NULL (previsao)
- `created_by` uuid NOT NULL FK -> profiles
- `created_at` timestamptz DEFAULT now()
- `updated_at` timestamptz DEFAULT now()
- `delivered_at` timestamptz NULL

Indices:
- `os_number` (UNIQUE ja cria)
- `status` (pra filtro rapido na lista)
- `assigned_to` (pra filtro do tecnico)
- `created_at DESC` (ordem cronologica da lista)
- `equipment_serial` (busca por IMEI)

#### `service_order_events` (linha do tempo)
- `id` uuid PK
- `service_order_id` uuid FK -> service_orders (CASCADE)
- `event_type` text NOT NULL CHECK in (
    'created', 'status_changed', 'assigned', 'note_added',
    'checklist_updated', 'part_resolved', 'delivered'
  )
- `from_value` text NULL (status anterior, tecnico anterior, etc.)
- `to_value` text NULL (status novo, tecnico novo, etc.)
- `note` text NULL (observacao livre)
- `author_id` uuid NOT NULL FK -> profiles
- `created_at` timestamptz DEFAULT now()
- INDEX em (`service_order_id`, `created_at DESC`)

#### View `service_orders_with_stale` (alerta de OS parada)
```sql
CREATE VIEW service_orders_with_stale AS
SELECT
  so.*,
  c.name AS customer_name,
  c.phone AS customer_phone,
  p.full_name AS assigned_to_name,
  EXTRACT(DAY FROM (now() - so.updated_at))::int AS days_since_update
FROM service_orders so
JOIN customers c ON c.id = so.customer_id
LEFT JOIN profiles p ON p.id = so.assigned_to
WHERE so.status NOT IN ('delivered', 'cancelled');
```

Frontend marca:
- `days_since_update >= 3 && < 7` -> badge amarela "X dias parada"
- `days_since_update >= 7` -> badge vermelha "X dias parada"

### 5.2 Triggers

- `trigger_os_number` — BEFORE INSERT em `service_orders`. Se `os_number` for
  NULL, gera `OS-YYYY-NNNN` a partir do ano atual e do proximo sequence.
  Implementacao: sequence `service_order_seq` + funcao.
- `trigger_os_touch` — BEFORE UPDATE em `service_orders` -> atualiza
  `updated_at = now()`. Simples, deixa o front focar no insert de evento.

### 5.3 RLS (Row Level Security)

Todas as tabelas: `ENABLE ROW LEVEL SECURITY`.

**Regra-mae**: usuario logado (`auth.role() = 'authenticated'`) pode:
- `SELECT` em `service_orders`, `customers`, `service_order_events`,
  `profiles` — todos veem tudo.
- `INSERT` em `service_orders`, `customers`, `service_order_events` — todos
  podem criar.
- `UPDATE` em `service_orders` e `service_order_events`:
  - **Owner (Felipe)**: pode tudo, em qualquer OS.
  - **Technician (Iago / Jefferson)**: pode apenas em OS onde
    `assigned_to = auth.uid()`. Excecao: tecnico pode `assigned_to =
    auth.uid()` na hora de pegar a OS pra si.
- `DELETE`:
  - Apenas `role = 'owner'` pode deletar (defesa em profundidade — soft
    delete via `cancelled` e o caminho normal).

A policy de UPDATE usa subquery: `EXISTS (SELECT 1 FROM profiles WHERE
id = auth.uid() AND role = 'owner') OR assigned_to = auth.uid()`.

### 5.4 Seed (rodar 1x apos criar profiles dos 3 usuarios)

```sql
-- Ajustar IDs reais depois de criar os usuarios via Supabase Auth
INSERT INTO profiles (id, full_name, email, role)
VALUES
  ('<felipe-uuid>', 'Felipe', 'felipe@cyberinformatica.tech', 'owner'),
  ('<iago-uuid>',   'Iago',   'iago@cyberinformatica.tech',   'technician'),
  ('<jefferson-uuid>', 'Jefferson', 'jefferson@cyberinformatica.tech', 'technician');
```

## 6. Como rodar localmente

```bash
# 1. Clonar o repo (se ainda nao tem)
git clone https://github.com/iflcosta/cyber-tech.git
cd cyber-tech

# 2. Criar branch de feature
git checkout -b feat/crm-admin

# 3. Adicionar env vars (no .env.local, junto com as que ja existem)
NEXT_PUBLIC_SUPABASE_CRM_URL=https://avfcsuyackxiaglldyvo.supabase.co
NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY=<anon key do projeto novo>

# 4. Instalar deps (nao precisa instalar nada novo — admin/ e parte do mesmo Next.js)
npm install

# 5. Rodar
npm run dev
# Abre em http://localhost:3000/admin/login
```

**Regra importante**: as env vars do CRM tem prefixo `_CRM_` pra nao colidir
com as do Supabase principal. O client de browser usa SO o `_CRM_URL` /
`_CRM_ANON_KEY`. Nunca misture.

## 7. Deploy

Vercel esta configurado pra fazer deploy automatico da `main` em
`cyberinformatica.tech`. A branch `feat/crm-admin` ganha um preview URL
tipo `feat-crm-admin-cyber-tech.vercel.app` (otimo pra QA antes de mergear).

Apos mergear em `main`:
1. Painel do Vercel -> projeto `cyber-tech` -> Settings -> Environment Variables
2. Adicionar as 2 env vars do CRM (`NEXT_PUBLIC_SUPABASE_CRM_URL` e
   `NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY`) no ambiente de **Production**
3. Re-deploy (ou esperar proximo push)
4. Acessar `https://cyberinformatica.tech/admin/login`

## 8. O que NAO esta no MVP (deixar pra depois)

- Estoque / controle de pecas
- Financeiro (comissao, pagamento, valor)
- Notificacao WhatsApp automatica
- Upload de fotos do aparelho
- Dashboard / relatorios
