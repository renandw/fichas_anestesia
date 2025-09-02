import React, { useState } from 'react';
import { X, User, Calendar, Hash, AlertTriangle, Check } from 'lucide-react';

const SimilarPatientsModal = ({ 
  isOpen, 
  onClose, 
  similarPatients = [], 
  newPatientData = {},
  onSelectExisting,
  onCreateNew,
  onUpdateExisting 
}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  if (!isOpen) return null;

  // Detectar se é caso contextual (exact_with_differences) ou similar
  const isContextualCase = similarPatients.length === 1 && similarPatients[0]?.contextualMessage;
  const contextualPatient = isContextualCase ? similarPatients[0] : null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCNS = (cns) => {
    if (!cns) return 'Não informado';
    return cns;
  };

  const getTitle = () => {
    if (!isContextualCase) return 'Pacientes Similares Encontrados';
    
    const titles = {
      name_expanded: 'Provável mesmo paciente com nome expandido',
      accent_difference: 'Mesmo paciente com diferenças de acentuação',
      possible_sibling: 'Possível paciente da mesma família',
      identical: 'Paciente encontrado com dados ligeiramente diferentes'
    };
    
    return titles[contextualPatient.relationship] || 'Paciente encontrado com diferenças';
  };

  const getDescription = () => {
    if (!isContextualCase) {
      return 'Encontramos paciente(s) com dados similares. Escolha uma opção:';
    }
    
    const descriptions = {
      name_expanded: 'O nome digitado parece ser uma versão mais completa do nome cadastrado.',
      accent_difference: 'Os nomes são praticamente idênticos, apenas com diferenças de acentos ou grafia.',
      possible_sibling: 'Encontramos paciente com nome similar e mesma data de nascimento.',
      identical: 'O paciente foi encontrado, mas há pequenas diferenças nos dados.'
    };
    
    const baseDesc = descriptions[contextualPatient.relationship] || descriptions.identical;
    const searchMethod = contextualPatient.searchMethod === 'cns' ? 'CNS' : 'nome e data de nascimento';
    
    return `${baseDesc} (Encontrado por: ${searchMethod})`;
  };

  const handleConfirm = () => {
    if (selectedAction === 'existing' && selectedPatientId) {
      const selectedPatient = similarPatients.find(p => p.id === selectedPatientId);
      onSelectExisting(selectedPatient);
    } else if (selectedAction === 'update' && selectedPatientId) {
      const selectedPatient = similarPatients.find(p => p.id === selectedPatientId);
      onUpdateExisting(selectedPatient);
    } else if (selectedAction === 'new') {
      onCreateNew();
    }
  };

  const isConfirmDisabled = () => {
    return !selectedAction || (selectedAction !== 'new' && !selectedPatientId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-amber-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getTitle()}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {getDescription()}
              </p>
              {isContextualCase && contextualPatient.confidence && (
                <p className="text-xs text-green-600 mt-1">
                  Confiança: {Math.round(contextualPatient.confidence.score * 100)}% ({contextualPatient.confidence.level})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Diferenças contextuais (para casos exact_with_differences) */}
          {isContextualCase && contextualPatient.differences && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Diferenças encontradas:</h4>
              <div className="space-y-1 text-sm">
                {contextualPatient.differences.name && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Nome:</span>
                    <span className="text-amber-900">
                      <span className="font-medium">{contextualPatient.differences.name.existing}</span> → <span className="font-medium">{contextualPatient.differences.name.new}</span>
                    </span>
                  </div>
                )}
                {contextualPatient.differences.birthDate && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Data:</span>
                    <span className="text-amber-900">
                      <span className="font-medium">{formatDate(contextualPatient.differences.birthDate.existing)}</span> → <span className="font-medium">{formatDate(contextualPatient.differences.birthDate.new)}</span>
                    </span>
                  </div>
                )}
                {contextualPatient.differences.sex && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Sexo:</span>
                    <span className="text-amber-900">
                      <span className="font-medium capitalize">{contextualPatient.differences.sex.existing}</span> → <span className="font-medium capitalize">{contextualPatient.differences.sex.new}</span>
                    </span>
                  </div>
                )}
                {contextualPatient.differences.cns && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">CNS:</span>
                    <span className="text-amber-900">
                      <span className="font-medium">{formatCNS(contextualPatient.differences.cns.existing)}</span> → <span className="font-medium">{formatCNS(contextualPatient.differences.cns.new)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dados que o usuário digitou */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Dados que você digitou:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Nome:</span>
                <p className="text-blue-700">{newPatientData.patientName || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium text-blue-800">Data de Nascimento:</span>
                <p className="text-blue-700">
                  {newPatientData.patientBirthDate ? formatDate(newPatientData.patientBirthDate) : 'Não informado'}
                </p>
              </div>
              <div>
                <span className="font-medium text-blue-800">CNS:</span>
                <p className="text-blue-700">{formatCNS(newPatientData.patientCNS)}</p>
              </div>
            </div>
          </div>

          {/* Pacientes encontrados */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">
              {isContextualCase ? 'Paciente encontrado:' : `Pacientes similares encontrados (${similarPatients.length}):`}
            </h3>
            
            <div className="space-y-3">
              {similarPatients.map((patient) => (
                <div 
                  key={patient.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPatientId === patient.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPatientId(patient.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <h4 className="font-medium text-gray-900">{patient.name}</h4>
                        {!isContextualCase && (
                          <p className="text-sm text-green-600 font-medium">
                            {patient.similarity}% de similaridade
                          </p>
                        )}
                        {patient.analysisDetails && (
                          <p className="text-xs text-gray-600 mt-1">
                            {patient.analysisDetails}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedPatientId === patient.id && (
                      <Check className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <span className="text-gray-600">Nascimento:</span>
                        <p className="font-medium">{formatDate(patient.birthDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <span className="text-gray-600">Sexo:</span>
                        <p className="font-medium capitalize">{patient.sex || 'Não informado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <span className="text-gray-600">CNS:</span>
                        <p className="font-medium">{formatCNS(patient.cns)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opções de ação */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 mb-3">O que você deseja fazer?</h3>
            
            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="action"
                value="existing"
                checked={selectedAction === 'existing'}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="mt-1 mr-3"
                disabled={!selectedPatientId}
              />
              <div>
                <div className="font-medium text-gray-900">
                  {isContextualCase ? 'Manter dados cadastrados e criar procedimento' : 'É o mesmo paciente (usar dados existentes)'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {isContextualCase 
                    ? 'Manter os dados originais do paciente e criar apenas o novo procedimento.'
                    : 'Vou criar o procedimento para o paciente selecionado acima, mantendo os dados já cadastrados.'
                  }
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="action"
                value="update"
                checked={selectedAction === 'update'}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="mt-1 mr-3"
                disabled={!selectedPatientId}
              />
              <div>
                <div className="font-medium text-gray-900">
                  {isContextualCase ? 'Atualizar dados e criar procedimento' : 'É o mesmo paciente (atualizar dados)'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {isContextualCase
                    ? 'Atualizar os dados do paciente com as informações que você digitou e criar o procedimento.'
                    : 'Vou atualizar os dados do paciente selecionado com as informações que você digitou e criar o procedimento.'
                  }
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="action"
                value="new"
                checked={selectedAction === 'new'}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {isContextualCase ? 'São pacientes diferentes (criar novo)' : 'É um paciente diferente (criar novo)'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {isContextualCase
                    ? 'Criar um novo paciente com os dados que você digitou (cuidado com duplicatas).'
                    : 'Vou criar um novo paciente com os dados que você digitou.'
                  }
                </div>
                {isContextualCase && (
                  <div className="text-xs text-amber-600 mt-1 font-medium">
                    ⚠️ Esta opção pode criar duplicatas se for realmente o mesmo paciente.
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimilarPatientsModal;