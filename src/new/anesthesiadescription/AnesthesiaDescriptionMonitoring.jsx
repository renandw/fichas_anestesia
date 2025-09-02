import React, { useEffect, useRef, useState } from 'react';
import { useFloating, offset, flip, shift, size, autoUpdate } from '@floating-ui/react';

// Lista centralizada de monitores (ordem define a apresentação e o texto)
const MONITORING_OPTIONS = [
  { key: 'cardioscopia', label: 'Cardioscopia', text: 'cardioscopia' },
  { key: 'oximetria',    label: 'Oximetria',    text: 'oximetria' },
  { key: 'pani',         label: 'PANI',         text: 'PANI' },
  { key: 'capnografia',  label: 'Capnografia',  text: 'capnografia' },
  { key: 'pai',          label: 'PAI',          text: 'PAI' },
  { key: 'pvc',          label: 'PVC',          text: 'PVC' },
  { key: 'termometro',   label: 'Termômetro',   text: 'termômetro' },
  { key: 'bis',          label: 'BIS',          text: 'BIS' },
  { key: 'tof',          label: 'TOF',          text: 'TOF' },
];

// Função de geração própria do componente
export const generateMonitoringText = (monitoring) => {
  if (!monitoring) return '';
  const items = MONITORING_OPTIONS
    .filter(opt => monitoring[opt.key])
    .map(opt => opt.text);

  // v2: lista de personalizados (preferencial)
  if (Array.isArray(monitoring.customMonitorings)) {
    monitoring.customMonitorings
      .map(v => (v || '').trim())
      .filter(Boolean)
      .forEach(v => items.push(v));
  }

  // compat: campo antigo único
  if (!Array.isArray(monitoring.customMonitorings) && monitoring.customMonitoringEnabled) {
    const custom = (monitoring.customMonitoring || '').trim();
    if (custom) items.push(custom);
  }

  if (items.length === 0) return '';
  return `Checklist de materiais de anestesia. Monitorização: ${items.join(', ')}.`;
};

// SaveButton próprio
const SaveButton = ({ section, hasChanges, isSaving, onSave, everSaved }) => {
  if (isSaving) {
    return (
      <button 
        disabled 
        className="px-3 py-1 bg-gray-400 text-white rounded text-sm flex items-center gap-1"
      >
        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
        Salvando...
      </button>
    );
  }
  
  if (!hasChanges && everSaved) {
    return (
      <button 
        disabled 
        className="px-3 py-1 bg-green-500 text-white rounded text-sm"
      >
        ✓ Salvo
      </button>
    );
  }
  
  if (hasChanges) {
    return (
      <button 
        onClick={onSave}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
      >
        💾 Salvar {section}
      </button>
    );
  }
  
  return (
    <button 
      disabled 
      className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm"
    >
      Salvar {section}
    </button>
  );
};

