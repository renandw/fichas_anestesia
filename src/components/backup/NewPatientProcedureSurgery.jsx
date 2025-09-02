import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  createPatientAndProcedureIntelligent, 
  updatePatientAndCreateProcedure,
  forceCreateNewPatientAndProcedure,
  savePatient,
  saveProcedure,
  saveSurgery
} from '../services/firestore';
import { 
  useExistingPatientAndCreateProcedure as createProcedureForExistingPatient 
} from '../services/firestore';
import PatientFormFields from '../components/surgery/PatientFormFields';
import SimilarPatientsModal from '../components/patient/SimilarPatientsModal';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const NewPatientProcedureSurgery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarPatients, setSimilarPatients] = useState([]);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const handleFormSubmit = async (formData) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      console.log("DEBUG - formData recebido no submit:", formData);
      
      // Adaptação: usar a função existente mas depois criar surgery
      const result = await createPatientAndProcedureIntelligent({
        patientData: formData.patientData,
        procedureData: formData.procedureData,
        metadata: formData.metadata
      });
      
      switch (result.action) {
        case 'patient_and_procedure_created':
          // Criar surgery para novo paciente/procedimento
          await createSurgeryForResult(result, formData.surgeryData);
          break;
          
        case 'procedure_created':
          // Criar surgery para paciente existente
          await createSurgeryForResult(result, formData.surgeryData);
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
          setPendingFormData({
            ...result.formData,
            surgeryData: formData.surgeryData // Adicionar dados da surgery
          });
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
          // Pacientes similares
          setSimilarPatients(result.similarPatients);
          setPendingFormData({
            ...result.formData,
            surgeryData: formData.surgeryData // Adicionar dados da surgery
          });
          setShowSimilarModal(true);
          toast.info(`Encontramos ${result.similarPatients.length} paciente(s) similar(es). Verifique se é o mesmo paciente.`);
          break;
          
        default:
          throw new Error('Ação não reconhecida');
      }
    } catch (error) {
      console.error('Erro ao processar paciente/procedimento/cirurgia:', error);
      toast.error('Erro ao processar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para criar surgery após procedure
  const createSurgeryForResult = async (result, surgeryData) => {
    try {
      const savedSurgery = await saveSurgery(
        result.patient.id, 
        result.procedure.id, 
        {
          ...surgeryData,
          status: 'planned',
          createdAt: new Date(),
          createdBy: userProfile?.uid
        }
      );
      
      toast.success('Paciente, procedimento e cirurgia criados com sucesso!');
      navigate(`/patients/${result.patient.id}/procedures/${result.procedure.id}/surgeries/${savedSurgery.id}`);
      
    } catch (error) {
      console.error('Erro ao criar cirurgia:', error);
      toast.error('Procedimento criado, mas erro ao criar cirurgia.');
      // Navegar para procedimento mesmo com erro na surgery
      navigate(`/patients/${result.patient.id}/procedures/${result.procedure.id}`);
    }
  };

  // Quando usuário escolhe usar paciente existente (sem atualizar)
  const handleSelectExisting = async (selectedPatient) => {
    setIsLoading(true);
    try {
      if (selectedPatient.contextualMessage) {
        // Caso contextual - usar função específica
        const result = await createProcedureForExistingPatient(selectedPatient.id, {
          patientData: pendingFormData.patientData,
          procedureData: pendingFormData.procedureData,
          metadata: pendingFormData.metadata
        });
        
        // Criar surgery
        await createSurgeryForResult(result, pendingFormData.surgeryData);
        
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
        
        // Criar surgery
        const savedSurgery = await saveSurgery(
          selectedPatient.id, 
          savedProcedure.id, 
          {
            ...pendingFormData.surgeryData,
            status: 'planned',
            createdAt: new Date(),
            createdBy: pendingFormData.metadata.createdBy
          }
        );
        
        toast.success('Procedimento e cirurgia criados para paciente existente!');
        navigate(`/patients/${selectedPatient.id}/procedures/${savedProcedure.id}/surgeries/${savedSurgery.id}`);
      }
      
    } catch (error) {
      console.error('Erro ao criar procedimento/cirurgia:', error);
      toast.error('Erro ao criar procedimento/cirurgia. Tente novamente.');
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
        {
          patientData: pendingFormData.patientData,
          procedureData: pendingFormData.procedureData,
          metadata: pendingFormData.metadata
        }
      );
      
      // Criar surgery
      await createSurgeryForResult(result, pendingFormData.surgeryData);
      
    } catch (error) {
      console.error('Erro ao atualizar paciente/criar procedimento/cirurgia:', error);
      toast.error('Erro ao processar dados. Tente novamente.');
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
      
      const firstPatient = similarPatients[0];
      
      if (firstPatient?.contextualMessage) {
        // Caso contextual - usar função específica
        const result = await forceCreateNewPatientAndProcedure({
          patientData: pendingFormData.patientData,
          procedureData: pendingFormData.procedureData,
          metadata: pendingFormData.metadata
        });
        
        // Criar surgery
        await createSurgeryForResult(result, pendingFormData.surgeryData);
        
      } else {
        // Caso similar - criar manualmente
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
        
        const savedSurgery = await saveSurgery(
          savedPatient.id, 
          savedProcedure.id, 
          {
            ...pendingFormData.surgeryData,
            status: 'planned',
            createdAt: new Date(),
            createdBy: pendingFormData.metadata.createdBy
          }
        );
        
        toast.success('Novo paciente, procedimento e cirurgia criados com sucesso!');
        navigate(`/patients/${savedPatient.id}/procedures/${savedProcedure.id}/surgeries/${savedSurgery.id}`);
      }
      
    } catch (error) {
      console.error('Erro ao criar novo paciente/procedimento/cirurgia:', error);
      toast.error('Erro ao criar dados. Tente novamente.');
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
          <Stethoscope className="h-5 w-5 text-blue-600" />
          <span className="ml-2 text-lg font-semibold text-gray-900">Nova Cirurgia Completa</span>
        </div>
        <div className="w-6"></div>
      </div>
      <div className="lg:hidden px-5 m-5">
        <p className="text-sm text-gray-600">
          Preencha os dados do paciente, procedimento e cirurgia.
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
            <h1 className="text-2xl font-bold text-gray-900">Novo Paciente, Procedimento e Cirurgia</h1>
            <p className="text-sm text-gray-600">
              Preencha todos os dados necessários para criar o registro completo da cirurgia.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <PatientFormFields
          mode="new_patient_procedure_surgery"
          currentUser={userProfile}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          submitButtonText={isLoading ? "Verificando e criando..." : "Criar Paciente, Procedimento e Cirurgia"}
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

export default NewPatientProcedureSurgery;