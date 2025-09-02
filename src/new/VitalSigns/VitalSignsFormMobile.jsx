import React from 'react';
import {
  Save,
  X,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Heart,
  AirVent,
  Brain,
  Droplets,
  Thermometer,
  Activity,
  Edit3,
  Check
} from 'lucide-react';

/**
 * VitalSignsFormMobile - Interface Mobile para Sinais Vitais
 * 
 * Componente UI otimizado para dispositivos móveis com:
 * - Layout sempre compacto (isCompactMode = true)
 * - Seções colapsáveis por padrão
 * - Inputs touch-friendly
 * - Botões full-width
 */
const VitalSignsFormMobile = ({ 
  // Props de modo e controle
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
}) => {
  // Mobile sempre usa layout compacto
  const isCompactMode = true;

  return (
    <div className={`space-y-4 ${isCompactMode ? 'p-3' : 'p-4'}`}>
      {/* Header do formulário */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          {getFormIcon()}
          <h4 className={`font-medium text-gray-900 ${isCompactMode ? 'text-base' : 'text-lg'}`}>
            {getFormTitle()}
          </h4>
          {mode === 'edit' && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Editando
            </span>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Toggle de Modo (apenas para create) */}
      {mode === 'create' && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoMode"
              checked={isAutoMode}
              onChange={(e) => setIsAutoMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="autoMode" className="ml-2 text-sm font-medium text-gray-700">
              🤖 Modo Automático
            </label>
          </div>
          <div className="text-xs text-gray-500">
            {isAutoMode ? 'Simular múltiplos registros' : 'Registro individual manual'}
          </div>
        </div>
      )}

      {/* Âncora informativa (apenas para create) */}
      {mode === 'create' && (
        <div className="flex items-center gap-2 text-xs text-gray-600 pl-1">
          <Clock className="w-3 h-3" />
          <span>
            <strong>Âncora:</strong> {anchorDateStr} {anchorTimeStr} <span className="text-gray-500">({anchorInfo?.source})</span>
          </span>
        </div>
      )}

      {/* Campos de Controle de Tempo */}
      <div className="grid grid-cols-1 gap-4">
        {mode === 'create' && !isAutoMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Horário do Registro *
            </label>
            <input
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                errors.manualTime ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.manualTime && (
              <p className="mt-1 text-sm text-red-600">{errors.manualTime}</p>
            )}
          </div>
        )}
        
        {mode === 'create' && isAutoMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Zap className="w-4 h-4 inline mr-1" />
              Duração da Simulação (min) *
            </label>
            <input
              type="number"
              value={simDuration}
              onChange={(e) => setSimDuration(e.target.value)}
              placeholder="Ex: 90"
              min="1"
              max="480"
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                errors.simDuration ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.simDuration && (
              <p className="mt-1 text-sm text-red-600">{errors.simDuration}</p>
            )}
          </div>
        )}

        {mode === 'edit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Horário do Registro *
            </label>
            <input
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                errors.manualTime ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.manualTime && (
              <p className="mt-1 text-sm text-red-600">{errors.manualTime}</p>
            )}
          </div>
        )}
      </div>

      {/* Grupo Cardiovascular (Obrigatório) */}
      <div className={`bg-red-50 border border-red-200 rounded-lg ${isCompactMode ? 'p-3' : 'p-4'}`}>
        <h5 className="font-medium text-red-800 mb-3 flex items-center">
          <Heart className="w-4 h-4 mr-2" />
          🔴 Cardiovascular *
        </h5>
        
        <div className="grid gap-3 grid-cols-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ritmo *</label>
            <select
              value={formData.ritmo}
              onChange={(e) => handleFieldChange('ritmo', e.target.value)}
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
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
              value={formData.fc}
              onChange={(e) => handleFieldChange('fc', e.target.value)}
              min="30"
              max="200"
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                errors.fc ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.fc && <p className="mt-1 text-xs text-red-600">{errors.fc}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PA Sistólica *</label>
              <input
                type="number"
                placeholder="PA Sistólica *"
                value={formData.pasSistolica}
                onChange={(e) => handleFieldChange('pasSistolica', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                  errors.pasSistolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.pasSistolica && <p className="mt-1 text-xs text-red-600">{errors.pasSistolica}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PA Diastólica *</label>
              <input
                type="number"
                placeholder="PA Diastólica *"
                value={formData.pasDiastolica}
                onChange={(e) => handleFieldChange('pasDiastolica', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                  errors.pasDiastolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.pasDiastolica && <p className="mt-1 text-xs text-red-600">{errors.pasDiastolica}</p>}
            </div>
          </div>
          
          <div>
            <div className="bg-gray-100 px-3 py-3 rounded-lg border text-center">
              <span className="text-sm text-gray-600">
                PAM: <strong>{calculatePAM(formData.pasSistolica, formData.pasDiastolica)} mmHg</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grupo Respiratório */}
      <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isCompactMode ? 'p-3' : 'p-4'}`}>
        <h5 className="font-medium text-blue-800 mb-3 flex items-center">
          <AirVent className="w-4 h-4 mr-2" />
          🔵 Respiratório
        </h5>
        
        <div className="grid gap-3 grid-cols-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">SpO₂ (%) *</label>
            <input
              type="number"
              placeholder="SpO2 (%) *"
              value={formData.spo2}
              onChange={(e) => handleFieldChange('spo2', e.target.value)}
              min="70"
              max="100"
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                errors.spo2 ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.spo2 && <p className="mt-1 text-xs text-red-600">{errors.spo2}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">EtCO₂ (mmHg)</label>
              <input
                type="number"
                placeholder="EtCO2 (mmHg)"
                value={formData.etco2}
                onChange={(e) => handleFieldChange('etco2', e.target.value)}
                min="15"
                max="60"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">FiO₂ (%)</label>
              <input
                type="number"
                placeholder="FiO2 (%)"
                value={formData.fio2}
                onChange={(e) => handleFieldChange('fio2', e.target.value)}
                min="21"
                max="100"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PEEP (cmH₂O)</label>
              <input
                type="number"
                placeholder="PEEP (cmH2O)"
                value={formData.peep}
                onChange={(e) => handleFieldChange('peep', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Volume Corrente (mL)</label>
              <input
                type="number"
                placeholder="Vol. Corrente (mL)"
                value={formData.volumeCorrente}
                onChange={(e) => handleFieldChange('volumeCorrente', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Parâmetros Avançados (Colapsável) */}
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 touch-manipulation"
        >
          <span className="font-medium text-gray-900">⚙️ Parâmetros Avançados</span>
          {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {showAdvanced && (
          <div className={`border-t border-gray-200 space-y-4 ${isCompactMode ? 'p-3' : 'p-4'}`}>
            {/* Neurológicos */}
            <div className="space-y-3">
              <h6 className="font-medium text-purple-800 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                🧠 Neurológicos
              </h6>
              <div className="grid gap-3 grid-cols-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">BIS (0–100)</label>
                <input
                  type="number"
                  placeholder="BIS (0-100)"
                  value={formData.bis}
                  onChange={(e) => handleFieldChange('bis', e.target.value)}
                  min="0"
                  max="100"
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Pupilas</label>
                <select
                  value={formData.pupilas}
                  onChange={(e) => handleFieldChange('pupilas', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="">Pupilas</option>
                  {pupilaOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <label className="block text-xs font-medium text-gray-600 mb-1">TOF (0–4)</label>
                <input
                  type="number"
                  placeholder="TOF (0-4)"
                  value={formData.tof}
                  onChange={(e) => handleFieldChange('tof', e.target.value)}
                  min="0"
                  max="4"
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>

            {/* Metabólicos */}
            <div className="space-y-3">
              <h6 className="font-medium text-green-800 flex items-center">
                <Thermometer className="w-4 h-4 mr-2" />
                🔬 Metabólicos
              </h6>
              <div className="grid gap-3 grid-cols-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Glicemia (mg/dL)</label>
                <input
                  type="number"
                  placeholder="Glicemia (mg/dL)"
                  value={formData.glicemia}
                  onChange={(e) => handleFieldChange('glicemia', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Lactato (mmol/L)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Lactato (mmol/L)"
                  value={formData.lactato}
                  onChange={(e) => handleFieldChange('lactato', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Temperatura (°C)"
                  value={formData.temperatura}
                  onChange={(e) => handleFieldChange('temperatura', e.target.value)}
                  min="32"
                  max="42"
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>

            {/* Hemodinâmicos */}
            <div className="space-y-3">
              <h6 className="font-medium text-indigo-800 flex items-center">
                <Droplets className="w-4 h-4 mr-2" />
                🩸 Hemodinâmicos
              </h6>
              <div className="grid gap-3 grid-cols-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">PVC (mmHg)</label>
                <input
                  type="number"
                  placeholder="PVC (mmHg)"
                  value={formData.pvc}
                  onChange={(e) => handleFieldChange('pvc', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Débito Cardíaco (L/min)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Débito Cardíaco (L/min)"
                  value={formData.debitoCardiaco}
                  onChange={(e) => handleFieldChange('debitoCardiaco', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>

            {/* Controle de Fluidos */}
            <div className="space-y-3">
              <h6 className="font-medium text-orange-800 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                📊 Controle de Fluidos
              </h6>
              <div className="grid gap-3 grid-cols-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Diurese (mL)</label>
                <input
                  type="number"
                  placeholder="Diurese (mL)"
                  value={formData.diurese}
                  onChange={(e) => handleFieldChange('diurese', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Sangramento (mL)</label>
                <input
                  type="number"
                  placeholder="Sangramento (mL)"
                  value={formData.sangramento}
                  onChange={(e) => handleFieldChange('sangramento', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="w-full px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 touch-manipulation"
        >
          {mode === 'edit' ? 'Restaurar' : 'Limpar'}
        </button>
        
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                {mode === 'edit' ? (
                  <>
                    <Check className="w-5 h-5" />
                    Salvar Alterações
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isAutoMode ? 'Gerar Simulação' : 'Adicionar Registro'}
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumo do formulário (modo automático create) */}
      {mode === 'create' && isAutoMode && Object.values(formData).some(v => v) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h6 className="font-medium text-yellow-800 mb-2">📋 Resumo da Simulação</h6>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Duração:</strong> {simDuration} minutos</p>
            <p><strong>Valores base:</strong> FC {formData.fc}, PA {formData.pasSistolica}/{formData.pasDiastolica}, SpO2 {formData.spo2}%</p>
            <p><strong>Registros estimados:</strong> ~{simDuration ? Math.ceil(parseInt(simDuration) / 10) : 0}</p>
          </div>
        </div>
      )}

      {/* Debug info - remover em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs text-gray-600">
          <p><strong>Debug Form Mobile:</strong></p>
          <p>Mode: {mode} | Auto: {isAutoMode ? 'Yes' : 'No'} | Time: {manualTime} | Duration: {simDuration}</p>
          <p>Errors: {Object.keys(errors).length} | Touched: {Object.keys(touched).length}</p>
          <p>Required filled: {['ritmo', 'fc', 'pasSistolica', 'pasDiastolica', 'spo2'].every(f => formData[f]) ? 'Yes' : 'No'}</p>
          {mode === 'edit' && <p>Edit Record ID: {editRecordId}</p>}
        </div>
      )}
    </div>
  );
};

export default VitalSignsFormMobile;