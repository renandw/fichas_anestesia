import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useProcedureDetails } from '../../../hooks/useProcedureDetails';
import { updateProcedure, updateSurgery, getSurgery} from '../../../services/firestore';
import PatientFormFields from '../../../components/surgery/PatientFormFields';
import NewSurgery from './surgery/NewSurgery';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EditProcedure = () => {
  const { patientId, procedureId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    patient, 
    procedure, 
    loading: dataLoading, 
    error: dataError 
  } = useProcedureDetails(patientId, procedureId);

  const [surgeryData, setSurgeryData] = useState(null);
  const [surgeryLoading, setSurgeryLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchSurgery() {
      setSurgeryLoading(true);
      const result = await getSurgery(patientId, procedureId);
      if (!ignore) setSurgeryData(result || {});
      setSurgeryLoading(false);
    }
    fetchSurgery();
    return () => { ignore = true };
  }, [patientId, procedureId]);

  // Verificar permissões
  const canEdit = procedure && (
    procedure.createdBy === userProfile?.uid || 
    procedure.sharedWith?.includes(userProfile?.uid)
  );

  // Auto-save function para campos CBHPM
  const handleAutoSave = async (formData) => {
    if (!canEdit) return;
    
    try {
      // Preparar dados para atualização (apenas procedimentos CBHPM)
      const updateData = {
        cbhpmProcedures: formData.cbhpmProcedures,
        lastUpdated: new Date(),
        lastUpdatedBy: userProfile?.uid
      };
      
      await updateProcedure(patientId, procedureId, updateData);
      // Não mostrar toast para auto-save para não poluir a interface
    } catch (error) {
      console.error('Erro no auto-save:', error);
      // Falha silenciosa no auto-save
    }
  };

  // Handler do submit principal
  const handleFormSubmit = async (formData) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar este procedimento');
      return;
    }

    setIsLoading(true);
    try {
      console.log('DEBUG - Atualizando procedimento:', formData);
      
      const result = await updateProcedure(patientId, procedureId, {
        ...formData.procedureData,
        lastUpdated: new Date(),
        lastUpdatedBy: userProfile?.uid
      });
      
      toast.success('Procedimento atualizado com sucesso!');
      navigate(`/patients/${patientId}/procedures/${procedureId}`);
      
    } catch (error) {
      console.error('Erro ao atualizar procedimento:', error);
      toast.error('Erro ao atualizar procedimento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(`/patients/${patientId}/procedures/${procedureId}`);
  };

  // Estados de loading e erro
  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner mr-2"></div>
        <p>Carregando dados do procedimento...</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Erro ao carregar dados</h3>
          </div>
          <p className="text-red-700 mt-2">{dataError}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 btn-primary"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!patient || !procedure) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-800">Procedimento não encontrado</h3>
          </div>
          <p className="text-yellow-700 mt-2">
            O procedimento solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 btn-primary"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Acesso negado</h3>
          </div>
          <p className="text-red-700 mt-2">
            Você não tem permissão para editar este procedimento.
          </p>
          <button
            onClick={handleGoBack}
            className="mt-4 btn-primary"
          >
            Voltar ao Procedimento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleGoBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            disabled={isLoading}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Dados da Cirurgia</h1>
          </div>
        </div>
      </div>

      {/* Informações do paciente (readonly) */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Nome:</span>
            <p className="text-lg font-medium">{patient.name}</p>
          </div>
          <div className='flex items-center gap-7'>
            <span className="text-gray-600">Sexo:</span>
            <p className="font-medium capitalize">{patient.sex}</p>
            <span className="text-gray-600">Nascimento:</span>
            <p className="font-medium">
              {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Aviso sobre auto-save para CBHPM */}
      {procedure.procedureType === 'convenio' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Auto-salvamento Ativo</h3>
              <p className="text-sm text-blue-700 mt-1">
                Os procedimentos CBHPM são salvos automaticamente quando selecionados. 
                Use o botão "Salvar Alterações" para confirmar outras modificações.
              </p>
            </div>
          </div>
        </div>
      )}

      {!surgeryLoading && (
        <div className="card">
          <PatientFormFields
            mode="edit_surgery"
            existingPatient={patient}
            initialProcedureData={procedure}
            initialSurgeryData={surgeryData}
            currentUser={userProfile}
            onSubmit={handleFormSubmit}
            onAutoSave={handleAutoSave}
            isLoading={isLoading}
            submitButtonText={isLoading ? "Salvando alterações..." : "Salvar Alterações"}
            showTitle={false}
          />
        </div>
      )}
      {surgeryLoading && (
        <div className="flex justify-center items-center min-h-[120px]">
          <div className="loading-spinner mr-2"></div>
          <p>Carregando dados da cirurgia...</p>
        </div>
      )}
    </div>
  );
};

export default EditProcedure;