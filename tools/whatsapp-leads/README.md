# 📲 Extração de Contatos do WhatsApp & Central de Leads (Suporte em TI)

Este diretório contém o kit completo para extrair **100% dos contatos e conversas do WhatsApp da loja** (incluindo números que já conversaram com a loja mas não foram salvos na agenda), cruzá-los com a base de clientes do **Cyber ERP** e montar a lista de prospecção para o novo serviço de **Suporte em TI**.

Além destes scripts, você também tem uma interface visual completa dentro do próprio ERP em:
👉 **`/admin/clientes/leads`** (acessível pelo botão **"📲 Central de Leads & WhatsApp"** na tela de Clientes).

---

## Passo 1: Extrair todos os contatos e conversas do WhatsApp Web (30 segundos)

1. No computador onde o WhatsApp da loja está conectado (ou conectando à noite pelo QR Code), abra **[https://web.whatsapp.com](https://web.whatsapp.com)** no Chrome ou Edge.
2. Aperte **`F12`** (ou `Ctrl + Shift + I`) e clique na aba **Console**.
   - *Dica:* Se o navegador exibir um aviso pedindo confirmação na primeira vez que você cola código, digite `allow pasting` (ou `permitir colagem`) e aperte `Enter`.
3. Copie todo o conteúdo do arquivo [`tools/whatsapp-leads/extract-whatsapp-web.js`](./extract-whatsapp-web.js) (ou clique no botão **"📋 Copiar Script do WhatsApp Web"** direto na tela `/admin/clientes/leads` do ERP).
4. Cole no Console do WhatsApp Web e aperte **`Enter`**.
5. O script vai ler automaticamente a base local do WhatsApp Web (`IndexedDB -> model-storage -> contact & chat`), ignorar grupos/status, identificar contas comerciais (WhatsApp Business) e baixar na hora dois arquivos na sua pasta de *Downloads*:
   - `leads-whatsapp-cyber-YYYY-MM-DD.csv` (pronto para abrir no Excel / Google Sheets)
   - `leads-whatsapp-cyber-YYYY-MM-DD.json`

---

## Passo 2 (Opcional): Exportar a agenda do celular (`.vcf` ou `.csv`)

Se houver contatos antigos salvos apenas no chip/conta Google do celular da loja:
1. Abra o app **Contatos** do celular (ou acesse [contacts.google.com](https://contacts.google.com)).
2. Clique em **Exportar** -> formato **`.vcf` (vCard)** ou **Google CSV**.

---

## Passo 3: Unificar com o Banco do ERP + Disparar Campanha de Suporte em TI

Você pode fazer isso de **duas formas** (escolha a que preferir hoje à noite):

### Opção A — Pelo Painel Visual do ERP (Recomendado)
1. Acesse **`/admin/clientes/leads`** no ERP da Cyber.
2. A página já carrega automaticamente todos os clientes de **OS**, **Vendas (PDV)** e **Formulário do Site** cadastrados no banco.
3. Arraste ou selecione o arquivo `.csv`, `.json` ou `.vcf` que você baixou do WhatsApp Web no Passo 1.
4. O painel:
   - Remove todos os números duplicados automaticamente;
   - Separa quem **já é cliente do ERP** de quem **só estava no WhatsApp**;
   - Classifica automaticamente entre **Empresa / B2B** e **Residencial / Home Office**;
   - Permite **Importar para o cadastro de Clientes do ERP** com 1 clique;
   - Permite **Exportar a Planilha Master (`.csv`)**;
   - Possui **Templates de Mensagem para Suporte em TI** com botão de envio rápido pelo WhatsApp e marcação de quem já foi contatado!

### Opção B — Via Linha de Comando (Terminal Node.js)
Se quiser consolidar vários arquivos `.csv`, `.json` e `.vcf` direto no terminal:

```bash
node tools/whatsapp-leads/consolidate-leads.mjs ~/Downloads/leads-whatsapp-cyber-*.json ~/Downloads/contatos.vcf
```

O script vai gerar a lista higienizada e deduplicada em:
- `tools/whatsapp-leads/output/leads-consolidados-ti.csv`
- `tools/whatsapp-leads/output/leads-consolidados-ti.json`
