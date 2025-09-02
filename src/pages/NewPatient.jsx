import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  findExistingPatient,
  updatePatient,
  savePatient
} from '../services/firestore';
import PatientFormFields from '../components/surgery/PatientFormFields';
import SimilarPatientsModal from '../components/patient/SimilarPatientsModal';
import { ArrowLeft, User } from 'lucide-react';
import toast from 'react-hot-toast';

const NewPatient = () => {
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
      
      // Usar findExistingPatient (função já existente)
      const searchResult = await findExistingPatient(formData.patientData);
      
      if (!searchResult) {
        // Nenhum paciente encontrado - criar novo diretamente
        const savedPatient = await savePatient({
          ...formData.patientData,
          createdBy: formData.metadata.createdBy
        });
        
        toast.success('Paciente criado com sucesso!');
        navigate('/patients');
        return;
      }

      // Paciente idêntico encontrado
      if (searchResult.type === 'exact') {
        toast.info('Paciente já existe no sistema!');
        navigate(`/patients/${searchResult.patient.id}`);
        return;
      }

      // Paciente com diferenças ou similares - mostrar modal
      if (searchResult.type === 'exact_with_differences') {
        setSimilarPatients([{
          ...searchResult.patient,
          confidence: searchResult.confidence,
          relationship: searchResult.relationship,
          differences: searchResult.differences,
          contextualMessage: searchResult.message,
          searchMethod: searchResult.searchMethod
        }]);
        setPendingFormData(formData);
        setShowSimilarModal(true);
        
        const toastMessages = {
          name_expanded: 'Paciente encontrado com nome expandido. Verifique se é o mesmo.',
          accent_difference: 'Paciente encontrado com diferenças de acentuação.',
          possible_sibling: 'Paciente similar encontrado. Pode ser da mesma família.',
          identical: 'Paciente encontrado com dados ligeiramente diferentes.'
        };
        toast.info(toastMessages[searchResult.relationship] || 'Paciente encontrado com diferenças.');
        
      } else if (searchResult.type === 'similar') {
        setSimilarPatients(searchResult.patients);
        setPendingFormData(formData);
        setShowSimilarModal(true);
        toast.info(`Encontramos ${searchResult.patients.length} paciente(s) similar(es). Verifique se é o mesmo paciente.`);
      }
      
    } catch (error) {
      console.error('Erro ao processar paciente:', error);
      toast.error('Erro ao processar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quando usuário escolhe usar paciente existente (sem atualizar)
  const handleSelectExisting = async (selectedPatient) => {
    setIsLoading(true);
    try {
      toast.success('Paciente existente selecionado!');
      navigate(`/patients/${selectedPatient.id}`);
      
    } catch (error) {
      console.error('Erro ao selecionar paciente:', error);
      toast.error('Erro ao selecionar paciente. Tente novamente.');
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
      await updatePatient(selectedPatient.id, pendingFormData.patientData);
      
      toast.success('Paciente atualizado com sucesso!');
      navigate(`/patients/${selectedPatient.id}`);
      
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
      
      const savedPatient = await savePatient({
        ...pendingFormData.patientData,
        createdBy: pendingFormData.metadata.createdBy
      });
      
      toast.success('Novo paciente criado com sucesso!');
      navigate(`/patients/${savedPatient.id}`);
      
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
    navigate('/patients');
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
          <User className="h-5 w-5 text-blue-600" />
          <span className="ml-2 text-lg font-semibold text-gray-900">Novo Paciente</span>
        </div>
        <div className="w-6"></div>
      </div>
      <div className="lg:hidden px-5 m-5">
        <p className="text-sm text-gray-600">
          Preencha os dados de identificação do paciente.
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
            <h1 className="text-2xl font-bold text-gray-900">Novo Paciente</h1>
            <p className="text-sm text-gray-600">
              Preencha os dados de identificação do paciente.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <PatientFormFields
          mode="new_patient"
          currentUser={userProfile}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          submitButtonText={isLoading ? "Verificando paciente..." : "Criar Paciente"}
          showTitle={false} // Título já está no header
        />
      </div>

      {/* Modal de pacientes similares - usando o modal existente */}
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

export default NewPatient;