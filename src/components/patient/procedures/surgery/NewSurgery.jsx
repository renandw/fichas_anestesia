import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { useProcedureDetails } from '../../../../hooks/useProcedureDetails';
import { saveSurgery } from '../../../../services/firestore';
import PatientFormFields from '../../../../components/surgery/PatientFormFields';
import { 
  ArrowLeft,
  Stethoscope,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const NewSurgery = () => {
  const { patientId, procedureId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const { 
    patient, 
    procedure, 
    loading, 
    error 
  } = useProcedureDetails(patientId, procedureId);

  const [isLoading, setIsLoading] = useState(false);

  // Verificar permissões
  const canCreate = procedure && (
    procedure.createdBy === userProfile?.uid || 
    procedure.sharedWith?.includes(userProfile?.uid)
  );

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    try {
      console.log("DEBUG - formData recebido no submit:", formData);
      
      // Preparar dados da cirurgia
      const { surgeryDate, surgeryTime, patientPosition, surgeryObservations } = formData.surgeryData;
      const startTime = new Date(`${surgeryDate}T${surgeryTime}:00`);
      const createdAt = new Date();

      const newSurgeryData = {
        startTime,
        surgeryDate,
        surgeryTime,
        patientPosition,
        observations: surgeryObservations || '',
        createdAt,
        createdBy: userProfile.uid,
        createdByName: userProfile.name,
        status: 'in_progress',
        // Anestesista inicial é quem criou
        anesthetists: [{
          doctorId: userProfile.uid,
          doctorName: userProfile.name,
          startTime: startTime.toISOString(),
          endTime: null,
          isActive: true
        }],
        // Dados herdados do procedimento
        procedureType: procedure.procedureType,
        mainSurgeon: procedure.mainSurgeon,
        auxiliarySurgeons: procedure.auxiliarySurgeons || [],
        hospital: procedure.hospital
      };

      const savedSurgery = await saveSurgery(patientId, procedureId, newSurgeryData);
      
      toast.success('Cirurgia iniciada com sucesso!');
      navigate(`/patients/${patientId}/procedures/${procedureId}/surgery`);
      
    } catch (error) {
      console.error('Erro ao criar cirurgia:', error);
      toast.error('Erro ao iniciar cirurgia. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigate(`/patients/${patientId}/procedures/${procedureId}`);
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
        <p>Carregando procedimento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Erro ao carregar procedimento</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-800">Sem permissão</h3>
          </div>
          <p className="text-yellow-700 mt-2">
            Você não tem permissão para criar uma cirurgia para este procedimento.
          </p>
          <button
            onClick={goBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Procedimento
          </button>
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
          <Stethoscope className="h-5 w-5 text-blue-600" />
          <span className="ml-2 text-lg font-semibold text-gray-900">Iniciar Cirurgia</span>
        </div>
        <div className="w-6"></div>
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
            <nav className="text-sm text-gray-600 mb-1">
              Dashboard → Paciente → Procedimento → Nova Cirurgia
            </nav>
            <h1 className="text-2xl font-bold text-gray-900">Iniciar Cirurgia</h1>
            <p className="text-sm text-gray-600">
              Defina a data, hora e posicionamento para início da cirurgia
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <div className="card">
            <PatientFormFields
              mode="create_surgery"
              existingPatient={patient}
              initialProcedureData={procedure}
              currentUser={userProfile}
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              submitButtonText={isLoading ? "Iniciando cirurgia..." : "Iniciar Cirurgia"}
              showTitle={false}
            />
          </div>
        </div>

        {/* Sidebar: Resumo do Procedimento */}
        <div className="space-y-6">
          {/* Card: Informações do Paciente */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Paciente</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Nome:</span>
                <p className="font-medium">{patient.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Sexo:</span>
                <p className="font-medium capitalize">{patient.sex}</p>
              </div>
              <div>
                <span className="text-gray-600">Nascimento:</span>
                <p className="font-medium">
                  {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Peso:</span>
                <p className="font-medium">{procedure.patientWeight} kg</p>
              </div>
            </div>
          </div>

          {/* Card: Informações do Procedimento */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Procedimento</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <p className="font-medium capitalize">
                  {procedure.procedureType === 'sus' ? 'SUS' : 'Convênio'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Hospital:</span>
                <p className="font-medium">{procedure.hospital}</p>
              </div>
              <div>
                <span className="text-gray-600">Cirurgião Principal:</span>
                <p className="font-medium">{procedure.mainSurgeon}</p>
              </div>
              <div>
                <span className="text-gray-600">Procedimento:</span>
                <p className="font-medium">{procedure.procedimento}</p>
              </div>
            </div>
          </div>

          {/* Card: Anestesista */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Anestesista Responsável</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{userProfile.name}</p>
                <p className="text-sm text-gray-600">Anestesista principal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSurgery;