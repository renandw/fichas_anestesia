import React, { useState, useCallback, useMemo } from 'react';

// Configurações de opções (podem crescer com mais detalhes)
const VENTILATORY_OPTIONS = [
  { 
    key: 'espontanea', 
    label: 'Ventilação Espontânea',
    description: 'Paciente respirando sem assistência',
    isDefault: true
  },
  { 
    key: 'vm_invasiva', 
    label: 'VM Invasiva',
    description: 'Ventilação mecânica via tubo/traqueostomia',
    requiresDetails: true
  },
  { 
    key: 'vm_nao_invasiva', 
    label: 'VM Não Invasiva',
    description: 'Ventilação por máscara/interface não invasiva',
    requiresDetails: true
  }
];

const OXYGEN_OPTIONS = [
  { 
    key: 'ar_ambiente', 
    label: 'Ar Ambiente',
    description: 'FiO₂ 21%',
    isDefault: true
  },
  { 
    key: 'cateter_2l', 
    label: 'Cateter O₂ 2L/min',
    description: 'Aproximadamente FiO₂ 28%'
  },
  { 
    key: 'cateter_custom', 
    label: 'Cateter O₂ (customizado)',
    description: 'Fluxo personalizado',
    requiresInput: true
  },
  { 
    key: 'mascara_5l', 
    label: 'Máscara O₂ 5L/min',
    description: 'Aproximadamente FiO₂ 40%'
  },
  { 
    key: 'fio2_variavel', 
    label: 'FiO₂ Variável',
    description: 'Concentração específica',
    requiresInput: true
  }
];

const HEMODYNAMIC_OPTIONS = [
  { 
    key: 'estavel', 
    label: 'Estável',
    description: 'Sem necessidade de drogas vasoativas',
    isDefault: true
  },
  { 
    key: 'instavel', 
    label: 'Instável',
    description: 'Requer suporte hemodinâmico',
    requiresDetails: true
  }
];

const CONSCIOUSNESS_ADULT_OPTIONS = [
  { key: 'lucido', label: 'Lúcido e Orientado', isDefault: true },
  { key: 'sedado_responsivo', label: 'Sedado Responsivo' },
  { key: 'sedado_nao_responsivo', label: 'Sedado Não Responsivo' },
  { key: 'confuso_agitado', label: 'Confuso/Agitado' },
  { key: 'torporoso', label: 'Torporoso' }
];

const CONSCIOUSNESS_PEDIATRIC_OPTIONS = [
  { key: 'ativo_responsivo', label: 'Ativo e Responsivo', isDefault: true },
  { key: 'calmo_responsivo', label: 'Calmo e Responsivo' },
  { key: 'sonolento_responde_chamado', label: 'Sonolento, Responsivo ao Chamado' },
  { key: 'sedado_responde_dor', label: 'Sedado, Responsivo a Estímulo Doloroso' },
  { key: 'torporoso', label: 'Torporoso' }
];

// Templates por tipo de cirurgia (pode crescer)
const ADMISSION_TEMPLATES = {
  eletiva_adulto: {
    name: 'Eletiva Adulto Padrão',
    data: {
      ventilatory: 'espontanea',
      oxygen: 'ar_ambiente',
      hemodynamic: 'estavel',
      consciousness: 'lucido'
    }
  },
  eletiva_pediatrico: {
    name: 'Eletiva Pediátrica Padrão',
    data: {
      ventilatory: 'espontanea',
      oxygen: 'ar_ambiente',
      hemodynamic: 'estavel',
      consciousness: 'ativo_responsivo'
    }
  },
  urgencia: {
    name: 'Urgência',
    data: {
      ventilatory: 'espontanea',
      oxygen: 'cateter_2l',
      hemodynamic: 'estavel'
    }
  }
};

