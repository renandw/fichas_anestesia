import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Monitor, Heart, Activity, Thermometer, Eye, Zap } from 'lucide-react';


const AnesthesiaDescription = ({ anesthesia, patient, onUpdate }) => {
  // Estado local para os dados do formulário
  const [formData, setFormData] = useState({
    // Seção 1: Monitorização
    monitoring: {
      cardioscopia: true,  // Default marcado
      oximetria: true,     // Default marcado
      capnografia: false,
      pani: true,          // Default marcado (PANI)
      pai: false,          // Pressão Arterial Invasiva
      pvc: false,          // Pressão Venosa Central
      termometro: false,
      bis: false,
      tof: false,
      outrasMonitorizacoes: [] // Array para múltiplas "outras"
    },

    // Seção 2: Admissão e condições do paciente
    admission: {
      // Respiração
      respiracao: {
        arAmbiente: true,  // Default
        iot: false,
        vm: false,
        outraRespiracao: ''
      },
      // Consciência
      consciencia: {
        lucidoOrientado: true,  // Default (adulto)
        ativoReativo: true,     // Default (pediátrico)
        sedado: false,
        rebaixamento: false,
        outraConsciencia: ''
      },
      // Hemodinâmica
      hemodinamica: {
        estavel: true,  // Default
        instabilidade: false,
        hipotenso: false,
        outraHemodinamica: ''
      }
    },

    // Seção 3: Tipo de anestesia
    anesthesiaType: {
      selectedOrder: [], // Array para rastrear ordem de seleção
      geral: {
        enabled: false,
        totNumero: '7.5',
        cormackLehane: 'II',
        fixacaoCm: '21',
        textoPersonalizado: ''
      },
      raquianestesia: {
        enabled: false,
        nivel: 'L3-L4',
        agulha: '27G',
        textoPersonalizado: ''
      },
      peridural: {
        enabled: false,
        nivel: 'T5-T6',
        agulha: '18G',
        textoPersonalizado: ''
      },
      sedacao: {
        enabled: false,
        textoPersonalizado: ''
      },
      plexoBraquial: {
        enabled: false,
        textoPersonalizado: ''
      },
      outras: {
        enabled: false,
        nome: '',
        textoPersonalizado: ''
      }
    },

    // Seção 4: Finalização
    completion: {
      revisaoPosicionamento: true,
      defaultFinalization: true,
      customFinalization: '',
      destinationRPA: true,
      destinationUTI: false
    },

    // Observações gerais
    generalObservations: ''
  });

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;


  // Refs para evitar sobrescrever edições do usuário
  const lastAutoTotRef = useRef(null);
  const lastAutoFixRef = useRef(null);

  // Inicializar com dados existentes
  useEffect(() => {
    if (anesthesia?.anesthesiaDescription) {
      setFormData(prevData => ({
        ...prevData,
        ...anesthesia.anesthesiaDescription,
        // Garantir que todas as estruturas existem
        monitoring: {
          ...prevData.monitoring,
          ...anesthesia.anesthesiaDescription.monitoring,
          outrasMonitorizacoes: anesthesia.anesthesiaDescription.monitoring?.outrasMonitorizacoes || []
        },
        admission: {
          ...prevData.admission,
          ...anesthesia.anesthesiaDescription.admission,
          respiracao: {
            ...prevData.admission.respiracao,
            ...anesthesia.anesthesiaDescription.admission?.respiracao
          },
          consciencia: {
            ...prevData.admission.consciencia,
            ...anesthesia.anesthesiaDescription.admission?.consciencia
          },
          hemodinamica: {
            ...prevData.admission.hemodinamica,
            ...anesthesia.anesthesiaDescription.admission?.hemodinamica
          }
        }
      }));
    }
  }, [anesthesia?.anesthesiaDescription]);

  // Função para calcular idade
  const calculateAge = useCallback(() => {
    if (!patient?.patientBirthDate) return null;
    
    const birthDate = new Date(patient.patientBirthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }, [patient?.patientBirthDate]);

  // Sugestão de TOT para pediatria e adultos
  const getSuggestedTOT = useCallback(() => {
    const ageYears = calculateAge();
    if (ageYears === null) return null;

    // Regras pediátricas
    if (ageYears === 0) return '3.0'; // RN
    if (ageYears < 12) {
      const diameter = (ageYears / 4) + 3.5;
      return diameter.toFixed(1);
    }

    // Regra para adultos (>= 12 anos): por sexo biológico
    const sex = (patient?.patientSex || '').toString().trim().toUpperCase();
    if (sex === 'F') return '7.0';
    if (sex === 'M') return '7.5';

    // Caso sexo não informado, mantemos nulo para não sobrescrever escolhas do usuário
    return null;
  }, [calculateAge, patient?.patientSex]);

  // Sugestão de fixação (cm) do TOT
  // Crianças: ~ número do tubo x 3
  // Adultos: M → 22 cm, F → 20 cm
  const getSuggestedFixationCm = useCallback(() => {
    const ageYears = calculateAge();
    if (ageYears === null) return null;

    const sex = (patient?.patientSex || '').toString().trim().toUpperCase();
    const tot = parseFloat(formData.anesthesiaType?.geral?.totNumero);

    if (ageYears < 12) {
      if (!Number.isNaN(tot)) {
        return (tot * 3).toFixed(0); // arredonda para inteiro
      }
      return null;
    }

    if (sex === 'M') return '22';
    if (sex === 'F') return '20';
    return null;
  }, [calculateAge, patient?.patientSex, formData.anesthesiaType?.geral?.totNumero]);

  // Auto-aplicar sugestões de TOT e Fixação quando mudarem idade/sexo
  useEffect(() => {
    if (!formData.anesthesiaType?.geral?.enabled) return;

    // TOT sugerido
    const suggestedTot = getSuggestedTOT();
    if (suggestedTot) {
      const currentTot = (formData.anesthesiaType.geral?.totNumero || '').toString();
      if (!currentTot || currentTot === '7.5' || currentTot === lastAutoTotRef.current) {
        setFormData(prev => ({
          ...prev,
          anesthesiaType: {
            ...prev.anesthesiaType,
            geral: {
              ...prev.anesthesiaType.geral,
              totNumero: suggestedTot,
            }
          }
        }));
        lastAutoTotRef.current = suggestedTot;
      }
    }

    // Fixação sugerida
    const suggestedFix = getSuggestedFixationCm();
    if (suggestedFix) {
      const currentFix = (formData.anesthesiaType.geral?.fixacaoCm || '').toString();
      if (!currentFix || currentFix === '21' || currentFix === lastAutoFixRef.current) {
        setFormData(prev => ({
          ...prev,
          anesthesiaType: {
            ...prev.anesthesiaType,
            geral: {
              ...prev.anesthesiaType.geral,
              fixacaoCm: suggestedFix,
            }
          }
        }));
        lastAutoFixRef.current = suggestedFix;
      }
    }
  }, [patient?.patientBirthDate, patient?.patientSex, getSuggestedTOT, getSuggestedFixationCm, formData.anesthesiaType?.geral?.enabled]);

  // Em pediatria, quando o TOT mudar, recalcular fixação (~ TOT x 3) e aplicar se ainda default/auto
  useEffect(() => {
    if (!formData.anesthesiaType?.geral?.enabled) return;
    const ageYears = calculateAge();
    if (ageYears !== null && ageYears < 12) {
      const suggestedFix = getSuggestedFixationCm();
      if (suggestedFix) {
        const currentFix = (formData.anesthesiaType.geral?.fixacaoCm || '').toString();
        if (!currentFix || currentFix === '21' || currentFix === lastAutoFixRef.current) {
          setFormData(prev => ({
            ...prev,
            anesthesiaType: {
              ...prev.anesthesiaType,
              geral: {
                ...prev.anesthesiaType.geral,
                fixacaoCm: suggestedFix,
              }
            }
          }));
          lastAutoFixRef.current = suggestedFix;
        }
      }
    }
  }, [formData.anesthesiaType?.geral?.totNumero, calculateAge, getSuggestedFixationCm, formData.anesthesiaType?.geral?.enabled]);

  // Verificar se é pediátrico (0-4 anos)
  const isPediatric = calculateAge() !== null && calculateAge() <= 4;

  // Handlers para atualizar seções específicas
  const updateMonitoring = (field, value) => {
    setFormData(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        [field]: value
      }
    }));
  };

  // Handler para adicionar nova "outra monitorização"
  const addOutraMonitorizacao = () => {
    setFormData(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        outrasMonitorizacoes: [...prev.monitoring.outrasMonitorizacoes, '']
      }
    }));
  };

  // Handler para atualizar "outra monitorização" específica
  const updateOutraMonitorizacao = (index, value) => {
    setFormData(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        outrasMonitorizacoes: prev.monitoring.outrasMonitorizacoes.map((item, i) => 
          i === index ? value : item
        )
      }
    }));
  };

  // Handler para remover "outra monitorização"
  const removeOutraMonitorizacao = (index) => {
    setFormData(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        outrasMonitorizacoes: prev.monitoring.outrasMonitorizacoes.filter((_, i) => i !== index)
      }
    }));
  };

  // Gerar texto da monitorização
  const generateMonitoringText = () => {
    const selected = [];
    const monitoring = formData.monitoring;
    
    if (monitoring.cardioscopia) selected.push('cardioscopia');
    if (monitoring.oximetria) selected.push('oximetria');
    if (monitoring.capnografia) selected.push('capnografia');
    if (monitoring.pani) selected.push('PANI');
    if (monitoring.pai) selected.push('PAI');
    if (monitoring.pvc) selected.push('PVC');
    if (monitoring.termometro) selected.push('termômetro');
    if (monitoring.bis) selected.push('BIS');
    if (monitoring.tof) selected.push('TOF');
    
    // Adicionar "outras" preenchidas
    const outrasMonitorizacoes = monitoring.outrasMonitorizacoes || [];
    outrasMonitorizacoes.forEach(outra => {
      if (outra.trim()) selected.push(outra.trim());
    });
    
    if (selected.length === 0) return '';
    
    return `Monitorização: ${selected.join(', ')}.`;
  };

  // Verificar se há pelo menos uma monitorização selecionada
  const hasMonitoringSelected = () => {
    const monitoring = formData.monitoring;
    const hasBasicSelected = monitoring.cardioscopia || monitoring.oximetria || 
                            monitoring.capnografia || monitoring.pani || monitoring.pai || 
                            monitoring.pvc || monitoring.termometro || monitoring.bis || monitoring.tof;
    const outrasMonitorizacoes = monitoring.outrasMonitorizacoes || [];
    const hasOutrasPreenchidas = outrasMonitorizacoes.some(outra => outra.trim());
    return hasBasicSelected || hasOutrasPreenchidas;
  };

  // Helpers de UI para Monitorização
  const getSelectedMonitoring = useCallback(() => {
    const m = formData.monitoring || {};
    const arr = [];
    if (m.cardioscopia) arr.push('cardioscopia');
    if (m.oximetria) arr.push('oximetria');
    if (m.capnografia) arr.push('capnografia');
    if (m.pani) arr.push('PANI');
    if (m.pai) arr.push('PAI');
    if (m.pvc) arr.push('PVC');
    if (m.termometro) arr.push('termômetro');
    if (m.bis) arr.push('BIS');
    if (m.tof) arr.push('TOF');
    (m.outrasMonitorizacoes || []).forEach((o) => { if ((o || '').trim()) arr.push(o.trim()); });
    return arr;
  }, [formData.monitoring]);

  const getMonitoringCount = useCallback(() => getSelectedMonitoring().length, [getSelectedMonitoring]);

  const toggleMonitoring = (field) => {
    updateMonitoring(field, !formData.monitoring[field]);
  };

  const applyMonitoringPreset = (preset) => {
    if (preset === 'basico') {
      setFormData(prev => ({
        ...prev,
        monitoring: {
          ...prev.monitoring,
          cardioscopia: true,
          oximetria: true,
          pani: true,
          capnografia: false,
          pai: false,
          pvc: false,
          termometro: false,
          bis: false,
          tof: false,
        }
      }));
    } else if (preset === 'completo') {
      setFormData(prev => ({
        ...prev,
        monitoring: {
          ...prev.monitoring,
          cardioscopia: true,
          oximetria: true,
          capnografia: true,
          pani: true,
          pai: false,
          pvc: false,
          termometro: false,
          bis: false,
          tof: false,
        }
      }));
    } else if (preset === 'limpar') {
      setFormData(prev => ({
        ...prev,
        monitoring: {
          ...prev.monitoring,
          cardioscopia: false,
          oximetria: false,
          capnografia: false,
          pani: false,
          pai: false,
          pvc: false,
          termometro: false,
          bis: false,
          tof: false,
          // mantemos as "outras" para não perder texto do usuário
        }
      }));
    }
  };

  // Handler para atualizar admissão
  const updateAdmission = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      admission: {
        ...prev.admission,
        [section]: {
          ...prev.admission[section],
          [field]: value
        }
      }
    }));
  };

  // Gerar texto da admissão
  const generateAdmissionText = () => {
    const admission = formData.admission || {};
    
    // Construir cada seção com verificações de segurança
    const respiracaoItems = [];
    const respiracao = admission.respiracao || {};
    if (respiracao.arAmbiente) respiracaoItems.push('em ar ambiente');
    if (respiracao.iot) respiracaoItems.push('IOT');
    if (respiracao.vm) respiracaoItems.push('VM');
    if (respiracao.outraRespiracao?.trim()) respiracaoItems.push(respiracao.outraRespiracao.trim());
    
    const conscienciaItems = [];
    const consciencia = admission.consciencia || {};
    if (isPediatric) {
      if (consciencia.ativoReativo) conscienciaItems.push('ativo e reativo');
    } else {
      if (consciencia.lucidoOrientado) conscienciaItems.push('lúcido e orientado');
    }
    if (consciencia.sedado) conscienciaItems.push('sedado');
    if (consciencia.rebaixamento) conscienciaItems.push('rebaixamento do nível de consciência');
    if (consciencia.outraConsciencia?.trim()) conscienciaItems.push(consciencia.outraConsciencia.trim());
    
    const hemodinamicaItems = [];
    const hemodinamica = admission.hemodinamica || {};
    if (hemodinamica.estavel) {
      if (isPediatric) {
        hemodinamicaItems.push('hemodinamicamente estável sem sinais de rebaixamento de consciência ou depressão respiratória');
      } else {
        hemodinamicaItems.push('hemodinamicamente estável');
      }
    }
    if (hemodinamica.instabilidade) hemodinamicaItems.push('instabilidade hemodinâmica');
    if (hemodinamica.hipotenso) hemodinamicaItems.push('hipotenso');
    if (hemodinamica.outraHemodinamica?.trim()) hemodinamicaItems.push(hemodinamica.outraHemodinamica.trim());
    
    // Concatenar tudo
    const allItems = [...respiracaoItems, ...conscienciaItems, ...hemodinamicaItems];
    const mainText = `Paciente admitido em sala cirúrgica ${allItems.join(', ')}.`;
    const finalText = 'Anamnese e exame físico realizados, checo venóclise pérvia.';
    
    return `${mainText} ${finalText}`;
  };

  // Gerar texto dos tipos de anestesia
  const generateAnesthesiaTypeText = () => {
    const textos = [];
    const anesthesiaType = formData.anesthesiaType;
    const selectedOrder = anesthesiaType.selectedOrder || [];

    // Função para gerar texto de cada tipo
    const getTextoTipo = (tipo) => {
      switch (tipo) {
        case 'geral':
          if (!anesthesiaType.geral?.enabled) return null;
          const textoBaseGeral = `Indução anestésica: a) Desnitrogenização com O₂ 100%; b) Drogas utilizadas conforme seção de medicamentos.; c) Intubação orotraqueal com TOT n° ${anesthesiaType.geral.totNumero} sob laringoscopia direta (Cormack-Lehane ${anesthesiaType.geral.cormackLehane}).; d) Tubo fixado a ${anesthesiaType.geral.fixacaoCm} cm na comissura labial.
Manutenção com drogas descritas em seção de medicações, sob ventilação mecânica. Parâmetros ventilatórios e monitoração contínua mantidos; proteção ocular.`;
          return anesthesiaType.geral.textoPersonalizado || textoBaseGeral;

        case 'raquianestesia':
          if (!anesthesiaType.raquianestesia?.enabled) return null;
          const textoBaseRaqui = `Raquianestesia: a) Posiciono paciente sentado em mesa cirúrgica b) Assepsia e antissepsia das mãos e dorso do paciente.; c) Agulha ${anesthesiaType.raquianestesia.agulha}, Quincke, punção única. Entre ${anesthesiaType.raquianestesia.nivel}. Punção de espaço subaracnóide sem intercorrências
d) LCR límpido, sem alterações. e) Injeto medicações conforme seção de medicamentos.
Testo bloqueio com estímulos térmicos e motores.`;
          return anesthesiaType.raquianestesia.textoPersonalizado || textoBaseRaqui;

        case 'peridural':
          if (!anesthesiaType.peridural?.enabled) return null;
          const textoBasePeri = `Peridural: a) Posiciono paciente sentado em mesa cirúrgica b) Assepsia e antissepsia das mãos e dorso do paciente.; c) Agulha ${anesthesiaType.peridural.agulha} Tuohy, punção única. Entre ${anesthesiaType.peridural.nivel}, confirmação de espaço peridural pela tecníca de Doglioti.
d) Sem acidentes de punção, retorno de líquor ou sangue. Teste de injeção de adrenalina negativo. Injeto drogas descritas na seção de medicamentos. Não observo deformação da bolha de ar à seringa.`;
          return anesthesiaType.peridural.textoPersonalizado || textoBasePeri;

        case 'sedacao':
          if (!anesthesiaType.sedacao?.enabled) return null;
          const textoBaseAdulto = `Sedação consciente com medicações descritas
a. Suplementação de O₂ via cateter nasal. 
b. Drogas utilizadas conforme seção de medicamentos.`;
          const textoBasePediatrico = `Sedação sob sistema Baraka Mapleson A com medicações descritas na seção de medicações.
Reviso posicionamento do paciente`;
          const textoBaseSedacao = isPediatric ? textoBasePediatrico : textoBaseAdulto;
          return anesthesiaType.sedacao.textoPersonalizado || textoBaseSedacao;

        case 'plexoBraquial':
          if (!anesthesiaType.plexoBraquial?.enabled) return null;
          const textoBasePlexo = `Assepsia de região interescalênica e axilar. Visualização de estruturas nervosas à ultrassonografia. Injeção de anestésico local conforme seção de medicação
Procedimento sem intercorrências;`;
          return anesthesiaType.plexoBraquial.textoPersonalizado || textoBasePlexo;

        case 'outras':
          if (!anesthesiaType.outras?.enabled || !anesthesiaType.outras.nome) return null;
          return `${anesthesiaType.outras.nome}: ${anesthesiaType.outras.textoPersonalizado}`;

        default:
          return null;
      }
    };

    // Gerar textos na ordem de seleção
    selectedOrder.forEach(tipo => {
      const texto = getTextoTipo(tipo);
      if (texto) {
        textos.push(texto);
      }
    });
    
    return textos.join('\n\n');
  };

  // Verificar se pelo menos um tipo de anestesia foi selecionado
  const hasAnesthesiaTypeSelected = () => {
    const anesthesiaType = formData.anesthesiaType;
    const selectedOrder = anesthesiaType.selectedOrder || [];
    return selectedOrder.length > 0;
  };

  // Helpers de UI para Seção 3 (Tipo de Anestesia)
  const getAnesthesiaSelectedCount = () => {
    const a = formData.anesthesiaType || {};
    const keys = ['geral','raquianestesia','peridural','sedacao','plexoBraquial','outras'];
    return keys.reduce((acc, k) => acc + (a[k]?.enabled ? 1 : 0), 0);
  };

  const toggleTechnique = (type) => {
    const current = !!formData.anesthesiaType?.[type]?.enabled;
    updateAnesthesiaType(type, 'enabled', !current);
  };

  const moveTechnique = (type, direction) => {
    setFormData(prev => {
      const order = [...(prev.anesthesiaType.selectedOrder || [])];
      const idx = order.indexOf(type);
      if (idx === -1) return prev;
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= order.length) return prev;
      [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
      return {
        ...prev,
        anesthesiaType: {
          ...prev.anesthesiaType,
          selectedOrder: order,
        }
      };
    });
  };

  const applyAnesthesiaPreset = (preset) => {
    if (preset === 'limpar') {
      setFormData(prev => ({
        ...prev,
        anesthesiaType: {
          ...prev.anesthesiaType,
          selectedOrder: [],
          geral: { ...prev.anesthesiaType.geral, enabled: false },
          raquianestesia: { ...prev.anesthesiaType.raquianestesia, enabled: false },
          peridural: { ...prev.anesthesiaType.peridural, enabled: false },
          sedacao: { ...prev.anesthesiaType.sedacao, enabled: false },
          plexoBraquial: { ...prev.anesthesiaType.plexoBraquial, enabled: false },
          outras: { ...prev.anesthesiaType.outras, enabled: false },
        }
      }));
      return;
    }

    const presets = {
      geral: ['geral'],
      neuroaxial: ['raquianestesia','peridural'],
      sedacao: ['sedacao'],
      bloqueio: ['plexoBraquial'],
      completo: ['geral','raquianestesia','peridural','sedacao'],
    };
    const list = presets[preset] || [];

    setFormData(prev => ({
      ...prev,
      anesthesiaType: {
        ...prev.anesthesiaType,
        selectedOrder: list,
        geral: { ...prev.anesthesiaType.geral, enabled: list.includes('geral') },
        raquianestesia: { ...prev.anesthesiaType.raquianestesia, enabled: list.includes('raquianestesia') },
        peridural: { ...prev.anesthesiaType.peridural, enabled: list.includes('peridural') },
        sedacao: { ...prev.anesthesiaType.sedacao, enabled: list.includes('sedacao') },
        plexoBraquial: { ...prev.anesthesiaType.plexoBraquial, enabled: list.includes('plexoBraquial') },
        outras: { ...prev.anesthesiaType.outras, enabled: list.includes('outras') },
      }
    }));
  };

  // Validation per step
  const isStepValid = useCallback((step) => {
    switch (step) {
      case 1:
        return hasMonitoringSelected();
      case 2:
        // Admissão sempre válida (pelo menos texto padrão é gerado)
        return true;
      case 3:
        return hasAnesthesiaTypeSelected();
      case 4:
        // Finalização sempre válida
        return true;
      default:
        return false;
    }
  }, [hasMonitoringSelected, hasAnesthesiaTypeSelected]);

  // Can open a given step? All previous must be valid
  const canGoToStep = (step) => {
    if (step < 1 || step > totalSteps) return false;
    for (let s = 1; s < step; s++) {
      if (!isStepValid(s)) return false;
    }
    return true;
  };

  const goNext = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const getStepStatus = (step) => {
    if (step < currentStep) {
      return isStepValid(step) ? 'complete' : 'incomplete';
    }
    if (step === currentStep) {
      return isStepValid(step) ? 'active-valid' : 'active';
    }
    return canGoToStep(step) ? 'locked-ready' : 'locked';
  };

  const updateAnesthesiaType = (type, field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        anesthesiaType: {
          ...prev.anesthesiaType,
          [type]: {
            ...prev.anesthesiaType[type],
            [field]: value
          }
        }
      };

      // Se está habilitando/desabilitando um tipo, atualizar a ordem
      if (field === 'enabled') {
        const currentOrder = prev.anesthesiaType.selectedOrder || [];
        
        if (value) {
          // Adicionar à ordem se não estiver presente
          if (!currentOrder.includes(type)) {
            newData.anesthesiaType.selectedOrder = [...currentOrder, type];
          }
          // Se habilitar Anestesia Geral e houver sugestão de TOT pediátrico, aplicar se o valor atual estiver vazio ou padrão
          if (type === 'geral') {
            const suggested = getSuggestedTOT();
            const currentTot = (newData.anesthesiaType.geral?.totNumero ?? '').toString();
            if (suggested && (!currentTot || currentTot === '7.5')) {
              newData.anesthesiaType.geral = {
                ...newData.anesthesiaType.geral,
                totNumero: suggested,
              };
            }
          }
          // Sugerir fixação (cm) conforme idade/sexo quando habilitar Geral
          if (type === 'geral') {
            const suggestedFix = getSuggestedFixationCm();
            const currentFix = (newData.anesthesiaType.geral?.fixacaoCm ?? '').toString();
            if (suggestedFix && (!currentFix || currentFix === '21')) {
              newData.anesthesiaType.geral = {
                ...newData.anesthesiaType.geral,
                fixacaoCm: suggestedFix,
              };
            }
          }
        } else {
          // Remover da ordem
          newData.anesthesiaType.selectedOrder = currentOrder.filter(item => item !== type);
        }
      }

      return newData;
    });
  };

  const updateCompletion = (field, value) => {
    setFormData(prev => ({
      ...prev,
      completion: {
        ...prev.completion,
        [field]: value
      }
    }));
  };

  // Gerar texto de finalização
  const generateCompletionText = () => {
    let text = "";
    
    if (formData.completion.revisaoPosicionamento) {
      text += "Revisão de posicionamento realizada. ";
    }
    
    if (formData.completion.defaultFinalization) {
      text += "Ao término da cirurgia, paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável. ";
    }
    
    const destination = formData.completion.destinationUTI ? "UTI" : "RPA";
    text += `Encaminhado à ${destination} em boas condições clínicas.`;
    
    if (formData.completion.customFinalization) {
      text += ` ${formData.completion.customFinalization}`;
    }
    
    return text;
  };

  // Preview Geral (todas as seções)
  const generateFullPreview = () => {
    const parts = [];
    const mon = (generateMonitoringText() || '').trim();
    if (mon) parts.push(mon);
    const adm = (generateAdmissionText() || '').trim();
    if (adm) parts.push(adm);
    const types = (generateAnesthesiaTypeText() || '').trim();
    if (types) parts.push(types);
    const fin = (generateCompletionText() || '').trim();
    if (fin) parts.push(fin);
    return parts.join('\n\n');
  };

  // Salvar "Descrição final" no objeto local (estado)
  const saveFinalDescription = () => {
    if (onUpdate) {
      onUpdate({
        anesthesiaDescription: {
          ...formData,
          descriptionFinal: generateFullPreview()
        }
      });
      alert('Descrição final salva no objeto local.');
    }
  };

  // Helpers de UI para Admissão (Seção 2)
  const toggleResp = (field) => {
    updateAdmission('respiracao', field, !formData.admission?.respiracao?.[field]);
  };
  const toggleConsc = (field) => {
    updateAdmission('consciencia', field, !formData.admission?.consciencia?.[field]);
  };
  const toggleHemo = (field) => {
    updateAdmission('hemodinamica', field, !formData.admission?.hemodinamica?.[field]);
  };

  const applyAdmissionPreset = (preset) => {
    if (preset === 'adulto_estavel') {
      setFormData(prev => ({
        ...prev,
        admission: {
          ...prev.admission,
          respiracao: { arAmbiente: true, iot: false, vm: false, outraRespiracao: '' },
          consciencia: { lucidoOrientado: true, ativoReativo: false, sedado: false, rebaixamento: false, outraConsciencia: '' },
          hemodinamica: { estavel: true, instabilidade: false, hipotenso: false, outraHemodinamica: '' }
        }
      }));
    } else if (preset === 'pediatrico_estavel') {
      setFormData(prev => ({
        ...prev,
        admission: {
          ...prev.admission,
          respiracao: { arAmbiente: true, iot: false, vm: false, outraRespiracao: '' },
          consciencia: { lucidoOrientado: false, ativoReativo: true, sedado: false, rebaixamento: false, outraConsciencia: '' },
          hemodinamica: { estavel: true, instabilidade: false, hipotenso: false, outraHemodinamica: '' }
        }
      }));
    } else if (preset === 'critico') {
      setFormData(prev => ({
        ...prev,
        admission: {
          ...prev.admission,
          respiracao: { arAmbiente: false, iot: true, vm: true, outraRespiracao: '' },
          consciencia: { lucidoOrientado: false, ativoReativo: false, sedado: true, rebaixamento: true, outraConsciencia: '' },
          hemodinamica: { estavel: false, instabilidade: true, hipotenso: true, outraHemodinamica: '' }
        }
      }));
    }
  };

  const getAdmissionCount = () => {
    const r = formData.admission?.respiracao || {};
    const c = formData.admission?.consciencia || {};
    const h = formData.admission?.hemodinamica || {};
    const bools = [r.arAmbiente, r.iot, r.vm, c.lucidoOrientado, c.ativoReativo, c.sedado, c.rebaixamento, h.estavel, h.instabilidade, h.hipotenso];
    const others = [r.outraRespiracao, c.outraConsciencia, h.outraHemodinamica].filter(v => (v || '').trim()).length;
    return bools.filter(Boolean).length + others;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Progress Indicator */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          {[1,2,3,4].map((step) => {
            const labels = {
              1: 'Monitorização',
              2: 'Admissão',
              3: 'Tipo de Anestesia',
              4: 'Finalização',
            };
            const status = getStepStatus(step);
            const base = 'text-xs font-medium';
            const color = status.includes('active')
              ? 'text-blue-700'
              : status === 'complete'
              ? 'text-green-700'
              : status === 'locked-ready'
              ? 'text-gray-700'
              : 'text-gray-400';
            return (
              <button
                key={step}
                type="button"
                onClick={() => { if (canGoToStep(step)) setCurrentStep(step); }}
                className={`flex-1 text-center ${base} ${color}`}
                title={labels[step]}
                disabled={!canGoToStep(step)}
              >
                {labels[step]}
              </button>
            );
          })}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-600 rounded transition-all"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Monitorização */}
      <div className="rounded-lg border">
        <div
          className="flex items-center justify-between p-3 bg-blue-50 rounded-t-lg cursor-pointer"
          onClick={() => { if (canGoToStep(1)) setCurrentStep(1); }}
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-blue-900 flex items-center gap-2">
              Monitorização
              <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200" aria-live="polite" title="Itens selecionados">
                {getMonitoringCount()} selecionado{getMonitoringCount() === 1 ? '' : 's'}
              </span>
            </h3>
          </div>
          {currentStep !== 1 && (
            <div className="text-xs text-gray-700">
              {/* Summary when collapsed */}
              {hasMonitoringSelected() ? (
                <span className="italic">{generateMonitoringText()}</span>
              ) : (
                <span className="text-yellow-700">Pendente</span>
              )}
            </div>
          )}
        </div>
        {currentStep === 1 && (
          <div className="p-4 space-y-4">
            {/* UI melhorada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Padrões rápidos</p>
                <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => applyMonitoringPreset('basico')} className="px-3 py-1.5 rounded-full border border-blue-300 bg-blue-50 text-blue-800 text-xs hover:bg-blue-100 active:scale-[0.99]">Monitorização Básica</button>
                <button type="button" onClick={() => applyMonitoringPreset('completo')} className="px-3 py-1.5 rounded-full border border-purple-300 bg-purple-50 text-purple-800 text-xs hover:bg-purple-100 active:scale-[0.99]">Anestesia Geral</button>
                  <button type="button" onClick={() => applyMonitoringPreset('limpar')} className="px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-700 text-xs hover:bg-gray-50 active:scale-[0.99]">Limpar</button>
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-xs text-gray-500">Escolha pelo menos um.</p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700 mb-2">Seleção</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['cardioscopia','Cardioscopia'],
                  ['oximetria','Oximetria'],
                  ['capnografia','Capnografia'],
                  ['pani','PANI'],
                  ['pai','PAI'],
                  ['pvc','PVC'],
                  ['termometro','Termômetro'],
                  ['bis','BIS'],
                  ['tof','TOF'],
                ].map(([key,label]) => {
                  const active = !!formData.monitoring[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleMonitoring(key)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition select-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${active ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      aria-pressed={active}
                      aria-label={`Alternar ${label}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Outras monitorizações</p>
              <div className="space-y-2">
                {(formData.monitoring.outrasMonitorizacoes || []).map((outra, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={outra}
                      onChange={(e) => updateOutraMonitorizacao(index, e.target.value)}
                      placeholder="Ex.: Doppler esofágico, PIC, etc."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-label={`Outra monitorização ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOutraMonitorizacao(index)}
                      className="px-2.5 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      title="Remover"
                      aria-label={`Remover monitorização ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOutraMonitorizacao}
                  className="inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-dashed border-blue-300"
                >
                  <span className="text-lg leading-none">＋</span> Adicionar outra monitorização
                </button>
              </div>
            </div>

            {!hasMonitoringSelected() && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md" role="alert" aria-live="polite">
                <p className="text-sm text-yellow-800">⚠️ Selecione pelo menos uma monitorização.</p>
              </div>
            )}


            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <button type="button" onClick={goPrev} disabled className="px-4 py-2 rounded bg-gray-200 text-gray-500 cursor-not-allowed">Anterior</button>
              <button type="button" onClick={goNext} disabled={!isStepValid(1)} className={`px-4 py-2 rounded ${isStepValid(1) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500'}`}>Próximo</button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Admissão e Condições */}
      <div className="rounded-lg border">
        <div
          className="flex items-center justify-between p-3 bg-green-50 rounded-t-lg cursor-pointer"
          onClick={() => { if (canGoToStep(2)) setCurrentStep(2); }}
        >
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-green-600" />
            <h3 className="text-base font-semibold text-green-900 flex items-center gap-2">
              Condições do Paciente
              <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200" title="Itens marcados" aria-live="polite">
                {getAdmissionCount()} itens
              </span>
              <span className="hidden md:inline text-xs font-normal text-gray-600 ml-1">({isPediatric ? `${calculateAge()} anos - Pediátrico` : `${calculateAge()} anos - Adulto`})</span>
            </h3>
          </div>
          {currentStep !== 2 && canGoToStep(2) && (
            <div className="text-xs text-gray-700 italic max-w-[60%] truncate">{generateAdmissionText()}</div>
          )}
        </div>
        {currentStep === 2 && (
          <>
          <div className="p-4 space-y-6">
            {/* Padrões rápidos */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => applyAdmissionPreset(isPediatric ? 'pediatrico_estavel' : 'adulto_estavel')} className="px-3 py-1.5 rounded-full border border-green-300 bg-green-50 text-green-800 text-xs hover:bg-green-100 active:scale-[0.99]">
                  {isPediatric ? 'Padrão Pediátrico (estável)' : 'Padrão Adulto (estável)'}
                </button>
                <button type="button" onClick={() => applyAdmissionPreset('critico')} className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs hover:bg-amber-100 active:scale-[0.99]">Crítico</button>
              </div>
              <p className="text-xs text-gray-500">Ajuste manualmente abaixo, se necessário.</p>
            </div>

            {/* Respiração */}
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Respiração</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  ['arAmbiente','Em ar ambiente'],
                  ['iot','IOT'],
                  ['vm','VM'],
                ].map(([key,label]) => {
                  const active = !!formData.admission?.respiracao?.[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleResp(key)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition select-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${active ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2">
                <input type="text" value={formData.admission?.respiracao?.outraRespiracao || ''} onChange={(e) => updateAdmission('respiracao', 'outraRespiracao', e.target.value)} placeholder="Outra condição respiratória..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
            </div>

            {/* Consciência */}
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Consciência</h4>
              <div className="flex flex-wrap gap-2">
                {isPediatric ? (
                  <button type="button" onClick={() => toggleConsc('ativoReativo')} className={`px-3 py-1.5 rounded-full text-sm border transition ${formData.admission?.consciencia?.ativoReativo ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} aria-pressed={!!formData.admission?.consciencia?.ativoReativo}>Ativo e reativo</button>
                ) : (
                  <button type="button" onClick={() => toggleConsc('lucidoOrientado')} className={`px-3 py-1.5 rounded-full text-sm border transition ${formData.admission?.consciencia?.lucidoOrientado ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} aria-pressed={!!formData.admission?.consciencia?.lucidoOrientado}>Lúcido e orientado</button>
                )}
                <button type="button" onClick={() => toggleConsc('sedado')} className={`px-3 py-1.5 rounded-full text-sm border transition ${formData.admission?.consciencia?.sedado ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} aria-pressed={!!formData.admission?.consciencia?.sedado}>Sedado</button>
                <button type="button" onClick={() => toggleConsc('rebaixamento')} className={`px-3 py-1.5 rounded-full text-sm border transition ${formData.admission?.consciencia?.rebaixamento ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} aria-pressed={!!formData.admission?.consciencia?.rebaixamento}>Rebaixamento consciência</button>
              </div>
              <div className="mt-2">
                <input type="text" value={formData.admission?.consciencia?.outraConsciencia || ''} onChange={(e) => updateAdmission('consciencia', 'outraConsciencia', e.target.value)} placeholder="Outra condição neurológica..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
            </div>

            {/* Hemodinâmica */}
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Hemodinâmica</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  ['estavel','Estável'],
                  ['instabilidade','Instabilidade'],
                  ['hipotenso','Hipotenso'],
                ].map(([key,label]) => {
                  const active = !!formData.admission?.hemodinamica?.[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleHemo(key)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition select-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${active ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2">
                <input type="text" value={formData.admission?.hemodinamica?.outraHemodinamica || ''} onChange={(e) => updateAdmission('hemodinamica', 'outraHemodinamica', e.target.value)} placeholder="Outra condição hemodinâmica..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button type="button" onClick={goPrev} className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Anterior</button>
            <button type="button" onClick={goNext} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Próximo</button>
          </div>
          </>
        )}
      </div>

      {/* STEP 3: Tipo de Anestesia */}
      <div className="rounded-lg border">
        <div
          className="flex items-center justify-between p-3 bg-purple-50 rounded-t-lg cursor-pointer"
          onClick={() => { if (canGoToStep(3)) setCurrentStep(3); }}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-semibold text-purple-900 flex items-center gap-2">
              Tipo de Anestesia
              <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200" title="Técnicas selecionadas" aria-live="polite">
                {getAnesthesiaSelectedCount()} técnica{getAnesthesiaSelectedCount() === 1 ? '' : 's'}
              </span>
            </h3>
          </div>
          {currentStep !== 3 && canGoToStep(3) && (
            <div className="text-xs text-gray-700 italic max-w-[60%] truncate whitespace-pre">{hasAnesthesiaTypeSelected() ? generateAnesthesiaTypeText() : 'Pendente'}</div>
          )}
        </div>
        {currentStep === 3 && (
          <div className="p-4 space-y-6">
            {/* Seleção de técnicas (sem redundância) */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500">Você pode ajustar abaixo e alterar a ordem.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['geral','Anestesia Geral'],
                  ['raquianestesia','Raquianestesia'],
                  ['peridural','Peridural'],
                  ['sedacao','Sedação'],
                  ['plexoBraquial','Plexo Braquial'],
                  ['outras','Outras Técnicas'],
                ].map(([key,label]) => {
                  const active = !!formData.anesthesiaType?.[key]?.enabled;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleTechnique(key)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition select-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${active ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Cards renderizados na ordem selecionada */}
            {(formData.anesthesiaType.selectedOrder || []).map((tipo) => {
              if (!formData.anesthesiaType?.[tipo]?.enabled) return null;
              switch (tipo) {
                case 'geral':
                  return (
                    <div key="card-geral" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Anestesia Geral</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200" title="Posição na ordem">#{(formData.anesthesiaType.selectedOrder || []).indexOf('geral') + 1}</span>
                          <button type="button" onClick={() => moveTechnique('geral','up')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para cima">↑</button>
                          <button type="button" onClick={() => moveTechnique('geral','down')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para baixo">↓</button>
                          <button type="button" onClick={() => toggleTechnique('geral')} className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Desativar técnica">Desativar</button>
                        </div>
                      </div>
                      <div className="space-y-3 ml-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">TOT nº:</label>
                            <input
                              type="text"
                              value={formData.anesthesiaType.geral?.totNumero || ''}
                              onChange={(e) => updateAnesthesiaType('geral', 'totNumero', e.target.value)}
                              className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                            />
                            {(() => {
                              const s = getSuggestedTOT();
                              const cur = (formData.anesthesiaType.geral?.totNumero || '').toString();
                              return s && cur !== s ? (
                                <div className="mt-1 flex items-center gap-2 text-[11px]">
                                  <span className="text-gray-600">Sugestão para idade {calculateAge()}a: <span className="font-medium text-purple-700">{s}</span></span>
                                  <button type="button" onClick={() => updateAnesthesiaType('geral','totNumero', s)} className="px-2 py-0.5 border rounded text-xs hover:bg-gray-50">Usar</button>
                                </div>
                              ) : null;
                            })()}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cormack-Lehane:</label>
                            <select
                              value={formData.anesthesiaType.geral?.cormackLehane || 'II'}
                              onChange={(e) => updateAnesthesiaType('geral', 'cormackLehane', e.target.value)}
                              className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="I">I</option>
                              <option value="II">II</option>
                              <option value="III">III</option>
                              <option value="IV">IV</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fixação (cm):</label>
                            <input
                              type="text"
                              value={formData.anesthesiaType.geral?.fixacaoCm || ''}
                              onChange={(e) => updateAnesthesiaType('geral', 'fixacaoCm', e.target.value)}
                              className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                            />
                            {(() => {
                              const s = getSuggestedFixationCm();
                              const cur = (formData.anesthesiaType.geral?.fixacaoCm || '').toString();
                              return s && cur !== s ? (
                                <div className="mt-1 flex items-center gap-2 text-[11px]">
                                  <span className="text-gray-600">Sugestão de fixação: <span className="font-medium text-purple-700">{s} cm</span></span>
                                  <button type="button" onClick={() => updateAnesthesiaType('geral','fixacaoCm', s)} className="px-2 py-0.5 border rounded text-xs hover:bg-gray-50">Usar</button>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Texto personalizado (deixe vazio para usar padrão):</label>
                          <textarea
                            value={formData.anesthesiaType.geral?.textoPersonalizado || ''}
                            onChange={(e) => updateAnesthesiaType('geral', 'textoPersonalizado', e.target.value)}
                            placeholder="Personalize o texto da anestesia geral..."
                            rows="3"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                case 'raquianestesia':
                  return (
                    <div key="card-raqui" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Raquianestesia</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200" title="Posição na ordem">#{(formData.anesthesiaType.selectedOrder || []).indexOf('raquianestesia') + 1}</span>
                          <button type="button" onClick={() => moveTechnique('raquianestesia','up')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para cima">↑</button>
                          <button type="button" onClick={() => moveTechnique('raquianestesia','down')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para baixo">↓</button>
                          <button type="button" onClick={() => toggleTechnique('raquianestesia')} className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Desativar técnica">Desativar</button>
                        </div>
                      </div>
                      <div className="space-y-3 ml-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nível:</label>
                            <select
                              value={formData.anesthesiaType.raquianestesia?.nivel || 'L3-L4'}
                              onChange={(e) => updateAnesthesiaType('raquianestesia', 'nivel', e.target.value)}
                              className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="L1-L2">L1-L2</option>
                              <option value="L2-L3">L2-L3</option>
                              <option value="L3-L4">L3-L4</option>
                              <option value="L4-L5">L4-L5</option>
                              <option value="L5-S1">L5-S1</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Agulha:</label>
                            <input
                              type="text"
                              value={formData.anesthesiaType.raquianestesia?.agulha || '27G'}
                              onChange={(e) => updateAnesthesiaType('raquianestesia', 'agulha', e.target.value)}
                              className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Texto personalizado:</label>
                          <textarea
                            value={formData.anesthesiaType.raquianestesia?.textoPersonalizado || ''}
                            onChange={(e) => updateAnesthesiaType('raquianestesia', 'textoPersonalizado', e.target.value)}
                            placeholder="Personalize o texto da raquianestesia..."
                            rows="3"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                case 'peridural':
                  return (
                    <div key="card-peri" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Peridural</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200" title="Posição na ordem">#{(formData.anesthesiaType.selectedOrder || []).indexOf('peridural') + 1}</span>
                          <button type="button" onClick={() => moveTechnique('peridural','up')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para cima">↑</button>
                          <button type="button" onClick={() => moveTechnique('peridural','down')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para baixo">↓</button>
                          <button type="button" onClick={() => toggleTechnique('peridural')} className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Desativar técnica">Desativar</button>
                        </div>
                      </div>
                      <div className="space-y-3 ml-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nível:</label>
                            <select
                              value={formData.anesthesiaType.peridural?.nivel || 'T5-T6'}
                              onChange={(e) => updateAnesthesiaType('peridural', 'nivel', e.target.value)}
                              className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="T4-T5">T4-T5</option>
                              <option value="T5-T6">T5-T6</option>
                              <option value="T6-T7">T6-T7</option>
                              <option value="T7-T8">T7-T8</option>
                              <option value="T8-T9">T8-T9</option>
                              <option value="L1-L2">L1-L2</option>
                              <option value="L2-L3">L2-L3</option>
                              <option value="L3-L4">L3-L4</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Agulha:</label>
                            <input
                              type="text"
                              value={formData.anesthesiaType.peridural?.agulha || '18G'}
                              onChange={(e) => updateAnesthesiaType('peridural', 'agulha', e.target.value)}
                              className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Texto personalizado:</label>
                          <textarea
                            value={formData.anesthesiaType.peridural?.textoPersonalizado || ''}
                            onChange={(e) => updateAnesthesiaType('peridural', 'textoPersonalizado', e.target.value)}
                            placeholder="Personalize o texto da peridural..."
                            rows="3"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                case 'sedacao':
                  return (
                    <div key="card-sedacao" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Sedação {isPediatric ? '(Pediátrica - Sistema Baraka)' : '(Consciente)'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200" title="Posição na ordem">#{(formData.anesthesiaType.selectedOrder || []).indexOf('sedacao') + 1}</span>
                          <button type="button" onClick={() => moveTechnique('sedacao','up')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para cima">↑</button>
                          <button type="button" onClick={() => moveTechnique('sedacao','down')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para baixo">↓</button>
                          <button type="button" onClick={() => toggleTechnique('sedacao')} className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Desativar técnica">Desativar</button>
                        </div>
                      </div>
                      <div className="space-y-3 ml-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Texto personalizado:</label>
                          <textarea
                            value={formData.anesthesiaType.sedacao?.textoPersonalizado || ''}
                            onChange={(e) => updateAnesthesiaType('sedacao', 'textoPersonalizado', e.target.value)}
                            placeholder={`Personalize o texto da sedação ${isPediatric ? 'pediátrica' : 'consciente'}...`}
                            rows="3"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                case 'plexoBraquial':
                  return (
                    <div key="card-plexo" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Bloqueio de Plexo Braquial</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200" title="Posição na ordem">#{(formData.anesthesiaType.selectedOrder || []).indexOf('plexoBraquial') + 1}</span>
                          <button type="button" onClick={() => moveTechnique('plexoBraquial','up')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para cima">↑</button>
                          <button type="button" onClick={() => moveTechnique('plexoBraquial','down')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para baixo">↓</button>
                          <button type="button" onClick={() => toggleTechnique('plexoBraquial')} className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Desativar técnica">Desativar</button>
                        </div>
                      </div>
                      <div className="space-y-3 ml-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Texto personalizado:</label>
                          <textarea
                            value={formData.anesthesiaType.plexoBraquial?.textoPersonalizado || ''}
                            onChange={(e) => updateAnesthesiaType('plexoBraquial', 'textoPersonalizado', e.target.value)}
                            placeholder="Personalize o texto do bloqueio de plexo braquial..."
                            rows="3"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                case 'outras':
                  return (
                    <div key="card-outras" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Outras Técnicas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200" title="Posição na ordem">#{(formData.anesthesiaType.selectedOrder || []).indexOf('outras') + 1}</span>
                          <button type="button" onClick={() => moveTechnique('outras','up')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para cima">↑</button>
                          <button type="button" onClick={() => moveTechnique('outras','down')} className="px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Mover para baixo">↓</button>
                          <button type="button" onClick={() => toggleTechnique('outras')} className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50" aria-label="Desativar técnica">Desativar</button>
                        </div>
                      </div>
                      <div className="space-y-3 ml-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Nome da técnica:</label>
                          <input
                            type="text"
                            value={formData.anesthesiaType.outras?.nome || ''}
                            onChange={(e) => updateAnesthesiaType('outras', 'nome', e.target.value)}
                            placeholder="Ex: Bloqueio TAP, Bloqueio femoral..."
                            className="w-full rounded-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Descrição da técnica:</label>
                          <textarea
                            value={formData.anesthesiaType.outras?.textoPersonalizado || ''}
                            onChange={(e) => updateAnesthesiaType('outras', 'textoPersonalizado', e.target.value)}
                            placeholder="Descreva a técnica anestésica utilizada..."
                            rows="3"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                default:
                  return null;
              }
            })}

            {/* Alert and Preview */}
            {!hasAnesthesiaTypeSelected() && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">⚠️ Selecione pelo menos um tipo de anestesia.</p>
              </div>
            )}
            <div className="flex justify-between pt-4">
              <button type="button" onClick={goPrev} className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Anterior</button>
              <button type="button" onClick={goNext} disabled={!isStepValid(3)} className={`px-4 py-2 rounded ${isStepValid(3) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500'}`}>Próximo</button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 4: Finalização */}
      <div className="rounded-lg border">
        <div
          className="flex items-center justify-between p-3 bg-orange-50 rounded-t-lg cursor-pointer"
          onClick={() => { if (canGoToStep(4)) setCurrentStep(4); }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-semibold text-orange-900">Finalização</h3>
          </div>
          {currentStep !== 4 && canGoToStep(4) && (
            <div className="text-xs text-gray-700 italic max-w-[60%] truncate">{generateCompletionText()}</div>
          )}
        </div>
        {currentStep === 4 && (
          <div className="p-4 space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.completion.revisaoPosicionamento} onChange={(e) => updateCompletion('revisaoPosicionamento', e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              <span className="text-sm">Revisão de posicionamento</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.completion.defaultFinalization} onChange={(e) => updateCompletion('defaultFinalization', e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              <span className="text-sm">Usar texto padrão de finalização</span>
            </label>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Destino:</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="destination" checked={formData.completion.destinationRPA} onChange={(e) => { updateCompletion('destinationRPA', e.target.checked); updateCompletion('destinationUTI', !e.target.checked); }} className="border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <span className="text-sm">RPA</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="destination" checked={formData.completion.destinationUTI} onChange={(e) => { updateCompletion('destinationUTI', e.target.checked); updateCompletion('destinationRPA', !e.target.checked); }} className="border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <span className="text-sm">UTI</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações de finalização:</label>
              <textarea value={formData.completion.customFinalization} onChange={(e) => updateCompletion('customFinalization', e.target.value)} placeholder="Adicione observações específicas sobre o final da cirurgia..." rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
            </div>
            {/* Navigation + Save */}
            <div className="flex items-center justify-between pt-4">
              <button type="button" onClick={goPrev} className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Anterior</button>
              <div className="flex items-center gap-3">
                <button onClick={saveFinalDescription} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">💾 Salvar descrição final</button>
                <button type="button" onClick={() => { /* optionally finalize */ }} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Concluir</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PREVIEW GERAL (todas as seções) */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900">Descrição final</h3>
          <button
            type="button"
            onClick={() => { try { navigator.clipboard && navigator.clipboard.writeText(generateFullPreview()); } catch (_) {} }}
            className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
            title="Copiar descrição final"
          >
            Copiar
          </button>
        </div>
        <div className="text-sm text-gray-800 whitespace-pre-line">{generateFullPreview()}</div>
      </div>
    </div>
  );
};

export default AnesthesiaDescription;