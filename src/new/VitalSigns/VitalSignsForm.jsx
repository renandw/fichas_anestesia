import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Activity
} from 'lucide-react';
import VitalSignsFormMobile from './VitalSignsFormMobile';
import VitalSignsFormDesktop from './VitalSignsFormDesktop';

// Normalizador seguro para Date/Timestamp/ISO/pt-BR
const safeToDate = (val) => {
  if (!val) return null;
  try {
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (val && typeof val.toDate === 'function') return val.toDate(); // Firestore Timestamp
    if (typeof val === 'object' && val !== null) {
      if (typeof val.seconds === 'number') return new Date(val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1e6) : 0));
      if (typeof val._seconds === 'number') return new Date(val._seconds * 1000 + (val._nanoseconds ? Math.floor(val._nanoseconds / 1e6) : 0));
    }
    if (typeof val === 'number') return new Date(val < 1e12 ? val * 1000 : val);
    if (typeof val === 'string') {
      const s = val.trim();
      const native = new Date(s);
      if (!isNaN(native.getTime())) return native;
      const meses = { janeiro:0, fevereiro:1, marco:2, março:2, abril:3, maio:4, junho:5, julho:6, agosto:7, setembro:8, outubro:9, novembro:10, dezembro:11 };
      const re = /(\d{1,2})\s+de\s+([a-zçãéó]+)\s+de\s+(\d{4}).*?(\d{1,2}):(\d{2})(?::(\d{2}))?.*?UTC\s*([+-]?\d{1,2})/i;
      const m = s.match(re);
      if (m) {
        const dia = parseInt(m[1], 10);
        const mesNome = m[2].normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const mes = meses[mesNome];
        const ano = parseInt(m[3], 10);
        const hh = parseInt(m[4], 10);
        const mm = parseInt(m[5], 10);
        const ss = m[6] ? parseInt(m[6], 10) : 0;
        const tz = parseInt(m[7], 10) || 0;
        if (mes !== undefined) {
          const utcMs = Date.UTC(ano, mes, dia, hh - tz, mm, ss, 0);
          return new Date(utcMs);
        }
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('safeToDate: unable to parse', val, e);
  }
  return null;
};

/**
 * VitalSignsForm - Controller/Logic Component
 * 
 * Responsabilidades:
 * - Gerenciar toda a lógica de negócio e estados
 * - Detectar tipo de device (mobile/desktop)
 * - Renderizar componente UI apropriado
 * - Manter compatibilidade com API existente
 */
