import React, { useState, useEffect } from 'react';
import { X, Stethoscope, Plus, Trash2, Building, CreditCard, Save, Edit, Search } from 'lucide-react';
import cbhpmCodes from '../../data/cbhpm_codes.json';

/**
 * SurgeryFormFields - Interface Visual Compartilhada
 * 
 * Responsabilidades:
 * - Renderizar todos os campos do formulário
 * - Gerenciar estados locais da UI (CBHPM, auxiliares)
 * - Comunicar com componentes de lógica via callbacks
 * - Ser agnóstico ao modo (create/edit)
 */

// Função utilitária para limpar e capitalizar nomes (usada em PatientForm)
const formatNameInput = (value, allowNumbers = false, allowDot = false) => {
  const onlyValidChars = allowNumbers
    ? value.replace(/[^A-Za-zÀ-ÿ0-9\s´˜~ˆ^'.]/g, '')
    : allowDot
      ? value.replace(/[^A-Za-zÀ-ÿ\s´˜~ˆ^'.]/g, '')
      : value.replace(/[^A-Za-zÀ-ÿ\s´˜~ˆ^']/g, '');
  const noExtraSpaces = onlyValidChars.replace(/\s{2,}/g, ' ');
  return noExtraSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const insuranceOptions = [
  "Unimed", "Bradesco", "Amil", "Sulamerica", "Assefaz",
  "Astir", "Capesesp", "Cassi", "Funsa", "Fusex", "Geap",
  "Ipam", "Life", "Saude Caixa", "Innova", "Particular"
];

const MobileView = ({
    surgeryData, errors, handleInputChange, addAuxSurgeon, removeAuxSurgeon,
    removeCbhpmProcedure,
    newAuxSurgeon, setNewAuxSurgeon, canEdit, isSubmitting, mode,
    existingSurgery, selectedPatient, currentFlow, flowLabels,
    showSubmitButton, handleSubmit, hasChanges, submitButtonText,
    showDiscardButton, handleDiscardChanges, cbhpmSearch, setCbhpmSearch,
    showCbhpmResults, setShowCbhpmResults, searchCbhpmCodes,
    selectCbhpmCode,
    insuranceSearch, setInsuranceSearch, showInsuranceSuggestions, setShowInsuranceSuggestions
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            {mode === "edit" ? <Edit className="w-4 h-4 text-white" /> : <Stethoscope className="w-4 h-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm leading-tight">
              {mode === "edit" ? "Editar Cirurgia" : "Dados da Cirurgia"}
            </h3>
            <p className="text-green-100 text-xs truncate">
              {mode === "edit" 
                ? selectedPatient?.patientName
                : `${selectedPatient?.patientName} - ${flowLabels[currentFlow]}`
              }
            </p>
          </div>
          {mode === "edit" && existingSurgery && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border bg-white/90 ${
              existingSurgery.status === 'Agendada' 
                ? 'text-blue-700 border-blue-200'
                : 'text-gray-700 border-gray-200'
            }`}>
              {existingSurgery.status}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3 space-y-3">
        {/* Erro geral */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-xs">{errors.general}</p>
          </div>
        )}

        {/* Data da Cirurgia */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data da Cirurgia *</label>
          <input
            type="date"
            value={surgeryData.surgeryDate}
            onChange={(e) => handleInputChange('surgeryDate', e.target.value)}
            className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.surgeryDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting || !canEdit}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.surgeryDate && (
            <p className="mt-1 text-xs text-red-600">{errors.surgeryDate}</p>
          )}
        </div>

        {/* Tipo de Procedimento */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de Procedimento *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleInputChange('procedureType', 'sus')}
              disabled={!canEdit}
              className={`p-2 border-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                surgeryData.procedureType === 'sus'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Building className="w-5 h-5" />
              <div className="text-center">
                <div className="font-medium text-xs">SUS</div>
                <div className="text-xs text-gray-600">Gratuito</div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleInputChange('procedureType', 'convenio')}
              disabled={!canEdit}
              className={`p-2 border-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                surgeryData.procedureType === 'convenio'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <CreditCard className="w-5 h-5" />
              <div className="text-center">
                <div className="font-medium text-xs">Convênio</div>
                <div className="text-xs text-gray-600">Particular</div>
              </div>
            </button>
          </div>
          {errors.procedureType && (
            <p className="mt-1 text-xs text-red-600">{errors.procedureType}</p>
          )}
        </div>

        {/* Dados Básicos */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Peso (kg) *</label>
            <input
              type="number"
              value={surgeryData.patientWeight}
              onChange={(e) => handleInputChange('patientWeight', e.target.value)}
              className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.patientWeight ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="70"
              disabled={isSubmitting || !canEdit}
            />
            {errors.patientWeight && (
              <p className="mt-1 text-xs text-red-600">{errors.patientWeight}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cirurgião *</label>
            <input
              type="text"
              value={surgeryData.mainSurgeon}
              onChange={(e) => handleInputChange('mainSurgeon', formatNameInput(e.target.value, false, true))}
              className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.mainSurgeon ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Nome"
              disabled={isSubmitting || !canEdit}
            />
            {errors.mainSurgeon && (
              <p className="mt-1 text-xs text-red-600">{errors.mainSurgeon}</p>
            )}
          </div>
        </div>

        {/* Hospital */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hospital *</label>
          <input
            type="text"
            value={surgeryData.hospital}
            onChange={(e) => handleInputChange('hospital', formatNameInput(e.target.value, true))}
            className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.hospital ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Nome do hospital"
            disabled={isSubmitting || !canEdit}
          />
          {errors.hospital && (
            <p className="mt-1 text-xs text-red-600">{errors.hospital}</p>
          )}
        </div>

        {/* Cirurgiões Auxiliares */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cirurgiões Auxiliares</label>
          <div className="space-y-1">
            {surgeryData.auxiliarySurgeons.map((surgeon, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="flex-1 text-xs">{surgeon.name}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeAuxSurgeon(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newAuxSurgeon}
                  onChange={(e) => setNewAuxSurgeon(formatNameInput(e.target.value, false, true))}
                  placeholder="Nome do auxiliar"
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addAuxSurgeon()}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={addAuxSurgeon}
                  className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Campos Específicos do SUS */}
        {surgeryData.procedureType === 'sus' && (
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900 text-xs">Dados SUS</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Registro Hospitalar *</label>
                <input
                  type="text"
                  value={surgeryData.hospitalRecord}
                  onChange={(e) => handleInputChange('hospitalRecord', e.target.value)}
                  className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.hospitalRecord ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Número do registro"
                  disabled={isSubmitting || !canEdit}
                />
                {errors.hospitalRecord && (
                  <p className="mt-1 text-xs text-red-600">{errors.hospitalRecord}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cirurgia Proposta *</label>
                <input
                  type="text"
                  value={surgeryData.proposedSurgery}
                  onChange={(e) => handleInputChange('proposedSurgery', e.target.value)}
                  className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.proposedSurgery ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Descrição da cirurgia"
                  disabled={isSubmitting || !canEdit}
                />
                {errors.proposedSurgery && (
                  <p className="mt-1 text-xs text-red-600">{errors.proposedSurgery}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campos Específicos do Convênio */}
        {surgeryData.procedureType === 'convenio' && (
          <div className="bg-purple-50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-purple-900 text-xs">Dados Convênio</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Número do Convênio *</label>
                <input
                  type="text"
                  value={surgeryData.insuranceNumber}
                  onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                  className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.insuranceNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Carteirinha"
                  disabled={isSubmitting || !canEdit}
                />
                {errors.insuranceNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.insuranceNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Convênio *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={surgeryData.insuranceName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInsuranceSearch(value);
                      handleInputChange('insuranceName', value);
                      setShowInsuranceSuggestions(value.length >= 1);
                    }}
                    placeholder="Digite ou selecione o convênio"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.insuranceName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting || !canEdit}
                    onFocus={() => setShowInsuranceSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowInsuranceSuggestions(false), 100)}
                  />
                  {showInsuranceSuggestions && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow max-h-40 overflow-y-auto mt-1 text-sm">
                      {insuranceOptions
                        .filter(opt => opt.toLowerCase().includes(insuranceSearch.toLowerCase()))
                        .map((opt, idx) => (
                          <li
                            key={idx}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleInputChange('insuranceName', opt);
                              setInsuranceSearch(opt);
                              setShowInsuranceSuggestions(false);
                            }}
                          >
                            {opt}
                          </li>
                        ))}
                      {insuranceOptions.filter(opt => opt.toLowerCase().includes(insuranceSearch.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-gray-500">Nenhuma correspondência</li>
                      )}
                    </ul>
                  )}
                  {errors.insuranceName && (
                    <p className="mt-1 text-xs text-red-600">{errors.insuranceName}</p>
                  )}
                </div>
              </div>

              {/* Procedimentos CBHPM */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Procedimentos CBHPM *</label>
                
                {/* Lista de procedimentos adicionados */}
                <div className="space-y-1 mb-2">
                  {surgeryData.cbhpmProcedures.map((proc, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">{proc.codigo} - {proc.procedimento}</div>
                        <div className="text-xs text-gray-600">Porte: {proc.porte_anestesico}</div>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => removeCbhpmProcedure(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Buscar e adicionar novo procedimento */}
                {canEdit && (
                  <div className="space-y-1">
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                          type="text"
                          value={cbhpmSearch}
                          onChange={(e) => {
                            setCbhpmSearch(e.target.value);
                            setShowCbhpmResults(e.target.value.length >= 2);
                          }}
                          placeholder="Pesquise para adicionar CBHPM..."
                          className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      {/* Resultados da busca */}
                      {showCbhpmResults && cbhpmSearch.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          <ul className="divide-y divide-gray-100">
                            {searchCbhpmCodes(cbhpmSearch).map((item, idx) => (
                              <li
                                key={idx}
                                onClick={() => selectCbhpmCode(item)}
                                className="cursor-pointer hover:bg-gray-100 p-2"
                              >
                                {item.codigo} - {item.procedimento}
                              </li>
                            ))}
                          </ul>
                          {searchCbhpmCodes(cbhpmSearch).length === 0 && (
                            <div className="px-2 py-2 text-xs text-gray-500">
                              Nenhum procedimento encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {errors.cbhpmProcedures && (
                  <p className="mt-1 text-xs text-red-600">{errors.cbhpmProcedures}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Procedimento Geral */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Descrição do Procedimento</label>
          <textarea
            value={surgeryData.procedimento}
            onChange={(e) => handleInputChange('procedimento', e.target.value)}
            className={`w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              !canEdit ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            rows="2"
            placeholder="Descrição geral do procedimento"
            disabled={isSubmitting || !canEdit}
          />
        </div>

        {/* Botões */}
        <div className="pt-2 space-y-2">
          {showSubmitButton && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canEdit || (mode === "edit" && !hasChanges)}
              className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {submitButtonText}
                </>
              ) : (
                <>
                  {mode === "edit" && <Save className="w-3 h-3" />}
                  {submitButtonText}
                </>
              )}
            </button>
          )}

          {showDiscardButton && (
            <button
              onClick={handleDiscardChanges}
              disabled={isSubmitting}
              className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-xs"
            >
              <X className="w-3 h-3" />
              Descartar Alterações
            </button>
          )}
          
          {mode === "edit" && !hasChanges && !showDiscardButton && (
            <p className="text-xs text-gray-500 text-center">
              Faça alterações nos campos para habilitar os botões
            </p>
          )}
        </div>
      </div>
    </div>
);

const DesktopView = ({
    surgeryData, errors, handleInputChange, addAuxSurgeon, removeAuxSurgeon,
    removeCbhpmProcedure,
    newAuxSurgeon, setNewAuxSurgeon, canEdit, isSubmitting, mode,
    existingSurgery, selectedPatient, currentFlow, flowLabels,
    showSubmitButton, handleSubmit, hasChanges, submitButtonText,
    showDiscardButton, handleDiscardChanges, cbhpmSearch, setCbhpmSearch,
    showCbhpmResults, setShowCbhpmResults, searchCbhpmCodes,
    selectCbhpmCode,
    insuranceSearch, setInsuranceSearch, showInsuranceSuggestions, setShowInsuranceSuggestions
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              {mode === "edit" ? <Edit className="w-5 h-5 text-white" /> : <Stethoscope className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {mode === "edit" ? "Editar Cirurgia" : "Dados da Cirurgia"}
              </h3>
              <p className="text-xs text-gray-600">
                {mode === "edit" 
                  ? `Editando cirurgia de ${selectedPatient?.patientName}`
                  : `Para: ${selectedPatient?.patientName} - ${flowLabels[currentFlow]}`
                }
              </p>
            </div>
          </div>
          
          {mode === "edit" && existingSurgery && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
              existingSurgery.status === 'Agendada' 
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-gray-100 text-gray-800 border-gray-200'
            }`}>
              {existingSurgery.status}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {/* Erro geral */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Data da Cirurgia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data da Cirurgia *</label>
          <input
            type="date"
            value={surgeryData.surgeryDate}
            onChange={(e) => handleInputChange('surgeryDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.surgeryDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting || !canEdit}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.surgeryDate && (
            <p className="mt-1 text-sm text-red-600">{errors.surgeryDate}</p>
          )}
        </div>

        {/* Tipo de Procedimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Procedimento *</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleInputChange('procedureType', 'sus')}
              disabled={!canEdit}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-3 transition-all ${
                surgeryData.procedureType === 'sus'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Building className="w-8 h-8" />
              <div className="text-center">
                <div className="font-semibold">SUS</div>
                <div className="text-sm text-gray-600">Sistema Único de Saúde</div>
                <div className="text-xs text-gray-500 mt-1">Gratuito</div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleInputChange('procedureType', 'convenio')}
              disabled={!canEdit}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-3 transition-all ${
                surgeryData.procedureType === 'convenio'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <CreditCard className="w-8 h-8" />
              <div className="text-center">
                <div className="font-semibold">Convênio</div>
                <div className="text-sm text-gray-600">Plano de Saúde</div>  
                <div className="text-xs text-gray-500 mt-1">Particular</div>
              </div>
              {surgeryData.procedureType === 'convenio' && (
                <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Selecionado
                </div>
              )}
            </button>
          </div>
          {errors.procedureType && (
            <p className="mt-1 text-sm text-red-600">{errors.procedureType}</p>
          )}
        </div>

        {/* Dados Básicos */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso do Paciente (kg) *</label>
            <input
              type="number"
              value={surgeryData.patientWeight}
              onChange={(e) => handleInputChange('patientWeight', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.patientWeight ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Ex: 70"
              disabled={isSubmitting || !canEdit}
            />
            {errors.patientWeight && (
              <p className="mt-1 text-sm text-red-600">{errors.patientWeight}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgião Principal *</label>
            <input
              type="text"
              value={surgeryData.mainSurgeon}
              onChange={(e) => handleInputChange('mainSurgeon', formatNameInput(e.target.value, false, true))}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.mainSurgeon ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Nome do cirurgião principal"
              disabled={isSubmitting || !canEdit}
            />
            {errors.mainSurgeon && (
              <p className="mt-1 text-sm text-red-600">{errors.mainSurgeon}</p>
            )}
          </div>
        </div>

        {/* Hospital */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
          <input
            type="text"
            value={surgeryData.hospital}
            onChange={(e) => handleInputChange('hospital', formatNameInput(e.target.value, true))}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.hospital ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Nome do hospital"
            disabled={isSubmitting || !canEdit}
          />
          {errors.hospital && (
            <p className="mt-1 text-sm text-red-600">{errors.hospital}</p>
          )}
        </div>

        {/* Cirurgiões Auxiliares */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cirurgiões Auxiliares</label>
          <div className="space-y-2">
            {surgeryData.auxiliarySurgeons.map((surgeon, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="flex-1 text-sm">{surgeon.name}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeAuxSurgeon(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAuxSurgeon}
                  onChange={(e) => setNewAuxSurgeon(formatNameInput(e.target.value, false, true))}
                  placeholder="Nome do cirurgião auxiliar"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addAuxSurgeon()}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={addAuxSurgeon}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Campos Específicos do SUS */}
        {surgeryData.procedureType === 'sus' && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-blue-900 text-sm">Dados SUS</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registro Hospitalar *</label>
                <input
                  type="text"
                  value={surgeryData.hospitalRecord}
                  onChange={(e) => handleInputChange('hospitalRecord', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.hospitalRecord ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Número do registro"
                  disabled={isSubmitting || !canEdit}
                />
                {errors.hospitalRecord && (
                  <p className="mt-1 text-sm text-red-600">{errors.hospitalRecord}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgia Proposta *</label>
                <input
                  type="text"
                  value={surgeryData.proposedSurgery}
                  onChange={(e) => handleInputChange('proposedSurgery', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.proposedSurgery ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Descrição da cirurgia"
                  disabled={isSubmitting || !canEdit}
                />
                {errors.proposedSurgery && (
                  <p className="mt-1 text-sm text-red-600">{errors.proposedSurgery}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campos Específicos do Convênio */}
        {surgeryData.procedureType === 'convenio' && (
          <div className="bg-purple-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-purple-900 text-sm">Dados Convênio</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Convênio *</label>
                <input
                  type="text"
                  value={surgeryData.insuranceNumber}
                  onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.insuranceNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Número da carteirinha"
                  disabled={isSubmitting || !canEdit}
                />
                {errors.insuranceNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.insuranceNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Convênio *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={surgeryData.insuranceName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInsuranceSearch(value);
                      handleInputChange('insuranceName', value);
                      setShowInsuranceSuggestions(value.length >= 1);
                    }}
                    placeholder="Digite ou selecione o convênio"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.insuranceName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting || !canEdit}
                    onFocus={() => setShowInsuranceSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowInsuranceSuggestions(false), 100)}
                  />
                  {showInsuranceSuggestions && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow max-h-40 overflow-y-auto mt-1 text-sm">
                      {insuranceOptions
                        .filter(opt => opt.toLowerCase().includes(insuranceSearch.toLowerCase()))
                        .map((opt, idx) => (
                          <li
                            key={idx}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleInputChange('insuranceName', opt);
                              setInsuranceSearch(opt);
                              setShowInsuranceSuggestions(false);
                            }}
                          >
                            {opt}
                          </li>
                        ))}
                      {insuranceOptions.filter(opt => opt.toLowerCase().includes(insuranceSearch.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-gray-500">Nenhuma correspondência</li>
                      )}
                    </ul>
                  )}
                  {errors.insuranceName && (
                    <p className="mt-1 text-sm text-red-600">{errors.insuranceName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Procedimentos CBHPM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Procedimentos CBHPM *</label>
              
              {/* Lista de procedimentos adicionados */}
              <div className="space-y-2 mb-3">
                {surgeryData.cbhpmProcedures.map((proc, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-white border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{proc.codigo} - {proc.procedimento}</div>
                      <div className="text-xs text-gray-600">Porte Anestésico: {proc.porte_anestesico}</div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeCbhpmProcedure(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Buscar e adicionar novo procedimento */}
              {canEdit && (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={cbhpmSearch}
                        onChange={(e) => {
                          setCbhpmSearch(e.target.value);
                          setShowCbhpmResults(e.target.value.length >= 2);
                        }}
                        placeholder="Buscar código ou procedimento CBHPM..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    {/* Resultados da busca */}
                    {showCbhpmResults && cbhpmSearch.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <ul className="divide-y divide-gray-100">
                          {searchCbhpmCodes(cbhpmSearch).map((item, idx) => (
                            <li
                              key={idx}
                              onClick={() => selectCbhpmCode(item)}
                              className="cursor-pointer hover:bg-gray-100 p-2"
                            >
                              {item.codigo} - {item.procedimento}
                            </li>
                          ))}
                        </ul>
                        {searchCbhpmCodes(cbhpmSearch).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Nenhum procedimento encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errors.cbhpmProcedures && (
                <p className="mt-1 text-sm text-red-600">{errors.cbhpmProcedures}</p>
              )}
            </div>
          </div>
        )}

        {/* Procedimento Geral */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Procedimento</label>
          <textarea
            value={surgeryData.procedimento}
            onChange={(e) => handleInputChange('procedimento', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              !canEdit ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            rows="3"
            placeholder="Descrição geral do procedimento cirúrgico"
            disabled={isSubmitting || !canEdit}
          />
        </div>

        {/* Botões */}
        <div className="pt-4 space-y-3 max-w-md mx-auto">
          {showSubmitButton && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canEdit || (mode === "edit" && !hasChanges)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {submitButtonText}
                </>
              ) : (
                <>
                  {mode === "edit" && <Save className="w-4 h-4" />}
                  {submitButtonText}
                </>
              )}
            </button>
          )}

          {showDiscardButton && (
            <button
              onClick={handleDiscardChanges}
              disabled={isSubmitting}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Descartar Alterações
            </button>
          )}
          
          {mode === "edit" && !hasChanges && !showDiscardButton && (
            <p className="text-sm text-gray-500 text-center">
              Faça alterações nos campos para habilitar os botões
            </p>
          )}
        </div>
      </div>
    </div>
  );  

const SurgeryFormFields = ({
  // Props de configuração
  mode = "create", // "create" | "edit"
  selectedPatient,
  currentFlow = "anesthesia",
  
  // Props de dados
  existingSurgery = null,
  initialData = null,
  
  // Props de controle
  canEdit = true,
  isSubmitting = false,
  hasChanges = false,
  
  // Props de UI
  submitButtonText = "Continuar",
  showSubmitButton = true,
  showDiscardButton = false,
  
  // Callbacks
  onSubmit,
  onDataChange,
  onDiscardChanges
}) => {
  
  // Estado principal dos dados do formulário
  const [surgeryData, setSurgeryData] = useState({
    surgeryDate: '',
    procedureType: 'convenio',
    patientWeight: '',
    mainSurgeon: '',
    auxiliarySurgeons: [],
    hospital: '',
    hospitalRecord: '',
    proposedSurgery: '',
    insuranceNumber: '',
    insuranceName: '',
    cbhpmProcedures: [],
    procedimento: ''
  });

  // Estados locais da UI
  const [errors, setErrors] = useState({});
  const [cbhpmSearch, setCbhpmSearch] = useState('');
  const [showCbhpmResults, setShowCbhpmResults] = useState(false);
  const [newAuxSurgeon, setNewAuxSurgeon] = useState('');
  const [insuranceSearch, setInsuranceSearch] = useState('');
  const [showInsuranceSuggestions, setShowInsuranceSuggestions] = useState(false);

  // Inicializar dados baseado nas props
  useEffect(() => {
    let initialFormData = {
      surgeryDate: '',
      procedureType: 'convenio',
      patientWeight: '',
      mainSurgeon: '',
      auxiliarySurgeons: [],
      hospital: '',
      hospitalRecord: '',
      proposedSurgery: '',
      insuranceNumber: '',
      insuranceName: '',
      cbhpmProcedures: [],
      procedimento: ''
    };

    // Prioridade: initialData (editor) > existingSurgery (edit mode)
    const dataSource = initialData || existingSurgery;
    
    if (dataSource) {
      initialFormData = {
        surgeryDate: dataSource.surgeryDate || '',
        procedureType: dataSource.procedureType || 'convenio',
        patientWeight: dataSource.patientWeight || '',
        mainSurgeon: dataSource.mainSurgeon || '',
        auxiliarySurgeons: dataSource.auxiliarySurgeons || [],
        hospital: dataSource.hospital || '',
        hospitalRecord: dataSource.hospitalRecord || '',
        proposedSurgery: dataSource.proposedSurgery || '',
        insuranceNumber: dataSource.insuranceNumber || '',
        insuranceName: dataSource.insuranceName || '',
        cbhpmProcedures: dataSource.cbhpmProcedures || [],
        procedimento: dataSource.procedimento || ''
      };
    }

    setSurgeryData(initialFormData);
  }, [initialData, existingSurgery]);

  // Buscar códigos CBHPM
  const extractNumbers = (code) => {
    return code.replace(/[^\d]/g, '');
  };

  const isCodeSearch = (term) => {
    return /^[\d\.\-]+$/.test(term);
  };

  const searchCbhpmCodes = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase().trim();
    
    // Se for busca por código
    if (isCodeSearch(term)) {
      const searchDigits = extractNumbers(term);
      
      return cbhpmCodes.filter(code => {
        const codeDigits = extractNumbers(code.codigo);
        
        // Busca exata se digitou código completo (8 dígitos)
        if (searchDigits.length === 8) {
          return codeDigits === searchDigits;
        }
        
        // Busca parcial para códigos incompletos
        return codeDigits.startsWith(searchDigits) || 
               code.codigo.toLowerCase().includes(term);
      }).slice(0, 10);
    }
    
    // Busca por múltiplas palavras no procedimento (todas as palavras devem estar presentes, em qualquer ordem)
    const words = term.split(/\s+/).filter(Boolean);

    return cbhpmCodes.filter(code => {
      const proc = code.procedimento.toLowerCase();
      return words.every(word => proc.includes(word));
    }).slice(0, 10);
  };
  // Formatar código CBHPM automaticamente ao digitar
  const formatCode = (digits) => {
    if (digits.length >= 7) {
      return `${digits[0]}.${digits.slice(1,3)}.${digits.slice(3,5)}.${digits.slice(5,7)}-${digits.slice(7)}`;
    }
    if (digits.length >= 5) {
      return `${digits[0]}.${digits.slice(1,3)}.${digits.slice(3,5)}.${digits.slice(5)}`;
    }
    if (digits.length >= 3) {
      return `${digits[0]}.${digits.slice(1,3)}.${digits.slice(3)}`;
    }
    if (digits.length >= 1) {
      return `${digits[0]}.${digits.slice(1)}`;
    }
    return digits;
  };

  const handleCbhpmSearchChange = (e) => {
    const value = e.target.value;
    
    // Se for apenas números, formatar automaticamente
    if (/^\d+$/.test(value) && value.length <= 8) {
      const formatted = formatCode(value);
      setCbhpmSearch(formatted);
    } else {
      setCbhpmSearch(value);
    }
    
    setShowCbhpmResults(value.length >= 2);
  };

  // Selecionar código CBHPM
  const selectCbhpmCode = (selectedCode) => {
    setSurgeryData(prev => {
      const newData = {
        ...prev,
        cbhpmProcedures: [...prev.cbhpmProcedures, selectedCode] // adiciona mesmo duplicado
      };
      if (mode === "edit" && onDataChange) {
        onDataChange(newData);
      }
      return newData;
    });
  
    setCbhpmSearch('');
    setShowCbhpmResults(false);
  };

  // Removido: addCbhpmProcedure e uso de newCbhpm

  // Remover procedimento CBHPM
  const removeCbhpmProcedure = (index) => {
    setSurgeryData(prev => {
      const newData = { ...prev, cbhpmProcedures: prev.cbhpmProcedures.filter((_, i) => i !== index) };
      if (mode === "edit" && onDataChange) {
        onDataChange(newData);
      }
      return newData;
    });
  };

  // Adicionar cirurgião auxiliar
  const addAuxSurgeon = () => {
    if (newAuxSurgeon.trim()) {
      setSurgeryData(prev => {
        const newData = { ...prev, auxiliarySurgeons: [...prev.auxiliarySurgeons, { name: newAuxSurgeon.trim() }] };
        if (mode === "edit" && onDataChange) {
          onDataChange(newData);
        }
        return newData;
      });
      setNewAuxSurgeon('');
    }
  };

  // Remover cirurgião auxiliar
  const removeAuxSurgeon = (index) => {
    setSurgeryData(prev => {
      const newData = { ...prev, auxiliarySurgeons: prev.auxiliarySurgeons.filter((_, i) => i !== index) };
      if (mode === "edit" && onDataChange) {
        onDataChange(newData);
      }
      return newData;
    });
  };

  // Alterar campos
  const handleInputChange = (field, value) => {
    setSurgeryData(prev => {
      const newData = { ...prev, [field]: value };
      if (mode === "edit" && onDataChange) {
        onDataChange(newData);
      }
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!onSubmit) return;

    const result = await onSubmit(surgeryData);
    
    if (!result.success && result.errors) {
      setErrors(result.errors);
    } else if (result.success) {
      setErrors({});
    }
  };

  // Descartar alterações (apenas edit mode)
  const handleDiscardChanges = () => {
    if (onDiscardChanges) {
      const resetData = onDiscardChanges();
      if (resetData) {
        setSurgeryData(resetData);
        setErrors({});
      }
    }
  };

  const flowLabels = {
    anesthesia: 'Ficha Anestésica',
    preAnesthesia: 'Avaliação Pré-Anestésica',
    srpa: 'Ficha SRPA'
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="block md:hidden">
        <MobileView
          surgeryData={surgeryData}
          errors={errors}
          handleInputChange={handleInputChange}
          addAuxSurgeon={addAuxSurgeon}
          removeAuxSurgeon={removeAuxSurgeon}
          removeCbhpmProcedure={removeCbhpmProcedure}
          newAuxSurgeon={newAuxSurgeon}
          setNewAuxSurgeon={setNewAuxSurgeon}
          canEdit={canEdit}
          isSubmitting={isSubmitting}
          mode={mode}
          existingSurgery={existingSurgery}
          selectedPatient={selectedPatient}
          currentFlow={currentFlow}
          flowLabels={flowLabels}
          showSubmitButton={showSubmitButton}
          handleSubmit={handleSubmit}
          hasChanges={hasChanges}
          submitButtonText={submitButtonText}
          showDiscardButton={showDiscardButton}
          handleDiscardChanges={handleDiscardChanges}
          cbhpmSearch={cbhpmSearch}
          setCbhpmSearch={setCbhpmSearch}
          showCbhpmResults={showCbhpmResults}
          setShowCbhpmResults={setShowCbhpmResults}
          searchCbhpmCodes={searchCbhpmCodes}
          selectCbhpmCode={selectCbhpmCode}
          insuranceSearch={insuranceSearch}
          setInsuranceSearch={setInsuranceSearch}
          showInsuranceSuggestions={showInsuranceSuggestions}
          setShowInsuranceSuggestions={setShowInsuranceSuggestions}
        />
      </div>

      <div className="hidden md:block">
        <DesktopView
          surgeryData={surgeryData}
          errors={errors}
          handleInputChange={handleInputChange}
          addAuxSurgeon={addAuxSurgeon}
          removeAuxSurgeon={removeAuxSurgeon}
          removeCbhpmProcedure={removeCbhpmProcedure}
          newAuxSurgeon={newAuxSurgeon}
          setNewAuxSurgeon={setNewAuxSurgeon}
          canEdit={canEdit}
          isSubmitting={isSubmitting}
          mode={mode}
          existingSurgery={existingSurgery}
          selectedPatient={selectedPatient}
          currentFlow={currentFlow}
          flowLabels={flowLabels}
          showSubmitButton={showSubmitButton}
          handleSubmit={handleSubmit}
          hasChanges={hasChanges}
          submitButtonText={submitButtonText}
          showDiscardButton={showDiscardButton}
          handleDiscardChanges={handleDiscardChanges}
          cbhpmSearch={cbhpmSearch}
          setCbhpmSearch={setCbhpmSearch}
          showCbhpmResults={showCbhpmResults}
          setShowCbhpmResults={setShowCbhpmResults}
          searchCbhpmCodes={searchCbhpmCodes}
          selectCbhpmCode={selectCbhpmCode}
          insuranceSearch={insuranceSearch}
          setInsuranceSearch={setInsuranceSearch}
          showInsuranceSuggestions={showInsuranceSuggestions}
          setShowInsuranceSuggestions={setShowInsuranceSuggestions}
        />
      </div>
    </div>
  );
};

export default SurgeryFormFields;