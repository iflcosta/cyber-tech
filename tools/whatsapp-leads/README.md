# 📲 Tutorial Completo: Extração de Contatos do WhatsApp & Central de Leads (Suporte em TI)

> **🤖 Contexto Rápido para o Antigravity (Handoff entre Dispositivos):**
> - **Status atual:** A extração direta do **WhatsApp Desktop** do computador da loja já foi executada e commitada neste repositório (`tools/whatsapp-leads/output/`).
> - **Arquivos já extraídos e prontos no repositório:**
>   1. `tools/whatsapp-leads/output/leads-whatsapp-empresas-b2b.csv` — **91 Empresas / B2B** (clínicas, escritórios, escolas, comércios, oficinas, etc.).
>   2. `tools/whatsapp-leads/output/leads-whatsapp-nomeados.csv` — **1.510 contatos com nome identificado** (sendo **983 da região DDD 11/19/12/35**).
>   3. `tools/whatsapp-leads/output/leads-whatsapp-completo.csv` — **9.495 números únicos de WhatsApp (Brasil)** que já conversaram com a loja.
>   4. `tools/whatsapp-leads/output/leads-whatsapp-nomeados.json` — Base JSON **pré-carregada automaticamente** na tela `/admin/clientes/leads` do ERP.
> - **Integração no ERP:** A rota `/admin/clientes/leads` (`src/app/admin/clientes/leads/page.tsx` e `WhatsAppLeadsClient.tsx`) já cruza automaticamente os contatos do banco do Supabase (`customers`, `service_orders`, `sales`, `contact_leads`) com os 1.510 leads pré-carregados do WhatsApp Desktop.

---

## 🛠️ Método 1: Extração Direta do WhatsApp Desktop (Windows) — *Sem abrir navegador*

O aplicativo **WhatsApp Desktop** da Microsoft Store armazena o banco `model-storage` em blocos comprimidos com **Snappy** dentro do LevelDB do WebView2 (`EBWebView`), no caminho:
```text
%LOCALAPPDATA%\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalCache\EBWebView\Default\IndexedDB\https_web.whatsapp.com_0.indexeddb.leveldb
```

O script [`tools/whatsapp-leads/extract-whatsapp-desktop.mjs`](./extract-whatsapp-desktop.mjs) implementa um descompactador Snappy puro em Node.js (zero dependências externas) que:
1. Lê todos os arquivos `.ldb` (SSTables comprimidas) e `.log` da pasta do WhatsApp Desktop;
2. Decodifica os registros **Protobuf `SyncActionData`** (`["contact","5511...@s.whatsapp.net"]`) para extrair os nomes salvos na agenda da loja e o vínculo `@lid`;
3. Decodifica os objetos serializados do motor **V8** (`o"\x02id...`) para extrair `name`, `shortName`, `pushname` (nome do perfil do cliente), `verifiedName` (nome comercial do WhatsApp Business) e mapear identificadores `@lid` para números reais `55...`;
4. Varre todas as chaves de histórico de conversas (`55...@c.us` e `55...@s.whatsapp.net`) para capturar clientes que conversaram com a loja mesmo sem estarem salvos na agenda;
5. Classifica automaticamente potenciais clientes **Empresas / B2B** por palavras-chave e conta comercial verificada.

### Como rodar (em qualquer PC Windows com WhatsApp Desktop logado):
```bash
node tools/whatsapp-leads/extract-whatsapp-desktop.mjs
```
Os 4 arquivos atualizados serão salvos automaticamente em `tools/whatsapp-leads/output/`.

---

## 🌐 Método 2: Extração pelo WhatsApp Web no Navegador (Console F12)

Caso você conecte o WhatsApp da loja pelo navegador (`https://web.whatsapp.com`) em outra máquina e queira extrair direto da sessão aberta do navegador:

