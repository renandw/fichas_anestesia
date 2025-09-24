import React from 'react';
import { createPortal } from 'react-dom';

let __PRINT_HOST__ = null; // singleton host div reused across mounts
const getPrintHost = () => {
  if (__PRINT_HOST__ && document.body.contains(__PRINT_HOST__)) return __PRINT_HOST__;
  const el = document.createElement('div');
  el.id = 'print-container-host';
  __PRINT_HOST__ = el;
  return __PRINT_HOST__;
};

const PrintContainer = ({ children }) => {
  const [host] = React.useState(getPrintHost);

  React.useEffect(() => {
    host.className = 'print-version';
    host.setAttribute('data-print-active', 'true');

    // Desativa e remove quaisquer outros contêineres de impressão órfãos
    document.querySelectorAll('.print-version, [id^="print-container-"]').forEach(el => {
      if (el !== host) {
        el.setAttribute && el.setAttribute('data-print-active', 'false');
        if (el.id && el.id !== 'print-container-host' && document.body.contains(el)) {
          document.body.removeChild(el);
        }
      }
    });

    // Garante que o singleton esteja anexado apenas uma vez
    if (!document.body.contains(host)) {
      host.style.position = 'absolute';
      host.style.left = '-99999px';
      host.style.top = '0';
      host.style.width = '210mm';
      host.style.pointerEvents = 'none';
      document.body.appendChild(host);
    }

    return () => {
      // Não remove o host; apenas marca como inativo para impedir duplicidade
      host.setAttribute('data-print-active', 'false');
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

  /* Esconde tudo exceto contêineres de impressão */
  body > *:not(.print-version) {
    display: none !important;
  }

  /* Garante que apenas o contêiner de impressão ATIVO apareça */
  .print-version { 
    display: none !important;
  }
  .print-version[data-print-active="true"] {
    display: block !important;
  }

  /* Traz o container do portal para o fluxo na impressão */
  .print-version { 
    position: static !important;
    left: auto !important;
    top: auto !important;
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