import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { saveSurgery, updateSurgery } from '../services/firestore';
import PatientFormFields from '../components/surgery/PatientFormFields';
import { 
  ArrowLeft,
  Stethoscope,
  Building2,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const NewSurgery = () => {
  const [surgeryType, setSurgeryType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Determinar tipo baseado nas empresas do usuário
  useEffect(() => {
    if (userProfile?.companies) {
      const hasClian = userProfile.companies.includes('CLIAN');
      const hasCma = userProfile.companies.includes('CMA');
      
      if (hasClian && hasCma) {
        // Usuário pode escolher - mostrar seleção de tipo
        setSurgeryType('choose');
      } else if (hasClian) {
        // Só convênio - vai direto para formulário
        setSurgeryType('convenio');
      } else if (hasCma) {
        // Só SUS - vai direto para formulário  
        setSurgeryType('sus');
      } else {
        toast.error('Usuário sem empresas configuradas');
        navigate('/dashboard');
      }
    }
  }, [userProfile, navigate]);

  const handleTypeSelection = (type) => {
    setSurgeryType(type);
  };

  const handleFormSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Preparar dados da cirurgia
      const { surgeryDate, surgeryTime } = data;
      const startTime = new Date(`${surgeryDate}T${surgeryTime}:00`);
      const createdAt = new Date();

      const surgeryData = {
        ...data,
        createdAt, // registro técnico (quando o documento foi criado)
        startTime, // início clínico da cirurgia
        type: surgeryType,
        createdBy: userProfile.uid,
        createdByName: userProfile.name,
        status: 'em_andamento',
        anesthetists: [{
          doctorId: userProfile.uid,
          doctorName: userProfile.name,
          startTime: startTime.toISOString(),
          endTime: null,
          isActive: true
        }]
      };

      const savedSurgery = await saveSurgery(surgeryData);
      toast.success(`Cirurgia ${savedSurgery.id} criada com sucesso!`);
      navigate(`/surgery/${savedSurgery.id}`);
    } catch (error) {
      console.error('Erro ao criar cirurgia:', error);
      toast.error('Erro ao criar cirurgia. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (surgeryType === 'choose') {
      navigate('/dashboard');
    } else {
      setSurgeryType('choose');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Cirurgia</h1>
            <p className="text-sm text-gray-600">
              {surgeryType === 'choose' ? 'Selecione o tipo de cirurgia' : 
               surgeryType === 'sus' ? 'Cirurgia SUS' : 
               surgeryType === 'convenio' ? 'Cirurgia Convênio' : 'Configurando...'}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Seleção de tipo (apenas se usuário tem ambas empresas) */}
        {surgeryType === 'choose' && (
          <div className="text-center py-8">
            <Stethoscope className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Selecione o tipo de cirurgia
            </h2>
            <p className="text-gray-600 mb-8">
              Escolha baseado no tipo de paciente e forma de pagamento
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={() => handleTypeSelection('sus')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Cirurgia SUS</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Pacientes do Sistema Único de Saúde
                  </p>
                </div>
              </button>
              
              <button
                onClick={() => handleTypeSelection('convenio')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Cirurgia Convênio</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Pacientes de convênio ou particular
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Formulário principal */}
        {surgeryType !== 'choose' && surgeryType !== null && (
          <PatientFormFields
            surgeryType={surgeryType}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            submitButtonText="Criar Cirurgia"
            showTitle={true}
            mode="create"
          />
        )}
      </div>
    </div>
  );
};

export default NewSurgery;