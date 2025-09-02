import React, { useState, useCallback, useMemo } from 'react';

// Configuração dos monitores (pode crescer com mais opções, categorias, etc.)
const MONITORING_OPTIONS = [
  { 
    key: 'cardioscopia', 
    label: 'Cardioscopia',
    category: 'basico',
    description: 'Monitorização cardíaca contínua'
  },
  { 
    key: 'oximetria', 
    label: 'Oximetria',
    category: 'basico',
    description: 'Saturação de oxigênio'
  },
  { 
    key: 'pani', 
    label: 'PANI',
    category: 'basico',
    description: 'Pressão arterial não invasiva'
  },
  { 
    key: 'capnografia', 
    label: 'Capnografia',
    category: 'avancado',
    description: 'Monitorização de CO₂ expirado'
  },
  { 
    key: 'pai', 
    label: 'PAI',
    category: 'avancado',
    description: 'Pressão arterial invasiva'
  },
  { 
    key: 'pvc', 
    label: 'PVC',
    category: 'avancado',
    description: 'Pressão venosa central'
  },
  { 
    key: 'termometro', 
    label: 'Termômetro',
    category: 'complementar',
    description: 'Monitorização de temperatura'
  },
  { 
    key: 'bis', 
    label: 'BIS',
    category: 'especializado',
    description: 'Índice biespectral'
  },
  { 
    key: 'tof', 
    label: 'TOF',
    category: 'especializado',
    description: 'Relaxamento neuromuscular'
  }
];

// Presets comuns (funcionalidade que pode crescer)
const MONITORING_PRESETS = {
  basic: {
    name: 'Básico',
    items: ['cardioscopia', 'oximetria', 'pani'],
    description: 'Monitorização padrão mínima'
  },
  general: {
    name: 'Anestesia Geral',
    items: ['cardioscopia', 'oximetria', 'pani', 'capnografia'],
    description: 'Padrão para anestesia geral'
  },
  advanced: {
    name: 'Avançado',
    items: ['cardioscopia', 'oximetria', 'pani', 'capnografia', 'pai', 'termometro'],
    description: 'Monitorização completa'
  }
};

const AnesthesiaDescriptionMonitoring = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved,
  patient,
  surgery
}) => {
  // ===== ESTADOS LOCAIS (podem crescer com features específicas) =====
  const [showPresets, setShowPresets] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customMonitors, setCustomMonitors] = useState([]);
  
  // ===== LÓGICA ESPECÍFICA DA SEÇÃO =====
  
  // Geração do texto (função própria da seção)
  const generateText = useCallback(() => {
    const selectedItems = MONITORING_OPTIONS
      .filter(option => data[option.key])
      .map(option => option.label.toLowerCase());
    
    // Adiciona monitores customizados
    const customSelected = customMonitors
      .filter(monitor => data[monitor.key])
      .map(monitor => monitor.label.toLowerCase());
    
    const allSelected = [...selectedItems, ...customSelected];
    
    if (allSelected.length === 0) return '';
    return `Monitorização: ${allSelected.join(', ')}.`;
  }, [data, customMonitors]);
  
  // Automação: aplicar preset
  const applyPreset = useCallback((presetKey) => {
    const preset = MONITORING_PRESETS[presetKey];
    if (!preset) return;
    
    // Limpa seleções atuais
    MONITORING_OPTIONS.forEach(option => {
      onChange(option.key, false);
    });
    
    // Aplica preset
    preset.items.forEach(item => {
      onChange(item, true);
    });
    
    setShowPresets(false);
  }, [onChange]);
  
  // Automação: sugestão baseada no paciente/cirurgia
  const getSuggestedMonitoring = useCallback(() => {
    // Lógica que pode crescer baseada em dados do paciente
    const suggestions = ['cardioscopia', 'oximetria', 'pani'];
    
    // Se anestesia geral, adiciona capnografia
    if (surgery?.anesthesiaType?.includes('geral')) {
      suggestions.push('capnografia');
    }
    
    // Se paciente alto risco, adiciona monitorização invasiva
    if (patient?.riskLevel === 'alto') {
      suggestions.push('pai', 'pvc');
    }
    
    return suggestions;
  }, [patient, surgery]);
  
  // Automação: aplicar sugestão
  const applySuggestion = useCallback(() => {
    const suggestions = getSuggestedMonitoring();
    suggestions.forEach(item => {
      onChange(item, true);
    });
  }, [getSuggestedMonitoring, onChange]);
  
  // Validação específica da seção
  const validation = useMemo(() => {
    const selected = MONITORING_OPTIONS.filter(option => data[option.key]);
    
    if (selected.length === 0) {
      return { isValid: false, message: 'Selecione pelo menos um monitor' };
    }
    
    // Validação: cardioscopia é obrigatória
    if (!data.cardioscopia) {
      return { isValid: false, message: 'Cardioscopia é obrigatória' };
    }
    
    // Validação: oximetria é obrigatória
    if (!data.oximetria) {
      return { isValid: false, message: 'Oximetria é obrigatória' };
    }
    
    return { isValid: true, message: '' };
  }, [data]);
  
  // Função para adicionar monitor customizado (feature que pode crescer)
  const addCustomMonitor = useCallback((name) => {
    const key = `custom_${Date.now()}`;
    const newMonitor = {
      key,
      label: name,
      category: 'custom'
    };
    
    setCustomMonitors(prev => [...prev, newMonitor]);
    onChange(key, true);
  }, [onChange]);
  
  // ===== COMPONENTE DE BOTÃO SALVAR (específico da seção) =====
  const SaveButton = () => {
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
          disabled={!validation.isValid}
          className={`px-3 py-1 rounded text-sm ${
            validation.isValid 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          💾 Salvar Monitorização
        </button>
      );
    }
    
    return (
      <button 
        disabled 
        className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm"
      >
        Salvar Monitorização
      </button>
    );
  };
  
  // ===== CATEGORIZAÇÃO DOS MONITORES =====
  const monitorsByCategory = useMemo(() => {
    const categories = {
      basico: [],
      avancado: [],
      complementar: [],
      especializado: [],
      custom: customMonitors
    };
    
    MONITORING_OPTIONS.forEach(option => {
      categories[option.category].push(option);
    });
    
    return categories;
  }, [customMonitors]);
  
  // ===== RENDER =====
  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Header com título e botão salvar */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">1. Monitorização</h3>
          {!validation.isValid && (
            <p className="text-xs text-red-600 mt-1">{validation.message}</p>
          )}
        </div>
        <SaveButton />
      </div>
      
      {/* Ferramentas de automação */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          📋 Presets
        </button>
        
        <button
          onClick={applySuggestion}
          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          💡 Sugestão Automática
        </button>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          ⚙️ Avançado
        </button>
      </div>
      
      {/* Presets */}
      {showPresets && (
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <h4 className="text-sm font-medium mb-2">Presets de Monitorização:</h4>
          <div className="space-y-2">
            {Object.entries(MONITORING_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="block w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-gray-600">{preset.description}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {preset.items.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Monitores básicos (sempre visíveis) */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Monitorização Básica:</h4>
        <div className="grid grid-cols-3 gap-3">
          {monitorsByCategory.basico.map(option => (
            <label key={option.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data[option.key] || false}
                onChange={(e) => onChange(option.key, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{option.label}</span>
              {(option.key === 'cardioscopia' || option.key === 'oximetria') && (
                <span className="text-xs text-red-500">*</span>
              )}
            </label>
          ))}
        </div>
      </div>
      
      {/* Monitores avançados */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Monitorização Avançada:</h4>
        <div className="grid grid-cols-3 gap-3">
          {monitorsByCategory.avancado.map(option => (
            <label key={option.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data[option.key] || false}
                onChange={(e) => onChange(option.key, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Monitores especializada (expandível) */}
      {showAdvanced && (
        <>
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Monitorização Complementar:</h4>
            <div className="grid grid-cols-3 gap-3">
              {monitorsByCategory.complementar.map(option => (
                <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data[option.key] || false}
                    onChange={(e) => onChange(option.key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Monitorização Especializada:</h4>
            <div className="grid grid-cols-3 gap-3">
              {monitorsByCategory.especializado.map(option => (
                <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data[option.key] || false}
                    onChange={(e) => onChange(option.key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm" title={option.description}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Monitores customizados */}
      {customMonitors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Monitores Customizados:</h4>
          <div className="space-y-2">
            {customMonitors.map(monitor => (
              <label key={monitor.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data[monitor.key] || false}
                  onChange={(e) => onChange(monitor.key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">{monitor.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Preview da seção */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Preview:</strong>
        <div className="mt-1">
          {generateText() || 'Selecione os monitores utilizados...'}
        </div>
      </div>
      
      {/* Debug info (development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>Debug Monitorização:</strong> Selecionados: {Object.keys(data).filter(k => data[k]).length}, 
          Válido: {validation.isValid ? 'Sim' : 'Não'}
        </div>
      )}
    </div>
  );
};

export default AnesthesiaDescriptionMonitoring;