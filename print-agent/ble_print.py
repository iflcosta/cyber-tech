import sys
import os
import asyncio
import unicodedata
from bleak import BleakClient

DEFAULT_ADDRESS = os.environ.get("PRINTER_BLE_ADDRESS", "DC:0D:51:5A:B6:C0")
WRITE_CHAR_UUID = "49535343-8841-43f4-a8d4-ecbe34729bb3"

def sanitize_text(text: str) -> bytes:
    # Normaliza acentos para evitar caracteres corrompidos na impressora termica
    # Substitui acentos mantendo a legibilidade perfeita (ex: ACAO -> ACAO, R$ -> R$)
    normalized = unicodedata.normalize('NFKD', text)
    ascii_text = ''.join(c for c in normalized if not unicodedata.combining(c))
    
    # Substitui outros caracteres especiais comuns
    replacements = {
        'º': 'o', 'ª': 'a', '°': 'o',
        '–': '-', '—': '-', '“': '"', '”': '"',
        '‘': "'", '’': "'"
    }
    for orig, repl in replacements.items():
        ascii_text = ascii_text.replace(orig, repl)
        
    return ascii_text.encode('ascii', errors='replace')

async def send_to_printer(content_bytes: bytes, address: str = DEFAULT_ADDRESS):
    # Comandos ESC/POS basicos
    # ESC @ : inicializa impressora
    # ESC d 4 : avanca 4 linhas no final
    payload = b"\x1b\x40" + content_bytes + b"\r\n\r\n\x1b\x64\x04"
    
    async with BleakClient(address, timeout=8.0) as client:
        if not client.is_connected:
            raise ConnectionError(f"Nao foi possivel conectar a impressora {address}")
            
        chunk_size = 20
        for i in range(0, len(payload), chunk_size):
            chunk = payload[i:i + chunk_size]
            await client.write_gatt_char(WRITE_CHAR_UUID, chunk, response=False)
            await asyncio.sleep(0.015)

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        text = (
            "==============================\r\n"
            "      CYBER INFORMATICA       \r\n"
            "   TESTE BLUETOOTH MPT-II     \r\n"
            "==============================\r\n"
            "Conexao: Bluetooth Sem Fio\r\n"
            "Status : 100% OPERACIONAL!\r\n"
            "------------------------------\r\n"
        )
    elif len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], 'r', encoding='utf-8', errors='replace') as f:
            text = f.read()
    else:
        # Le da entrada padrao (stdin)
        text = sys.stdin.read()

    if not text.strip():
        print("Erro: Nenhum texto fornecido para impressao.", file=sys.stderr)
        sys.exit(1)

    data = sanitize_text(text)
    
    try:
        asyncio.run(send_to_printer(data))
        print("OK: Impresso com sucesso via Bluetooth BLE!")
    except Exception as e:
        print(f"Erro BLE: {e}", file=sys.stderr)
        sys.exit(2)

if __name__ == "__main__":
    main()
