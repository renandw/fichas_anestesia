import React, { useState, useCallback, useMemo } from 'react';

// Configurações de finalização
const COMPLETION_OPTIONS = {
  positionReview: {
    key: 'positionReview',
    label: 'Revisão de posicionamento realizada',
    description: 'Verificação da posição do paciente ao final',
    category: 'routine',
    defaultEnabled: true
  },
  standardEnd: {
    key: 'standardEnd', 
    label: 'Finalização padrão',
    description: 'Respiração espontânea, obedecendo comandos, boa mecânica ventilatória',
    category: 'routine',
    defaultEnabled: true
  },
  extubation: {
    key: 'extubation',
    label: 'Extubação realizada',
    description: 'Retirada do tubo orotraqueal',
    category: 'airway',
    conditions: ['geral_anesthesia']
  },
  reversal: {
    key: 'reversal',
    label: 'Reversão de bloqueio neuromuscular',
    description: 'Uso de sugammadex ou neostigmina',
    category: 'medication',
    fields: {
      agent: { type: 'select', options: ['Sugammadex', 'Neostigmina + Atropina'], label: 'Agente' },
      dose: { type: 'text', label: 'Dose', placeholder: 'mg/kg' }
    }
  },
  complications: {
    key: 'complications',
    label: 'Intercorrências',
    description: 'Eventos adversos durante a anestesia',
    category: 'adverse',
    fields: {
      type: { type: 'select', options: ['Hipotensão', 'Hipertensão', 'Bradicardia', 'Taquicardia', 'Dessaturação', 'Outras'], label: 'Tipo' },
      description: { type: 'textarea', label: 'Descrição', placeholder: 'Descreva a intercorrência e conduta...' },
      resolved: { type: 'checkbox', label: 'Resolvida' }
    }
  }
};

const DESTINATION_OPTIONS = [
  {
    key: 'rpa',
    label: 'RPA (Recuperação Pós-Anestésica)',
    description: 'Recuperação padrão',
    icon: '🏥',
    requirements: ['stable_vital_signs'],
    isDefault: true
  },
  {
    key: 'uti',
    label: 'UTI (Unidade de Terapia Intensiva)', 
    description: 'Cuidados intensivos',
    icon: '🚨',
    requirements: ['continuous_monitoring'],
    fields: {
      reason: { 
        type: 'select', 
        options: ['Instabilidade hemodinâmica', 'Insuficiência respiratória', 'Procedimento de alto risco', 'Comorbidades', 'Outros'], 
        label: 'Motivo',
        required: true
      },
      customReason: { type: 'text', label: 'Outros (especificar)' }
    }
  },
  {
    key: 'centro_cirurgico',
    label: 'Centro Cirúrgico',
    description: 'Permanece no CC',
    icon: '⚕️',
    fields: {
      reason: {
        type: 'select',
        options: ['Aguardando vaga UTI', 'Aguardando vaga RPA', 'Procedimento em andamento'],
        label: 'Motivo',
        required: true
      }
    }
  },
  {
    key: 'enfermaria',
    label: 'Enfermaria',
    description: 'Direto para leito',
    icon: '🛏️',
    requirements: ['low_complexity']
  }
];

// Templates de finalização
const COMPLETION_TEMPLATES = {
  standard: {
    name: 'Finalização Padrão',
    description: 'Sem intercorrências, para RPA',
    data: {
      positionReview: true,
      standardEnd: true,
      extubation: true,
      destination: 'rpa'
    }
  },
  complicated: {
    name: 'Com Intercorrências',
    description: 'Eventos adversos, UTI',
    data: {
      positionReview: true,
      standardEnd: false,
      complications: true,
      destination: 'uti'
    }
  },
  ambulatorial: {
    name: 'Cirurgia Ambulatorial',
    description: 'Alta no mesmo dia',
    data: {
      positionReview: true,
      standardEnd: true,
      extubation: true,
      destination: 'rpa'
    }
  }
};

