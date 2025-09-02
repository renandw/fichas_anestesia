import React, { useState, useEffect, useRef } from 'react';
import { Printer, ZoomIn, ZoomOut, CheckCircle2, Loader2 } from 'lucide-react';

const PreviewWrapper = ({ scale, onScaleChange, onPrint, onFinalize, finalizing: externalFinalizing, extraActions, sheetType, onSheetTypeChange, children }) => {
  const [internalFinalizing, setInternalFinalizing] = useState(false);
  const finalizing = externalFinalizing ?? internalFinalizing;

  const [printArmed, setPrintArmed] = useState(false);
  const printTimerRef = useRef(null);

  const getSheetLabel = (t) => (t === 'anesthesia' ? 'Anestésica' : 'Pré-Anestésica');

  const SheetSelector = ({ sheetType, onSheetTypeChange }) => (
    <div className="flex bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => onSheetTypeChange('anesthesia')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          sheetType === 'anesthesia' 
            ? 'bg-blue-600 text-white shadow-sm' 
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        Ficha Anestésica
      </button>
      <button
        onClick={() => onSheetTypeChange('preanesthesia')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          sheetType === 'preanesthesia' 
            ? 'bg-blue-600 text-white shadow-sm' 
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        Pré-Anestésica
      </button>
    </div>
  );

  const adjustScale = (delta) => {
    const newScale = Math.max(0.3, Math.min(1.2, scale + delta));
    onScaleChange(newScale);
  };

  const handleFinalizeClick = async () => {
    if (!onFinalize || finalizing) return;
    try {
      setInternalFinalizing(true);
      await onFinalize();
    } catch (e) {
      // deixe o componente pai lidar com erros via onFinalize, se desejar
    } finally {
      setInternalFinalizing(false);
    }
  };

  const handlePrintTapMobile = () => {
    if (!onPrint) return;
    if (!printArmed) {
      setPrintArmed(true);
      if (printTimerRef.current) clearTimeout(printTimerRef.current);
      printTimerRef.current = setTimeout(() => {
        setPrintArmed(false);
        printTimerRef.current = null;
      }, 5000);
      return;
    }
    if (printTimerRef.current) {
      clearTimeout(printTimerRef.current);
      printTimerRef.current = null;
    }
    setPrintArmed(false);
    onPrint();
  };

  useEffect(() => {
    return () => {
      if (printTimerRef.current) clearTimeout(printTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-gray-100 print:bg-white print:m-0 pb-32 md:pb-8 pt-[10px] md:pt-0">
      {/* Toolbar Desktop - Top (mostra em md+) */}
      <div className="sticky top-0 z-20 px-3 sm:px-4 py-2 sm:py-3 items-center justify-between hidden md:flex print:hidden mx-[-0.5rem] sm:mx-[-1rem] bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 border border-white/30 dark:border-white/10 ring-1 ring-black/5 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">Preview da Ficha Anestésica</h1>
            <SheetSelector sheetType={sheetType} onSheetTypeChange={onSheetTypeChange} />
          <div className="flex items-center gap-1.5 sm:gap-2" aria-label="Controles de zoom">
            <button
              onClick={() => adjustScale(-0.1)}
              className={`p-2 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${scale <= 0.3 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={scale <= 0.3 ? 'Zoom mínimo' : 'Diminuir zoom'}
              aria-label="Diminuir zoom"
              disabled={scale <= 0.3}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 min-w-[60px] text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => adjustScale(0.1)}
              className={`p-2 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${scale >= 1.2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={scale >= 1.2 ? 'Zoom máximo' : 'Aumentar zoom'}
              aria-label="Aumentar zoom"
              disabled={scale >= 1.2}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {extraActions}
          {onFinalize && (
            <button
              onClick={handleFinalizeClick}
              disabled={finalizing}
              className="flex items-center gap-2 bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              title="Finalizar Ficha Anestésica"
              aria-label="Finalizar Ficha Anestésica"
            >
              {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {finalizing ? 'Finalizando…' : 'Finalizar'}
            </button>
          )}
          <button
            onClick={onPrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            title="Imprimir"
            aria-label="Imprimir"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Indicador superior (mobile) */}
      <div className="fixed top-30 z-30 px-3 py-2 md:hidden flex items-center justify-center print:hidden bg-transparent backdrop-blur-sm w-full">
        <span className="bg-neutral-900/50 text-white text-sm font-medium rounded-full px-3 py-1 shadow-lg border border-white/20 backdrop-blur">
          Ficha {getSheetLabel(sheetType)} • Zoom {Math.round(scale * 100)}%
        </span>
      </div>
      {/* Mini toolbar Mobile - SheetSelector (fica acima da toolbar principal) */}
      <div className="fixed bottom-14 left-0 right-0 z-30 px-3 py-2 md:hidden flex items-center justify-center print:hidden">
        <div className="backdrop-blur-xl bg-white/60 dark:bg-neutral-900/40 supports-[backdrop-filter]:bg-white/40 border border-white/30 dark:border-white/10 shadow-md rounded-2xl px-3 py-2 pointer-events-auto">
          <SheetSelector sheetType={sheetType} onSheetTypeChange={onSheetTypeChange} />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 border-t border-white/30 dark:border-white/10 ring-1 ring-black/5 px-3 py-2 flex md:hidden items-center justify-between gap-2 print:hidden shadow-lg">
        <div className="flex items-center gap-2" aria-label="Controles de zoom">
          <button
            onClick={() => adjustScale(-0.1)}
            className={`p-2 rounded-lg bg-gray-100 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${scale <= 0.3 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={scale <= 0.3 ? 'Zoom mínimo' : 'Diminuir zoom'}
            aria-label="Diminuir zoom"
            disabled={scale <= 0.3}
          >
            <ZoomOut className="w-6 h-6" />
          </button>
          <span className="text-sm text-gray-700 min-w-[48px] text-center select-none">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => adjustScale(0.1)}
            className={`p-2 rounded-lg bg-gray-100 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${scale >= 1.2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={scale >= 1.2 ? 'Zoom máximo' : 'Aumentar zoom'}
            aria-label="Aumentar zoom"
            disabled={scale >= 1.2}
          >
            <ZoomIn className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onFinalize && (
            <button
              onClick={handleFinalizeClick}
              disabled={finalizing}
              className="flex items-center gap-2 bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              title="Finalizar Ficha Anestésica"
              aria-label="Finalizar Ficha Anestésica"
            >
              {finalizing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              <span className="hidden xs:inline">{finalizing ? 'Finalizando…' : 'Finalizar'}</span>
            </button>
          )}
          <button
            onClick={handlePrintTapMobile}
            className={`relative inline-flex items-center bg-blue-600 text-white rounded-lg transition-all duration-200 ${printArmed ? 'bg-blue-700 shadow-lg ring-1 ring-black/10 w-[148px] px-3 justify-start' : 'hover:bg-blue-700 w-11 px-0 justify-center'} h-11`}
            title={printArmed ? 'Toque para imprimir' : 'Imprimir'}
            aria-label="Imprimir"
            aria-expanded={printArmed ? 'true' : 'false'}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <span className={`flex items-center will-change-transform select-none overflow-hidden ${printArmed ? 'gap-4' : 'gap-0'}`}>
              <Printer className="w-5 h-5 flex-shrink-0" />
              <span
                className={`whitespace-nowrap transition-all duration-200 origin-left ${printArmed ? 'opacity-100 scale-100 ml-2' : 'opacity-0 scale-95 w-0 ml-0'} overflow-hidden`}
              >
                Imprimir
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Container da ficha para display em tela */}
      <div 
        className="px-4 pt-20 print:hidden overflow-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch' // Better mobile scrolling
        }}
      >
        <div 
          className="flex justify-center"
          style={{
            // Apply dimensions to the wrapper, not the scaled element
            minWidth: `${200 * scale}mm`,
            minHeight: `${287 * scale}mm`,
            paddingBottom: '2rem' // Add some bottom spacing
          }}
        >
          <div 
            className="bg-white shadow-lg"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease'
              // ✅ No dimensions here - let the content determine size
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewWrapper;