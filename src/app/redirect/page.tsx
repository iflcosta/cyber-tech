'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

export default function RedirectPage() {
  const searchParams = useSearchParams()
  const progressRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subheadingRef = useRef<HTMLParagraphElement>(null)
  const buttonRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // 1. Start progress bar
    const bar = progressRef.current
    if (bar) {
      setTimeout(() => { bar.style.width = '100%' }, 100)
    }

    // 2. After 2s: update text and show button
    const timer = setTimeout(() => {
      if (headingRef.current)
        headingRef.current.textContent = 'Voucher Validado com Sucesso!'
      if (subheadingRef.current)
        subheadingRef.current.textContent =
          'Clique abaixo para receber seu cupom e iniciar o atendimento exclusivo.'
      if (buttonRef.current) {
        buttonRef.current.style.display = 'block'
        buttonRef.current.classList.add('visible')
      }
    }, 2100)

    return () => clearTimeout(timer)
  }, [])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()

    // Build the internal API URL with all UTM params
    const apiUrl = new URL('/api/redirect/whatsapp', window.location.origin)
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.set(key, value)
    })

    window.location.href = apiUrl.toString()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        :root {
          --bg: #FFFFFF;
          --soft-gray: #F5F5F7;
          --charcoal: #1D1D1F;
          --metallic: #86868B;
          --radius: 12px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
          color: var(--charcoal);
          -webkit-font-smoothing: antialiased;
        }
        .page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          min-height: 100vh;
          padding: 40px 20px;
        }
        header { width: 100%; display: flex; justify-content: center; }
        .logo {
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }
        main {
          text-align: center;
          max-width: 400px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .loader-container {
          width: 100%;
          height: 4px;
          background: var(--soft-gray);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-bar {
          height: 100%;
          width: 0%;
          background: var(--charcoal);
          transition: width 2s cubic-bezier(0.65, 0, 0.35, 1);
        }
        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-top: 10px;
          opacity: 0;
          transform: translateY(10px);
          animation: fadeIn 0.6s forwards 0.2s;
        }
        p {
          font-size: 0.95rem;
          color: var(--metallic);
          line-height: 1.5;
          margin-top: -8px;
          opacity: 0;
          transform: translateY(10px);
          animation: fadeIn 0.6s forwards 0.4s;
        }
        .cta-button {
          display: none;
          background: var(--charcoal);
          color: #fff;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: var(--radius);
          font-size: 1rem;
          font-weight: 600;
          width: 100%;
          margin-top: 10px;
          text-align: center;
          opacity: 0;
          transform: scale(0.95);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        .cta-button.visible {
          display: block;
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .cta-button:active { transform: scale(0.98); }
        footer {
          text-align: center;
          font-size: 0.75rem;
          color: var(--metallic);
          opacity: 0.8;
        }
        @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn  { to { opacity: 1; transform: scale(1); } }
        @media (max-width: 480px) {
          h1 { font-size: 1.3rem; }
          p  { font-size: 0.9rem; }
          .cta-button { padding: 18px 24px; font-size: 0.9rem; }
        }
      `}</style>

      <div className="page">
        <header>
          <div className="logo">Cyber Informática</div>
        </header>

        <main>
          <div className="loader-container">
            <div className="progress-bar" ref={progressRef} />
          </div>
          <h1 ref={headingRef}>Validando seu Voucher de Desconto...</h1>
          <p ref={subheadingRef}>
            Aguarde um instante enquanto conectamos você ao nosso especialista em Bragança Paulista.
          </p>
          <a href="#" className="cta-button" ref={buttonRef} onClick={handleClick}>
            RECEBER VOUCHER NO WHATSAPP
          </a>
        </main>

        <footer>
          Cyber Informática - 20 anos de tradição em tecnologia. Atendimento oficial.
        </footer>
      </div>
    </>
  )
}