// Checklist de alta
const DISCHARGE_CHECKLIST = {
  aldrete: {
    name: 'Critérios de Aldrete',
    items: [
      { key: 'activity', label: 'Atividade (movimento voluntário)', max: 2 },
      { key: 'respiration', label: 'Respiração', max: 2 },
      { key: 'circulation', label: 'Circulação', max: 2 },
      { key: 'consciousness', label: 'Consciência', max: 2 },
      { key: 'color', label: 'Coloração', max: 2 }
    ],
    minimumScore: 8
  }
};

const AnesthesiaDescriptionFinal = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved,
  patient,
  surgery
}) => {
  // ===== ESTADOS LOCAIS =====
  const [showTemplates, setShowTemplates] = useState(false);
  const [showComplications, setShowComplications] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [aldreteScore, setAldreteScore] = useState({});
  const [customObservations, setCustomObservations] = useState('');
  
  // ===== CÁLCULOS =====
  const totalAldreteScore = useMemo(() => {
    return Object.values(aldreteScore).reduce((sum, score) => sum + (parseInt(score) || 0), 0);
  }, [aldreteScore]);
  
  const canDischarge = useMemo(() => {
    return totalAldreteScore >= DISCHARGE_CHECKLIST.aldrete.minimumScore;
  }, [totalAldreteScore]);
  
  // ===== GERAÇÃO DE TEXTO =====
  const generateText = useCallback(() => {
    const parts = [];
    
    // Revisão de posicionamento
    if (data.positionReview === true) {
      parts.push('Revisão de posicionamento realizada.');
    }
    
    // Reversão de bloqueio
    if (data.reversal === true) {
      const reversalData = data.reversalData || {};
      let reversalText = 'Reversão de bloqueio neuromuscular';
      if (reversalData.agent) {
        reversalText += ` com ${reversalData.agent}`;
        if (reversalData.dose) {
          reversalText += ` (${reversalData.dose})`;
        }
      }
      reversalText += '.';
      parts.push(reversalText);
    }
    
    // Extubação
    if (data.extubation === true) {
      parts.push('Extubação realizada em sala cirúrgica.');
    }
    
    // Finalização padrão ou customizada
    if (data.standardEnd === true) {
      parts.push('Ao término da cirurgia, paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável.');
    }
    
    // Intercorrências
    if (data.complications === true) {
      const complicationData = data.complicationsData || {};
      if (complicationData.type && complicationData.description) {
        let compText = `Intercorrência: ${complicationData.type} - ${complicationData.description}`;
        if (complicationData.resolved) {
          compText += ' (resolvida)';
        }
        compText += '.';
        parts.push(compText);
      } else {
        parts.push('Intercorrências durante o procedimento (ver observações).');
      }
    }
    
    // Destino
    if (data.destination) {
      const destination = DESTINATION_OPTIONS.find(opt => opt.key === data.destination);
      if (destination) {
        let destText = `Encaminhado à ${destination.label.split(' ')[0]} em `;
        
        // Condição baseada em intercorrências
        if (data.complications === true && !data.complicationsData?.resolved) {
          destText += 'condições que requerem monitorização contínua.';
        } else {
          destText += 'boas condições clínicas.';
        }
        
        // Motivo específico para UTI
        if (data.destination === 'uti') {
          const destinationData = data.destinationData || {};
          if (destinationData.reason) {
            destText += ` Motivo: ${destinationData.reason}`;
            if (destinationData.reason === 'Outros' && destinationData.customReason) {
              destText += ` (${destinationData.customReason})`;
            }
            destText += '.';
          }
        }
        
        parts.push(destText);
      }
    }
    
    // Observações customizadas
    if (customObservations.trim()) {
      parts.push(`Observações: ${customObservations.trim()}`);
    }
    
    return parts.join(' ');
  }, [data, customObservations]);
  
  // ===== AUTOMAÇÕES =====
  const applyTemplate = useCallback((templateKey) => {
    const template = COMPLETION_TEMPLATES[templateKey];
    if (!template) return;
    
    Object.entries(template.data).forEach(([field, value]) => {
      onChange(field, value);
    });
    
    setShowTemplates(false);
  }, [onChange]);
  
  const getSuggestedCompletion = useCallback(() => {
    // Sugestão baseada no tipo de cirurgia e dados do paciente
    if (surgery?.complexity === 'high' || surgery?.duration > 240) {
      return COMPLETION_TEMPLATES.complicated.data;
    }
    
    if (surgery?.type === 'ambulatorial') {
      return COMPLETION_TEMPLATES.ambulatorial.data;
    }
    
    return COMPLETION_TEMPLATES.standard.data;
  }, [surgery]);
  
  const applySuggestion = useCallback(() => {
    const suggestion = getSuggestedCompletion();
    Object.entries(suggestion).forEach(([field, value]) => {
      onChange(field, value);
    });
  }, [getSuggestedCompletion, onChange]);
  
  // ===== HANDLERS =====
  const handleOptionToggle = useCallback((optionKey, enabled) => {
    onChange(optionKey, enabled);
    
    // Auto-expandir complicações se habilitado
    if (optionKey === 'complications' && enabled) {
      setShowComplications(true);
    }
  }, [onChange]);
  
  const handleFieldChange = useCallback((optionKey, field, value) => {
    const currentData = data[`${optionKey}Data`] || {};
    onChange(`${optionKey}Data`, { ...currentData, [field]: value });
  }, [data, onChange]);
  
  const handleAldreteChange = useCallback((item, score) => {
    setAldreteScore(prev => ({ ...prev, [item]: score }));
  }, []);
  
  // ===== VALIDAÇÃO =====
  const validation = useMemo(() => {
    if (!data.destination) {
      return { isValid: false, message: 'Selecione o destino do paciente' };
    }
    
    // Validação específica para UTI
    if (data.destination === 'uti') {
      const destinationData = data.destinationData || {};
      if (!destinationData.reason) {
        return { isValid: false, message: 'UTI: Motivo é obrigatório' };
      }
      if (destinationData.reason === 'Outros' && !destinationData.customReason) {
        return { isValid: false, message: 'UTI: Especifique o motivo' };
      }
    }
    
    // Validação de complicações
    if (data.complications === true) {
      const complicationData = data.complicationsData || {};
      if (!complicationData.type || !complicationData.description) {
        return { isValid: false, message: 'Intercorrências: Tipo e descrição são obrigatórios' };
      }
    }
    
    return { isValid: true, message: '' };
  }, [data]);
  
  // ===== SAVE BUTTON =====
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
          💾 Salvar Finalização
        </button>
      );
    }
    
    return (
      <button 
        disabled 
        className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm"
      >
        Salvar Finalização
      </button>
    );
  };
  
  // ===== RENDER =====
  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">4. Finalização</h3>
          {!validation.isValid && (
            <p className="text-xs text-red-600 mt-1">{validation.message}</p>
          )}
        </div>
        <SaveButton />
      </div>
      
      {/* Ferramentas */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          📋 Templates
        </button>
        
        <button
          onClick={applySuggestion}
          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          💡 Sugestão por Cirurgia
        </button>
        
        <button
          onClick={() => setShowChecklist(!showChecklist)}
          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          ✅ Checklist Aldrete
        </button>
      </div>
      
      {/* Templates */}
      {showTemplates && (
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <h4 className="text-sm font-medium mb-2">Templates de Finalização:</h4>
          <div className="space-y-2">
            {Object.entries(COMPLETION_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className="block w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-gray-600">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Checklist Aldrete */}
      {showChecklist && (
        <div className="mb-4 p-3 bg-purple-50 rounded border">
          <h4 className="text-sm font-medium mb-2">Critérios de Aldrete:</h4>
          <div className="space-y-2">
            {DISCHARGE_CHECKLIST.aldrete.items.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map(score => (
                    <label key={score} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={item.key}
                        value={score}
                        checked={aldreteScore[item.key] == score}
                        onChange={(e) => handleAldreteChange(item.key, e.target.value)}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">{score}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total:</span>
              <span className={`text-sm font-bold ${canDischarge ? 'text-green-600' : 'text-red-600'}`}>
                {totalAldreteScore}/10 {canDischarge ? '✓' : '✗'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Mínimo para alta: {DISCHARGE_CHECKLIST.aldrete.minimumScore} pontos
            </p>
          </div>
        </div>
      )}
      
      {/* Opções de finalização */}
      <div className="mb-4 space-y-3">
        {Object.entries(COMPLETION_OPTIONS).map(([key, option]) => (
          <div key={key} className="border rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data[key] === true}
                onChange={(e) => handleOptionToggle(key, e.target.checked)}
                className="mt-0.5 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{option.label}</div>
                <p className="text-xs text-gray-600">{option.description}</p>
                
                {/* Campos específicos */}
                {data[key] === true && option.fields && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(option.fields).map(([fieldKey, fieldConfig]) => {
                      const currentValue = data[`${key}Data`]?.[fieldKey] || '';
                      
                      return (
                        <div key={fieldKey}>
                          <label className="block text-xs font-medium mb-1">
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {fieldConfig.type === 'select' ? (
                            <select
                              value={currentValue}
                              onChange={(e) => handleFieldChange(key, fieldKey, e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            >
                              <option value="">Selecione...</option>
                              {fieldConfig.options.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : fieldConfig.type === 'textarea' ? (
                            <textarea
                              value={currentValue}
                              onChange={(e) => handleFieldChange(key, fieldKey, e.target.value)}
                              placeholder={fieldConfig.placeholder}
                              className="w-full text-sm border rounded px-2 py-1"
                              rows={2}
                            />
                          ) : fieldConfig.type === 'checkbox' ? (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={currentValue || false}
                                onChange={(e) => handleFieldChange(key, fieldKey, e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-sm">{fieldConfig.label}</span>
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handleFieldChange(key, fieldKey, e.target.value)}
                              placeholder={fieldConfig.placeholder}
                              className="w-full text-sm border rounded px-2 py-1"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>
      
      {/* Destino do paciente */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Destino do Paciente: *</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DESTINATION_OPTIONS.map(option => (
            <div key={option.key} className="border rounded-lg">
              <label className="flex items-start gap-3 p-3 cursor-pointer">
                <input
                  type="radio"
                  name="destination"
                  value={option.key}
                  checked={data.destination === option.key}
                  onChange={(e) => onChange('destination', e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                  
                  {/* Campos específicos do destino */}
                  {data.destination === option.key && option.fields && (
                    <div className="mt-2 space-y-2">
                      {Object.entries(option.fields).map(([fieldKey, fieldConfig]) => {
                        const currentValue = data.destinationData?.[fieldKey] || '';
                        
                        return (
                          <div key={fieldKey}>
                            <label className="block text-xs font-medium mb-1">
                              {fieldConfig.label}
                              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {fieldConfig.type === 'select' ? (
                              <select
                                value={currentValue}
                                onChange={(e) => handleFieldChange('destination', fieldKey, e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1"
                              >
                                <option value="">Selecione...</option>
                                {fieldConfig.options.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => handleFieldChange('destination', fieldKey, e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Observações customizadas */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Observações Adicionais:</label>
        <textarea
          value={customObservations}
          onChange={(e) => setCustomObservations(e.target.value)}
          placeholder="Observações específicas sobre a finalização, intercorrências não cobertas acima, etc..."
          className="w-full text-sm border rounded px-3 py-2"
          rows={2}
        />
      </div>
      
      {/* Preview */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Preview:</strong>
        <div className="mt-1">
          {generateText() || 'Configure as opções de finalização...'}
        </div>
      </div>
      
      {/* Debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>Debug Final:</strong> Destino: {data.destination || 'Nenhum'}, 
          Aldrete: {totalAldreteScore}/10, Válido: {validation.isValid ? 'Sim' : 'Não'}
        </div>
      )}
    </div>
  );
};

export default AnesthesiaDescriptionFinal;