import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Heart,
  AirVent,
  Brain,
  Droplets,
  Thermometer,
  Activity,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Save
} from 'lucide-react';
import VitalSignsMobile from './VitalSignsMobile';
import VitalSignsDesktop from './VitalSignsDesktop';

/**
 * VitalSignsTable - Container/Router Component
 * 
 * Responsabilidades:
 * - Detectar tamanho da tela
 * - Gerenciar toda a lógica compartilhada
 * - Processar dados para os componentes de apresentação
 * - Coordenar edição e exclusão
 * - Escolher qual componente renderizar (Mobile ou Desktop)
 */
const VitalSignsTable = ({ 
  vitalSigns = [], 
  onEdit, 
  onDelete, 
  isLoading = false 
}) => {
  // Estados de responsividade
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Estados compartilhados de edição
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função utilitária para converter timestamp
  const safeToDate = useCallback((val) => {
    if (!val) return null;
    try {
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (val && typeof val.toDate === 'function') return val.toDate();
      if (typeof val === 'object' && val !== null) {
        if (typeof val.seconds === 'number') return new Date(val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1e6) : 0));
        if (typeof val._seconds === 'number') return new Date(val._seconds * 1000 + (val._nanoseconds ? Math.floor(val._nanoseconds / 1e6) : 0));
      }
      if (typeof val === 'number') return new Date(val < 1e12 ? val * 1000 : val);
      if (typeof val === 'string') {
        const s = val.trim();
        const native = new Date(s);
        if (!isNaN(native.getTime())) return native;
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('safeToDate: unable to parse', val, e);
    }
    return null;
  }, []);

  // Opções para campos select
  const rhythmOptions = useMemo(() => [
    'Sinusal',
    'Taquicardia Sinusal',
    'Bradicardia Sinusal',
    'Fibrilação Atrial',
    'Flutter Atrial',
    'Taquicardia Supraventricular',
    'Extrassístoles',
    'Ritmo Nodal'
  ], []);

  const pupilaOptions = useMemo(() => [
    'Isocóricas',
    'Anisocóricas',
    'Miose',
    'Midríase',
    'Não avaliadas'
  ], []);

  // Processamento dos dados dos sinais vitais
  const processedVitalSigns = useMemo(() => {
    return vitalSigns.map(record => {
      const timestamp = safeToDate(record.absoluteTimestamp);
      return {
        ...record,
        displayTime: timestamp ? timestamp.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }) : '--:--',
        displayDate: timestamp ? timestamp.toLocaleDateString('pt-BR') : '--/--/----'
      };
    });
  }, [vitalSigns, safeToDate]);

  // Definição dos campos dinâmicos
  const dynamicFields = useMemo(() => {
    const fields = [
      { key: 'etco2', label: 'EtCO2', unit: 'mmHg', icon: AirVent, group: 'respiratory', type: 'number', min: 15, max: 60 },
      { key: 'fio2', label: 'FiO2', unit: '%', icon: AirVent, group: 'respiratory', type: 'number', min: 21, max: 100 },
      { key: 'peep', label: 'PEEP', unit: 'cmH2O', icon: AirVent, group: 'respiratory', type: 'number' },
      { key: 'volumeCorrente', label: 'Volume Corrente', unit: 'mL', icon: AirVent, group: 'respiratory', type: 'number' },
      { key: 'bis', label: 'BIS', unit: '', icon: Brain, group: 'neurological', type: 'number', min: 0, max: 100 },
      { key: 'pupilas', label: 'Pupilas', unit: '', icon: Brain, group: 'neurological', type: 'select', options: pupilaOptions },
      { key: 'tof', label: 'TOF', unit: '', icon: Brain, group: 'neurological', type: 'number', min: 0, max: 4 },
      { key: 'pvc', label: 'PVC', unit: 'mmHg', icon: Droplets, group: 'hemodynamic', type: 'number', min: 0, max: 25 },
      { key: 'debitoCardiaco', label: 'Débito Cardíaco', unit: 'L/min', icon: Droplets, group: 'hemodynamic', type: 'number', step: 0.1 },
      { key: 'glicemia', label: 'Glicemia', unit: 'mg/dL', icon: Thermometer, group: 'metabolic', type: 'number' },
      { key: 'lactato', label: 'Lactato', unit: 'mmol/L', icon: Thermometer, group: 'metabolic', type: 'number', step: 0.1 },
      { key: 'temperatura', label: 'Temperatura', unit: '°C', icon: Thermometer, group: 'metabolic', type: 'number', step: 0.1, min: 32, max: 42 },
      { key: 'diurese', label: 'Diurese', unit: 'mL', icon: Activity, group: 'fluids', type: 'number' },
      { key: 'sangramento', label: 'Sangramento', unit: 'mL', icon: Activity, group: 'fluids', type: 'number' }
    ];
    return fields;
  }, [pupilaOptions]);

  // Agrupamento dos campos dinâmicos
  const groupedFields = useMemo(() => {
    const groups = {};
    dynamicFields.forEach(field => {
      if (!groups[field.group]) {
        groups[field.group] = [];
      }
      groups[field.group].push(field);
    });
    return groups;
  }, [dynamicFields]);

  // Campos dinâmicos com dados existentes
  const fieldsWithData = useMemo(() => {
    return dynamicFields.filter(field => 
      vitalSigns.some(record => 
        record[field.key] !== undefined && 
        record[field.key] !== null && 
        record[field.key] !== ''
      )
    );
  }, [vitalSigns, dynamicFields]);

  // Função de validação
  const validateField = useCallback((fieldName, value) => {
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

    const rule = validationRules[fieldName];
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
  }, []);

  // Calcular PAM
  const calculatePAM = useCallback((sistolica, diastolica) => {
    if (!sistolica || !diastolica) return '--';
    const pam = Math.round((parseInt(sistolica) + 2 * parseInt(diastolica)) / 3);
    return isNaN(pam) ? '--' : pam;
  }, []);

  // Formatar valor
  const formatValue = useCallback((value, unit) => {
    if (value === undefined || value === null || value === '') return '—';
    return unit ? `${value} ${unit}` : value;
  }, []);

  // Cor do badge do ritmo
  const getRhythmBadgeColor = useCallback((rhythm) => {
    const colors = {
      'Sinusal': 'bg-green-100 text-green-800',
      'Taquicardia Sinusal': 'bg-orange-100 text-orange-800',
      'Bradicardia Sinusal': 'bg-blue-100 text-blue-800',
      'Fibrilação Atrial': 'bg-red-100 text-red-800',
      'Flutter Atrial': 'bg-red-100 text-red-800',
      'Taquicardia Supraventricular': 'bg-yellow-100 text-yellow-800',
      'Extrassístoles': 'bg-purple-100 text-purple-800',
      'Ritmo Nodal': 'bg-indigo-100 text-indigo-800'
    };
    return colors[rhythm] || 'bg-gray-100 text-gray-800';
  }, []);

  // Iniciar edição
  const handleStartEdit = useCallback((recordId) => {
    const record = vitalSigns.find(vs => vs.id === recordId);
    if (!record) return;

    console.log(`🔧 Iniciando edição ${isMobile ? 'mobile' : 'desktop'} do registro:`, recordId);

    const timestamp = safeToDate(record.absoluteTimestamp);
    const timeString = timestamp ? timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) : '';

    const hasAdvancedData = dynamicFields.some(field => 
      record[field.key] !== undefined && 
      record[field.key] !== null && 
      record[field.key] !== ''
    );

    setEditingRecord(recordId);
    setEditingData({
      horario: timeString,
      ritmo: record.ritmo || '',
      fc: record.fc ? String(record.fc) : '',
      pasSistolica: record.pasSistolica ? String(record.pasSistolica) : '',
      pasDiastolica: record.pasDiastolica ? String(record.pasDiastolica) : '',
      spo2: record.spo2 ? String(record.spo2) : '',
      etco2: record.etco2 ? String(record.etco2) : '',
      fio2: record.fio2 ? String(record.fio2) : '',
      peep: record.peep ? String(record.peep) : '',
      volumeCorrente: record.volumeCorrente ? String(record.volumeCorrente) : '',
      bis: record.bis ? String(record.bis) : '',
      pupilas: record.pupilas || '',
      tof: record.tof ? String(record.tof) : '',
      pvc: record.pvc ? String(record.pvc) : '',
      debitoCardiaco: record.debitoCardiaco ? String(record.debitoCardiaco) : '',
      glicemia: record.glicemia ? String(record.glicemia) : '',
      lactato: record.lactato ? String(record.lactato) : '',
      temperatura: record.temperatura ? String(record.temperatura) : '',
      diurese: record.diurese ? String(record.diurese) : '',
      sangramento: record.sangramento ? String(record.sangramento) : ''
    });
    setErrors({});
    setTouched({});
    setShowAdvanced(hasAdvancedData);
  }, [vitalSigns, dynamicFields, safeToDate, isMobile]);

  // Cancelar edição
  const handleCancelEdit = useCallback(() => {
    console.log(`❌ Cancelando edição ${isMobile ? 'mobile' : 'desktop'}`);
    setEditingRecord(null);
    setEditingData({});
    setErrors({});
    setTouched({});
    setShowAdvanced(false);
  }, [isMobile]);

  // Alterar campo
  const handleFieldChange = useCallback((name, value) => {
    setEditingData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Salvar edição
  const handleSaveEdit = useCallback(async () => {
    if (!editingRecord || !onEdit) return;

    console.log(`💾 Salvando edição ${isMobile ? 'mobile' : 'desktop'}:`, editingData);

    const newErrors = {};

    const requiredFields = ['ritmo', 'fc', 'pasSistolica', 'pasDiastolica', 'spo2'];
    requiredFields.forEach(field => {
      if (
        editingData[field] === undefined ||
        editingData[field] === null ||
        editingData[field] === ''
      ) {
        newErrors[field] = `${field === 'ritmo' ? 'Ritmo' : field.toUpperCase()} é obrigatório`;
      }
    });

    Object.keys(editingData).forEach(field => {
      const v = editingData[field];
      if (v !== '') {
        const error = validateField(field, v);
        if (error) newErrors[field] = error;
      }
    });

    if (editingData.pasSistolica && editingData.pasDiastolica) {
      if (parseInt(editingData.pasSistolica) <= parseInt(editingData.pasDiastolica)) {
        newErrors.pasSistolica = 'PA Sistólica deve ser maior que Diastólica';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const originalRecord = vitalSigns.find(vs => vs.id === editingRecord);
    if (!originalRecord) return;

    let absoluteTimestamp = originalRecord.absoluteTimestamp;
    if (editingData.horario) {
      const [hours, minutes] = editingData.horario.split(':').map(Number);
      const baseDate = safeToDate(originalRecord.absoluteTimestamp);
      if (baseDate) {
        const newTimestamp = new Date(baseDate);
        newTimestamp.setHours(hours, minutes, 0, 0);
        absoluteTimestamp = newTimestamp;
      }
    }

    const updatedData = { absoluteTimestamp };

    updatedData.ritmo = editingData.ritmo;
    updatedData.fc = parseInt(editingData.fc);
    updatedData.pasSistolica = parseInt(editingData.pasSistolica);
    updatedData.pasDiastolica = parseInt(editingData.pasDiastolica);
    updatedData.spo2 = parseInt(editingData.spo2);

    updatedData.pam = calculatePAM(editingData.pasSistolica, editingData.pasDiastolica);

    dynamicFields.forEach(field => {
      const value = editingData[field.key];

      // Se o usuário apagou o valor, marcar para limpar (null). O backend pode mapear null -> deleteField().
      if (value === '') {
        updatedData[field.key] = null;
        return;
      }

      if (field.type === 'number') {
        const parsed = field.step ? parseFloat(value) : parseInt(value);
        updatedData[field.key] = Number.isNaN(parsed) ? null : parsed; // aceita 0 como válido
      } else {
        updatedData[field.key] = value;
      }
    });

    try {
      await onEdit(editingRecord, updatedData);
      handleCancelEdit();
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      setErrors({ general: 'Erro ao salvar alterações. Tente novamente.' });
    }
  }, [editingRecord, editingData, onEdit, vitalSigns, dynamicFields, safeToDate, calculatePAM, validateField, handleCancelEdit, isMobile]);

  // Iniciar exclusão
  const handleDeleteClick = useCallback((recordId) => {
    setDeleteConfirm(recordId);
  }, []);

  // Confirmar exclusão
  const confirmDelete = useCallback(() => {
    if (deleteConfirm && onDelete) {
      onDelete(deleteConfirm);
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, onDelete]);

  // Cancelar exclusão
  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // Toggle para parâmetros avançados
  const handleToggleAdvanced = useCallback(() => {
    setShowAdvanced(!showAdvanced);
  }, [showAdvanced]);

  // Renderizar formulário de edição (compartilhado)
  const renderEditForm = useCallback(() => {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
        {/* Header do formulário */}
        <div className="flex items-center justify-between border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-medium text-blue-900">
              Editando registro de {editingData.horario || 'horário desconhecido'}
            </h4>
          </div>
          <button
            onClick={handleCancelEdit}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campos de Controle de Tempo */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Horário do Registro *
            </label>
            <input
              type="time"
              value={editingData.horario}
              onChange={(e) => handleFieldChange('horario', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.horario ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.horario && (
              <p className="mt-1 text-sm text-red-600">{errors.horario}</p>
            )}
          </div>
        </div>

        {/* Grupo Cardiovascular (Obrigatório) */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h5 className="font-medium text-red-800 mb-3 flex items-center">
            <Heart className="w-4 h-4 mr-2" />
            🔴 Cardiovascular *
          </h5>
          
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ritmo *</label>
              <select
                value={editingData.ritmo}
                onChange={(e) => handleFieldChange('ritmo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.ritmo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o ritmo *</option>
                {rhythmOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.ritmo && <p className="mt-1 text-xs text-red-600">{errors.ritmo}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">FC (bpm) *</label>
              <input
                type="number"
                placeholder="FC (bpm) *"
                value={editingData.fc}
                onChange={(e) => handleFieldChange('fc', e.target.value)}
                min="30"
                max="200"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.fc ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.fc && <p className="mt-1 text-xs text-red-600">{errors.fc}</p>}
            </div>
            
            {!isMobile && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">PA Sistólica (mmHg) *</label>
                <input
                  type="number"
                  placeholder="PA Sistólica (mmHg) *"
                  value={editingData.pasSistolica}
                  onChange={(e) => handleFieldChange('pasSistolica', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.pasSistolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.pasSistolica && <p className="mt-1 text-xs text-red-600">{errors.pasSistolica}</p>}
              </div>
            )}
            
            {/* PA fields for mobile - grid */}
            {isMobile && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PA Sistólica (mmHg) *</label>
                  <input
                    type="number"
                    placeholder="PA Sistólica (mmHg) *"
                    value={editingData.pasSistolica}
                    onChange={(e) => handleFieldChange('pasSistolica', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.pasSistolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.pasSistolica && <p className="mt-1 text-xs text-red-600">{errors.pasSistolica}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PA Diastólica (mmHg) *</label>
                  <input
                    type="number"
                    placeholder="PA Diastólica (mmHg) *"
                    value={editingData.pasDiastolica}
                    onChange={(e) => handleFieldChange('pasDiastolica', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.pasDiastolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.pasDiastolica && <p className="mt-1 text-xs text-red-600">{errors.pasDiastolica}</p>}
                </div>
              </div>
            )}
            
            {!isMobile && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">PA Diastólica (mmHg) *</label>
                <input
                  type="number"
                  placeholder="PA Diastólica (mmHg) *"
                  value={editingData.pasDiastolica}
                  onChange={(e) => handleFieldChange('pasDiastolica', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.pasDiastolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.pasDiastolica && <p className="mt-1 text-xs text-red-600">{errors.pasDiastolica}</p>}
              </div>
            )}
            
            <div>
              <div className="bg-gray-100 px-3 py-2 rounded-lg border">
                <span className="text-sm text-gray-600">
                  PAM: <strong>{calculatePAM(editingData.pasSistolica, editingData.pasDiastolica)} mmHg</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grupo Respiratório */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-3 flex items-center">
            <AirVent className="w-4 h-4 mr-2" />
            🔵 Respiratório
          </h5>
          
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SpO₂ (%) *</label>
              <input
                type="number"
                placeholder="SpO2 (%) *"
                value={editingData.spo2}
                onChange={(e) => handleFieldChange('spo2', e.target.value)}
                min="70"
                max="100"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.spo2 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.spo2 && <p className="mt-1 text-xs text-red-600">{errors.spo2}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">EtCO₂ (mmHg)</label>
              <input
                type="number"
                placeholder="EtCO2 (mmHg)"
                value={editingData.etco2}
                onChange={(e) => handleFieldChange('etco2', e.target.value)}
                min="15"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">FiO₂ (%)</label>
              <input
                type="number"
                placeholder="FiO2 (%)"
                value={editingData.fio2}
                onChange={(e) => handleFieldChange('fio2', e.target.value)}
                min="21"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PEEP (cmH₂O)</label>
              <input
                type="number"
                placeholder="PEEP (cmH2O)"
                value={editingData.peep}
                onChange={(e) => handleFieldChange('peep', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Volume Corrente (mL)</label>
              <input
                type="number"
                placeholder="Volume Corrente (mL)"
                value={editingData.volumeCorrente}
                onChange={(e) => handleFieldChange('volumeCorrente', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Parâmetros Avançados (Colapsável) */}
        <div className="border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={handleToggleAdvanced}
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">⚙️ Parâmetros Avançados</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showAdvanced && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              {/* Neurológicos */}
              <div className="space-y-3">
                <h6 className="font-medium text-purple-800 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  🧠 Neurológicos
                </h6>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">BIS (0–100)</label>
                    <input
                      type="number"
                      placeholder="BIS (0-100)"
                      value={editingData.bis}
                      onChange={(e) => handleFieldChange('bis', e.target.value)}
                      min="0"
                      max="100"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pupilas</label>
                    <select
                      value={editingData.pupilas}
                      onChange={(e) => handleFieldChange('pupilas', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pupilas</option>
                      {pupilaOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TOF (0–4)</label>
                    <input
                      type="number"
                      placeholder="TOF (0-4)"
                      value={editingData.tof}
                      onChange={(e) => handleFieldChange('tof', e.target.value)}
                      min="0"
                      max="4"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Metabólicos */}
              <div className="space-y-3">
                <h6 className="font-medium text-green-800 flex items-center">
                  <Thermometer className="w-4 h-4 mr-2" />
                  🔬 Metabólicos
                </h6>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Glicemia (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="Glicemia (mg/dL)"
                      value={editingData.glicemia}
                      onChange={(e) => handleFieldChange('glicemia', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Lactato (mmol/L)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Lactato (mmol/L)"
                      value={editingData.lactato}
                      onChange={(e) => handleFieldChange('lactato', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Temperatura (°C)"
                      value={editingData.temperatura}
                      onChange={(e) => handleFieldChange('temperatura', e.target.value)}
                      min="32"
                      max="42"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hemodinâmicos */}
              <div className="space-y-3">
                <h6 className="font-medium text-indigo-800 flex items-center">
                  <Droplets className="w-4 h-4 mr-2" />
                  🩸 Hemodinâmicos
                </h6>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">PVC (mmHg)</label>
                    <input
                      type="number"
                      placeholder="PVC (mmHg)"
                      value={editingData.pvc}
                      onChange={(e) => handleFieldChange('pvc', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Débito Cardíaco (L/min)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Débito Cardíaco (L/min)"
                      value={editingData.debitoCardiaco}
                      onChange={(e) => handleFieldChange('debitoCardiaco', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Controle de Fluidos */}
              <div className="space-y-3">
                <h6 className="font-medium text-orange-800 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  📊 Controle de Fluidos
                </h6>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Diurese (mL)</label>
                    <input
                      type="number"
                      placeholder="Diurese (mL)"
                      value={editingData.diurese}
                      onChange={(e) => handleFieldChange('diurese', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sangramento (mL)</label>
                    <input
                      type="number"
                      placeholder="Sangramento (mL)"
                      value={editingData.sangramento}
                      onChange={(e) => handleFieldChange('sangramento', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className={`flex gap-3 pt-4 border-t border-blue-200 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isLoading}
            className={`px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : 'flex-1 sm:w-auto'}`}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={isLoading}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isMobile ? 'w-full' : 'flex-1 sm:w-auto'}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>

        {/* Erro geral */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}
      </div>
    );
  }, [editingData, errors, isLoading, isMobile, rhythmOptions, pupilaOptions, handleCancelEdit, handleFieldChange, handleSaveEdit, calculatePAM, showAdvanced, handleToggleAdvanced]);

  // Modal de confirmação de exclusão (compartilhado)
  const renderDeleteModal = useCallback(() => {
    if (!deleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Tem certeza que deseja excluir este registro de sinais vitais? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button
              onClick={cancelDelete}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    );
  }, [deleteConfirm, isLoading, cancelDelete, confirmDelete]);

  // Props processadas para os componentes de apresentação
  const sharedProps = {
    records: processedVitalSigns,
    fieldsWithData,
    dynamicFields,
    groupedFields,
    editingRecord,
    isLoading,
    formatValue,
    getRhythmBadgeColor,
    onStartEdit: handleStartEdit,
    onDeleteClick: handleDeleteClick,
    editForm: editingRecord ? renderEditForm() : null,
    deleteModal: renderDeleteModal()
  };

  // Estado vazio
  if (processedVitalSigns.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Nenhum registro de sinais vitais encontrado.</p>
      </div>
    );
  }

  // Renderizar componente adequado baseado no tamanho da tela
  return isMobile 
    ? <VitalSignsMobile {...sharedProps} />
    : <VitalSignsDesktop {...sharedProps} />;
};

export default VitalSignsTable;