import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import PatientForm from './PatientForm';
import SurgeryForm from './SurgeryForm/SurgeryForm';
import AnesthesiaFormComponent from './AnesthesiaFormComponent';
import ShareSurgery from './ShareSurgery';
import { useAuth } from '../contexts/AuthContext';

const formatBirthDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

// Componente principal da página
const NewAnesthesiaPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState('patient');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [selectedAnesthesia, setSelectedAnesthesia] = useState(null);
  const [isNewSurgery, setIsNewSurgery] = useState(false);

  // Verificar autenticação
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
          <p className="text-red-600">Você precisa estar logado para acessar esta página.</p>
          <button 
            onClick={() => navigate('/signin')}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const handlePatientSelected = (patient) => {
    console.log('✅ Paciente selecionado:', patient);
    setSelectedPatient(patient);
    setCurrentStep('surgery');
  };

  const handleSurgerySelected = (surgery) => {
    console.log('✅ Cirurgia selecionada:', surgery);
    setSelectedSurgery(surgery);
    
    // Verificar se é cirurgia nova (tem metadata.createdAt recente)
    const isNew = surgery.metadata?.createdAt && surgery.code; // Cirurgia nova tem código
    setIsNewSurgery(isNew);
    
    console.log('🔄 Indo para step de anestesia');
    setCurrentStep('anesthesia');
  };

  const handleAnesthesiaCreated = (anesthesia) => {
    console.log('✅ Anestesia criada:', anesthesia);
    setSelectedAnesthesia(anesthesia);
    
    if (isNewSurgery) {
      console.log('🆕 Cirurgia nova - oferecendo compartilhamento');
      setCurrentStep('share');
    } else {
      console.log('📋 Cirurgia existente - indo direto para anestesia');
      redirectToAnesthesia(anesthesia);
    }
  };

  const handleShareComplete = (updatedSurgery, selectedUserIds) => {
    console.log('🔗 Cirurgia compartilhada com:', selectedUserIds);
    console.log('📄 Cirurgia atualizada:', updatedSurgery);
    
    setSelectedSurgery(updatedSurgery);
    
    setCurrentStep('success');
    setTimeout(() => {
      redirectToAnesthesia(selectedAnesthesia);
    }, 2000);
  };

  const handleSkipShare = () => {
    console.log('⏭️ Compartilhamento pulado');
    redirectToAnesthesia(selectedAnesthesia);
  };

  const redirectToAnesthesia = (anesthesia) => {
    if (selectedPatient && selectedSurgery && anesthesia) {
      const url = `/patients/${selectedPatient.id}/surgeries/${selectedSurgery.id}/anesthesia/${anesthesia.id}`;
      console.log('🔄 Redirecionando para:', url);
      navigate(url);
    }
  };

  const handleGoBack = () => {
    if (currentStep === 'surgery') {
      setCurrentStep('patient');
      setSelectedPatient(null);
    } else if (currentStep === 'anesthesia') {
      setCurrentStep('surgery');
      setSelectedSurgery(null);
      setIsNewSurgery(false);
    } else if (currentStep === 'share') {
      setCurrentStep('anesthesia');
      setSelectedAnesthesia(null);
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'patient': return 1;
      case 'surgery': return 2;
      case 'anesthesia': return 3;
      case 'share': return 4;
      case 'success': return 4;
      default: return 1;
    }
  };

  const getTotalSteps = () => {
    return isNewSurgery ? 4 : 3;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nova Ficha Anestésica</h1>
              <p className="text-gray-600">Cadastre paciente, cirurgia e anestesia</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Etapa {getStepNumber()} de {getTotalSteps()}
              </span>
              <span className="text-sm text-gray-500">
                {currentStep === 'patient' && 'Dados do Paciente'}
                {currentStep === 'surgery' && 'Dados da Cirurgia'}
                {currentStep === 'anesthesia' && 'Dados da Anestesia'}
                {currentStep === 'share' && 'Compartilhamento'}
                {currentStep === 'success' && 'Concluído'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getStepNumber() / getTotalSteps()) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Steps Navigation */}
        {currentStep !== 'success' && (
          <div className="flex items-center justify-center mb-8 overflow-x-auto">
            <div className="flex items-center gap-2 sm:gap-4 flex-nowrap">
              {/* Step 1 - Paciente */}
              <div className={`flex items-center gap-2 ${currentStep === 'patient' ? 'text-blue-600' : selectedPatient ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'patient' ? 'bg-blue-100 text-blue-600' : 
                  selectedPatient ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {selectedPatient ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <span className="hidden sm:inline text-sm font-medium">Paciente</span>
              </div>

              <div className="w-8 h-px bg-gray-300"></div>

              {/* Step 2 - Cirurgia */}
              <div className={`flex items-center gap-2 ${currentStep === 'surgery' ? 'text-blue-600' : selectedSurgery ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'surgery' ? 'bg-blue-100 text-blue-600' : 
                  selectedSurgery ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {selectedSurgery ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <span className="hidden sm:inline text-sm font-medium">Cirurgia</span>
              </div>

              <div className="w-8 h-px bg-gray-300"></div>

              {/* Step 3 - Anestesia */}
              <div className={`flex items-center gap-2 ${currentStep === 'anesthesia' ? 'text-blue-600' : selectedAnesthesia ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'anesthesia' ? 'bg-blue-100 text-blue-600' : 
                  selectedAnesthesia ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {selectedAnesthesia ? <CheckCircle className="w-4 h-4" /> : '3'}
                </div>
                <span className="hidden sm:inline text-sm font-medium">Anestesia</span>
              </div>

              {isNewSurgery && (
                <>
                  <div className="w-8 h-px bg-gray-300"></div>

                  {/* Step 4 - Compartilhamento */}
                  <div className={`flex items-center gap-2 ${currentStep === 'share' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === 'share' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      4
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">Compartilhar</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Back Button */}
        {(currentStep === 'surgery' || currentStep === 'anesthesia' || currentStep === 'share') && (
          <div className="mb-6">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-700 text-xs sm:text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {currentStep === 'patient' && (
            <PatientForm onPatientSelected={handlePatientSelected} />
          )}

          {currentStep === 'surgery' && selectedPatient && (
            <SurgeryForm 
              selectedPatient={selectedPatient} 
              currentFlow="anesthesia"
              onSurgerySelected={handleSurgerySelected} 
            />
          )}

          {currentStep === 'anesthesia' && selectedPatient && selectedSurgery && (
            <div>
              {/* Contexto da Anestesia */}
              <div className="mb-6 bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Contexto da Anestesia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
                    <h4 className="font-medium text-blue-900 mb-1 text-xs sm:text-sm">Paciente</h4>
                    <p className="text-xs sm:text-sm text-blue-800">{selectedPatient.patientName}</p>
                    <p className="text-xs text-blue-600">CNS: {selectedPatient.patientCNS}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 sm:p-3">
                    <h4 className="font-medium text-green-900 mb-1 text-xs sm:text-sm">Cirurgia</h4>
                    <p className="text-xs sm:text-sm text-green-800">
                      {selectedSurgery.procedimento || selectedSurgery.proposedSurgery}
                    </p>
                    <p className="text-xs text-green-600">{selectedSurgery.hospital}</p>
                  </div>
                </div>
              </div>

              {/* Formulário de Anestesia */}
              <AnesthesiaFormComponent 
                mode="create"
                selectedPatient={selectedPatient}
                selectedSurgery={selectedSurgery}
                onAnesthesiaCreated={handleAnesthesiaCreated}
              />
            </div>
          )}

          {/* Usando o ShareSurgery completo com Firebase */}
          {currentStep === 'share' && selectedSurgery && (
            <ShareSurgery 
              surgery={selectedSurgery}
              onShareComplete={handleShareComplete}
              onSkip={handleSkipShare}
            />
          )}

          {currentStep === 'success' && (
            <div className="bg-white rounded-lg border border-green-200 p-6 sm:p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                {selectedSurgery?.sharedWith?.length > 0 ? 'Anestesia Criada e Compartilhada!' : 'Anestesia Criada!'}
              </h3>
              <p className="text-xs sm:text-gray-600 sm:mb-4 mb-2">
                {selectedSurgery?.sharedWith?.length > 0 
                  ? `Compartilhada com ${selectedSurgery.sharedWith.length} usuário(s). Redirecionando...`
                  : 'Redirecionando para a ficha anestésica...'
                }
              </p>
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Panel */}
        {(selectedPatient || selectedSurgery || selectedAnesthesia) && currentStep !== 'success' && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Resumo</h3>
            
            {selectedPatient && (
              <div className="mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1 text-xs sm:text-sm">Paciente Selecionado</h4>
                <p className="text-xs sm:text-sm text-blue-800">{selectedPatient.patientName}</p>
                <p className="text-xs text-blue-600">
                  CNS: {selectedPatient.patientCNS} | 
                  Nascimento: {formatBirthDate(selectedPatient.patientBirthDate)}
                </p>
              </div>
            )}

            {selectedSurgery && (
              <div className="mb-4 p-2 sm:p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1 text-xs sm:text-sm">Cirurgia Selecionada</h4>
                <div className="text-xs sm:text-sm text-green-800">
                  <p><strong>Código:</strong> {selectedSurgery.code || 'N/A'}</p>
                  <p><strong>Procedimento:</strong> {selectedSurgery.procedimento || selectedSurgery.proposedSurgery || 'Não especificado'}</p>
                  <p><strong>Tipo:</strong> {selectedSurgery.procedureType === 'sus' ? 'SUS' : 'Convênio'}</p>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Hospital: {selectedSurgery.hospital} | 
                  Status: {selectedSurgery.status}
                  {selectedSurgery.sharedWith?.length > 0 && (
                    <span> | Compartilhada com {selectedSurgery.sharedWith.length} usuário(s)</span>
                  )}
                </p>
              </div>
            )}

            {selectedAnesthesia && (
              <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-1 text-xs sm:text-sm">Anestesia Criada</h4>
                <div className="text-xs sm:text-sm text-purple-800">
                  <p><strong>Data:</strong> {new Date(selectedAnesthesia.surgeryDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Técnica:</strong> {selectedAnesthesia.anestheticTechnique || 'Não especificada'}</p>
                  <p><strong>Início:</strong> {selectedAnesthesia.anesthesiaTimeStart || 'Não definido'}</p>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Status: {selectedAnesthesia.status}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAnesthesiaPage;