import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  createPatientAndProcedureIntelligent, 
  updatePatientAndCreateProcedure,
  forceCreateNewPatientAndProcedure,
  savePatient,
  saveProcedure
} from '../services/firestore';
import { 
  useExistingPatientAndCreateProcedure as createProcedureForExistingPatient 
} from '../services/firestore';
import PatientFormFields from '../components/surgery/PatientFormFields';
import SimilarPatientsModal from '../components/patient/SimilarPatientsModal';
import { ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const NewPatientProcedure = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarPatients, setSimilarPatients] = useState([]);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const handleFormSubmit = async (formData) => {
    if (isLoading) return; // Prevent duplicate submissions
    setIsLoading(true);
    try {
      console.log("DEBUG - formData recebido no submit:", formData);
      // Usar a nova função inteligente
      const result = await createPatientAndProcedureIntelligent(formData);
      
      switch (result.action) {
        case 'patient_and_procedure_created':
          toast.success(result.message);
          navigate(`/patients/${result.patient.id}/procedures/${result.procedure.id}`);
          break;
          
        case 'procedure_created':
          toast.success(result.message);
          navigate(`/patients/${result.patient.id}/procedures/${result.procedure.id}`);
          break;
          
        case 'exact_patient_with_differences':
          // NOVO: Paciente encontrado com diferenças contextuais
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
          
          // Toast contextual baseado no tipo de relação
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

  // Quando usuário escolhe usar paciente existente (sem atualizar)
  const handleSelectExisting = async (selectedPatient) => {
    setIsLoading(true);
    try {
      // Verificar se é caso contextual (exact_with_differences) ou similar
      if (selectedPatient.contextualMessage) {
        // Caso contextual - usar função específica
        const result = await createProcedureForExistingPatient(selectedPatient.id, pendingFormData);
        
        toast.success(result.message);
        navigate(`/patients/${result.patient.id}/procedures/${result.procedure.id}`);
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
        
        toast.success('Procedimento criado para o paciente existente!');
        navigate(`/patients/${selectedPatient.id}/procedures/${savedProcedure.id}`);
      }
      
    } catch (error) {
      console.error('Erro ao criar procedimento:', error);
      toast.error('Erro ao criar procedimento. Tente novamente.');
    } finally {
      setIsLoading(false);
      setShowSimilarModal(false);
      resetModalState();
    }
  };

  // Quando usuário escolhe atualizar paciente existente
  const handleUpdateExisting = async (selectedPatient) => {
    setIsLoading(true);
    try {
      const result = await updatePatientAndCreateProcedure(
        selectedPatient.id, 
        pendingFormData
      );
      
      toast.success(result.message);
      navigate(`/patients/${result.patient.id}/procedures/${result.procedure.id}`);
      
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast.error('Erro ao atualizar paciente. Tente novamente.');
    } finally {
      setIsLoading(false);
      setShowSimilarModal(false);
      resetModalState();
    }
  };

  // Quando usuário escolhe criar novo paciente
  const handleCreateNew = async () => {
    setIsLoading(true);
    try {
      console.log("DEBUG - pendingFormData antes de salvar:", pendingFormData);
      // Verificar se é caso contextual ou similar
      const firstPatient = similarPatients[0];
      
      if (firstPatient?.contextualMessage) {
        // Caso contextual - usar função específica para forçar criação
        const result = await forceCreateNewPatientAndProcedure(pendingFormData);
        
        toast.success(result.message);
        navigate(`/patients/${result.patient.id}/procedures/${result.procedure.id}`);
      } else {
        // Caso similar - usar função original
        // Criar novo paciente
        const savedPatient = await savePatient({
          ...pendingFormData.patientData,
          createdAt: new Date(),
          createdBy: pendingFormData.metadata.createdBy,
          lastUpdated: new Date()
        });
        
        // Criar procedimento
        const savedProcedure = await saveProcedure(savedPatient.id, {
          ...pendingFormData.procedureData,
          status: 'planned',
          createdAt: new Date(),
          createdBy: pendingFormData.metadata.createdBy,
          sharedWith: [],
          lastUpdated: new Date()
        });
        
        toast.success('Novo paciente e procedimento criados com sucesso!');
        navigate(`/patients/${savedPatient.id}/procedures/${savedProcedure.id}`);
      }
      
    } catch (error) {
      console.error('Erro ao criar novo paciente:', error);
      toast.error('Erro ao criar novo paciente. Tente novamente.');
    } finally {
      setIsLoading(false);
      setShowSimilarModal(false);
      resetModalState();
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
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile-only header */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
        <button
          onClick={goBack}
          className="text-gray-400 hover:text-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          
          <span className="ml-2 text-lg font-semibold text-gray-900">Novo Procedimento</span>
        </div>
        <div className="w-6"></div>
      </div>
      <div className="lg:hidden px-5 m-5">
        <p className="text-sm text-gray-600">
          Preencha os dados de identificação do paciente e do procedimento.
        </p>
      </div>
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            disabled={isLoading}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Paciente e Procedimento</h1>
            <p className="text-sm text-gray-600">
              Preencha os dados de identificação do paciente e do procedimento.
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <PatientFormFields
          mode="new_patient_procedure"
          currentUser={userProfile}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          submitButtonText={isLoading ? "Verificando paciente..." : "Criar Paciente e Procedimento"}
          showTitle={false} // Título já está no header
        />
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

export default NewPatientProcedure;