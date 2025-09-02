import React from 'react';
import { createPortal } from 'react-dom';

const PrintContainer = ({ children }) => {
  const [host] = React.useState(() => document.createElement('div'));

  React.useEffect(() => {
    host.className = 'print-version';
    // Mantém montado e mensurável fora da tela (sem display:none)
    host.style.position = 'absolute';
    host.style.left = '-99999px';
    host.style.top = '0';
    host.style.width = '210mm';     // largura alvo de A4
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);
    
    return () => {
      if (document.body.contains(host)) {
        document.body.removeChild(host);
      }
    };
  }, [host]);

  React.useEffect(() => {
    const onBeforePrint = () => {
      // pequena folga para o layout estabilizar
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    };
    const onAfterPrint = () => {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  return createPortal(
    <>
      {children}
      <style>{`
        @media print {
  @page { size: A4; margin: 10mm; } /* margem superior p/ Safari e 1 página */

  html, body {
    height: auto !important;
    background: white !important;
  }

  /* Esconde todos os irmãos diretos do portal para não gerar páginas extras */
  body > *:not(.print-version) {
    display: none !important;
  }

  /* Traz o container do portal para o fluxo na impressão */
  .print-version { 
    position: static !important;
    left: auto !important;
    top: auto !important;
    display: block !important; 
    width: 210mm !important;
    height: auto !important;
    overflow: hidden !important;
  }

  /* Garante que a ficha caiba em 1 página (evita h fixa + padding estourando 297mm) */
  .anesthesia-container {
    box-sizing: content-box !important;
    width: 190mm !important;        /* 210 - 2*10 de margem da página */
    padding: 10mm !important;
    height: auto !important;
    max-height: 277mm !important;   /* 297 - 2*10 de margem da página */
    overflow: visible !important;
    background: white !important;
  }

  /* Evitar quebras ruins apenas onde importa (Safari pode gerar página extra com * ) */
  .anesthesia-container,
  .chart-box {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Garantir que o container dos gráficos tenha tamanho não-zero */
  .chart-box {
    width: 100% !important;
    min-height: 250px !important;
    height: auto !important;
    overflow: visible !important;
  }

  .chart-box canvas,
  .chart-box svg {
    width: 100% !important;
    min-height: 250px !important;
    height: auto !important;
    display: block !important;
    visibility: visible !important;
  }
}
      `}</style>
    </>,
    host
  );
};

export default PrintContainer;