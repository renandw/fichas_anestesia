import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  getPatient,
  saveProcedure,
  saveSurgery
} from '../services/firestore';
import PatientFormFields from '../components/surgery/PatientFormFields';
import { ArrowLeft, Stethoscope, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ExistingPatientNewProcedureSurgery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [existingPatient, setExistingPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { userProfile } = useAuth();

  // Carregar dados do paciente existente
  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        toast.error('ID do paciente não fornecido');
        navigate('/patients');
        return;
      }

      try {
        setLoadingPatient(true);
        const patient = await getPatient(patientId);
        
        if (!patient) {
          toast.error('Paciente não encontrado');
          navigate('/patients');
          return;
        }

        setExistingPatient(patient);
      } catch (error) {
        console.error('Erro ao carregar paciente:', error);
        toast.error('Erro ao carregar dados do paciente');
        navigate('/patients');
      } finally {
        setLoadingPatient(false);
      }
    };

    loadPatient();
  }, [patientId, navigate]);

  const handleFormSubmit = async (formData) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      console.log("DEBUG - formData recebido no submit:", formData);
      
      // 1. Criar procedimento para o paciente existente
      const savedProcedure = await saveProcedure(patientId, {
        ...formData.procedureData,
        status: 'planned',
        createdAt: new Date(),
        createdBy: formData.metadata.createdBy,
        sharedWith: [],
        lastUpdated: new Date()
      });
      
      console.log('✅ Procedimento criado:', savedProcedure.id);
      
      // 2. Criar cirurgia para o procedimento
      const savedSurgery = await saveSurgery(
        patientId, 
        savedProcedure.id, 
        {
          ...formData.surgeryData,
          status: 'planned',
          createdAt: new Date(),
          createdBy: formData.metadata.createdBy
        }
      );
      
      console.log('✅ Cirurgia criada:', savedSurgery.id);
      
      toast.success('Procedimento e cirurgia criados com sucesso!');
      navigate(`/patients/${patientId}/procedures/${savedProcedure.id}`);
      
    } catch (error) {
      console.error('Erro ao criar procedimento/cirurgia:', error);
      
      // Se já criou procedimento mas falhou na surgery, navegar para procedure
      if (error.message && error.message.includes('procedimento criado')) {
        const procedureId = error.procedureId;
        toast.error('Procedimento criado, mas erro ao criar cirurgia.');
        navigate(`/patients/${patientId}/procedures/${procedureId}`);
      } else {
        toast.error('Erro ao criar procedimento e cirurgia. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigate(`/patients/${patientId}` || '/patients');
  };

  // Loading do paciente
  if (loadingPatient) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados do paciente...</span>
        </div>
      </div>
    );
  }

  // Se não encontrou paciente (já trata o redirect no useEffect)
  if (!existingPatient) {
    return null;
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
          <Stethoscope className="h-5 w-5 text-blue-600" />
          <span className="ml-2 text-lg font-semibold text-gray-900">Nova Ficha Anestésica</span>
        </div>
        <div className="w-6"></div>
      </div>
      <div className="lg:hidden px-5 m-5">
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
            <h1 className="text-2xl font-bold text-gray-900">Criar Ficha Anestésica para Nova Cirurgia</h1>
          </div>
        </div>
      </div>

      {/* Card com resumo do paciente */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Paciente Selecionado</h3>
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

      <div className="card">
        <PatientFormFields
          mode="existing_patient_new_procedure_surgery"
          existingPatient={existingPatient}
          currentUser={userProfile}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          submitButtonText={isLoading ? "Criando procedimento e cirurgia..." : "Iniciar Ficha Anestésica"}
          showTitle={false} // Título já está no header
        />
      </div>
    </div>
  );
};

export default ExistingPatientNewProcedureSurgery;