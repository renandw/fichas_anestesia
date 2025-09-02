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
 * VitalSignsFormDesktop - Interface Desktop para Sinais Vitais
 * 
 * Componente UI otimizado para desktop com:
 * - Layout expandido em múltiplas colunas
 * - Mais informações visíveis simultaneamente
 * - Campos mais compactos
 * - Botões de tamanho padrão alinhados à direita
 */
const VitalSignsFormDesktop = ({ 
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
  // Desktop sempre usa layout expandido
  const isCompactMode = false;

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
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
        
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <select
              value={formData.ritmo}
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
            <input
              type="number"
              placeholder="FC (bpm) *"
              value={formData.fc}
              onChange={(e) => handleFieldChange('fc', e.target.value)}
              min="30"
              max="200"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.fc ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.fc && <p className="mt-1 text-xs text-red-600">{errors.fc}</p>}
          </div>
          
          <div>
            <input
              type="number"
              placeholder="PA Sistólica (mmHg) *"
              value={formData.pasSistolica}
              onChange={(e) => handleFieldChange('pasSistolica', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.pasSistolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.pasSistolica && <p className="mt-1 text-xs text-red-600">{errors.pasSistolica}</p>}
          </div>
          
          <div>
            <input
              type="number"
              placeholder="PA Diastólica (mmHg) *"
              value={formData.pasDiastolica}
              onChange={(e) => handleFieldChange('pasDiastolica', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.pasDiastolica ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.pasDiastolica && <p className="mt-1 text-xs text-red-600">{errors.pasDiastolica}</p>}
          </div>
          
          <div className="md:col-span-2 lg:col-span-1">
            <div className="bg-gray-100 px-3 py-2 rounded-lg border">
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
        
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <input
              type="number"
              placeholder="SpO2 (%) *"
              value={formData.spo2}
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
            <input
              type="number"
              placeholder="EtCO2 (mmHg)"
              value={formData.etco2}
              onChange={(e) => handleFieldChange('etco2', e.target.value)}
              min="15"
              max="60"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <input
              type="number"
              placeholder="FiO2 (%)"
              value={formData.fio2}
              onChange={(e) => handleFieldChange('fio2', e.target.value)}
              min="21"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <input
              type="number"
              placeholder="PEEP (cmH2O)"
              value={formData.peep}
              onChange={(e) => handleFieldChange('peep', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <input
              type="number"
              placeholder="Volume Corrente (mL)"
              value={formData.volumeCorrente}
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
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">⚙️ Parâmetros Avançados</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showAdvanced && (
          <div className={`border-t border-gray-200 space-y-4 ${isCompactMode ? 'p-3' : 'p-4'}`}>
            {/* Neurológicos */}
            <div className="space-y-3">
              <h6 className="font-medium text-purple-800 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                🧠 Neurológicos
              </h6>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                <input
                  type="number"
                  placeholder="BIS (0-100)"
                  value={formData.bis}
                  onChange={(e) => handleFieldChange('bis', e.target.value)}
                  min="0"
                  max="100"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.pupilas}
                  onChange={(e) => handleFieldChange('pupilas', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pupilas</option>
                  {pupilaOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="TOF (0-4)"
                  value={formData.tof}
                  onChange={(e) => handleFieldChange('tof', e.target.value)}
                  min="0"
                  max="4"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Metabólicos */}
            <div className="space-y-3">
              <h6 className="font-medium text-green-800 flex items-center">
                <Thermometer className="w-4 h-4 mr-2" />
                🔬 Metabólicos
              </h6>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                <input
                  type="number"
                  placeholder="Glicemia (mg/dL)"
                  value={formData.glicemia}
                  onChange={(e) => handleFieldChange('glicemia', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Lactato (mmol/L)"
                  value={formData.lactato}
                  onChange={(e) => handleFieldChange('lactato', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Temperatura (°C)"
                  value={formData.temperatura}
                  onChange={(e) => handleFieldChange('temperatura', e.target.value)}
                  min="32"
                  max="42"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Hemodinâmicos */}
            <div className="space-y-3">
              <h6 className="font-medium text-indigo-800 flex items-center">
                <Droplets className="w-4 h-4 mr-2" />
                🩸 Hemodinâmicos
              </h6>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                <input
                  type="number"
                  placeholder="PVC (mmHg)"
                  value={formData.pvc}
                  onChange={(e) => handleFieldChange('pvc', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Débito Cardíaco (L/min)"
                  value={formData.debitoCardiaco}
                  onChange={(e) => handleFieldChange('debitoCardiaco', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Controle de Fluidos */}
            <div className="space-y-3">
              <h6 className="font-medium text-orange-800 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                📊 Controle de Fluidos
              </h6>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                <input
                  type="number"
                  placeholder="Diurese (mL)"
                  value={formData.diurese}
                  onChange={(e) => handleFieldChange('diurese', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Sangramento (mL)"
                  value={formData.sangramento}
                  onChange={(e) => handleFieldChange('sangramento', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          {mode === 'edit' ? 'Restaurar' : 'Limpar'}
        </button>
        
        <div className="flex gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    <Check className="w-4 h-4" />
                    Salvar Alterações
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
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
          <p><strong>Debug Form Desktop:</strong></p>
          <p>Mode: {mode} | Auto: {isAutoMode ? 'Yes' : 'No'} | Time: {manualTime} | Duration: {simDuration}</p>
          <p>Errors: {Object.keys(errors).length} | Touched: {Object.keys(touched).length}</p>
          <p>Required filled: {['ritmo', 'fc', 'pasSistolica', 'pasDiastolica', 'spo2'].every(f => formData[f]) ? 'Yes' : 'No'}</p>
          {mode === 'edit' && <p>Edit Record ID: {editRecordId}</p>}
        </div>
      )}
    </div>
  );
};

export default VitalSignsFormDesktop;