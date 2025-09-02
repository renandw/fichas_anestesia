import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { 
  createPatientAndProcedureIntelligent, 
  updatePatientAndCreateProcedure,
  forceCreateNewPatientAndProcedure,
  savePatient,
  saveProcedure,
  saveSurgery
} from '../../../../services/firestore';
import { 
  useExistingPatientAndCreateProcedure as createProcedureForExistingPatient 
} from '../../../../services/firestore';
import PatientFormFields from '../../../surgery/PatientFormFields';
import SimilarPatientsModal from '../../SimilarPatientsModal';
import SurgeryForm from './SurgeryForm';
import { 
  ArrowLeft, 
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const NewPatientProcedureSurgery = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Paciente/Procedimento, 2: Cirurgia
  const [isLoading, setIsLoading] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarPatients, setSimilarPatients] = useState([]);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [createdPatientProcedure, setCreatedPatientProcedure] = useState(null);
  const [surgeryData, setSurgeryData] = useState({
    surgeryDate: '',
    surgeryTime: '',
    observations: ''
  });
  
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Handler do primeiro formulário (Paciente + Procedimento)
  const handlePatientProcedureSubmit = async (formData) => {
    setIsLoading(true);
    try {
      console.log("DEBUG - formData recebido no submit:", formData);
      
      // Usar a nova função inteligente
      const result = await createPatientAndProcedureIntelligent(formData);
      
      switch (result.action) {
        case 'patient_and_procedure_created':
          // Sucesso direto - avançar para step 2
          setCreatedPatientProcedure({
            patient: result.patient,
            procedure: result.procedure
          });
          setCurrentStep(2);
          toast.success('Paciente e procedimento criados! Agora defina os dados da cirurgia.');
          break;
          
        case 'procedure_created':
          // Procedimento criado para paciente existente - avançar para step 2
          setCreatedPatientProcedure({
            patient: result.patient,
            procedure: result.procedure
          });
          setCurrentStep(2);
          toast.success('Procedimento criado! Agora defina os dados da cirurgia.');
          break;
          
        case 'exact_patient_with_differences':
          // Paciente encontrado com diferenças contextuais
          console.log('🔍 Paciente com diferenças encontrado:', result);
          setSimilarPatients([{
            ...result.existingPatient,
            confidence: result.confidence,
            relationship: result.relationship,
            differences: result.differences,
            contextualMessage: result.contextualMessage,
            searchMethod: result.searchMethod
          }]);
          setPendingFormData(result.formData);
          setShowSimilarModal(true);
          
          const toastMessages = {
            name_expanded: 'Paciente encontrado com nome expandido. Verifique se é o mesmo.',
            accent_difference: 'Paciente encontrado com diferenças de acentuação.',
            possible_sibling: 'Paciente similar encontrado. Pode ser da mesma família.',
            identical: 'Paciente encontrado com dados ligeiramente diferentes.'
          };
          toast.info(toastMessages[result.relationship] || 'Paciente encontrado com diferenças.');
          break;
          
        case 'similar_patients_found':
          // Pacientes similares (média/baixa confiança)
          setSimilarPatients(result.similarPatients);
          setPendingFormData(result.formData);
          setShowSimilarModal(true);
          toast.info(`Encontramos ${result.similarPatients.length} paciente(s) similar(es). Verifique se é o mesmo paciente.`);
          break;
          
        default:
          throw new Error('Ação não reconhecida');
      }
    } catch (error) {
      console.error('Erro ao processar paciente/procedimento:', error);
      toast.error('Erro ao processar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler do segundo formulário (Cirurgia)
  const handleSurgerySubmit = async (surgeryFormData) => {
    if (!createdPatientProcedure) {
      toast.error('Erro: dados do paciente/procedimento não encontrados');
      return;
    }

    setIsLoading(true);
    try {
      const { surgeryDate, surgeryTime, observations } = surgeryFormData;
      const startTime = new Date(`${surgeryDate}T${surgeryTime}:00`);
      const createdAt = new Date();

      const newSurgeryData = {
        startTime,
        createdAt,
        createdBy: userProfile.uid,
        createdByName: userProfile.name,
        status: 'in_progress',
        observations: observations || '',
        // Anestesista inicial é quem criou
        anesthetists: [{
          doctorId: userProfile.uid,
          doctorName: userProfile.name,
          startTime: startTime.toISOString(),
          endTime: null,
          isActive: true
        }],
        // Dados herdados do procedimento
        procedureType: createdPatientProcedure.procedure.procedureType,
        mainSurgeon: createdPatientProcedure.procedure.mainSurgeon,
        auxiliarySurgeons: createdPatientProcedure.procedure.auxiliarySurgeons || [],
        hospital: createdPatientProcedure.procedure.hospital
      };

      const savedSurgery = await saveSurgery(
        createdPatientProcedure.patient.id, 
        createdPatientProcedure.procedure.id, 
        newSurgeryData
      );

      toast.success('Paciente, procedimento e cirurgia criados com sucesso!');
      navigate(`/patients/${createdPatientProcedure.patient.id}/procedures/${createdPatientProcedure.procedure.id}/surgery`);
      
    } catch (error) {
      console.error('Erro ao criar cirurgia:', error);
      toast.error('Erro ao criar cirurgia. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers do modal de pacientes similares
  const handleSelectExisting = async (selectedPatient) => {
    setIsLoading(true);
    try {
      let result;
      
      if (selectedPatient.contextualMessage) {
        // Caso contextual - usar função específica
        result = await createProcedureForExistingPatient(selectedPatient.id, pendingFormData);
      } else {
        // Caso similar - usar função original
        const savedProcedure = await saveProcedure(selectedPatient.id, {
          ...pendingFormData.procedureData,
          status: 'planned',
          createdAt: new Date(),
          createdBy: pendingFormData.metadata.createdBy,
          sharedWith: [],
          lastUpdated: new Date()
        });
        
        result = {
          patient: { id: selectedPatient.id, ...selectedPatient },
          procedure: { id: savedProcedure.id, ...savedProcedure }
        };
      }

      setCreatedPatientProcedure(result);
      setCurrentStep(2);
      setShowSimilarModal(false);
      resetModalState();
      toast.success('Procedimento criado! Agora defina os dados da cirurgia.');
      
    } catch (error) {
      console.error('Erro ao criar procedimento:', error);
      toast.error('Erro ao criar procedimento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExisting = async (selectedPatient) => {
    setIsLoading(true);
    try {
      const result = await updatePatientAndCreateProcedure(
        selectedPatient.id, 
        pendingFormData
      );
      
      setCreatedPatientProcedure(result);
      setCurrentStep(2);
      setShowSimilarModal(false);
      resetModalState();
      toast.success('Paciente atualizado e procedimento criado! Agora defina os dados da cirurgia.');
      
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast.error('Erro ao atualizar paciente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setIsLoading(true);
    try {
      let result;
      const firstPatient = similarPatients[0];
      
      if (firstPatient?.contextualMessage) {
        // Caso contextual - usar função específica para forçar criação
        result = await forceCreateNewPatientAndProcedure(pendingFormData);
      } else {
        // Caso similar - usar função original
        const savedPatient = await savePatient({
          ...pendingFormData.patientData,
          createdAt: new Date(),
          createdBy: pendingFormData.metadata.createdBy,
          lastUpdated: new Date()
        });
        
        const savedProcedure = await saveProcedure(savedPatient.id, {
          ...pendingFormData.procedureData,
          status: 'planned',
          createdAt: new Date(),
          createdBy: pendingFormData.metadata.createdBy,
          sharedWith: [],
          lastUpdated: new Date()
        });
        
        result = {
          patient: { id: savedPatient.id, ...savedPatient },
          procedure: { id: savedProcedure.id, ...savedProcedure }
        };
      }

      setCreatedPatientProcedure(result);
      setCurrentStep(2);
      setShowSimilarModal(false);
      resetModalState();
      toast.success('Novo paciente e procedimento criados! Agora defina os dados da cirurgia.');
      
    } catch (error) {
      console.error('Erro ao criar novo paciente:', error);
      toast.error('Erro ao criar novo paciente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModalState = () => {
    setSimilarPatients([]);
    setPendingFormData(null);
  };

  const handleCloseModal = () => {
    setShowSimilarModal(false);
    resetModalState();
    setIsLoading(false);
  };

  const goBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setCreatedPatientProcedure(null);
    } else {
      navigate('/dashboard');
    }
  };

  // Componente de progresso
  const ProgressSteps = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 1 ? 'text-primary-600' : 'text-gray-500'
            }`}>
              Paciente e Procedimento
            </span>
          </div>
          
          {/* Connector */}
          <div className={`w-12 h-px ${
            currentStep > 1 ? 'bg-primary-600' : 'bg-gray-300'
          }`} />
          
          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 2 ? 'text-primary-600' : 'text-gray-500'
            }`}>
              Cirurgia
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            disabled={isLoading}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Paciente, Procedimento e Cirurgia</h1>
            <p className="text-sm text-gray-600">
              {currentStep === 1 
                ? 'Preencha os dados do paciente e procedimento' 
                : 'Defina a data e hora de início da cirurgia'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <ProgressSteps />

      {/* Indicador de detecção inteligente (apenas no step 1) */}
      {currentStep === 1 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Detecção Inteligente Ativa</h3>
              <p className="text-sm text-blue-700 mt-1">
                O sistema verificará automaticamente se o paciente já existe. Se encontrar pacientes similares, 
                você poderá escolher entre usar um existente ou criar um novo antes de definir a cirurgia.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {/* Step 1: Paciente e Procedimento */}
        {currentStep === 1 && (
          <PatientFormFields
            mode="new_patient"
            currentUser={userProfile}
            onSubmit={handlePatientProcedureSubmit}
            isLoading={isLoading}
            submitButtonText={isLoading ? "Verificando paciente..." : "Continuar para Cirurgia"}
            showTitle={false}
          />
        )}

        {/* Step 2: Cirurgia */}
        {currentStep === 2 && createdPatientProcedure && (
          <div className="space-y-6">
            {/* Resumo do paciente e procedimento */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-800">Paciente e Procedimento Criados</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Paciente:</span>
                  <p className="text-green-800">{createdPatientProcedure.patient.name || createdPatientProcedure.patient.patientName}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Procedimento:</span>
                  <p className="text-green-800">{createdPatientProcedure.procedure.procedimento}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Hospital:</span>
                  <p className="text-green-800">{createdPatientProcedure.procedure.hospital}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Cirurgião:</span>
                  <p className="text-green-800">{createdPatientProcedure.procedure.mainSurgeon}</p>
                </div>
              </div>
            </div>

            {/* Formulário de cirurgia */}
            <div>
              <div className="flex items-center mb-6">
                <Stethoscope className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Dados da Cirurgia</h3>
              </div>

              <SurgeryForm
                surgeryData={surgeryData}
                onChange={setSurgeryData}
                onSubmit={handleSurgerySubmit}
                isLoading={isLoading}
                submitButtonText={isLoading ? "Criando Cirurgia..." : "Criar Cirurgia"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de pacientes similares */}
      <SimilarPatientsModal
        isOpen={showSimilarModal}
        onClose={handleCloseModal}
        similarPatients={similarPatients}
        newPatientData={pendingFormData?.patientData || {}}
        onSelectExisting={handleSelectExisting}
        onUpdateExisting={handleUpdateExisting}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
};

export default NewPatientProcedureSurgery;