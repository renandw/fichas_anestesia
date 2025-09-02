import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  getPatient,
  updatePatient
} from '../services/firestore';
import PatientFormFields from '../components/surgery/PatientFormFields';
import { ArrowLeft, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EditPatient = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [existingPatient, setExistingPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Carregar dados do paciente
  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setError('ID do paciente não fornecido');
        return;
      }

      try {
        setLoading(true);
        const patient = await getPatient(patientId);
        
        if (!patient) {
          setError('Paciente não encontrado');
          return;
        }

        setExistingPatient(patient);
        
      } catch (err) {
        console.error('Erro ao carregar paciente:', err);
        setError('Erro ao carregar dados do paciente');
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [patientId]);

  // Verificar permissões de edição
  const canEdit = existingPatient && (
    existingPatient.createdBy === userProfile?.uid || 
    existingPatient.sharedWith?.includes(userProfile?.uid) ||
    !existingPatient.createdBy // Compatibilidade com dados antigos
  );

  const handleFormSubmit = async (formData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log("DEBUG - formData recebido no submit:", formData);
      
      // Atualizar dados do paciente
      await updatePatient(patientId, {
        ...formData.patientData,
        lastUpdatedBy: formData.metadata.lastUpdatedBy,
        lastUpdated: new Date()
      });
      
      toast.success('Dados do paciente atualizados com sucesso!');
      navigate(`/patients/${patientId}`);
      
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast.error('Erro ao atualizar dados do paciente. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate(`/patients/${patientId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados do paciente...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Erro</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => navigate('/patients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Lista de Pacientes
          </button>
        </div>
      </div>
    );
  }

  // No permission state
  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-800">Sem Permissão</h3>
          </div>
          <p className="text-yellow-700 mt-2">
            Você não tem permissão para editar os dados deste paciente.
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={goBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar aos Detalhes
            </button>
            <button
              onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Lista de Pacientes
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <span className="ml-2 text-lg font-semibold text-gray-900">Editar Paciente</span>
        </div>
        <div className="w-6"></div>
      </div>
      <div className="lg:hidden px-5 m-5">
        <p className="text-sm text-gray-600">
          Atualize os dados de {existingPatient.name}.
        </p>
      </div>

      {/* Header */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
            <p className="text-sm text-gray-600">
              Atualize os dados de <span className="font-medium">{existingPatient.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Card com dados atuais do paciente */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Dados Atuais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Nome:</span>
            <p className="text-blue-800">{existingPatient.name}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Data de Nascimento:</span>
            <p className="text-blue-800">
              {new Date(existingPatient.birthDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Sexo:</span>
            <p className="text-blue-800 capitalize">{existingPatient.sex}</p>
          </div>
          {existingPatient.cns && (
            <div>
              <span className="text-blue-700 font-medium">CNS:</span>
              <p className="text-blue-800">{existingPatient.cns}</p>
            </div>
          )}
        </div>
      </div>

      {/* Informativo sobre a edição */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Edição de Dados do Paciente</h4>
            <p className="text-sm text-amber-700">
              Altere apenas os campos necessários. As informações atuais estão pré-preenchidas nos campos abaixo.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <PatientFormFields
          mode="edit_patient"
          existingPatient={existingPatient}
          currentUser={userProfile}
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
          submitButtonText={isSubmitting ? "Salvando alterações..." : "Salvar Alterações"}
          showTitle={false} // Título já está no header
        />
      </div>
    </div>
  );
};

export default EditPatient;