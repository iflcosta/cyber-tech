# CRM Cyber Informática — `/admin` do cyberinformatica.tech

CRM interno de bancada pra assistencia tecnica. Modulo `/admin` adicionado ao
site institucional existente.

## O que ja esta pronto

- Login com Supabase Auth (sessao 30 dias, "manter logado")
- Cadastro rapido de OS em 3 passos (cliente → aparelho → servico)
- Lista de OS com filtros (status, busca por nome/telefone/IMEI/modelo)
- Detalhe da OS com timeline automatica
- Comprovante de entrada imprimivel (A4)
- Alerta de OS parada (>3d amarelo, >7d vermelho)
- Numeracao automatica `OS-2026-0001` (sequence no banco)
- RLS no Supabase: dono edita tudo, tecnico so nas atribuidas a ele
- Auto-cria `profile` quando usuario e criado no Auth

## Usuarios

| Email | Senha inicial | Role |
| --- | --- | --- |
| `felipe@cyberinformatica.tech` | (definida na criacao) | `owner` |
| `iago@cyberinformatica.tech` | (definida na criacao) | `technician` |
| `jefferson@cyberinformatica.tech` | (definida na criacao) | `technician` |

Os 3 ja foram criados no Auth do projeto Supabase novo. O trigger
`on_auth_user_created` ja criou os `profiles` correspondentes. Se algum ficou
com `role = 'technician'` por padrao, ajustar Felipe com:

```sql
UPDATE public.profiles SET role = 'owner' WHERE email = 'felipe@cyberinformatica.tech';
```

## Como integrar ao `cyber-tech`

A pasta `admin/` deste diretorio vai inteira pra raiz do repo `cyber-tech`,
junto com a migracao SQL em `supabase/migrations/0001_init.sql`.

### 1. Copiar arquivos

```bash
# Dentro do repo cyber-tech ja clonado:
cp -r /caminho/para/crm-cyber/admin ./admin
cp /caminho/para/crm-cyber/supabase/migrations/0001_init.sql ./supabase/migrations/
```

(Os arquivos `AGENTS.md`, `client.ts`, `server.ts`, `database.ts`, layout,
login, lista, cadastro, detalhe, impressao, componentes — todos sao novos e
nao conflitam com nada.)

### 2. Adicionar env vars no Vercel

No painel do Vercel → projeto `cyber-tech` → Settings → Environment Variables,
adicionar (em todos os ambientes que for usar):

```
NEXT_PUBLIC_SUPABASE_CRM_URL = https://avfcsuyackxiaglldyvo.supabase.co
NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY = <anon key do projeto novo>
```

E tambem em `.env.local` local pra dev.

### 3. Instalar dependencia (se ainda nao tiver)

`@supabase/ssr` ja esta no `package.json` (versao 0.8.0). Se faltar, rodar:

```bash
cd cyber-tech
npm install @supabase/ssr
```

### 4. Rodar local

```bash
git checkout -b feat/crm-admin
npm install
npm run dev
# Abre http://localhost:3000/admin/login
```

### 5. Deploy

Push pra branch `feat/crm-admin` → Vercel gera preview URL automatico.
Testar no preview, depois mergear em `main` e Vercel deploya em producao
(`cyberinformatica.tech/admin`).

## Estrutura final

```
crm-cyber/
├── AGENTS.md                              ← doc do projeto
├── README.md                              ← este arquivo
├── admin/
│   ├── app/
│   │   ├── layout.tsx                     ← shell com auth guard + nav
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── LoginForm.tsx
│   │   └── os/
│   │       ├── page.tsx                   ← lista
│   │       ├── OSFilter.tsx
│   │       ├── new/
│   │       │   ├── page.tsx
│   │       │   └── NewOSForm.tsx
│   │       └── [id]/
│   │           ├── page.tsx               ← detalhe + timeline
│   │           ├── OSDetailActions.tsx
│   │           └── print/
│   │               └── page.tsx           ← comprovante A4
│   ├── components/
│   │   ├── OSCard.tsx
│   │   ├── OSTimeline.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StaleBadge.tsx
│   │   └── LogoutButton.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts                  ← browser client
│   │       └── server.ts                  ← server client
│   └── types/
│       └── database.ts
└── supabase/
    └── migrations/
        └── 0001_init.sql                  ← schema + RLS + triggers
```

## Pendencias / fase 2

- Estoque de pecas
- Financeiro (comissao, valor, pagamento)
- Notificacao WhatsApp automatica
- Upload de fotos do aparelho
- Dashboard / relatorios
- PWA (instalar como app no celular)
- Confirmacao de envio de comprovante por email/SMS
