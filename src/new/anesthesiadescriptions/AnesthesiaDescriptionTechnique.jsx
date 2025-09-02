import React, { useState, useCallback, useMemo } from 'react';

// Configurações de técnicas anestésicas
const ANESTHESIA_TECHNIQUES = {
  geral: {
    key: 'geral',
    label: 'Anestesia Geral',
    description: 'Anestesia com perda total de consciência',
    category: 'primary',
    icon: '🫁',
    commonCombinations: ['sedacao', 'regional'],
    fields: {
      totNumber: { type: 'text', label: 'TOT nº', placeholder: '7.0', required: true },
      cormack: { type: 'select', label: 'Cormack-Lehane', options: ['I', 'II', 'III', 'IV'], required: true },
      fixacao: { type: 'text', label: 'Fixação (cm)', placeholder: '21', required: true },
      laringoscopia: { type: 'select', label: 'Laringoscopia', options: ['Direta', 'Videolaringoscopia'], default: 'Direta' },
      difficultIntubation: { type: 'checkbox', label: 'Intubação difícil' },
      rapidSequence: { type: 'checkbox', label: 'Sequência rápida' }
    }
  },
  raquianestesia: {
    key: 'raquianestesia',
    label: 'Raquianestesia',
    description: 'Bloqueio subaracnóide',
    category: 'regional',
    icon: '💉',
    commonCombinations: ['sedacao'],
    fields: {
      agulha: { type: 'select', label: 'Agulha', options: ['25G Quincke', '27G Quincke', '25G Whitacre', '27G Whitacre'], default: '25G Quincke' },
      nivel: { type: 'select', label: 'Nível', options: ['L3-L4', 'L4-L5', 'L2-L3'], default: 'L3-L4' },
      posicao: { type: 'select', label: 'Posição', options: ['Sentado', 'Decúbito lateral'], default: 'Sentado' },
      tentativas: { type: 'number', label: 'Tentativas', default: '1' }
    }
  },
  peridural: {
    key: 'peridural',
    label: 'Peridural',
    description: 'Bloqueio peridural',
    category: 'regional',
    icon: '💉',
    commonCombinations: ['geral'],
    fields: {
      agulha: { type: 'select', label: 'Agulha', options: ['18G Tuohy', '16G Tuohy'], default: '18G Tuohy' },
      nivel: { type: 'select', label: 'Nível', options: ['T12-L1', 'L1-L2', 'L2-L3', 'L3-L4'], default: 'L2-L3' },
      tecnica: { type: 'select', label: 'Técnica', options: ['Doglioti', 'Perda resistência'], default: 'Doglioti' },
      cateter: { type: 'checkbox', label: 'Cateter inserido' }
    }
  },
  sedacao: {
    key: 'sedacao',
    label: 'Sedação',
    description: 'Sedação consciente ou profunda',
    category: 'support',
    icon: '😴',
    commonCombinations: ['raquianestesia', 'peridural'],
    fields: {
      tipo: { type: 'select', label: 'Tipo', options: ['Consciente', 'Profunda'], default: 'Consciente' },
      via: { type: 'select', label: 'Via Aérea', options: ['Cateter nasal', 'Máscara facial', 'Sistema Baraka'], default: 'Cateter nasal' }
    }
  },
  plexoBraquial: {
    key: 'plexoBraquial',
    label: 'Bloqueio de Plexo Braquial',
    description: 'Bloqueio regional de membro superior',
    category: 'regional',
    icon: '💪',
    fields: {
      abordagem: { type: 'select', label: 'Abordagem', options: ['Interescalênica', 'Supraclavicular', 'Axilar'], required: true },
      guia: { type: 'select', label: 'Guia', options: ['Ultrassom', 'Neuroestimulação', 'Ambos'], default: 'Ultrassom' }
    }
  },
  outras: {
    key: 'outras',
    label: 'Outras Técnicas',
    description: 'Técnica personalizada',
    category: 'custom',
    icon: '⚕️',
    fields: {
      nome: { type: 'text', label: 'Nome da Técnica', required: true },
      descricao: { type: 'textarea', label: 'Descrição', required: true }
    }
  }
};