const VitalSignsForm = ({ 
  mode = 'create',
  surgery,
  anesthesia,
  vitalSigns, 
  onAddSingle, 
  onAddMultiple, 
  onEdit,
  onCancel, 
  isSubmitting,
  // Props específicas para modo edit
  editData = null,
  editRecordId = null
}) => {
  // ========================================
  // DETECÇÃO DE DEVICE
  // ========================================
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // md breakpoint
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ========================================
  // ESTADOS DE MODO E CONTROLE
  // ========================================
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Estados de controle de tempo
  const [manualTime, setManualTime] = useState('');
  const [simDuration, setSimDuration] = useState('');
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    // Cardiovasculares (obrigatórios)
    ritmo: '',
    fc: '',
    pasSistolica: '',
    pasDiastolica: '',
    
    // Respiratórios
    spo2: '',
    etco2: '',
    fio2: '',
    peep: '',
    volumeCorrente: '',
    
    // Neurológicos
    bis: '',
    pupilas: '',
    tof: '',
    
    // Hemodinâmicos
    pvc: '',
    debitoCardiaco: '',
    
    // Metabólicos
    glicemia: '',
    lactato: '',
    temperatura: '',
    
    // Controle de Fluidos
    diurese: '',
    sangramento: ''
  });
  
  // Estados de validação
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ========================================
  // INICIALIZAÇÃO PARA MODO EDIT
  // ========================================
  useEffect(() => {
    if (mode === 'edit' && editData) {
      console.log('[DEBUG] Inicializando modo edit com dados:', editData);
      
      // Preencher form com dados existentes
      const initialData = { ...formData };
      Object.keys(initialData).forEach(key => {
        if (editData[key] !== undefined && editData[key] !== null) {
          initialData[key] = String(editData[key]);
        }
      });
      
      setFormData(initialData);
      
      // Para edit, mostrar campos avançados se houver dados
      const hasAdvancedData = ['bis', 'pupilas', 'tof', 'pvc', 'debitoCardiaco', 
                                'glicemia', 'lactato', 'temperatura', 'diurese', 
                                'sangramento'].some(field => editData[field]);
      setShowAdvanced(hasAdvancedData);
      
      // Converter timestamp para horário
      if (editData.absoluteTimestamp) {
        const timestamp = safeToDate(editData.absoluteTimestamp);
        if (timestamp) {
          const timeStr = timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          setManualTime(timeStr);
        }
      }
    }
  }, [mode, editData]);

  // ========================================
  // UTILITÁRIOS DE DATA E TEMPO
  // ========================================
  
  // Obter a data de início da anestesia como Date
  const getAnesthesiaStartDate = () => {
    const ts = anesthesia?.anesthesiaStart ?? surgery?.anesthesiaStart;
    console.log('[DEBUG] getAnesthesiaStartDate called with:', anesthesia?.anesthesiaStart, surgery?.anesthesiaStart);
    return safeToDate(ts);
  };

  // Âncora de tempo para auto-mode: 1) anesthesiaStart, 2) último registro, 3) agora
  const getAutoAnchorDate = () => {
    const aStart = getAnesthesiaStartDate();
    console.log('[DEBUG] getAutoAnchorDate - aStart:', aStart);
    if (aStart) return aStart;
    if (vitalSigns && vitalSigns.length > 0) {
      const last = vitalSigns[vitalSigns.length - 1]?.absoluteTimestamp;
      const d = safeToDate(last);
      if (d) return d;
    }
    return new Date();
  };

  // Info de âncora para exibir na UI (sem alterar a lógica)
  const getAnchorInfo = () => {
    if (vitalSigns && vitalSigns.length > 0) {
      const last = vitalSigns[vitalSigns.length - 1]?.absoluteTimestamp;
      const d = safeToDate(last);
      if (d) return { source: 'Último registro', date: d };
    }
    const aStart = getAnesthesiaStartDate();
    if (aStart) return { source: 'Início da anestesia', date: aStart };
    return { source: 'Agora', date: new Date() };
  };

  // Converter horário para timestamp absoluto
  const getAbsoluteTimestamp = (timeStr) => {
    const baseDate = getAnesthesiaStartDate() || (vitalSigns.length > 0 ? safeToDate(vitalSigns[0].absoluteTimestamp) : new Date());
    console.log('[DEBUG] getAbsoluteTimestamp - baseDate:', baseDate, 'timeStr:', timeStr);
    if (!timeStr || !baseDate) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const absolute = new Date(baseDate);
    absolute.setHours(hours, minutes, 0, 0);
    return absolute;
  };

  // ========================================
  // OPÇÕES PARA SELETORES
  // ========================================
  const rhythmOptions = [
    'Sinusal',
    'Taquicardia Sinusal',
    'Bradicardia Sinusal',
    'Fibrilação Atrial',
    'Flutter Atrial',
    'Taquicardia Supraventricular',
    'Extrassístoles',
    'Ritmo Nodal'
  ];

  const pupilaOptions = [
    'Isocóricas',
    'Anisocóricas',
    'Miose',
    'Midríase',
    'Não avaliadas'
  ];

  // ========================================
  // INICIALIZAÇÃO DE HORÁRIO SUGERIDO
  // ========================================
  useEffect(() => {
    if (mode !== 'create') return;
    
    const getNextSuggestedTime = () => {
      const anesthesiaStartDate = getAnesthesiaStartDate();
      const anchor = getAutoAnchorDate();
      if (!anchor) return '';

      if (vitalSigns.length === 0) {
        const startTime = anchor;
        return startTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }

      const lastRecord = vitalSigns[vitalSigns.length - 1];
      const lastTime = safeToDate(lastRecord?.absoluteTimestamp) || anchor;
      const baseForElapsed = anesthesiaStartDate || (vitalSigns[0]?.absoluteTimestamp ? safeToDate(vitalSigns[0].absoluteTimestamp) : anchor);
      const elapsed = (lastTime - baseForElapsed) / (1000 * 60);
      const increment = elapsed < 30 ? 5 : 10;
      const nextTime = new Date(lastTime.getTime() + (increment * 60 * 1000));
      return nextTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    if (!isAutoMode) {
      setManualTime(getNextSuggestedTime());
    }
  }, [surgery, anesthesia, vitalSigns, isAutoMode, mode]);

  // ========================================
  // CÁLCULO DE PAM AUTOMÁTICO
  // ========================================
  const calculatePAM = (sistolica, diastolica) => {
    if (!sistolica || !diastolica) return '--';
    const pam = Math.round((parseInt(sistolica) + 2 * parseInt(diastolica)) / 3);
    return isNaN(pam) ? '--' : pam;
  };

  // ========================================
  // VALIDAÇÃO
  // ========================================
  
  // Validação de campo individual
  const validateField = (name, value) => {
    const validationRules = {
      fc: { min: 30, max: 200, required: true, name: 'FC' },
      pasSistolica: { min: 50, max: 250, required: true, name: 'PA Sistólica' },
      pasDiastolica: { min: 30, max: 150, required: true, name: 'PA Diastólica' },
      spo2: { min: 70, max: 100, required: true, name: 'SpO2' },
      etco2: { min: 15, max: 60, name: 'EtCO2' },
      fio2: { min: 21, max: 100, name: 'FiO2' },
      bis: { min: 0, max: 100, name: 'BIS' },
      tof: { min: 0, max: 4, name: 'TOF' },
      temperatura: { min: 32.0, max: 42.0, name: 'Temperatura' },
      pvc: { min: 0, max: 25, name: 'PVC' }
    };

    const rule = validationRules[name];
    if (!rule) return '';

    if (rule.required && (!value || value === '')) {
      return `${rule.name} é obrigatório`;
    }

    if (value && rule.min !== undefined && parseFloat(value) < rule.min) {
      return `${rule.name} deve ser ≥ ${rule.min}`;
    }

    if (value && rule.max !== undefined && parseFloat(value) > rule.max) {
      return `${rule.name} deve ser ≤ ${rule.max}`;
    }

    return '';
  };

  // Validação geral do formulário
  const validateForm = () => {
    const newErrors = {};

    // Validação específica por modo
    if (mode === 'create') {
      if (isAutoMode && (!simDuration || parseInt(simDuration) <= 0)) {
        newErrors.simDuration = 'Duração obrigatória para simulação automática';
      }

      if (!isAutoMode && !manualTime) {
        newErrors.manualTime = 'Horário obrigatório no modo manual';
      }
    } else if (mode === 'edit') {
      if (!manualTime) {
        newErrors.manualTime = 'Horário obrigatório';
      }
    }

    // Campos obrigatórios
    const requiredFields = ['ritmo', 'fc', 'pasSistolica', 'pasDiastolica', 'spo2'];
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field === 'ritmo' ? 'Ritmo' : field.toUpperCase()} é obrigatório`;
      }
    });

    // Validações numéricas
    Object.keys(formData).forEach(field => {
      if (formData[field]) {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });

    // Lógica médica: PA Sistólica > Diastólica
    if (formData.pasSistolica && formData.pasDiastolica) {
      if (parseInt(formData.pasSistolica) <= parseInt(formData.pasDiastolica)) {
        newErrors.pasSistolica = 'PA Sistólica deve ser maior que Diastólica';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========================================
  // HANDLERS DE FORMULÁRIO
  // ========================================
  
  // Manipular mudança de campo
  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validar campo em tempo real se já foi tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // ========================================
  // SIMULAÇÃO (apenas para modo create)
  // ========================================
  const simConfig = {
    inertia: 0.2,
    margins: {
      fc: 10, pasSistolica: 15, pasDiastolica: 10, spo2: 3, etco2: 5, bis: 10, temperatura: 1, volumeCorrente: 50
    },
    sigma: {
      fc: 2, pasSistolica: 3, pasDiastolica: 2, spo2: 3, etco2: 2, bis: 3, temperatura: 0.3, volumeCorrente: 20
    },
    limits: {
      fc: [30, 200], pasSistolica: [50, 250], pasDiastolica: [30, 150],
      spo2: [95, 100], etco2: [15, 60], bis: [0, 100], temperatura: [32, 42], volumeCorrente: [200, 800]
    }
  };

  const gaussian01 = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const softenSigmaNearEdges = (value, min, max, margin) => {
    if (value == null || isNaN(value)) return 1;
    const distMin = Math.max(0, value - min);
    const distMax = Math.max(0, max - value);
    const softMin = Math.min(1, distMin / Math.max(1, margin));
    const softMax = Math.min(1, distMax / Math.max(1, margin));
    return Math.min(softMin, softMax);
  };

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const stepRandomWalk = (prev, base, sigma, limits, margin, inertia) => {
    const [min, max] = limits;
    const soft = softenSigmaNearEdges(prev ?? base, min, max, margin);
    const drift = (base - (prev ?? base)) * inertia;
    const noise = gaussian01() * sigma * soft;
    return clamp((prev ?? base) + drift + noise, min, max);
  };

  // Gerar dados simulados (apenas para modo create)
  const generateSimulatedData = (duration) => {
    if (mode !== 'create') return [];
    
    const minutes = parseInt(duration);
    if (!minutes || minutes <= 0) return [];

    const anesthesiaStartDate = getAnesthesiaStartDate();
    console.log('[DEBUG] generateSimulatedData - anesthesiaStartDate:', anesthesiaStartDate);
    const anchor = getAutoAnchorDate();
    const records = [];

    const lastTs = vitalSigns.length > 0 ? safeToDate(vitalSigns[vitalSigns.length - 1].absoluteTimestamp) : null;

    let startTime;
    if (lastTs && !isNaN(lastTs.getTime())) {
      const baseForElapsedAtLast = anesthesiaStartDate || lastTs;
      const elapsedAtLastMin = (lastTs - baseForElapsedAtLast) / (1000 * 60);
      const incrementAtLast = elapsedAtLastMin < 30 ? 5 : 10;
      startTime = new Date(lastTs.getTime() + incrementAtLast * 60 * 1000);
    } else {
      startTime = anchor;
    }

    if (!startTime || isNaN(startTime.getTime())) return [];

    const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

    const baseValues = {
      ritmo: formData.ritmo || 'Sinusal',
      fc: parseInt(formData.fc) || 70,
      pasSistolica: parseInt(formData.pasSistolica) || 120,
      pasDiastolica: parseInt(formData.pasDiastolica) || 80,
      spo2: parseInt(formData.spo2) || 98,
      etco2: formData.etco2 ? parseInt(formData.etco2) : null,
      fio2: formData.fio2 ? parseInt(formData.fio2) : null,
      bis: formData.bis ? parseInt(formData.bis) : null,
      temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
      volumeCorrente: formData.volumeCorrente ? parseInt(formData.volumeCorrente) : null
    };

    let prev = { ...baseValues };
    let currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      const baseForElapsed = anesthesiaStartDate || startTime;
      const elapsed = (currentTime - baseForElapsed) / (1000 * 60);
      const increment = elapsed < 30 ? 5 : 10;

      const fc = stepRandomWalk(prev.fc, baseValues.fc, simConfig.sigma.fc, simConfig.limits.fc, simConfig.margins.fc, simConfig.inertia);
      const pasS = stepRandomWalk(prev.pasSistolica, baseValues.pasSistolica, simConfig.sigma.pasSistolica, simConfig.limits.pasSistolica, simConfig.margins.pasSistolica, simConfig.inertia);
      const pad = stepRandomWalk(prev.pasDiastolica, baseValues.pasDiastolica, simConfig.sigma.pasDiastolica, simConfig.limits.pasDiastolica, simConfig.margins.pasDiastolica, simConfig.inertia);
      const spo2 = stepRandomWalk(prev.spo2, baseValues.spo2, simConfig.sigma.spo2, simConfig.limits.spo2, simConfig.margins.spo2, simConfig.inertia);

      let etco2 = null; 
      if (baseValues.etco2 != null) {
        etco2 = stepRandomWalk(prev.etco2, baseValues.etco2, simConfig.sigma.etco2, simConfig.limits.etco2, simConfig.margins.etco2, simConfig.inertia);
      }
      let bis = null; 
      if (baseValues.bis != null) {
        bis = stepRandomWalk(prev.bis, baseValues.bis, simConfig.sigma.bis, simConfig.limits.bis, simConfig.margins.bis, simConfig.inertia);
      }
      let temperatura = null; 
      if (baseValues.temperatura != null) {
        temperatura = stepRandomWalk(prev.temperatura, baseValues.temperatura, simConfig.sigma.temperatura, simConfig.limits.temperatura, simConfig.margins.temperatura, simConfig.inertia);
      }
      let volumeCorr = null;
      if (baseValues.volumeCorrente != null) {
        volumeCorr = stepRandomWalk(
          prev.volumeCorrente,
          baseValues.volumeCorrente,
          simConfig.sigma.volumeCorrente,
          simConfig.limits.volumeCorrente,
          simConfig.margins.volumeCorrente,
          simConfig.inertia
        );
      }

      const record = {
        absoluteTimestamp: new Date(currentTime),
        ritmo: baseValues.ritmo,
        fc: Math.round(fc),
        pasSistolica: Math.round(pasS),
        pasDiastolica: Math.round(pad),
        spo2: Math.round(spo2),
      };
      record.pam = Math.round((record.pasSistolica + 2 * record.pasDiastolica) / 3);
      if (etco2 != null) record.etco2 = Math.round(etco2);
      if (baseValues.fio2 != null) record.fio2 = baseValues.fio2;
      if (bis != null) record.bis = Math.round(bis);
      if (temperatura != null) record.temperatura = Math.round(temperatura * 10) / 10;
      if (baseValues.peep != null) record.peep = baseValues.peep;
      if (volumeCorr != null) record.volumeCorrente = Math.round(volumeCorr);

      prev = {
        fc: record.fc,
        pasSistolica: record.pasSistolica,
        pasDiastolica: record.pasDiastolica,
        spo2: record.spo2,
        etco2: etco2,
        bis: bis,
        temperatura: temperatura,
        volumeCorrente: volumeCorr,
      };

      records.push(record);
      currentTime = new Date(currentTime.getTime() + increment * 60 * 1000);
    }

    return records;
  };

  // ========================================
  // HANDLERS PRINCIPAIS
  // ========================================
  
  // Submeter formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      console.log('[DEBUG] mode:', mode, 'isAutoMode:', isAutoMode);
      
      if (mode === 'edit') {
        // Modo edição
        const absoluteTimestamp = getAbsoluteTimestamp(manualTime);
        if (!absoluteTimestamp) {
          setErrors(prev => ({ ...prev, manualTime: 'Horário inválido' }));
          return;
        }

        // Filtrar campos vazios e tratar números corretamente, preservando 0 e enviando '' como null
        const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
          if (value === '') {
            acc[key] = null; // sinaliza remoção
            return acc;
          }
          if (value !== null && value !== undefined) {
            if (key.includes('temperatura') || key.includes('lactato') || key.includes('debitoCardiaco')) {
              const parsed = parseFloat(value);
              acc[key] = Number.isNaN(parsed) ? null : parsed;
            } else if (!isNaN(value)) {
              const parsed = parseInt(value);
              acc[key] = Number.isNaN(parsed) ? null : parsed; // preserva 0
            } else {
              acc[key] = value;
            }
          }
          return acc;
        }, {});

        // Adicionar PAM calculada
        if (cleanedData.pasSistolica && cleanedData.pasDiastolica) {
          cleanedData.pam = calculatePAM(cleanedData.pasSistolica, cleanedData.pasDiastolica);
        }

        const updatedRecord = {
          ...cleanedData,
          absoluteTimestamp
        };

        await onEdit(editRecordId, updatedRecord);
        
      } else if (mode === 'create') {
        // Modo criação
        if (isAutoMode) {
          const simulatedRecords = generateSimulatedData(parseInt(simDuration));
          await onAddMultiple(simulatedRecords);
        } else {
          const absoluteTimestamp = getAbsoluteTimestamp(manualTime);
          if (!absoluteTimestamp) {
            setErrors(prev => ({ ...prev, manualTime: 'Horário inválido' }));
            return;
          }

          const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
            if (value === '') {
              acc[key] = null; // sinaliza remoção
              return acc;
            }
            if (value !== null && value !== undefined) {
              if (key.includes('temperatura') || key.includes('lactato') || key.includes('debitoCardiaco')) {
                const parsed = parseFloat(value);
                acc[key] = Number.isNaN(parsed) ? null : parsed;
              } else if (!isNaN(value)) {
                const parsed = parseInt(value);
                acc[key] = Number.isNaN(parsed) ? null : parsed; // preserva 0
              } else {
                acc[key] = value;
              }
            }
            return acc;
          }, {});

          if (cleanedData.pasSistolica && cleanedData.pasDiastolica) {
            cleanedData.pam = calculatePAM(cleanedData.pasSistolica, cleanedData.pasDiastolica);
          }

          const record = {
            ...cleanedData,
            absoluteTimestamp
          };

          await onAddSingle(record);
        }
      }
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  // Resetar formulário
  const handleReset = () => {
    if (mode === 'edit' && editData) {
      // Para edit, volta aos valores originais
      const initialData = { ...formData };
      Object.keys(initialData).forEach(key => {
        initialData[key] = editData[key] ? String(editData[key]) : '';
      });
      setFormData(initialData);
    } else {
      // Para create, limpa tudo
      setFormData({
        ritmo: '', fc: '', pasSistolica: '', pasDiastolica: '',
        spo2: '', etco2: '', fio2: '', peep: '', volumeCorrente: '',
        bis: '', pupilas: '', tof: '', pvc: '', debitoCardiaco: '',
        glicemia: '', lactato: '', temperatura: '', diurese: '', sangramento: ''
      });
    }
    setErrors({});
    setTouched({});
    if (mode === 'create') {
      setShowAdvanced(false);
    }
  };

  // ========================================
  // DADOS CALCULADOS PARA UI
  // ========================================
  
  // Título dinâmico baseado no modo
  const getFormTitle = () => {
    if (mode === 'edit') {
      return 'Editar Registro de Sinais Vitais';
    }
    return 'Novo Registro de Sinais Vitais';
  };

  // Ícone dinâmico baseado no modo
  const getFormIcon = () => {
    if (mode === 'edit') {
      return <Edit3 className="w-5 h-5" />;
    }
    return <Activity className="w-5 h-5" />;
  };

  // Informações de âncora para UI
  const anchorInfo = mode === 'create' ? getAnchorInfo() : null;
  const anchorDateStr = anchorInfo?.date ? anchorInfo.date.toLocaleDateString('pt-BR') : '';
  const anchorTimeStr = anchorInfo?.date ? anchorInfo.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  // ========================================
  // PROPS COMUNS PARA COMPONENTES UI
  // ========================================
  const commonProps = {
    // Props originais
    mode,
    surgery,
    anesthesia,
    vitalSigns,
    onAddSingle,
    onAddMultiple,
    onEdit,
    onCancel,
    isSubmitting,
    editData,
    editRecordId,
    
    // Estados do formulário
    isAutoMode,
    setIsAutoMode,
    showAdvanced,
    setShowAdvanced,
    manualTime,
    setManualTime,
    simDuration,
    setSimDuration,
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched,
    
    // Handlers
    handleFieldChange,
    handleSubmit,
    handleReset,
    
    // Dados calculados e utilitários
    calculatePAM,
    rhythmOptions,
    pupilaOptions,
    getFormTitle,
    getFormIcon,
    anchorInfo,
    anchorDateStr,
    anchorTimeStr
  };

  // ========================================
  // RENDERIZAÇÃO CONDICIONAL
  // ========================================
  
  if (isMobile) {
    return <VitalSignsFormMobile {...commonProps} />;
  }
  
  return <VitalSignsFormDesktop {...commonProps} />;
};

export default VitalSignsForm;