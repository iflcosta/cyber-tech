# Agente de impressão local — Cyber ERP

Pequeno serviço que roda no PC da bancada e faz a ponte entre o
sistema (rodando no navegador) e a impressora térmica MPT-II
(Bluetooth). Sem ele, o navegador não tem como mandar bytes crus pra
uma porta serial/Bluetooth — só USB dá pra fazer direto (WebUSB), e a
MPT-II é Bluetooth.

Com o agente rodando, os botões verdes "🖨️ Imprimir na MPT-II
(Bluetooth)" nas páginas de etiqueta e recibo mandam comandos ESC/POS
de verdade (negrito, alinhamento, corte automático de papel) — nada
de gambiarra de texto com pontos simulando espaço.

## Instalação (uma vez só, no PC da bancada)

1. Instalar o [Node.js](https://nodejs.org/) (versão LTS) se ainda não tiver.
2. Baixar/copiar esta pasta `print-agent/` pro PC da bancada.
3. Abrir um terminal (cmd/PowerShell) dentro da pasta e rodar:
   ```
   npm install
   ```
4. Copiar `.env.example` pra `.env` e ajustar a porta COM (ver abaixo).

## Descobrir a porta COM da impressora

A MPT-II pareada por Bluetooth vira uma porta COM virtual no Windows.
Pra descobrir qual:

- **Painel de Controle → Dispositivos e Impressoras** → botão direito
  na MPT-II → Propriedades → aba "Serviços" ou "Hardware" → porta COM
  de **saída**.
- Ou **Gerenciador de Dispositivos → Portas (COM e LPT)** — geralmente
  aparece como "Standard Serial over Bluetooth link (COMx)".

Coloca esse número em `PRINTER_COM_PORT` no `.env` (ex: `COM9`).

## Rodar

```
npm start
```

Deixa a janela aberta enquanto usa o sistema. Pra confirmar que está
no ar, abre `http://localhost:9100/status` no navegador — deve
responder `{"ok":true,...}`.

## Deixar iniciando sozinho com o Windows

Pra não precisar abrir na mão toda vez:

1. Cria um atalho pro `npm start` (ou um `.bat` com `npm start` dentro
   da pasta `print-agent`).
2. Coloca o atalho na pasta de Inicialização do Windows
   (`shell:startup` na barra de endereço do Explorer).

## Se der erro

- **"Não consegui abrir a porta COMx"** — confere se a impressora está
  ligada, pareada e se a porta no `.env` é a mesma do Gerenciador de
  Dispositivos. Outro programa (Word, outro app de impressão) pode
  estar com a porta aberta ao mesmo tempo — feche antes.
- **Imprime mas sai lixo/caracteres estranhos** — tenta trocar
  `BAUD_RATE` no `.env` pra `115200` (alguns clones usam essa taxa em
  vez de 9600).
- **Botão no site diz "não consegui falar com o agente"** — confirma
  que o `npm start` está rodando e que não tem firewall bloqueando
  `localhost:9100`.

## Segurança

O agente só escuta em `127.0.0.1` (localhost) — não fica acessível
por outros computadores na rede da loja. E só aceita pedidos vindos da
origem configurada em `ALLOWED_ORIGIN` (o domínio do site).

## Por que não dá pra fazer isso só no navegador

- **WebUSB** existe e permite mandar bytes direto do navegador sem
  agente nenhum, mas só funciona com impressora ligada por **USB** —
  não serve pra Bluetooth, e não funciona no Safari/iOS.
- Um serviço local ouvindo em `localhost` é o mesmo padrão usado por
  sistemas de PDV de verdade (ex: QZ Tray) exatamente por cobrir tanto
  USB quanto Bluetooth/serial, em qualquer navegador.
