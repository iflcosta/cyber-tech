"""
Script de Geração de Criativos Visuais de Alta Resolução - Cyber Informática
Estilo: CIS-01 Industrial Brutalista / Laboratório de Engenharia de Hardware
Dimensões:
  - card_01_stories_workstation.png: 1080x1920 (9:16 Stories)
  - card_02_stories_autoclave_oca.png: 1080x1920 (9:16 Stories)
  - card_03_feed_leva_e_traz.png: 1080x1350 (4:5 Feed)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Cores do Sistema de Design Industrial CIS-01
BG_DARK = (9, 9, 12)           # #09090c Grafite Profundo
CARD_BG = (17, 17, 22)         # #111116 Painel de Circuito
CARD_BORDER = (38, 40, 52)     # #262834 Borda Usinada
GRID_COLOR = (24, 25, 34)      # #181922 Grid Técnico
ACCENT_GREEN = (16, 185, 129)  # #10b981 Esmeralda Industrial
ACCENT_CYAN = (6, 182, 212)    # #06b6d4 Ciano Óptico
ACCENT_AMBER = (245, 158, 11)  # #f59e0b Âmbar Telemetria
TEXT_WHITE = (255, 255, 255)   # Branco Puro
TEXT_MUTED = (148, 163, 184)   # #94a3b8 Cinza Metálico
TEXT_DIM = (100, 116, 139)     # #64748b Cinza Escuro

# Carregamento de Fontes do Sistema Windows
FONT_TITLE_PATH = "C:/Windows/Fonts/segoeuib.ttf"
FONT_BODY_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_MONO_B_PATH = "C:/Windows/Fonts/consolab.ttf"
FONT_MONO_PATH = "C:/Windows/Fonts/consola.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_grid(draw, width, height, step=60):
    """Desenha grade cartesiana técnica sutil de fundo."""
    for x in range(0, width, step):
        draw.line([(x, 0), (x, height)], fill=GRID_COLOR, width=1)
    for y in range(0, height, step):
        draw.line([(0, y), (width, y)], fill=GRID_COLOR, width=1)

def draw_crosshair(draw, x, y, size=12, color=TEXT_DIM):
    """Desenha retículo de mira técnica (+)."""
    draw.line([(x - size, y), (x + size, y)], fill=color, width=1)
    draw.line([(x, y - size), (x, y + size)], fill=color, width=1)

def draw_machined_panel(draw, box, fill=CARD_BG, border=CARD_BORDER, notch=16):
    """Desenha painel industrial com cantos chanfrados (machined metal look)."""
    x1, y1, x2, y2 = box
    points = [
        (x1 + notch, y1),
        (x2 - notch, y1),
        (x2, y1 + notch),
        (x2, y2 - notch),
        (x2 - notch, y2),
        (x1 + notch, y2),
        (x1, y2 - notch),
        (x1, y1 + notch)
    ]
    draw.polygon(points, fill=fill, outline=border, width=2)
    # Marcas de parafusos / usinagem nos cantos
    corner_inset = notch + 6
    draw.ellipse([x1 + corner_inset - 2, y1 + corner_inset - 2, x1 + corner_inset + 2, y1 + corner_inset + 2], fill=border)
    draw.ellipse([x2 - corner_inset - 2, y1 + corner_inset - 2, x2 - corner_inset + 2, y1 + corner_inset + 2], fill=border)
    draw.ellipse([x2 - corner_inset - 2, y2 - corner_inset - 2, x2 - corner_inset + 2, y2 - corner_inset + 2], fill=border)
    draw.ellipse([x1 + corner_inset - 2, y2 - corner_inset - 2, x1 + corner_inset + 2, y2 - corner_inset + 2], fill=border)

def draw_badge(draw, text, x, y, font, color=ACCENT_GREEN, bg=(16, 185, 129, 30), border_color=ACCENT_GREEN):
    """Desenha badge usinada de especificação técnica."""
    bbox = draw.textbbox((x, y), text, font=font)
    pad_x, pad_y = 14, 8
    bx1, by1, bx2, by2 = bbox[0] - pad_x, bbox[1] - pad_y, bbox[2] + pad_x, bbox[3] + pad_y
    draw.rectangle([bx1, by1, bx2, by2], fill=bg[:3], outline=border_color, width=1)
    draw.text((x, y), text, font=font, fill=color)
    return bx2 - bx1 + 10

def draw_telemetry_header(draw, width, card_code, subtitle="LABORATÓRIO DE ENGENHARIA DE HARDWARE"):
    """Desenha cabeçalho padrão de instrumentação e coordenadas de Bragança Paulista."""
    font_mono = get_font(FONT_MONO_B_PATH, 19)
    font_mono_small = get_font(FONT_MONO_PATH, 16)
    
    # Linha de Coordenadas e Identificação
    draw.text((70, 70), "CYBER INFORMÁTICA // DIVISÃO INDUSTRIAL", font=font_mono, fill=ACCENT_GREEN)
    draw.text((width - 320, 70), f"ID: {card_code} // CIS-01", font=font_mono, fill=TEXT_MUTED)
    
    draw.text((70, 98), "LAT: -22.9537° S  |  LONG: -46.5414° W  |  ALT: 817m", font=font_mono_small, fill=TEXT_DIM)
    draw.text((width - 450, 98), "10 ANOS • CENTRO BRAGANÇA PAULISTA", font=font_mono_small, fill=TEXT_MUTED)
    
    # Barra divisória usinada
    draw.line([(70, 130), (width - 70, 130)], fill=CARD_BORDER, width=2)
    draw.line([(70, 132), (180, 132)], fill=ACCENT_GREEN, width=3)
    
    # Marcadores de canto
    draw_crosshair(draw, 70, 130, 8, ACCENT_GREEN)
    draw_crosshair(draw, width - 70, 130, 8, TEXT_DIM)

def draw_spec_row(draw, x, y, width, label, value, status="VERIFICADO", font_lbl=None, font_val=None):
    """Desenha uma linha de telemetria técnica de alta precisão."""
    draw.text((x, y), label, font=font_lbl, fill=TEXT_MUTED)
    draw.text((x + 360, y), value, font=font_val, fill=TEXT_WHITE)
    
    # Status badge
    draw.text((x + width - 180, y), f"[{status}]", font=font_lbl, fill=ACCENT_GREEN)
    draw.line([(x, y + 36), (x + width, y + 36)], fill=(28, 30, 40), width=1)


# ==============================================================================
# CARD 01: STORIES (9:16 - 1080x1920) - WORKSTATIONS & UPGRADES (TÉRREO)
# ==============================================================================
def generate_card_01(output_dir):
    width, height = 1080, 1920
    im = Image.new("RGB", (width, height), color=BG_DARK)
    draw = ImageDraw.Draw(im)
    
    draw_grid(draw, width, height, step=54)
    draw_telemetry_header(draw, width, "ENG-WKST-01")
    
    font_hero = get_font(FONT_TITLE_PATH, 58)
    font_subhero = get_font(FONT_TITLE_PATH, 34)
    font_body = get_font(FONT_BODY_PATH, 24)
    font_mono_b = get_font(FONT_MONO_B_PATH, 20)
    font_mono = get_font(FONT_MONO_PATH, 18)
    
    # Bloco de Localização Física / Arquitetura da Loja
    draw_badge(draw, "TÉRREO: PÉ-DIREITO 6.0 METROS", 70, 175, font_mono_b, color=ACCENT_GREEN, border_color=ACCENT_GREEN)
    draw_badge(draw, "ENGENHEIROS DE HARDWARE: IAGO & FELIPE", 470, 175, font_mono_b, color=ACCENT_CYAN, border_color=ACCENT_CYAN)
    
    # Manchete Principal
    y_cursor = 250
    draw.text((70, y_cursor), "WORKSTATIONS SOB MEDIDA", font=font_hero, fill=TEXT_WHITE)
    y_cursor += 70
    draw.text((70, y_cursor), "& UPGRADES DE ALTO DESEMPENHO", font=font_hero, fill=ACCENT_GREEN)
    
    y_cursor += 85
    desc_p1 = "Montagem industrial, curadoria de componentes de precisão e testes térmicos"
    desc_p2 = "sob carga máxima para render, IA, simulações de engenharia e modelagem 3D."
    draw.text((70, y_cursor), desc_p1, font=font_body, fill=TEXT_MUTED)
    draw.text((70, y_cursor + 32), desc_p2, font=font_body, fill=TEXT_MUTED)
    
    # Painel Central de Especificações de Hardware (Machined Panel)
    panel_box = [70, 460, width - 70, 1180]
    draw_machined_panel(draw, panel_box, fill=CARD_BG, border=CARD_BORDER, notch=20)
    
    # Header interno do painel
    draw.text((105, 490), "PROTOCOLO DE INTEGRAÇÃO & CURADORIA DE HARDWARE", font=font_mono_b, fill=ACCENT_GREEN)
    draw.text((width - 360, 490), "NORMA CIS-LAB-V2", font=font_mono, fill=TEXT_DIM)
    draw.line([(105, 525), (width - 105, 525)], fill=CARD_BORDER, width=1)
    
    # Linhas de telemetria técnica
    specs = [
        ("ARQUITETURA DE FORÇA", "Dimensionamento de VRM & Eficiência 80 Plus Platinum", "SINCRO 100%"),
        ("GERENCIAMENTO TÉRMICO", "Curva de PWM Dinâmica + Pasta de Prata/Metal", "DELTA < 68°C"),
        ("SUBSISTEMA DE MEMÓRIA", "DDR5 Low-Latency • Dual/Quad Channel Sincronizado", "TESTADO AIDA64"),
        ("ESTRUTURA DE NVME", "Gen4/Gen5 com Dissipadores Maciços de Alumínio", "7.400 MB/s"),
        ("ESTABILIDADE SOB CARGA", "Burn-in de 4 Horas sob Carga Contínua em Bancada", "ZERO THROTTLING"),
        ("CONECTIVIDADE RARA", "Acervo de Adaptadores, Fibras e Cabos a Pronta-Entrega", "EM ESTOQUE"),
        ("SUPORTE & GARANTIA", "Garantia Integral de 90 Dias com Base no Art. 26 CDC", "LAUDO FÍSICO"),
    ]
    
    row_y = 560
    for label, val, st in specs:
        draw_spec_row(draw, 105, row_y, width - 210, label, val, st, font_lbl=font_mono, font_val=font_mono_b)
        row_y += 82
        
    # Painel Secundário: Diferencial do Térreo
    diff_box = [70, 1220, width - 70, 1490]
    draw_machined_panel(draw, diff_box, fill=(13, 13, 18), border=(30, 32, 44), notch=14)
    
    draw.text((105, 1245), "INFRAESTRUTURA DO TÉRREO // PÉ-DIREITO 6M", font=font_mono_b, fill=ACCENT_CYAN)
    draw.text((105, 1285), "• Bancadas de montagem com aterramento ESD e instrumentação digital.", font=font_body, fill=TEXT_WHITE)
    draw.text((105, 1325), "• Estoque imediato dos cabos e conversores de sinal mais raros da região.", font=font_body, fill=TEXT_WHITE)
    draw.text((105, 1365), "• Atendimento técnico direto no balcão térreo com Iago e Felipe.", font=font_body, fill=TEXT_WHITE)
    draw.text((105, 1405), "• Maleta de transporte estanque antichoque para coleta em Bragança e região.", font=font_body, fill=TEXT_WHITE)

    # Bloco CTA / Rodapé Seguro (Safe Zone de Stories)
    cta_box = [70, 1530, width - 70, 1690]
    draw.rectangle(cta_box, fill=ACCENT_GREEN)
    
    draw.text((120, 1555), "SOLICITE PROJETO OU UPGRADE DIRETO NO WHATSAPP", font=font_subhero, fill=(5, 15, 10))
    draw.text((120, 1605), "Rua Cel. Teófilo Leme 967, Centro • Bragança Paulista - SP", font=font_mono_b, fill=(10, 35, 20))
    draw.text((120, 1640), "CONSULTORIA TÉCNICA ESPECIALIZADA • RESPOSTA ÁGIL", font=font_mono, fill=(15, 50, 30))
    
    # Telemetria final
    draw.text((70, 1730), "CYBER INFORMÁTICA • 10 ANOS DE ENGENHARIA DE HARDWARE • BRAGANÇA PAULISTA", font=font_mono, fill=TEXT_DIM)
    
    filepath = os.path.join(output_dir, "card_01_stories_workstation.png")
    im.save(filepath, "PNG", quality=95)
    print(f"[OK] Criativo 1 salvo em: {filepath}")
    return filepath


# ==============================================================================
# CARD 02: STORIES (9:16 - 1080x1920) - REMANUFATURA ÓPTICA OCA (MEZANINO)
# ==============================================================================
def generate_card_02(output_dir):
    width, height = 1080, 1920
    im = Image.new("RGB", (width, height), color=BG_DARK)
    draw = ImageDraw.Draw(im)
    
    draw_grid(draw, width, height, step=54)
    draw_telemetry_header(draw, width, "OPTIC-AUTOCLAVE-02")
    
    font_hero = get_font(FONT_TITLE_PATH, 54)
    font_subhero = get_font(FONT_TITLE_PATH, 34)
    font_body = get_font(FONT_BODY_PATH, 24)
    font_mono_b = get_font(FONT_MONO_B_PATH, 20)
    font_mono = get_font(FONT_MONO_PATH, 18)
    
    # Badges do Mezanino Industrial
    draw_badge(draw, "MEZANINO LAB: ELEVAÇÃO +3.60 METROS", 70, 175, font_mono_b, color=ACCENT_CYAN, border_color=ACCENT_CYAN)
    draw_badge(draw, "ESPECIALISTA RESPONSÁVEL: JEFFERSON", 530, 175, font_mono_b, color=ACCENT_GREEN, border_color=ACCENT_GREEN)
    
    # Manchete Principal
    y_cursor = 250
    draw.text((70, y_cursor), "REMANUFATURA ÓPTICA DE TELAS", font=font_hero, fill=TEXT_WHITE)
    y_cursor += 70
    draw.text((70, y_cursor), "AUTOCLAVE 6.0 BAR & VÁCUO OCA", font=font_hero, fill=ACCENT_CYAN)
    
    y_cursor += 85
    desc_p1 = "Recuperação avançada em câmara de vácuo de alta precisão (-0.08 MPa)."
    desc_p2 = "Preserve 100% o seu display original de fábrica sem trocar por réplicas paralelas."
    draw.text((70, y_cursor), desc_p1, font=font_body, fill=TEXT_MUTED)
    draw.text((70, y_cursor + 32), desc_p2, font=font_body, fill=TEXT_MUTED)
    
    # Painel dos Parâmetros Industriais
    panel_box = [70, 460, width - 70, 1180]
    draw_machined_panel(draw, panel_box, fill=CARD_BG, border=CARD_BORDER, notch=20)
    
    draw.text((105, 490), "PARÂMETROS DE REMANUFATURA ÓPTICA INDUSTRIAL", font=font_mono_b, fill=ACCENT_CYAN)
    draw.text((width - 340, 490), "PRESSÃO: 6.0 BAR", font=font_mono_b, fill=ACCENT_GREEN)
    draw.line([(105, 525), (width - 105, 525)], fill=CARD_BORDER, width=1)
    
    specs = [
        ("AUTOCLAVE INDUSTRIAL", "Câmara Pneumática de 6.0 Bar com Desareação Ativa", "ZERO BOLHAS"),
        ("CÂMARA DE VÁCUO OCA", "Pressão Negativa -0.08 MPa para Laminação Perfeita", "ALINHAMENTO 100%"),
        ("PAINEL ORIGINAL MANTIDO", "Preserva o Display Retina / OLED Genuíno de Fábrica", "CORES REAIS"),
        ("SENSIBILIDADE DE TOQUE", "Sem perda de taxa de resposta ou toques fantasmas", "PRECISÃO PURA"),
        ("HOMOLOGAÇÃO DE SENSORES", "Mantém TrueTone, Biometria e Sensores de Proximidade", "TOTALMENTE ATIVO"),
        ("CAPACIDADE B2B REGIONAL", "Atendimento para Clientes Finais e Lojistas Parceiros", "TABELA ATACADO"),
        ("CONFORMIDADE JURÍDICA", "Garantia de 90 Dias Conforme Artigo 26 do CDC", "GARANTIA LEGAL"),
    ]
    
    row_y = 560
    for label, val, st in specs:
        draw_spec_row(draw, 105, row_y, width - 210, label, val, st, font_lbl=font_mono, font_val=font_mono_b)
        row_y += 82
        
    # Quadro Comparativo: O Risco da Peça Paralela vs Remanufatura Óptica
    comp_box = [70, 1220, width - 70, 1490]
    draw_machined_panel(draw, comp_box, fill=(13, 13, 18), border=(30, 32, 44), notch=14)
    
    draw.text((105, 1245), "POR QUE EXIGIR REMANUFATURA ÓPTICA EM VEZ DE TELA PARALELA?", font=font_mono_b, fill=ACCENT_AMBER)
    draw.text((105, 1285), "• Telas paralelas chinesas têm cores lavadas, alto consumo e quebram fácil.", font=font_body, fill=TEXT_MUTED)
    draw.text((105, 1325), "• A laminação OCA em autoclave troca somente o vidro, mantendo seu display original.", font=font_body, fill=TEXT_WHITE)
    draw.text((105, 1365), "• Maquinário industrial no mezanino: processo livre de poeira e microbolhas.", font=font_body, fill=TEXT_WHITE)
    draw.text((105, 1405), "• Economia de até 60% comparado a um display novo genuíno de concessionária.", font=font_body, fill=ACCENT_GREEN)

    # Bloco CTA
    cta_box = [70, 1530, width - 70, 1690]
    draw.rectangle(cta_box, fill=ACCENT_CYAN)
    
    draw.text((120, 1555), "FALE COM O MEZANINO: RECUPERE SEU DISPLAY ORIGINAL", font=font_subhero, fill=(5, 15, 25))
    draw.text((120, 1605), "Atendimento B2C e Terceirização B2B para Lojistas da Região", font=font_mono_b, fill=(10, 35, 45))
    draw.text((120, 1640), "WHATSAPP DIRETO COM O LABORATÓRIO INDUSTRIAL DE HARDWARE", font=font_mono, fill=(15, 50, 60))
    
    draw.text((70, 1730), "CYBER INFORMÁTICA • RUA CEL. TEÓFILO LEME 967, CENTRO • BRAGANÇA PAULISTA", font=font_mono, fill=TEXT_DIM)
    
    filepath = os.path.join(output_dir, "card_02_stories_autoclave_oca.png")
    im.save(filepath, "PNG", quality=95)
    print(f"[OK] Criativo 2 salvo em: {filepath}")
    return filepath


# ==============================================================================
# CARD 03: FEED (4:5 - 1080x1350) - LEVA-E-TRAZ & 10 ANOS DE SEDE FÍSICA
# ==============================================================================
def generate_card_03(output_dir):
    width, height = 1080, 1350
    im = Image.new("RGB", (width, height), color=BG_DARK)
    draw = ImageDraw.Draw(im)
    
    draw_grid(draw, width, height, step=54)
    draw_telemetry_header(draw, width, "LOG-SHOCK-03")
    
    font_hero = get_font(FONT_TITLE_PATH, 50)
    font_subhero = get_font(FONT_TITLE_PATH, 30)
    font_body = get_font(FONT_BODY_PATH, 23)
    font_mono_b = get_font(FONT_MONO_B_PATH, 19)
    font_mono = get_font(FONT_MONO_PATH, 17)
    
    # Badges do Serviço
    draw_badge(draw, "10 ANOS DE SEDE FÍSICA NO CENTRO", 70, 165, font_mono_b, color=ACCENT_GREEN, border_color=ACCENT_GREEN)
    draw_badge(draw, "ROTA DIÁRIA REGIONAL", 470, 165, font_mono_b, color=ACCENT_CYAN, border_color=ACCENT_CYAN)
    draw_badge(draw, "MALETA ANTICHOQUE", 740, 165, font_mono_b, color=ACCENT_AMBER, border_color=ACCENT_AMBER)
    
    # Manchete Principal
    y_cursor = 235
    draw.text((70, y_cursor), "LOGÍSTICA SEGURA LEVA-E-TRAZ", font=font_hero, fill=TEXT_WHITE)
    y_cursor += 62
    draw.text((70, y_cursor), "BRAGANÇA, ATIBAIA, ITATIBA & REGIÃO", font=font_hero, fill=ACCENT_GREEN)
    
    y_cursor += 75
    desc_p1 = "Transporte especializado de equipamentos sensíveis em maleta de alumínio"
    desc_p2 = "estanque com espuma perfilada, termo de custódia e rastreamento em tempo real."
    draw.text((70, y_cursor), desc_p1, font=font_body, fill=TEXT_MUTED)
    draw.text((70, y_cursor + 28), desc_p2, font=font_body, fill=TEXT_MUTED)
    
    # Painel Principal das Cidades & Recursos de Segurança
    panel_box = [70, 425, width - 70, 995]
    draw_machined_panel(draw, panel_box, fill=CARD_BG, border=CARD_BORDER, notch=18)
    
    draw.text((105, 450), "ESPECIFICAÇÕES DE CUSTÓDIA & MALETA ANTICHOQUE", font=font_mono_b, fill=ACCENT_GREEN)
    draw.text((width - 340, 450), "PADRÃO MILITAR ESTANQUE", font=font_mono, fill=TEXT_MUTED)
    draw.line([(105, 482), (width - 105, 482)], fill=CARD_BORDER, width=1)
    
    specs = [
        ("MALA TÉCNICA ANTICHOQUE", "Estrutura rígida de alumínio com interior em espuma EVA", "BLINDADO"),
        ("ROTA BRAGANÇA PAULISTA", "Atendimento em residências, escritórios e condomínios", "DIÁRIO"),
        ("ROTA ATIBAIA & ITATIBA", "Coleta programada corporativa e para lojistas parceiros", "SEMANAL/DIÁRIO"),
        ("CUSTÓDIA DOCUMENTADA", "Termo de entrada assinado no ato com checklist visual", "100% SEGURO"),
        ("TRIAGEM DE DOIS NÍVEIS", "Térreo (Workstations) e Mezanino (Autoclave/Microchip)", "DUPLO LAB"),
        ("RASTREAMENTO PÚBLICO", "Acompanhe o status do serviço online pelo código de OS", "SISTEMA PRÓPRIO"),
    ]
    
    row_y = 515
    for label, val, st in specs:
        draw_spec_row(draw, 105, row_y, width - 210, label, val, st, font_lbl=font_mono, font_val=font_mono_b)
        row_y += 76
        
    # Informação da Loja Física (Credibilidade de 10 Anos)
    store_box = [105, 875, width - 105, 965]
    draw.rectangle(store_box, fill=(13, 13, 18), outline=(32, 34, 46), width=1)
    draw.text((130, 890), "SEDE FÍSICA ESTABELECIDA HÁ UMA DÉCADA:", font=font_mono_b, fill=ACCENT_CYAN)
    draw.text((130, 922), "Rua Coronel Teófilo Leme, 967 - Centro de Bragança Paulista | Estacionamento e balcão aberto.", font=font_body, fill=TEXT_WHITE)

    # Bloco CTA Rodapé
    cta_box = [70, 1030, width - 70, 1220]
    draw.rectangle(cta_box, fill=ACCENT_GREEN)
    
    draw.text((110, 1055), "AGENDAR COLETA NO SEU ENDEREÇO OU ESCRITÓRIO", font=font_subhero, fill=(5, 15, 10))
    draw.text((110, 1105), "Atendimento em Bragança Paulista, Atibaia, Itatiba e Cidades Vizinhas", font=font_mono_b, fill=(10, 35, 20))
    draw.text((110, 1145), "SOLICITE O LEVA-E-TRAZ PELO WHATSAPP DA CYBER INFORMÁTICA", font=font_mono, fill=(15, 50, 30))
    
    draw.text((70, 1270), "CYBER INFORMÁTICA • CENTRO DE ENGENHARIA DE HARDWARE • ARTIGO 26 DO CDC", font=font_mono, fill=TEXT_DIM)
    
    filepath = os.path.join(output_dir, "card_03_feed_leva_e_traz.png")
    im.save(filepath, "PNG", quality=95)
    print(f"[OK] Criativo 3 salvo em: {filepath}")
    return filepath


def main():
    target_dirs = [
        r"C:\Users\Iago\.gemini\antigravity\brain\62d15379-aa63-43a0-aae8-d577ac993643\scratch\cyber-tech\marketing",
        r"c:\tech-solutions-ifl\marketing\cyber-v2"
    ]
    
    for d in target_dirs:
        os.makedirs(d, exist_ok=True)
        print(f"--- Gerando Criativos para {d} ---")
        generate_card_01(d)
        generate_card_02(d)
        generate_card_03(d)
        
    print("\n[SUCESSO] Todos os 3 criativos foram gerados com sucesso nas duas pastas!")

if __name__ == "__main__":
    main()