// Templates de combinações comuns
const TECHNIQUE_TEMPLATES = {
  geral_simples: {
    name: 'Anestesia Geral Simples',
    description: 'IOT + manutenção inalatória',
    techniques: ['geral'],
    defaults: {
      geral: { laringoscopia: 'Direta', rapidSequence: false }
    }
  },
  geral_balanceada: {
    name: 'Anestesia Geral Balanceada',
    description: 'IOT + inalatória + opioides',
    techniques: ['geral'],
    defaults: {
      geral: { laringoscopia: 'Direta' }
    }
  },
  raqui_sedacao: {
    name: 'Raquianestesia + Sedação',
    description: 'Bloqueio subaracnóide com sedação',
    techniques: ['raquianestesia', 'sedacao'],
    defaults: {
      raquianestesia: { posicao: 'Sentado' },
      sedacao: { tipo: 'Consciente' }
    }
  },
  geral_peridural: {
    name: 'Geral + Peridural',
    description: 'Anestesia combinada para analgesia pós-operatória',
    techniques: ['geral', 'peridural'],
    defaults: {
      geral: { laringoscopia: 'Direta' },
      peridural: { cateter: true }
    }
  }
};

const AnesthesiaDescriptionTechnique = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved,
  patient,
  surgery,
  age,
  isChild,
  suggestedTOT
}) => {
  // ===== ESTADOS LOCAIS =====
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedTechnique, setExpandedTechnique] = useState(null);
  const [showCombinations, setShowCombinations] = useState(false);
  
  // ===== TÉCNICAS ATIVAS =====
  const activeTechniques = useMemo(() => {
    return Object.keys(ANESTHESIA_TECHNIQUES).filter(key => data[key] === true);
  }, [data]);
  
  // ===== CÁLCULOS DE SUGESTÕES =====
  const getSuggestedFixation = useCallback((totNumber) => {
    if (!totNumber) return '';
    const tot = parseFloat(totNumber.replace(',', '.'));
    if (isNaN(tot)) return '';
    
    if (isChild) {
      return (tot * 3).toFixed(0);
    }
    
    const sex = patient?.patientSex?.toUpperCase();
    return sex === 'F' ? '20' : '22';
  }, [isChild, patient?.patientSex]);
  
  // ===== GERAÇÃO DE TEXTO =====
  const generateText = useCallback(() => {
    const texts = [];
    
    activeTechniques.forEach(techniqueKey => {
      const technique = ANESTHESIA_TECHNIQUES[techniqueKey];
      const techniqueData = data[techniqueKey + 'Data'] || {};
      
      switch (techniqueKey) {
        case 'geral':
          const tot = techniqueData.totNumber || suggestedTOT || '7.0';
          const cormack = techniqueData.cormack || 'I';
          const fixacao = techniqueData.fixacao || getSuggestedFixation(tot) || '21';
          const laringoscopia = techniqueData.laringoscopia || 'Direta';
          const laringoscopiaText = laringoscopia === 'Direta' ? 'laringoscopia direta' : 'videolaringoscopia';
          
          let geralText = `Indução anestésica: a) Desnitrogenização com O₂ 100%; b) Drogas utilizadas conforme seção de medicamentos; c) Intubação orotraqueal com TOT n° ${tot} sob ${laringoscopiaText} (Cormack-Lehane ${cormack}); d) Tubo fixado a ${fixacao} cm na comissura labial.\\nManutenção com drogas descritas em seção de medicações, sob ventilação mecânica. Parâmetros ventilatórios e monitoração contínua mantidos; proteção ocular.`;
          
          if (techniqueData.rapidSequence) {
            geralText = `Indução em sequência rápida. ${geralText}`;
          }
          
          if (techniqueData.difficultIntubation) {
            geralText += ` Intubação considerada difícil.`;
          }
          
          texts.push(geralText);
          break;
          
        case 'raquianestesia':
          const agulha = techniqueData.agulha || '25G Quincke';
          const nivel = techniqueData.nivel || 'L3-L4';
          const posicao = techniqueData.posicao || 'Sentado';
          const tentativas = techniqueData.tentativas || '1';
          
          let raquiText = `Raquianestesia: a) Posicionamento ${posicao.toLowerCase()}; b) Assepsia e antissepsia das mãos e dorso do paciente; c) Agulha ${agulha}, punção única entre ${nivel}. Punção de espaço subaracnóide sem intercorrências; d) LCR límpido, sem alterações; e) Medicações conforme seção de medicamentos.\\nTeste de bloqueio com estímulos térmicos e motores.`;
          
          if (tentativas > 1) {
            raquiText = raquiText.replace('punção única', `${tentativas} tentativas de punção`);
          }
          
          texts.push(raquiText);
          break;
          
        case 'peridural':
          const agulhaP = techniqueData.agulha || '18G Tuohy';
          const nivelP = techniqueData.nivel || 'L2-L3';
          const tecnica = techniqueData.tecnica || 'Doglioti';
          
          let periText = `Peridural: a) Posicionamento sentado; b) Assepsia e antissepsia; c) Agulha ${agulhaP}, punção entre ${nivelP}, confirmação de espaço peridural pela técnica de ${tecnica}; d) Sem acidentes de punção, retorno de líquor ou sangue. Teste de injeção de adrenalina negativo. Medicações descritas na seção de medicamentos.`;
          
          if (techniqueData.cateter) {
            periText += ` Cateter peridural inserido e fixado.`;
          }
          
          texts.push(periText);
          break;
          
        case 'sedacao':
          const tipo = techniqueData.tipo || 'Consciente';
          const via = techniqueData.via || 'Cateter nasal';
          
          let sedacaoText;
          if (isChild && via === 'Sistema Baraka') {
            sedacaoText = `Sedação sob sistema Baraka Mapleson A com medicações descritas na seção de medicações.`;
          } else {
            sedacaoText = `Sedação ${tipo.toLowerCase()} com medicações descritas na seção de medicamentos.`;
            if (via !== 'Sistema Baraka') {
              sedacaoText += ` Suplementação de O₂ via ${via.toLowerCase()}.`;
            }
          }
          
          texts.push(sedacaoText);
          break;
          
        case 'plexoBraquial':
          const abordagem = techniqueData.abordagem || 'Interescalênica';
          const guia = techniqueData.guia || 'Ultrassom';
          
          texts.push(`Bloqueio de plexo braquial por via ${abordagem.toLowerCase()} guiado por ${guia.toLowerCase()}. Visualização de estruturas nervosas. Injeção de anestésico local conforme seção de medicações. Procedimento sem intercorrências.`);
          break;
          
        case 'outras':
          const nome = techniqueData.nome || 'Técnica personalizada';
          const descricao = techniqueData.descricao || 'Descrição personalizada';
          
          texts.push(`${nome}: ${descricao}`);
          break;
      }
    });
    
    return texts.join('\\n\\n');
  }, [data, activeTechniques, suggestedTOT, getSuggestedFixation, isChild]);
  
  // ===== AUTOMAÇÕES =====
  const applyTemplate = useCallback((templateKey) => {
    const template = TECHNIQUE_TEMPLATES[templateKey];
    if (!template) return;
    
    // Limpa seleções atuais
    Object.keys(ANESTHESIA_TECHNIQUES).forEach(key => {
      onChange(key, false);
    });
    
    // Aplica template
    template.techniques.forEach(techniqueKey => {
      onChange(techniqueKey, true);
      
      // Aplica defaults se existirem
      if (template.defaults && template.defaults[techniqueKey]) {
        const defaults = template.defaults[techniqueKey];
        Object.entries(defaults).forEach(([field, value]) => {
          onChange(`${techniqueKey}Data`, { 
            ...data[`${techniqueKey}Data`], 
            [field]: value 
          });
        });
      }
    });
    
    setShowTemplates(false);
  }, [onChange, data]);
  
  const applySuggestion = useCallback(() => {
    // Sugestão baseada no tipo de cirurgia e idade
    if (surgery?.type?.includes('cardiovascular')) {
      applyTemplate('geral_balanceada');
    } else if (surgery?.type?.includes('ortopedica') && !isChild) {
      applyTemplate('raqui_sedacao');
    } else if (isChild) {
      applyTemplate('geral_simples');
    } else {
      applyTemplate('geral_simples');
    }
  }, [surgery, isChild, applyTemplate]);
  
  // ===== HANDLERS =====
  const handleTechniqueToggle = useCallback((techniqueKey, enabled) => {
    onChange(techniqueKey, enabled);
    
    // Auto-sugestões quando habilita técnica
    if (enabled) {
      const technique = ANESTHESIA_TECHNIQUES[techniqueKey];
      const currentData = data[`${techniqueKey}Data`] || {};
      
      if (techniqueKey === 'geral' && !currentData.totNumber) {
        onChange(`${techniqueKey}Data`, {
          ...currentData,
          totNumber: suggestedTOT,
          fixacao: getSuggestedFixation(suggestedTOT),
          cormack: 'I',
          laringoscopia: 'Direta'
        });
      }
    }
    
    // Expande automaticamente quando habilita
    if (enabled) {
      setExpandedTechnique(techniqueKey);
    }
  }, [onChange, data, suggestedTOT, getSuggestedFixation]);
  
  const handleFieldChange = useCallback((techniqueKey, field, value) => {
    const currentData = data[`${techniqueKey}Data`] || {};
    const newData = { ...currentData, [field]: value };
    
    // Auto-sugestão de fixação quando TOT muda
    if (field === 'totNumber' && techniqueKey === 'geral') {
      newData.fixacao = getSuggestedFixation(value);
    }
    
    onChange(`${techniqueKey}Data`, newData);
  }, [data, onChange, getSuggestedFixation]);
  
  // ===== VALIDAÇÃO =====
  const validation = useMemo(() => {
    if (activeTechniques.length === 0) {
      return { isValid: false, message: 'Selecione pelo menos uma técnica anestésica' };
    }
    
    // Validações específicas por técnica
    for (const techniqueKey of activeTechniques) {
      const technique = ANESTHESIA_TECHNIQUES[techniqueKey];
      const techniqueData = data[`${techniqueKey}Data`] || {};
      
      for (const [fieldKey, fieldConfig] of Object.entries(technique.fields || {})) {
        if (fieldConfig.required && !techniqueData[fieldKey]) {
          return { 
            isValid: false, 
            message: `${technique.label}: ${fieldConfig.label} é obrigatório` 
          };
        }
      }
    }
    
    return { isValid: true, message: '' };
  }, [activeTechniques, data]);
  
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
          💾 Salvar Técnica
        </button>
      );
    }
    
    return (
      <button 
        disabled 
        className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm"
      >
        Salvar Técnica
      </button>
    );
  };
  
  // ===== RENDER =====
  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">3. Técnica Anestésica</h3>
          {!validation.isValid && (
            <p className="text-xs text-red-600 mt-1">{validation.message}</p>
          )}
          {activeTechniques.length > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              Técnicas ativas: {activeTechniques.length}
            </p>
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
          onClick={() => setShowCombinations(!showCombinations)}
          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          🔗 Combinações Comuns
        </button>
      </div>
      
      {/* Templates */}
      {showTemplates && (
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <h4 className="text-sm font-medium mb-2">Templates de Técnicas:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(TECHNIQUE_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className="text-left p-2 text-xs bg-white rounded border hover:bg-blue-50"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-gray-600">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Seleção de técnicas */}
      <div className="mb-4 space-y-3">
        {Object.entries(ANESTHESIA_TECHNIQUES).map(([key, technique]) => (
          <div key={key} className="border rounded-lg">
            {/* Cabeçalho da técnica */}
            <div className="p-3 border-b">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data[key] || false}
                  onChange={(e) => handleTechniqueToggle(key, e.target.checked)}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{technique.icon}</span>
                    <span className="font-medium">{technique.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      technique.category === 'primary' ? 'bg-blue-100 text-blue-700' :
                      technique.category === 'regional' ? 'bg-green-100 text-green-700' :
                      technique.category === 'support' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {technique.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{technique.description}</p>
                </div>
                
                {data[key] && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setExpandedTechnique(expandedTechnique === key ? null : key);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {expandedTechnique === key ? '▼ Recolher' : '▶ Configurar'}
                  </button>
                )}
              </label>
            </div>
            
            {/* Campos específicos da técnica */}
            {data[key] && expandedTechnique === key && technique.fields && (
              <div className="p-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(technique.fields).map(([fieldKey, fieldConfig]) => {
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
                            type={fieldConfig.type || 'text'}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(key, fieldKey, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            className="w-full text-sm border rounded px-2 py-1"
                          />
                        )}
                        
                        {/* Sugestões visuais */}
                        {key === 'geral' && fieldKey === 'totNumber' && suggestedTOT && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Sugerido: {suggestedTOT} (baseado na idade)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Preview */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Preview:</strong>
        <div className="mt-1 whitespace-pre-line">
          {generateText() || 'Selecione as técnicas anestésicas...'}
        </div>
      </div>
      
      {/* Debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>Debug Técnica:</strong> Ativas: {activeTechniques.length}, 
          TOT sugerido: {suggestedTOT}, Válido: {validation.isValid ? 'Sim' : 'Não'}
        </div>
      )}
    </div>
  );
};

export default AnesthesiaDescriptionTechnique;