1. Abra **[https://web.whatsapp.com](https://web.whatsapp.com)** no Chrome, Edge ou Brave.
2. Pressione **`F12`** (ou `Ctrl + Shift + I`) e selecione a aba **Console**.
   - *Nota:* Se o navegador pedir confirmação ao colar código pela primeira vez, digite `allow pasting` (ou `permitir colagem`) e aperte `Enter`.
3. Copie o conteúdo de [`tools/whatsapp-leads/extract-whatsapp-web.js`](./extract-whatsapp-web.js) (ou clique no botão **"Copiar Script do Console (F12)"** dentro de `/admin/clientes/leads` no ERP).
4. Cole no Console e pressione **`Enter`**.
5. O script lê as tabelas `contact`, `chat` e `lid-mapping` do `IndexedDB` (`model-storage`) do navegador e faz o download imediato de:
   - `leads-whatsapp-cyber-YYYY-MM-DD.csv`
   - `leads-whatsapp-cyber-YYYY-MM-DD.json`

---

## 📱 Método 3: Unificar com Agenda do Celular (`.vcf` ou `.csv` do Google Contacts)

Se quiser cruzar também com os contatos exportados do celular ou do Google Contacts ([contacts.google.com](https://contacts.google.com)):

### Opção A — Pela Interface Visual do ERP (`/admin/clientes/leads`)
1. Acesse **`/admin/clientes`** e clique em **`Leads WhatsApp (Suporte TI)`** (ou vá direto para `/admin/clientes/leads`).
2. Clique em **`Importar Arquivo (.json, .csv, .vcf)`** e selecione o arquivo exportado.
3. O sistema mescla e desduplica tudo automaticamente pelo número de telefone normalizado (`55` + DDD + número).

### Opção B — Pelo Terminal (CLI)
```bash
node tools/whatsapp-leads/consolidate-leads.mjs caminho/para/arquivo1.json caminho/para/contatos.vcf
```
Isso gera `tools/whatsapp-leads/output/leads-consolidados-ti.csv` e `.json`.

---

## 🚀 Como Usar a Central de Leads Hoje à Noite (`/admin/clientes/leads`)

1. **Rode o projeto localmente na outra máquina** (`git pull` $\rightarrow$ `npm run dev`) ou acesse pela URL da Vercel.
2. Abra **`/admin/clientes/leads`**:
   - Os **1.510 contatos nomeados do WhatsApp Desktop** já aparecem **pré-carregados** na tabela junto com os clientes de OS e PDV do banco de dados.
3. **Filtre sua lista de ataque:**
   - **Empresas / B2B:** Foca nos ~91 comércios, clínicas, escritórios e empresas para oferecer contrato ou pacote mensal de Suporte em TI.
   - **Já clientes no ERP:** Clientes que já fizeram OS ou compraram na loja (alta confiança na marca Cyber Informática).
   - **Novos (só WhatsApp):** Contatos que cotaram ou conversaram no WhatsApp mas ainda não estão salvos na tabela `customers` do ERP.
4. **Escolha o Script de Abordagem:**
   - **1. Empresas & Escritórios (B2B)**
   - **2. Home Office & Profissionais**
   - **3. Reativação Geral (Clientes Antigos)**
   - O texto substitui automaticamente `{primeiro_nome}` e `{nome}` pelo nome de cada contato ao clicar em **`Chamar no WhatsApp`**.
5. **Salve no Banco do ERP (Opcional):**
   - Clicando em **`Salvar Novos no ERP`**, o painel cadastra em lote na tabela `customers` do Supabase os contatos vindos do WhatsApp que ainda não existiam no sistema.

---

## 💡 Sugestões de Prompts para Continuar com o Antigravity Hoje à Noite

Quando abrir este repositório no outro dispositivo com o Antigravity, você pode pedir, por exemplo:
- *"Analise o arquivo `tools/whatsapp-leads/output/leads-whatsapp-nomeados.csv` e crie uma segmentação mais detalhada separando Clínicas/Saúde, Escritórios (Advocacia/Contabilidade), Comércios/Lojas e Escolas com scripts personalizados para cada nicho."*
- *"Crie uma página dedicada `/suporte-ti-empresas` no Portal Público da Cyber Informática para eu enviar o link junto com a abordagem no WhatsApp."*
- *"Adicione no painel `/admin/clientes/leads` um status de funil de prospecção (Não contatado, Mensagem enviada, Em negociação, Fechado, Sem interesse) salvo no Supabase."*