const AnesthesiaDescriptionMonitoring = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved
}) => {
  const customWrapperRef = useRef(null);
  const popoverRef = useRef(null);
  const [customOpen, setCustomOpen] = useState(false); // controla apenas a UI (popover) e não o estado clínico

  // Floating UI for popover positioning
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    open: customOpen,
    onOpenChange: setCustomOpen,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: 'start' }),
      shift({ padding: 8 }),
      size({
        apply({ availableWidth, availableHeight, elements }) {
          const maxW = Math.min(availableWidth, Math.floor(window.innerWidth * 0.92));
          const maxH = Math.min(availableHeight, Math.floor(window.innerHeight * 0.6));
          Object.assign(elements.floating.style, {
            maxWidth: `${maxW}px`,
            maxHeight: `${maxH}px`,
          });
        },
      }),
    ],
  });

  const [customInput, setCustomInput] = useState('');

  const addCustomMonitoring = (value) => {
    const v = (value || '').trim();
    if (!v) return;
    const list = Array.isArray(data.customMonitorings) ? [...data.customMonitorings] : [];
    // evita duplicatas (case-insensitive)
    const exists = list.some(x => x.toLowerCase() === v.toLowerCase());
    if (!exists) {
      onChange('customMonitorings', [...list, v]);
    }
  };

  const removeCustomMonitoring = (value) => {
    const v = (value || '').trim();
    const list = Array.isArray(data.customMonitorings) ? data.customMonitorings : [];
    const next = list.filter(x => x.toLowerCase() !== v.toLowerCase());
    onChange('customMonitorings', next);
  };

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!customOpen) return;
      const wrapper = customWrapperRef.current;
      if (wrapper && !wrapper.contains(e.target)) {
        setCustomOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [customOpen]);


  return (
    <div className="bg-white border rounded-lg p-3 sm:p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Monitorização</h3>
      </div>
      
      {/* Ações rápidas */}
      <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Presets</div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            MONITORING_OPTIONS.forEach(opt => {
              const isBasic = ['cardioscopia','oximetria','pani'].includes(opt.key);
              onChange(opt.key, isBasic);
            });
            onChange('customMonitoringEnabled', false);
            onChange('customMonitoring', '');
            onChange('customMonitorings', []);
            setCustomOpen(false);
          }}
          className="w-full sm:w-auto px-3 py-2 sm:py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-800 shadow-sm"
        >
          <span className="inline-flex items-center gap-2"><span aria-hidden>🩺</span> Monitorização Básica</span>
        </button>
        <button
          type="button"
          onClick={() => {
            MONITORING_OPTIONS.forEach(opt => {
              const isGeneral = ['cardioscopia','oximetria','pani','capnografia'].includes(opt.key);
              onChange(opt.key, isGeneral);
            });
            onChange('customMonitoringEnabled', false);
            onChange('customMonitoring', '');
            onChange('customMonitorings', []);
            setCustomOpen(false);
          }}
          className="w-full sm:w-auto px-3 py-2 sm:py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-800 shadow-sm"
        >
          <span className="inline-flex items-center gap-2"><span aria-hidden>💉</span> Anestesia geral</span>
        </button>
      </div>
      <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Ações</div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            MONITORING_OPTIONS.forEach(opt => onChange(opt.key, false));
            onChange('customMonitoringEnabled', false);
            onChange('customMonitoring', '');
            onChange('customMonitorings', []);
            setCustomOpen(false);
          }}
          className="w-full sm:w-auto px-3 py-2 sm:py-1 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-sm text-red-700 shadow-sm"
        >
          <span className="inline-flex items-center gap-2"><span aria-hidden>🧹</span> Limpar</span>
        </button>
      </div>
      <div className="border-t border-gray-200 my-3" />

      <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Monitores</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3 mb-4">
        {MONITORING_OPTIONS.map(option => {
          const selected = !!data[option.key];
          return (
            <button
              key={option.key}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => onChange(option.key, !selected)}
              className={`px-4 rounded-full text-sm border transition select-none min-w-[10rem] sm:min-w-[10.5rem] h-9 flex items-center justify-center whitespace-nowrap truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
            >
              {option.label}
            </button>
          );
        })}
        {Array.isArray(data.customMonitorings) && data.customMonitorings.map((label) => (
          <button
            key={`custom-${label}`}
            type="button"
            role="checkbox"
            aria-checked={true}
            onClick={() => removeCustomMonitoring(label)}
            className={"px-4 rounded-full text-sm border transition select-none min-w-[10rem] sm:min-w-[10.5rem] h-9 flex items-center justify-center whitespace-nowrap truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 bg-blue-600 text-white border-blue-600"}
            title={label}
          >
            <span className="truncate max-w-[8rem]">{label}</span>
          </button>
        ))}
        {/* Personalizado como pill */}
        <div className="relative" ref={customWrapperRef}>
          <button
            ref={refs.setReference}
            type="button"
            role="checkbox"
            aria-checked={!!data.customMonitoringEnabled}
            aria-haspopup="dialog"
            aria-expanded={customOpen}
            aria-controls="custom-monitoring-popover"
            onClick={() => {
              setCustomInput('');
              setCustomOpen(prev => !prev);
            }}
            className={`px-4 rounded-full text-sm border transition select-none min-w-[10rem] sm:min-w-[10.5rem] h-9 flex items-center justify-center whitespace-nowrap truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400
              ${customOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
            title="Adicionar monitorização personalizada"
          >
            <span>Personalizado</span>
            {Array.isArray(data.customMonitorings) && data.customMonitorings.length > 0 && !customOpen && (
              <span className="ml-1 text-xs opacity-90"></span>
            )}
          </button>

          {/* Inline no desktop (aparece ao abrir) */}
          {customOpen && (
            <div className="hidden sm:flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="ex.: EEG, NIRS, Doppler…"
                className="w-[22rem] max-w-[92vw] border rounded px-2 py-1 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { addCustomMonitoring(customInput); setCustomInput(''); setCustomOpen(false); }
                  if (e.key === 'Escape') { setCustomOpen(false); }
                }}
              />
              <button
                type="button"
                className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                onClick={() => { addCustomMonitoring(customInput); setCustomInput(''); setCustomOpen(false); }}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => setCustomOpen(false)}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Popover no mobile */}
          {customOpen && (
            <div
              ref={node => { popoverRef.current = node; refs.setFloating(node); }}
              id="custom-monitoring-popover"
              role="dialog"
              aria-modal="true"
              style={floatingStyles}
              className="sm:hidden z-50 w-[min(22rem,92vw)] p-2 bg-white border rounded-lg shadow-md"
            >
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Descreva a monitorização…"
                className="w-full border rounded px-2 py-2 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { addCustomMonitoring(customInput); setCustomInput(''); setCustomOpen(false); }
                  if (e.key === 'Escape') { setCustomOpen(false); }
                }}
              />
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { addCustomMonitoring(customInput); setCustomInput(''); setCustomOpen(false); }}
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setCustomOpen(false)}
                  className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 bg-gray-50 p-2 sm:p-3 rounded">
        {generateMonitoringText(data) || 'Selecione os monitores utilizados...'}
      </div>
      <SaveButton
        section="Monitorização"
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={onSave}
        everSaved={everSaved}
      />
    </div>
  );
};

export default AnesthesiaDescriptionMonitoring;