# Launch da Campanha — Cyber Informática

> **Para o Claude:** Iago está chegando na loja para lançar a primeira campanha de marketing da Cyber Informática. Oriente-o passo a passo. O site já está no ar em `https://cyberinformatica.tech`, o repositório é `https://github.com/iflcosta/cyber-tech`, o deploy é na Vercel. Todas as correções técnicas já foram feitas. Sua função agora é ser um parceiro de lançamento — ajude com copy, configuração de anúncios, criação dos links rastreados, e qualquer dúvida que surgir. Seja direto e prático.

---

## Contexto do negócio

- **Loja:** Cyber Informática — Rua Coronel Teófilo Leme, 967 — Bragança Paulista/SP
- **WhatsApp:** 11 95436-9269
- **Instagram:** @cyberinfo.brag
- **Site:** https://cyberinformatica.tech
- **Horário:** Seg-Sex 09h–18h, Sáb 09h–13h

### Serviços principais
- Manutenção de celular (reparo de tela, bateria, molhado)
- Manutenção de notebook e PC
- Montagem de PC Gamer e Workstation
- Venda de produtos e periféricos

---

## O que já está pronto (não precisa mexer)

- [x] Site no ar com captacao de leads
- [x] Admin em `/admin` com abas: Leads, Vendas, Manutenção, Produtos
- [x] Links de campanha com UTM já mapeados para as abas certas
- [x] QR code com deduplicação (não gera lead duplicado)
- [x] Vouchers automaticos para cada lead
- [x] Número do WhatsApp e Instagram atualizados no código

---

## Passo a passo do dia

### 1. Verificar o site em producao
Abrir no celular e no computador:
- [ ] https://cyberinformatica.tech — home carrega?
- [ ] Clicar em "WhatsApp" no header — abre o WA com voucher?
- [ ] Abrir `/admin` — leads aparecem?

---

### 2. Criar as campanhas na Meta (Facebook/Instagram)

Entrar no **Meta Ads Manager** e criar 3 campanhas:

#### Campanha A — Manutenção de Celular
- Objetivo: **Leads** ou **Mensagens**
- Público: Raio 15km de Bragança Paulista, 18–45 anos
- Formatos: Stories + Reels
- Link de destino:
```
https://cyberinformatica.tech/api/redirect/whatsapp?utm_source=instagram&utm_medium=cpc&utm_campaign=manutencao-celular&service=reparo_celular
```

#### Campanha B — Montagem PC Gamer
- Objetivo: **Leads** ou **Mensagens**
- Público: Raio 30km, 16–35 anos, interesses: games, hardware, PC
- Formatos: Carrossel de builds + Reels
- Link de destino:
```
https://cyberinformatica.tech/api/redirect/whatsapp?utm_source=instagram&utm_medium=cpc&utm_campaign=montagem-pc-gamer&service=montagem_pc
```

#### Campanha C — Produto específico (opcional)
- Objetivo: **Tráfego**
- Formato: Imagem do produto
- Link de destino:
```
https://cyberinformatica.tech/produtos?utm_source=facebook&utm_medium=cpc&utm_campaign=produto-NOME
```

---

### 3. Criar as campanhas no Google Ads

#### Campanha A — Manutenção (Search)
- Tipo: Rede de Pesquisa
- Palavras-chave sugeridas:
  - conserto de celular bragança paulista
  - assistência técnica celular bragança
  - tela quebrada iphone bragança
  - reparo notebook bragança paulista
- Link de destino:
```
https://cyberinformatica.tech/manutencao?utm_source=google&utm_medium=cpc&utm_campaign=manutencao-search
```

#### Campanha B — Montagem PC (Search)
- Tipo: Rede de Pesquisa
- Palavras-chave sugeridas:
  - montagem pc gamer bragança paulista
  - montar pc gamer interior sp
  - pc gamer personalizado bragança
- Link de destino:
```
https://cyberinformatica.tech/?utm_source=google&utm_medium=cpc&utm_campaign=montagem-pc-search#pc-builder
```

---

### 4. Monitorar os primeiros leads

Abrir o admin em `/admin` e ficar de olho:
- **Aba Leads** — cliques genéricos sem serviço definido
- **Aba Manutenção** — quem clicou nos links de reparo
- **Aba Vendas** — quem clicou no link de montagem PC

Responder o WhatsApp em até 5 minutos — isso aumenta muito a conversão.

---

### 5. Perguntas para pedir ao Claude se travar

- "Como crio o pixel do Facebook no site?"
- "Como adiciono uma palavra-chave negativa no Google Ads?"
- "O lead entrou mas foi para a aba errada, o que faço?"
- "Quero adicionar um produto novo no admin, como faço?"
- "Preciso criar um QR code para colocar no balcão da loja"

---

## Links uteis

| O que | Link |
|-------|------|
| Site | https://cyberinformatica.tech |
| Admin | https://cyberinformatica.tech/admin |
| Repositório | https://github.com/iflcosta/cyber-tech |
| Meta Ads | https://adsmanager.facebook.com |
| Google Ads | https://ads.google.com |

---

> **Lembre ao Claude:** Iago é o dono da loja e está fazendo tudo isso sozinho. Seja parceiro, nao só técnico. Se ele travar em algo, ajude com o passo a passo completo.