const AnesthesiaDescriptionAdmission = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved,
  patient,
  surgery,
  age,
  isChild
}) => {
  // ===== ESTADOS LOCAIS =====
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVasoactives, setShowVasoactives] = useState(false);
  const [showVenousAccess, setShowVenousAccess] = useState(false);
  const [customOxygenFlow, setCustomOxygenFlow] = useState('');
  const [customFiO2, setCustomFiO2] = useState('');
  
  // ===== CÁLCULOS E FORMATAÇÃO DE IDADE =====
  const formatPatientAge = useCallback(() => {
    if (!patient?.patientBirthDate || !surgery?.surgeryDate) return '';
    
    const birth = new Date(patient.patientBirthDate);
    const surgeryDate = new Date(surgery.surgeryDate);
    
    let years = surgeryDate.getFullYear() - birth.getFullYear();
    const beforeBirthday = (surgeryDate.getMonth() < birth.getMonth()) || 
                          (surgeryDate.getMonth() === birth.getMonth() && surgeryDate.getDate() < birth.getDate());
    if (beforeBirthday) years--;

    const afterYears = new Date(birth);
    afterYears.setFullYear(birth.getFullYear() + years);

    let months = surgeryDate.getMonth() - afterYears.getMonth();
    if (surgeryDate.getDate() < birth.getDate()) months--;
    if (months < 0) months += 12;

    const afterMonths = new Date(afterYears);
    afterMonths.setMonth(afterYears.getMonth() + months);

    const msPerDay = 24 * 60 * 60 * 1000;
    let days = Math.floor((surgeryDate - afterMonths) / msPerDay);
    if (days < 0) days = 0;

    const fmt = (n, sing, plural) => `${n} ${n === 1 ? sing : plural}`;

    if (years < 1) {
      const segMes = months > 0 ? fmt(months, 'mês', 'meses') : null;
      const segDia = days > 0 ? fmt(days, 'dia', 'dias') : null;
      return [segMes, segDia].filter(Boolean).join(' e ');
    }
    if (years >= 1 && years < 12) {
      const segAno = fmt(years, 'ano', 'anos');
      const segMes = months > 0 ? fmt(months, 'mês', 'meses') : null;
      return [segAno, segMes].filter(Boolean).join(' e ');
    }
    return fmt(years, 'ano', 'anos');
  }, [patient?.patientBirthDate, surgery?.surgeryDate]);
  
  // ===== GERAÇÃO DE TEXTO =====
  const generateText = useCallback(() => {
    const parts = [];
    
    // Mapeamentos
    const ventMap = {
      espontanea: 'ventilação espontânea',
      vm_invasiva: 'ventilação mecânica invasiva',
      vm_nao_invasiva: 'ventilação mecânica não invasiva'
    };
    
    const oxygenMap = {
      ar_ambiente: 'ar ambiente',
      cateter_2l: 'O₂ por cateter nasal 2 L/min',
      cateter_custom: data.customOxygenFlow ? `O₂ por cateter nasal ${data.customOxygenFlow} L/min` : 'O₂ por cateter nasal',
      mascara_5l: 'O₂ por máscara facial 5 L/min',
      fio2_variavel: data.customFiO2 ? `FiO₂ ${data.customFiO2}%` : 'FiO₂ variável'
    };
    
    const hemoMap = {
      estavel: 'hemodinamicamente estável',
      instavel: 'hemodinamicamente instável'
    };
    
    const consAdultMap = {
      lucido: 'lúcido e orientado',
      sedado_responsivo: 'sedado responsivo',
      sedado_nao_responsivo: 'sedado não responsivo',
      confuso_agitado: 'confuso/agitado',
      torporoso: 'torporoso'
    };
    
    const consPedMap = {
      ativo_responsivo: 'ativo e responsivo',
      calmo_responsivo: 'calmo e responsivo',
      sonolento_responde_chamado: 'sonolento, responsivo ao chamado',
      sedado_responde_dor: 'sedado, responsivo a estímulo doloroso',
      torporoso: 'torporoso'
    };
    
    // Construção do texto
    if (data.ventilatory) parts.push(ventMap[data.ventilatory]);
    if (data.oxygen) parts.push(oxygenMap[data.oxygen]);
    if (data.hemodynamic) parts.push(hemoMap[data.hemodynamic]);
    
    // Consciência baseada na idade
    if (isChild && data.consciousnessPediatric) {
      parts.push(consPedMap[data.consciousnessPediatric]);
    } else if (!isChild && data.consciousnessAdult) {
      parts.push(consAdultMap[data.consciousnessAdult]);
    }
    
    if (parts.length === 0) return '';
    
    // Prefixo baseado na idade
    const patientAge = formatPatientAge();
    const weight = surgery?.patientWeight ? `${surgery.patientWeight} kg` : '';
    
    let prefix = 'Paciente admitido em sala cirúrgica';
    
    if (isChild) {
      const ageInfo = [patientAge, weight].filter(Boolean).join(', ');
      prefix = ageInfo ? `Paciente pediátrico de ${ageInfo} admitido em sala cirúrgica` : 'Paciente pediátrico admitido em sala cirúrgica';
    }
    
    return `${prefix}, ${parts.join(', ')}.`;
  }, [data, isChild, formatPatientAge, surgery?.patientWeight]);
  
  // ===== AUTOMAÇÕES =====
  const applyTemplate = useCallback((templateKey) => {
    const template = ADMISSION_TEMPLATES[templateKey];
    if (!template) return;
    
    Object.entries(template.data).forEach(([field, value]) => {
      onChange(field, value);
    });
    
    setShowTemplates(false);
  }, [onChange]);
  
  const getSuggestedAdmission = useCallback(() => {
    // Sugestão baseada no tipo de cirurgia e paciente
    if (surgery?.urgency === 'emergencia') {
      return ADMISSION_TEMPLATES.urgencia.data;
    }
    
    if (isChild) {
      return ADMISSION_TEMPLATES.eletiva_pediatrico.data;
    }
    
    return ADMISSION_TEMPLATES.eletiva_adulto.data;
  }, [surgery, isChild]);
  
  const applySuggestion = useCallback(() => {
    const suggestion = getSuggestedAdmission();
    Object.entries(suggestion).forEach(([field, value]) => {
      onChange(field, value);
    });
  }, [getSuggestedAdmission, onChange]);
  
  // ===== VALIDAÇÃO =====
  const validation = useMemo(() => {
    // Validações básicas (podem crescer)
    if (!data.ventilatory) {
      return { isValid: false, message: 'Condição ventilatória é obrigatória' };
    }
    
    if (!data.hemodynamic) {
      return { isValid: false, message: 'Condição hemodinâmica é obrigatória' };
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
          💾 Salvar Admissão
        </button>
      );
    }
    
    return (
      <button 
        disabled 
        className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm"
      >
        Salvar Admissão
      </button>
    );
  };
  
  // ===== RENDER =====
  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">2. Condições de Admissão</h3>
          {!validation.isValid && (
            <p className="text-xs text-red-600 mt-1">{validation.message}</p>
          )}
          {age !== null && (
            <p className="text-xs text-gray-600 mt-1">
              {isChild ? `👶 Paciente pediátrico: ${formatPatientAge()}` : `👤 Paciente adulto: ${age} anos`}
              {surgery?.patientWeight && ` • ${surgery.patientWeight} kg`}
            </p>
          )}
        </div>
        <SaveButton />
      </div>
      
      {/* Ferramentas de automação */}
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
          💡 Sugestão Automática
        </button>
      </div>
      
      {/* Templates */}
      {showTemplates && (
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <h4 className="text-sm font-medium mb-2">Templates de Admissão:</h4>
          <div className="space-y-2">
            {Object.entries(ADMISSION_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className="block w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50"
              >
                <div className="font-medium">{template.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Formulário principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Ventilação */}
        <div>
          <label className="block text-sm font-medium mb-2">Condição Ventilatória *</label>
          <div className="space-y-2">
            {VENTILATORY_OPTIONS.map(option => (
              <label key={option.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ventilatory"
                  value={option.key}
                  checked={data.ventilatory === option.key}
                  onChange={(e) => onChange('ventilatory', e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{option.label}</span>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        {/* Oxigenação */}
        <div>
          <label className="block text-sm font-medium mb-2">Suporte de O₂</label>
          <div className="space-y-2">
            {OXYGEN_OPTIONS.map(option => (
              <div key={option.key}>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="oxygen"
                    value={option.key}
                    checked={data.oxygen === option.key}
                    onChange={(e) => onChange('oxygen', e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">{option.label}</span>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                </label>
                
                {/* Inputs customizados */}
                {option.requiresInput && data.oxygen === option.key && (
                  <div className="ml-6 mt-2">
                    {option.key === 'cateter_custom' && (
                      <input
                        type="text"
                        placeholder="Fluxo (L/min)"
                        value={data.customOxygenFlow || ''}
                        onChange={(e) => onChange('customOxygenFlow', e.target.value)}
                        className="w-24 px-2 py-1 text-xs border rounded"
                      />
                    )}
                    {option.key === 'fio2_variavel' && (
                      <input
                        type="text"
                        placeholder="FiO₂ (%)"
                        value={data.customFiO2 || ''}
                        onChange={(e) => onChange('customFiO2', e.target.value)}
                        className="w-24 px-2 py-1 text-xs border rounded"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Hemodinâmica */}
        <div>
          <label className="block text-sm font-medium mb-2">Condição Hemodinâmica *</label>
          <div className="space-y-2">
            {HEMODYNAMIC_OPTIONS.map(option => (
              <label key={option.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hemodynamic"
                  value={option.key}
                  checked={data.hemodynamic === option.key}
                  onChange={(e) => onChange('hemodynamic', e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{option.label}</span>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        {/* Consciência (baseada na idade) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Nível de Consciência {isChild ? '(Pediátrico)' : '(Adulto)'}
          </label>
          <div className="space-y-2">
            {(isChild ? CONSCIOUSNESS_PEDIATRIC_OPTIONS : CONSCIOUSNESS_ADULT_OPTIONS).map(option => (
              <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={isChild ? "consciousnessPediatric" : "consciousnessAdult"}
                  value={option.key}
                  checked={data[isChild ? 'consciousnessPediatric' : 'consciousnessAdult'] === option.key}
                  onChange={(e) => onChange(isChild ? 'consciousnessPediatric' : 'consciousnessAdult', e.target.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* Seções expandíveis */}
      <div className="mb-4 space-y-2">
        <button
          onClick={() => setShowVasoactives(!showVasoactives)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showVasoactives ? '▼' : '▶'} Drogas Vasoativas
        </button>
        
        <button
          onClick={() => setShowVenousAccess(!showVenousAccess)}
          className="text-sm text-blue-600 hover:text-blue-800 ml-4"
        >
          {showVenousAccess ? '▼' : '▶'} Acessos Venosos
        </button>
      </div>
      
      {/* Preview da seção */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Preview:</strong>
        <div className="mt-1">
          {generateText() || 'Selecione as condições de admissão...'}
        </div>
      </div>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>Debug Admissão:</strong> Idade: {age}, Pediátrico: {isChild ? 'Sim' : 'Não'}, 
          Válido: {validation.isValid ? 'Sim' : 'Não'}
        </div>
      )}
    </div>
  );
};

export default AnesthesiaDescriptionAdmission;