import React, { useState, useEffect } from 'react';
import { Activity, Plus, BarChart3, ChevronDown, ChevronUp, User, Edit3, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import VitalChart from './VitalChart';

// Função utilitária para obter o timestamp absoluto de um horário (HH:mm) baseado na data de início da cirurgia
const getAbsoluteTimestamp = (timeStr, baseDate) => {
  // Se timeStr já for Date, retorna ela
  if (timeStr instanceof Date) return timeStr;
  // Se timeStr for string no formato HH:mm, calcula o Date
  if (!baseDate || !timeStr) return null;
  // Suporta timeStr vindo como "HH:mm" ou Date ou já string de data
  if (typeof timeStr === 'string' && timeStr.match(/^\d{2}:\d{2}$/)) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    // Se o horário calculado for menor que a base (passou da meia-noite), soma 1 dia
    if (result < baseDate) result.setDate(result.getDate() + 1);
    return result;
  }
  // Se timeStr for string de data ISO
  if (typeof timeStr === 'string') {
    const d = new Date(timeStr);
    if (!isNaN(d)) return d;
  }
  return null;
};

const VitalSignsSection = ({ 
  vitalSigns = [], 
  surgery,
  onVitalSignsChange,
  autoSave 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [simDuration, setSimDuration] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Parâmetros dinâmicos para colunas extras
  const dynamicParams = [
    'etco2', 'temperatura', 'bis', 'pupillas', 'tof',
    'glicemia', 'lactato', 'fio2', 'peep', 'volumeCorrente',
    'pvc', 'debitoCardiaco', 'diurese', 'sangramento'
  ];

  // Retorna { linha1, linha2 } para cabeçalhos de tabela
  const nomeAmigavel = (param) => ({
    fc: { linha1: "FC", linha2: "bpm" },
    spo2: { linha1: "SpO₂", linha2: "%" },
    pasSistolica: { linha1: "PA Sist", linha2: "mmHg" },
    pasDiastolica: { linha1: "PA Diast", linha2: "mmHg" },
    pam: { linha1: "PAM", linha2: "mmHg" },
    etco2: { linha1: "EtCO₂", linha2: "mmHg" },
    temperatura: { linha1: "Temp", linha2: "°C" },
    bis: { linha1: "BIS", linha2: "" },
    pupillas: { linha1: "Pupilas", linha2: "" },
    tof: { linha1: "TOF", linha2: "" },
    glicemia: { linha1: "Glicemia", linha2: "mg/dL" },
    lactato: { linha1: "Lactato", linha2: "mmol/L" },
    fio2: { linha1: "FiO₂", linha2: "%" },
    peep: { linha1: "PEEP", linha2: "cmH₂O" },
    volumeCorrente: { linha1: "Vol. Corr", linha2: "mL" },
    pvc: { linha1: "PVC", linha2: "mmHg" },
    debitoCardiaco: { linha1: "DC", linha2: "L/min" },
    diurese: { linha1: "Diurese", linha2: "mL" },
    sangramento: { linha1: "Sangue", linha2: "mL" }
  }[param] || { linha1: param, linha2: "" });
  
  // Estado para perfil do paciente (simples)
  const [patientProfile, setPatientProfile] = useState('stable');

  // Estado para edição de registros na tabela
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingMobileRecord, setEditingMobileRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  // Funções auxiliares para edição inline
  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = (id) => {
    const updatedVitalSigns = vitalSigns.map(r =>
      r.id === id ? { ...r, ...editFormData } : r
    );
    onVitalSignsChange(updatedVitalSigns);
    if (autoSave) autoSave({ vitalSigns: updatedVitalSigns });
    setEditingRecord(null);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    ritmo: 'Sinusal',
    fc: '79',
    pasSistolica: '119',
    pasDiastolica: '81',
    spo2: '100',
    etco2: '',
    temperatura: '',
    bis: '',
    pupillas: '',
    tof: '',
    glicemia: '',
    lactato: '',
    fio2: '',
    peep: '',
    volumeCorrente: '',
    pvc: '',
    debitoCardiaco: '',
    diurese: '',
    sangramento: ''
  });

  // ===== SISTEMA DE PERFIS SIMPLES =====
  
  const patientProfiles = {
    stable: {
      name: 'Cirurgia Estável',
      description: 'Paciente estável, pequenas variações normais',
      emoji: '😌',
      variations: {
        fc: { range: 5, trend: 'stable' },           // ±5 bpm
        pasSistolica: { range: 8, trend: 'stable' }, // ±8 mmHg
        pasDiastolica: { range: 5, trend: 'stable' },// ±5 mmHg
        spo2: { range: 1, trend: 'stable' },         // ±1%
        etco2: { range: 3, trend: 'stable' },        // ±3 mmHg
        temperatura: { range: 0.3, trend: 'stable' },// ±0.3°C
        bis: { range: 5, trend: 'stable' },          // ±5
        pvc: { range: 2, trend: 'stable' }           // ±2 mmHg
      }
    },
    
    hypovolemic: {
      name: 'Sangramento/Hipovolemia',
      description: 'PA caindo, FC compensando, PVC baixo',
      emoji: '🩸',
      variations: {
        fc: { range: 8, trend: 'rising' },           // sobe gradualmente
        pasSistolica: { range: 12, trend: 'falling' }, // cai gradualmente
        pasDiastolica: { range: 8, trend: 'falling' },
        spo2: { range: 2, trend: 'stable' },
        etco2: { range: 4, trend: 'stable' },
        temperatura: { range: 0.4, trend: 'falling' }, // hipotermia leve
        bis: { range: 6, trend: 'stable' },
        pvc: { range: 3, trend: 'falling' }          // PVC baixo
      },
      correlations: true // FC compensa PA
    },
    
    hypertensive: {
      name: 'Paciente Hipertenso',
      description: 'PA elevada com variações, FC pode ser irregular',
      emoji: '📈',
      variations: {
        fc: { range: 6, trend: 'stable' },
        pasSistolica: { range: 15, trend: 'volatile' }, // mais instável
        pasDiastolica: { range: 10, trend: 'volatile' },
        spo2: { range: 1, trend: 'stable' },
        etco2: { range: 3, trend: 'stable' },
        temperatura: { range: 0.3, trend: 'stable' },
        bis: { range: 5, trend: 'stable' },
        pvc: { range: 4, trend: 'rising' }           // pode subir
      }
    },
    
    cardiac: {
      name: 'Instabilidade Cardíaca',
      description: 'FC irregular, correlações PA-FC alteradas',
      emoji: '💓',
      variations: {
        fc: { range: 12, trend: 'volatile' },        // muito irregular
        pasSistolica: { range: 10, trend: 'volatile' },
        pasDiastolica: { range: 7, trend: 'volatile' },
        spo2: { range: 2, trend: 'stable' },
        etco2: { range: 4, trend: 'stable' },
        temperatura: { range: 0.3, trend: 'stable' },
        bis: { range: 6, trend: 'stable' },
        pvc: { range: 5, trend: 'volatile' }
      },
      correlations: false // correlações alteradas
    },
    
    respiratory: {
      name: 'Problemas Respiratórios',
      description: 'SpO2 e EtCO2 instáveis, outros parâmetros compensando',
      emoji: '🫁',
      variations: {
        fc: { range: 7, trend: 'rising' },           // FC sobe (hipoxemia)
        pasSistolica: { range: 8, trend: 'stable' },
        pasDiastolica: { range: 5, trend: 'stable' },
        spo2: { range: 4, trend: 'falling' },        // problema principal
        etco2: { range: 8, trend: 'volatile' },      // instável
        temperatura: { range: 0.3, trend: 'stable' },
        bis: { range: 5, trend: 'stable' },
        pvc: { range: 2, trend: 'stable' }
      }
    }
  };

  // ===== FUNÇÃO DE GERAÇÃO SIMPLIFICADA =====
  
  const generateValueWithProfile = (baseValue, parameter, profile, timeIndex, totalRecords, duration) => {
    const profileConfig = patientProfiles[profile];
    const paramConfig = profileConfig.variations[parameter];
    
    if (!paramConfig || !baseValue) return baseValue;
    
    // Fator de duração (cirurgias longas = mais instabilidade)
    const durationFactor = duration <= 60 ? 1.0 : 
                          duration <= 360 ? 1.1 : 1.15;
    
    // Componente de tendência
    const timeProgress = timeIndex / (totalRecords - 1); // 0 a 1
    let trendComponent = 0;
    
    switch (paramConfig.trend) {
      case 'rising':
        trendComponent = timeProgress * 0.15 * durationFactor; // sobe até 15%
        break;
      case 'falling':
        trendComponent = -timeProgress * 0.20 * durationFactor; // cai até 20%
        break;
      case 'volatile':
        // Sem tendência, só variação maior
        break;
      default: // stable
        trendComponent = 0;
    }
    
    // Componente de variação aleatória
    const variation = paramConfig.range;
    const randomVariation = parameter === 'temperatura' ? 
      (Math.random() - 0.5) * 2 * variation : // temperatura em decimal
      Math.round((Math.random() - 0.5) * 2 * variation); // outros inteiros
    
    // Valor final
    let finalValue;
    if (parameter === 'temperatura') {
      finalValue = baseValue * (1 + trendComponent) + randomVariation;
      finalValue = Math.round(finalValue * 10) / 10; // 1 casa decimal
    } else {
      finalValue = Math.round(baseValue * (1 + trendComponent)) + randomVariation;
    }
    
    // Aplicar limites de segurança
    return applyLimits(finalValue, parameter, baseValue);
  };
  
  const applyLimits = (value, parameter, baseValue) => {
    const limits = {
      fc: { min: 30, max: 200 },
      pasSistolica: { min: 50, max: 250 },
      pasDiastolica: { min: 30, max: 150 },
      spo2: { min: 85, max: 100 },
      etco2: { min: 15, max: 60 },
      temperatura: { min: 32.0, max: 42.0 },
      bis: { min: 0, max: 100 },
      pvc: { min: 0, max: 25 }
    };
    
    const limit = limits[parameter];
    if (!limit) return value;
    
    return Math.max(limit.min, Math.min(limit.max, value));
  };

  // Aplicar correlações simples
  const applyCorrelations = (record, profile, baseData) => {
    if (profile === 'hypovolemic') {
      // Se PA baixa, FC sobe (compensação)
      const pasDrop = (baseData.pasSistolica - record.pasSistolica) / baseData.pasSistolica;
      if (pasDrop > 0.1) { // PA caiu >10%
        record.fc = Math.min(200, record.fc + Math.round(pasDrop * 30)); // FC compensa
      }
    }
    
    return record;
  };

  const generateAutoVitalSignsWithProfile = (baseData, duration, startTime, profile) => {
    const records = [];
    console.log("DEBUG - startTime recebido:", startTime);
    
    // 1. CALCULAR TEMPO JÁ DECORRIDO DA CIRURGIA
    const timeElapsedInSurgery = vitalSigns.length > 0
    ? minutesSinceStart(new Date(vitalSigns[vitalSigns.length - 1].absoluteTimestamp), surgeryStartDate)
    : 0;
    console.log("DEBUG - timeElapsedInSurgery:", timeElapsedInSurgery);
    
    // 2. CALCULAR INTERVALOS CONSIDERANDO O TEMPO TOTAL DA CIRURGIA
    const intervals = [];
    let tempOffset = 0;
    
    while (tempOffset <= duration) {
      intervals.push(tempOffset);
      
      // A chave da correção: somar tempo já decorrido + tempo do offset atual
      const totalTimeFromSurgeryStart = timeElapsedInSurgery + tempOffset;
      
      // Usar essa soma para decidir o intervalo (5min se < 30min total, 10min se >= 30min total)
      tempOffset += (totalTimeFromSurgeryStart < 30 ? 5 : 10);
    }
    
    const totalRecords = intervals.length;
    
    // 3. GERAR CADA REGISTRO
    intervals.forEach((timeOffset, index) => {
      const absoluteTime = addMinutesToDate(startTime, timeOffset);
      
      let record = {
        id: Date.now() + index,
        absoluteTimestamp: absoluteTime
      };
      
      // Primeiro registro = valores base exatos
      if (index === 0) {
        record = { ...record, ...baseData };
      } else {
        // Registros subsequentes com perfil
        const varyingParams = ['fc', 'pasSistolica', 'pasDiastolica', 'spo2', 'etco2', 'volumeCorrente', 'temperatura', 'bis', 'pvc'];
        
        varyingParams.forEach(param => {
          if (baseData[param]) {
            record[param] = generateValueWithProfile(
              parseFloat(baseData[param]),
              param,
              profile,
              index,
              totalRecords,
              duration
            );
          }
        });
        
        // Aplicar correlações
        record = applyCorrelations(record, profile, baseData);
        
        // Parâmetros estáticos
        const staticParams = ['ritmo', 'pupillas', 'tof', 'glicemia', 'lactato', 'fio2', 'peep', 'debitoCardiaco', 'diurese', 'sangramento'];
        staticParams.forEach(param => {
          if (baseData[param]) {
            record[param] = baseData[param];
          }
        });
        
        // Calcular PAM
        if (record.pasSistolica && record.pasDiastolica) {
          record.pam = Math.round((2 * record.pasDiastolica + record.pasSistolica) / 3);
        }
      }
      
      records.push(record);
    });
    
    return records;
  };

  // ===== COMPONENTES EXISTENTES (inalterados) =====

  const ritmosCardiacos = [
    'Sinusal',
    'Taquicardia Sinusal',
    'Bradicardia Sinusal',
    'Fibrilação Atrial',
    'Flutter Atrial',
    'Taquicardia Supraventricular',
    'Extrassístoles',
    'Ritmo Nodal'
  ];

  const pupillasOpcoes = [
    'Isocóricas',
    'Anisocóricas',
    'Miose',
    'Midríase',
    'Não avaliadas'
  ];

  const getNextSuggestedTime = () => {
    if (!surgeryStartDate) return getSurgeryBaseTime();
    if (vitalSigns.length === 0) return getSurgeryBaseTime();
  
    const lastRecord = vitalSigns[vitalSigns.length - 1];
    const lastTime = new Date(lastRecord.absoluteTimestamp);
    const elapsed = minutesSinceStart(lastTime, surgeryStartDate);
    const increment = elapsed < 30 ? 5 : 10;
  
    const nextTime = addMinutesToDate(lastTime, increment);
    return nextTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (showForm && !isAutoMode && !manualTime) {
      setManualTime(getNextSuggestedTime());
    }
  }, [showForm, isAutoMode, manualTime, vitalSigns.length]);

  const calculateDurationMinutes = () => {
    if (!simDuration) return 90;
    return parseInt(simDuration);
  };

  const calcularPAM = (sistolica, diastolica) => {
    if (!sistolica || !diastolica) return '';
    const pam = Math.round((2 * diastolica + sistolica) / 3);
    return pam;
  };

  const getSurgeryBaseTime = () => {
    const base = surgery?.startTime || surgery?.createdAt;
    if (!base) {
      return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    let surgeryDate;
    if (base.seconds) {
      surgeryDate = new Date(base.seconds * 1000);
    } else if (typeof base === 'string') {
      surgeryDate = new Date(base);
    } else {
      surgeryDate = new Date(base);
    }
    
    return surgeryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const validateForm = () => {
    const { fc, pasSistolica, pasDiastolica, spo2, ritmo } = formData;
    
    if (!fc || !pasSistolica || !pasDiastolica || !spo2 || !ritmo) {
      toast.error('Preencha todos os campos obrigatórios (Ritmo, FC, PA, SpO2)');
      return false;
    }
    
    if (parseInt(pasSistolica) <= parseInt(pasDiastolica)) {
      toast.error('PA Sistólica deve ser maior que Diastólica');
      return false;
    }
    
    if (parseInt(fc) < 30 || parseInt(fc) > 200) {
      toast.error('FC deve estar entre 30 e 200 bpm');
      return false;
    }
    
    if (parseInt(spo2) < 70 || parseInt(spo2) > 100) {
      toast.error('SpO2 deve estar entre 70 e 100%');
      return false;
    }
    
    return true;
  };

  const addMinutesToDate = (baseDate, minutes) => {
    return new Date(baseDate.getTime() + minutes * 60000);
  };

  const minutesSinceStart = (currentDate, baseDate) => {
    return Math.round((currentDate - baseDate) / 60000);
  };

  const surgeryStartDate = (() => {
    const base = surgery?.startTime || surgery?.createdAt;
    if (!base) return null;
    if (base.seconds) return new Date(base.seconds * 1000);
    if (typeof base === 'string') return new Date(base);
    return new Date(base);
  })();

  const getNextTimeForAuto = () => {
    if (vitalSigns.length === 0) return surgeryStartDate;
  
    const lastRecord = vitalSigns[vitalSigns.length - 1];
    const lastTime = new Date(lastRecord.absoluteTimestamp || surgeryStartDate);
    const elapsed = minutesSinceStart(lastTime, surgeryStartDate);
    const increment = elapsed < 30 ? 5 : 10;
  
    return addMinutesToDate(lastTime, increment);
  };
  
  // ===== FUNÇÃO handleSubmit CORRIGIDA =====
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (isAutoMode && (!simDuration || parseInt(simDuration) <= 0)) {
      toast.error('Informe a duração (min) para simulação automática');
      return;
    }

    if (!isAutoMode && !manualTime) {
      toast.error('Informe o horário do registro no modo manual');
      return;
    }

    const pam = calcularPAM(parseInt(formData.pasSistolica), parseInt(formData.pasDiastolica));

    const baseRecord = {
      ...formData,
      fc: parseInt(formData.fc),
      pasSistolica: parseInt(formData.pasSistolica),
      pasDiastolica: parseInt(formData.pasDiastolica),
      spo2: parseInt(formData.spo2),
      etco2: formData.etco2 ? parseInt(formData.etco2) : '',
      temperatura: formData.temperatura ? parseFloat(formData.temperatura) : '',
      bis: formData.bis ? parseInt(formData.bis) : '',
      tof: formData.tof ? parseInt(formData.tof) : '',
      glicemia: formData.glicemia ? parseInt(formData.glicemia) : '',
      lactato: formData.lactato ? parseFloat(formData.lactato) : '',
      fio2: formData.fio2 ? parseInt(formData.fio2) : '',
      peep: formData.peep ? parseInt(formData.peep) : '',
      volumeCorrente: formData.volumeCorrente ? parseInt(formData.volumeCorrente) : '',
      pvc: formData.pvc ? parseInt(formData.pvc) : '',
      debitoCardiaco: formData.debitoCardiaco ? parseFloat(formData.debitoCardiaco) : '',
      diurese: formData.diurese ? parseInt(formData.diurese) : '',
      sangramento: formData.sangramento ? parseInt(formData.sangramento) : '',
      pam: pam
    };

    let newRecords;

    if (isAutoMode) {
      // CORREÇÃO PRINCIPAL: usar o próximo horário, não o último
      const startTimeForAuto = getNextTimeForAuto();
      const duration = calculateDurationMinutes();

      // Usar função corrigida
      newRecords = generateAutoVitalSignsWithProfile(
        baseRecord, 
        duration, 
        startTimeForAuto,  // ← Agora é o PRÓXIMO horário
        patientProfile
      );
      // Normalizar cada registro gerado automaticamente para inserir todos os dynamicParams
      newRecords = newRecords.map(record => {
        const normalized = {
          ...record,
          ...Object.fromEntries(dynamicParams.map(param => [param, record[param] ?? '']))
        };
        return normalized;
      });
      const profileName = patientProfiles[patientProfile].name;
      toast.success(`${newRecords.length} registros gerados - ${profileName} (${duration} min)`);
    } else {
      // Modo manual: calcular absoluteTimestamp a partir de manualTime e surgeryStartDate
      const absolute = getAbsoluteTimestamp(manualTime, surgeryStartDate);
      const manualRecord = {
        id: Date.now(),
        ...baseRecord,
        absoluteTimestamp: absolute
      };
      const normalized = {
        ...manualRecord,
        ...Object.fromEntries(dynamicParams.map(param => [param, manualRecord[param] ?? '']))
      };
      newRecords = [normalized];
      toast.success('Registro de sinais vitais adicionado');
    }

    const updatedVitalSigns = [...vitalSigns, ...newRecords];
    onVitalSignsChange(updatedVitalSigns);

    if (autoSave) {
      await autoSave({ vitalSigns: updatedVitalSigns });
    }

    // Resetar formulário (resto permanece igual)
    if (isAutoMode) {
      setFormData({
        ritmo: 'Sinusal', fc: '', pasSistolica: '', pasDiastolica: '',
        spo2: '', etco2: '', temperatura: '', bis: '', pupillas: 'Isocóricas',
        tof: '', glicemia: '', lactato: '', fio2: '', peep: '', volumeCorrente: '',
        pvc: '', debitoCardiaco: '', diurese: '', sangramento: ''
      });
      setSimDuration('');
    } else {
      setFormData({
        ritmo: 'Sinusal', fc: '', pasSistolica: '', pasDiastolica: '',
        spo2: '', etco2: '', temperatura: '', bis: '', pupillas: 'Isocóricas',
        tof: '', glicemia: '', lactato: '', fio2: '', peep: '', volumeCorrente: '',
        pvc: '', debitoCardiaco: '', diurese: '', sangramento: ''
      });
      setManualTime('');
    }
  };

  const removeVitalSign = async (recordId) => {
    const updatedVitalSigns = vitalSigns.filter(record => record.id !== recordId);
    onVitalSignsChange(updatedVitalSigns);
    
    if (autoSave) {
      await autoSave({ vitalSigns: updatedVitalSigns });
    }
    
    toast.success('Registro removido');
  };

  const currentPAM = calcularPAM(parseInt(formData.pasSistolica), parseInt(formData.pasDiastolica));

  // ===== COMPONENTE DE SELEÇÃO DE PERFIL =====
  const ProfileSelector = () => {
    const duration = parseInt(simDuration) || 90;
    const selectedProfile = patientProfiles[patientProfile];
    
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-green-600" />
          <h5 className="text-sm font-medium text-green-800">
            Perfil do Paciente
          </h5>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Cenário:
            </label>
            <select
              value={patientProfile}
              onChange={(e) => setPatientProfile(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {Object.entries(patientProfiles).map(([key, profile]) => (
                <option key={key} value={key}>
                  {profile.emoji} {profile.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="p-3 bg-green-100 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">
              {selectedProfile.emoji} {selectedProfile.name}
            </div>
            <div className="text-xs text-green-700">
              {selectedProfile.description}
            </div>
            <div className="text-xs text-green-600 mt-2">
              ⏱️ Duração: {duration}min {duration > 180 ? '(instabilidade aumentada)' : ''}
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Colunas dinâmicas ativas (presentes em algum registro)
  const activeDynamicColumns = dynamicParams.filter(param =>
    vitalSigns.some(r => r[param] !== undefined && r[param] !== '')
  );

  // Utilitário: retorna apenas os campos dinâmicos presentes no registro
  const getActiveFieldsForRecord = (record) => {
    return [
      'etco2', 'temperatura', 'bis', 'pupillas', 'tof',
      'glicemia', 'lactato', 'fio2', 'peep', 'volumeCorrente',
      'pvc', 'debitoCardiaco', 'diurese', 'sangramento'
    ].filter(param =>
      record[param] !== undefined &&
      record[param] !== '' &&
      record[param] !== null
    );
  };

  // CompactCards: versão mobile dos registros de sinais vitais em cartões (com edição inline)
  const CompactCards = () => (
    <div className="space-y-1">
      {[...vitalSigns].sort((a, b) => {
        const t1 = new Date(a.absoluteTimestamp);
        const t2 = new Date(b.absoluteTimestamp);
        return t1 - t2;
      }).map((record) => (
        <div key={record.id} className="bg-white border rounded-lg p-3 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-mono text-blue-600">
              {record.absoluteTimestamp
                ? new Date(record.absoluteTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '--'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {record.ritmo}
              </span>
              {/* Botões de ação */}
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (editingMobileRecord === record.id) {
                      setEditingMobileRecord(null);
                    } else {
                      setEditingMobileRecord(record.id);
                      const fixedFields = ['ritmo', 'fc', 'pasSistolica', 'pasDiastolica', 'pam', 'spo2'];
                      const allFields = [...fixedFields, ...activeDynamicColumns];
                      // Garante todos os campos, mesmo se undefined/null, como string vazia
                      const initialFormData = {};
                      allFields.forEach((field) => {
                        initialFormData[field] = record[field] !== undefined && record[field] !== null ? record[field] : '';
                      });
                      setEditFormData({
                        ...initialFormData,
                        id: record.id,
                        absoluteTimestamp: record.absoluteTimestamp
                      });
                    }
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                  title="Editar"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeVitalSign(record.id)}
                  className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                  title="Excluir"
                >
                  <Trash className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-700">
            <div><strong>FC:</strong> {record.fc ?? '--'} bpm</div>
            <div><strong>SpO₂:</strong> {record.spo2 ?? '--'}%</div>
            <div><strong>PA:</strong> {record.pasSistolica}/{record.pasDiastolica ?? '--'} mmHg</div>
            <div><strong>PAM:</strong> {record.pam ?? '--'} mmHg</div>
            {getActiveFieldsForRecord(record).map((param) => (
              <div key={param}>
                <strong>{nomeAmigavel(param).linha1}:</strong> {record[param] ?? '--'} {nomeAmigavel(param).linha2}
              </div>
            ))}
          </div>

          {editingMobileRecord === record.id && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">FC:</label>
                    <input
                      type="number"
                      value={editFormData.fc || ''}
                      onChange={(e) => handleEditChange('fc', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SpO2:</label>
                    <input
                      type="number"
                      value={editFormData.spo2 || ''}
                      onChange={(e) => handleEditChange('spo2', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PA Sist:</label>
                    <input
                      type="number"
                      value={editFormData.pasSistolica || ''}
                      onChange={(e) => handleEditChange('pasSistolica', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PA Diast:</label>
                    <input
                      type="number"
                      value={editFormData.pasDiastolica || ''}
                      onChange={(e) => handleEditChange('pasDiastolica', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ritmo:</label>
                  <select
                    value={editFormData.ritmo || ''}
                    onChange={(e) => handleEditChange('ritmo', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                  >
                    {ritmosCardiacos.map(ritmo => (
                      <option key={ritmo} value={ritmo}>{ritmo}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    'etco2', 'temperatura', 'bis', 'pupillas', 'tof',
                    'glicemia', 'lactato', 'fio2', 'peep', 'volumeCorrente',
                    'pvc', 'debitoCardiaco', 'diurese', 'sangramento'
                  ].map((param) => (
                    <div key={param}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {nomeAmigavel(param).linha1}:
                      </label>
                      <input
                        type={param === 'pupillas' ? 'text' : 'number'}
                        step={param === 'temperatura' || param === 'lactato' || param === 'debitoCardiaco' ? '0.1' : '1'}
                        value={editFormData[param] ?? ''}
                        onChange={(e) => handleEditChange(param, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingMobileRecord(null)}
                    className="px-3 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleSaveEdit(record.id);
                      setEditingMobileRecord(null);
                    }}
                    className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
  

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div>
        <div className="mb-3">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sinais Vitais ({vitalSigns.length} registros)
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-2">
            {vitalSigns.length > 0 && (
              <button
                onClick={() => setShowGraphs(!showGraphs)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <BarChart3 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="w-fit px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
          </div>
        </div>
      </div>

      {/* Formulário de entrada */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h4 className="text-base font-semibold text-gray-900">
                Registrar Sinais Vitais
              </h4>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Linha 1: Horário e Modo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Modo automático */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={isAutoMode}
                  onChange={(e) => setIsAutoMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-blue-800">🤖 Modo Automático</span>
                  <p className="text-xs text-blue-600">Gerar registros com perfil de paciente</p>
                </div>
              </div>

              {/* Horário manual ou duração automática */}
              {!isAutoMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🕒 Horário do Registro *
                  </label>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ⏱️ Duração (min) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={simDuration}
                    onChange={(e) => setSimDuration(e.target.value)}
                    placeholder="Ex: 90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
            </div>

            {/* Seletor de Perfil - só aparece no modo automático */}
            {isAutoMode && simDuration && (
              <ProfileSelector />
            )}

            {/* Grupo 2: Cardiovascular */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <h5 className="text-sm font-medium text-red-800 mb-3">🩺 Cardiovascular</h5>
              
              {/* Linha 1: Ritmo + FC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ritmo Cardíaco *
                  </label>
                  <select
                    value={formData.ritmo}
                    onChange={(e) => setFormData({...formData, ritmo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {ritmosCardiacos.map(ritmo => (
                      <option key={ritmo} value={ritmo}>{ritmo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Frequência Cardíaca (bpm) *
                  </label>
                  <input
                    type="number"
                    value={formData.fc}
                    onChange={(e) => setFormData({...formData, fc: e.target.value})}
                    placeholder="Ex: 72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Linha 2: PA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PA Sistólica (mmHg) *
                  </label>
                  <input
                    type="number"
                    placeholder="120"
                    value={formData.pasSistolica}
                    onChange={(e) => setFormData({ ...formData, pasSistolica: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PA Diastólica (mmHg) *
                  </label>
                  <input
                    type="number"
                    placeholder="80"
                    value={formData.pasDiastolica}
                    onChange={(e) => setFormData({ ...formData, pasDiastolica: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PAM (mmHg)
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600 flex items-center justify-center">
                    {currentPAM || '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grupo 3: Respiratório */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-sm font-medium text-blue-800 mb-3">🫁 Respiratório</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    SpO2 (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.spo2}
                    onChange={(e) => setFormData({...formData, spo2: e.target.value})}
                    placeholder="98"
                    min="70"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    EtCO2 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formData.etco2}
                    onChange={(e) => setFormData({...formData, etco2: e.target.value})}
                    placeholder="35"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Grupo 4: Outros Parâmetros - Colapsável */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700">🔍 Outros Parâmetros</h5>
                <button
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  {showAdvancedFields ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Mostrar
                    </>
                  )}
                </button>
              </div>

              {showAdvancedFields && (
                <div className="space-y-3">
                  {/* Neurológicos */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-600 mb-2">Neurológicos</h6>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          BIS (0-100)
                        </label>
                        <input
                          type="number"
                          value={formData.bis}
                          onChange={(e) => setFormData({...formData, bis: e.target.value})}
                          placeholder="45"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pupilas
                        </label>
                        <select
                          value={formData.pupillas}
                          onChange={(e) => setFormData({...formData, pupillas: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        >
                          {pupillasOpcoes.map(opcao => (
                            <option key={opcao} value={opcao}>{opcao}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          TOF (0-4)
                        </label>
                        <input
                          type="number"
                          value={formData.tof}
                          onChange={(e) => setFormData({...formData, tof: e.target.value})}
                          placeholder="4"
                          min="0"
                          max="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metabólicos */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-600 mb-2">Metabólicos</h6>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Glicemia (mg/dL)
                        </label>
                        <input
                          type="number"
                          value={formData.glicemia}
                          onChange={(e) => setFormData({...formData, glicemia: e.target.value})}
                          placeholder="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Lactato (mmol/L)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.lactato}
                          onChange={(e) => setFormData({...formData, lactato: e.target.value})}
                          placeholder="1.5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Respiratório Avançado */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-600 mb-2">Respiratório Avançado</h6>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          FiO2 (%)
                        </label>
                        <input
                          type="number"
                          value={formData.fio2}
                          onChange={(e) => setFormData({...formData, fio2: e.target.value})}
                          placeholder="50"
                          min="21"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          PEEP (cmH2O)
                        </label>
                        <input
                          type="number"
                          value={formData.peep}
                          onChange={(e) => setFormData({...formData, peep: e.target.value})}
                          placeholder="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Vol. Corrente (mL)
                        </label>
                        <input
                          type="number"
                          value={formData.volumeCorrente}
                          onChange={(e) => setFormData({...formData, volumeCorrente: e.target.value})}
                          placeholder="500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hemodinâmicos */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-600 mb-2">Hemodinâmicos</h6>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          PVC (mmHg)
                        </label>
                        <input
                          type="number"
                          value={formData.pvc}
                          onChange={(e) => setFormData({...formData, pvc: e.target.value})}
                          placeholder="8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Débito Cardíaco (L/min)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.debitoCardiaco}
                          onChange={(e) => setFormData({...formData, debitoCardiaco: e.target.value})}
                          placeholder="5.0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Outros */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-600 mb-2">Outros</h6>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Temperatura (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.temperatura}
                          onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                          placeholder="36.8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Diurese (mL)
                        </label>
                        <input
                          type="number"
                          value={formData.diurese}
                          onChange={(e) => setFormData({...formData, diurese: e.target.value})}
                          placeholder="50"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Sangramento (mL)
                        </label>
                        <input
                          type="number"
                          value={formData.sangramento}
                          onChange={(e) => setFormData({...formData, sangramento: e.target.value})}
                          placeholder="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    ritmo: 'Sinusal', fc: '', pasSistolica: '', pasDiastolica: '',
                    spo2: '', etco2: '', temperatura: '', bis: '', pupillas: 'Isocóricas',
                    tof: '', glicemia: '', lactato: '', fio2: '', peep: '', volumeCorrente: '',
                    pvc: '', debitoCardiaco: '', diurese: '', sangramento: ''
                  });
                  setSimDuration('');
                  setManualTime('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {isAutoMode ? 'Gerar com Perfil' : 'Adicionar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualização gráfica */}
      {showGraphs && vitalSigns.length > 0 && (
        <VitalChart 
          vitalSigns={vitalSigns} 
          surgery={surgery}
          showTitle={true}
          height={320}
          compact={false}
        />
      )}

      {/* Lista de registros (tabela com edição inline) */}
      {vitalSigns.length > 0 ? (
        <>
          {/* Desktop: Tabela completa */}
          <div className="hidden md:block">
            {/* Conteúdo da tabela existente */}
            <div className="overflow-auto max-w-full max-h-[70vh]">
              <table className="min-w-max bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr className="sticky top-0 z-20 bg-gray-50">
                    <th className="bg-white">
                      <div className="text-center leading-tight font-mono">
                        <div className="text-sm font-semibold text-gray-800">Horário</div>
                      </div>
                    </th>
                    <th className="bg-white">
                      <div className="text-center leading-tight">
                        <div className="text-sm font-semibold text-gray-800">Ritmo</div>
                        <div className="text-xs text-gray-500"></div>
                      </div>
                    </th>
                    {/* FC */}
                    <th className="bg-white">
                      <div className="text-center leading-tight">
                        <div className="text-sm font-semibold text-gray-800">{nomeAmigavel('fc').linha1}</div>
                        <div className="text-xs text-gray-500">{nomeAmigavel('fc').linha2}</div>
                      </div>
                    </th>
                    {/* SpO2 */}
                    <th className="bg-white">
                      <div className="text-center leading-tight">
                        <div className="text-sm font-semibold text-gray-800">{nomeAmigavel('spo2').linha1}</div>
                        <div className="text-xs text-gray-500">{nomeAmigavel('spo2').linha2}</div>
                      </div>
                    </th>
                    {/* PA sist/diast */}
                    <th className="bg-white">
                      <div className="text-center leading-tight">
                        <div className="text-sm font-semibold text-gray-800">PA</div>
                        <div className="text-xs text-gray-500">mmHg</div>
                      </div>
                    </th>
                    {/* PAM */}
                    <th className="bg-white">
                      <div className="text-center leading-tight">
                        <div className="text-sm font-semibold text-gray-800">{nomeAmigavel('pam').linha1}</div>
                        <div className="text-xs text-gray-500">{nomeAmigavel('pam').linha2}</div>
                      </div>
                    </th>
                    {/* Colunas dinâmicas para parâmetros extras */}
                    {activeDynamicColumns.map(param => {
                      const { linha1, linha2 } = nomeAmigavel(param);
                      return (
                        <th key={param} className="bg-white">
                          <div className="text-center leading-tight">
                            <div className="text-sm font-semibold text-gray-800">{linha1}</div>
                            <div className="text-xs text-gray-500">{linha2}</div>
                          </div>
                        </th>
                      );
                    })}
                    <th className="bg-white">
                      <div className="text-center leading-tight">
                        <div className="text-sm font-semibold text-gray-800">Ações</div>
                        <div className="text-xs text-gray-500"></div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...vitalSigns].sort((a, b) => {
                    const t1 = new Date(a.absoluteTimestamp);
                    const t2 = new Date(b.absoluteTimestamp);
                    return t1 - t2;
                  }).map((record, idx) => (
                    <React.Fragment key={record.id}>
                      <tr className={`border-b border-gray-100 ${idx % 2 === 1 ? 'even:bg-gray-50' : ''}`}>
                        <td className="px-3 py-2 font-mono text-blue-600 text-sm">
                          {record.absoluteTimestamp
                            ? new Date(record.absoluteTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : '--'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-800">{record.ritmo}</td>
                        <td className="px-3 py-2 text-xs text-gray-800 text-right">{record.fc !== undefined && record.fc !== '' ? record.fc : '--'}</td>
                        <td className="px-3 py-2 text-xs text-gray-800 text-right">{record.spo2 !== undefined && record.spo2 !== '' ? record.spo2 : '--'}</td>
                        <td className="px-3 py-2 text-xs text-gray-800">
                          {record.pasSistolica !== undefined && record.pasSistolica !== '' && record.pasDiastolica !== undefined && record.pasDiastolica !== ''
                            ? `${record.pasSistolica}/${record.pasDiastolica}`
                            : '--'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-800 text-right">{record.pam !== undefined && record.pam !== '' ? record.pam : '--'}</td>
                        {activeDynamicColumns.map(param => (
                          <td
                            key={param}
                            className={`px-3 py-2 text-xs text-gray-800${
                              // Alinhar à direita se campo numérico
                              ['fc', 'pasSistolica', 'pasDiastolica', 'pam', 'spo2', 'etco2', 'temperatura', 'bis', 'tof', 'glicemia', 'lactato', 'fio2', 'peep', 'volumeCorrente', 'pvc', 'debitoCardiaco', 'diurese', 'sangramento'].includes(param)
                                ? ' text-right'
                                : ''
                            }`}
                          >
                            {record[param] !== undefined && record[param] !== '' ? record[param] : '--'}
                          </td>
                        ))}
                        <td className="px-3 py-2 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingRecord(record.id);
                              // Preenche todos os campos editáveis mesmo que ausentes
                              const fixedFields = ['ritmo', 'fc', 'pasSistolica', 'pasDiastolica', 'pam', 'spo2'];
                              const allFields = [...fixedFields, ...activeDynamicColumns];
                          const initialFormData = Object.fromEntries(
                            allFields.map(field => [field, record.hasOwnProperty(field) ? record[field] : ''])
                          );
                              setEditFormData({
                                ...initialFormData,
                                id: record.id,
                                absoluteTimestamp: record.absoluteTimestamp
                              });
                            }}
                            className="text-blue-600 hover:underline text-xs flex items-center justify-center"
                            title="Editar"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => removeVitalSign(record.id)}
                            className="text-red-600 hover:underline text-xs flex items-center justify-center"
                            title="Excluir"
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                      {editingRecord === record.id && (
                        <tr className="bg-blue-50">
                          <td colSpan={7 + activeDynamicColumns.length} className="p-4">
                            <div className="space-y-2">
                              {/* Campos fixos */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Ritmo:</label>
                                  <input
                                    type="text"
                                    value={editFormData.ritmo || ''}
                                    onChange={(e) => handleEditChange('ritmo', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">FC (bpm):</label>
                                  <input
                                    type="number"
                                    value={editFormData.fc || ''}
                                    onChange={(e) => handleEditChange('fc', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">SpO2 (%):</label>
                                  <input
                                    type="number"
                                    value={editFormData.spo2 || ''}
                                    onChange={(e) => handleEditChange('spo2', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">PA Sistólica:</label>
                                  <input
                                    type="number"
                                    value={editFormData.pasSistolica || ''}
                                    onChange={(e) => handleEditChange('pasSistolica', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">PA Diastólica:</label>
                                  <input
                                    type="number"
                                    value={editFormData.pasDiastolica || ''}
                                    onChange={(e) => handleEditChange('pasDiastolica', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">PAM:</label>
                                  <input
                                    type="number"
                                    value={editFormData.pam || ''}
                                    onChange={(e) => handleEditChange('pam', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              </div>
                              {/* Campos dinâmicos: mostrar se existentes em algum registro ou neste record */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                {[
                                  // Lista dos campos extras
                                  'etco2', 'temperatura', 'bis', 'pupillas', 'tof',
                                  'glicemia', 'lactato', 'fio2', 'peep', 'volumeCorrente',
                                  'pvc', 'debitoCardiaco', 'diurese', 'sangramento'
                                ].map(param => (
                                  <div key={param}>
                                    <label className="block text-xs font-medium text-gray-700">
                                      {(() => {
                                        // Nome amigável para o campo
                                        switch (param) {
                                          case 'etco2': return 'EtCO2 (mmHg)';
                                          case 'temperatura': return 'Temperatura (°C)';
                                          case 'bis': return 'BIS (0-100)';
                                          case 'pupillas': return 'Pupilas';
                                          case 'tof': return 'TOF (0-4)';
                                          case 'glicemia': return 'Glicemia (mg/dL)';
                                          case 'lactato': return 'Lactato (mmol/L)';
                                          case 'fio2': return 'FiO2 (%)';
                                          case 'peep': return 'PEEP (cmH2O)';
                                          case 'volumeCorrente': return 'Vol. Corrente (mL)';
                                          case 'pvc': return 'PVC (mmHg)';
                                          case 'debitoCardiaco': return 'Débito Cardíaco (L/min)';
                                          case 'diurese': return 'Diurese (mL)';
                                          case 'sangramento': return 'Sangramento (mL)';
                                          default: return param;
                                        }
                                      })()}
                                    </label>
                                    <input
                                      type={param === 'pupillas' ? 'text' : 'number'}
                                      value={editFormData[param] || ''}
                                      onChange={(e) => handleEditChange(param, e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(record.id)}
                                  className="text-xs text-blue-600 font-medium hover:underline"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Cards compactos */}
          <div className="md:hidden">
            <CompactCards />
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nenhum registro de sinais vitais ainda</p>
          <p className="text-xs">Clique em "Novo Registro" para começar</p>
        </div>
      )}
    </div>
  );
};

export default VitalSignsSection;