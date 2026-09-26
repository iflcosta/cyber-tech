import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Cyber Informática — Computadores à Pronta-Entrega, Manutenção Rápida e Laboratório Próprio em Bragança Paulista";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Linhas de Grid Estrutural Laterais (Para o formato 1200x630 completo) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 285,
            width: 2,
            backgroundColor: "#27272a",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 285,
            width: 2,
            backgroundColor: "#27272a",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 40,
            height: 2,
            backgroundColor: "#27272a",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 40,
            height: 2,
            backgroundColor: "#27272a",
          }}
        />

        {/* ZONA SEGURA CENTRAL 1:1 (570x550px) — Nunca corta na miniatura quadrada do WhatsApp */}
        <div
          style={{
            width: 570,
            height: 550,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "36px 38px",
            backgroundColor: "#09090b",
            border: "2px solid #ffffff",
          }}
        >
          {/* Topo: Cidade + 10 Anos */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid #27272a",
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: "#a1a1aa",
                textTransform: "uppercase",
              }}
            >
              BRAGANÇA PAULISTA · SP
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.1em",
                backgroundColor: "#ffffff",
                color: "#09090b",
                padding: "4px 10px",
                textTransform: "uppercase",
              }}
            >
              10 ANOS NO CENTRO
            </div>
          </div>

          {/* Marca Principal Centralizada e Legível sem Corte */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: "#ffffff",
                  color: "#09090b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: 900,
                }}
              >
                C
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.95,
                    color: "#ffffff",
                  }}
                >
                  CYBER
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.28em",
                    color: "#d4d4d8",
                    marginTop: 4,
                  }}
                >
                  INFORMÁTICA
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 21,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.28,
                marginTop: 22,
              }}
            >
              Computadores à Pronta-Entrega, Bancada Rápida e Laboratório Próprio.
            </div>
          </div>

          {/* 3 Pilares em Tabela Suíça */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid #27272a",
              borderBottom: "1px solid #27272a",
              paddingTop: 12,
              paddingBottom: 12,
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 15,
              }}
            >
              <span style={{ color: "#ffffff", fontWeight: 700 }}>
                01 · PCs Gamer, Workstation & Office
              </span>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>PRONTA-ENTREGA</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 15,
              }}
            >
              <span style={{ color: "#ffffff", fontWeight: 700 }}>
                02 · Manutenção, SSD NVMe & Periféricos
              </span>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>1º ANDAR</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 15,
              }}
            >
              <span style={{ color: "#ffffff", fontWeight: 700 }}>
                03 · Placas de Vídeo & Troca de Vidro
              </span>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>2º ANDAR</span>
            </div>
          </div>

          {/* Rodapé da Caixa Segura */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#d4d4d8",
            }}
          >
            <span>R. CEL. TEÓFILO LEME, 967 — CENTRO</span>
            <span style={{ color: "#ffffff" }}>(11) 95436-9269</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
