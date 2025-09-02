import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, Clock, User, Stethoscope } from 'lucide-react';

const AnesthesiaValidator = ({ patient, surgery, onAnesthesiaSelected, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anesthesia, setAnesthesia] = useState(null);

  // Simulação de busca de anestesia no Firebase
  const fetchAnesthesia = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simula delay de busca
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simula diferentes cenários
      const mockAnesthesias = [
        {
          id: 'anest_1',
          patientId: patient.id,
          surgeryId: surgery.id,
          surgeryDate: '2025-08-01',
          surgeryTimeStart: '08:00',
          surgeryTimeEnd: '10:30',
          anesthesiaTimeStart: '07:45',
          anesthesiaTimeEnd: '10:45',
          patientPosition: 'Supina',
          medications: ['Propofol', 'Fentanil', 'Rocurônio'],
          vitalSigns: {
            bloodPressure: '120/80',
            heartRate: '75',
            temperature: '36.5'
          },
          description: 'Anestesia geral balanceada',
          status: 'Concluída',
          metadata: {
            createdAt: '2025-08-01T07:30:00Z',
            createdBy: 'Dr. Anestesista',
            updatedAt: '2025-08-01T11:00:00Z'
          }
        }
      ];

      // Simula verificação baseada na cirurgia
      const foundAnesthesia = surgery.status === 'Concluída' || surgery.id === 'surgery_1' 
        ? mockAnesthesias[0] 
        : null;

      if (!foundAnesthesia) {
        setError({
          type: 'no_anesthesia',
          message: 'Esta cirurgia não possui anestesia concluída.',
          details: `Status da cirurgia: ${surgery.status}. SRPA só pode ser criado após anestesia concluída.`
        });
        if (onError) onError('no_anesthesia');
        return;
      }

      if (foundAnesthesia.status !== 'Concluída') {
        setError({
          type: 'anesthesia_not_completed',
          message: 'A anestesia desta cirurgia não foi concluída.',
          details: `Status da anestesia: ${foundAnesthesia.status}. SRPA só pode ser criado após anestesia concluída.`
        });
        if (onError) onError('anesthesia_not_completed');
        return;
      }

      // Anestesia válida encontrada
      setAnesthesia(foundAnesthesia);
      
      // Auto-seleção após pequeno delay para mostrar sucesso
      setTimeout(() => {
        onAnesthesiaSelected(foundAnesthesia);
      }, 800);

    } catch (err) {
      setError({
        type: 'fetch_error',
        message: 'Erro ao verificar anestesia.',
        details: 'Ocorreu um erro ao buscar dados da anestesia. Tente novamente.'
      });
      if (onError) onError('fetch_error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patient && surgery) {
      fetchAnesthesia();
    }
  }, [patient, surgery]);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Verificando Anestesia</h3>
            <p className="text-sm text-gray-600">Validando dados para SRPA</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
          </div>
          <p className="mt-4 text-gray-600">Verificando anestesia concluída...</p>
          <div className="mt-2 bg-gray-100 rounded-lg p-3 max-w-md">
            <p className="text-sm text-gray-700">
              <strong>Paciente:</strong> {patient.patientName}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Cirurgia:</strong> {surgery.procedimento || 'Não especificado'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Erro na Validação</h3>
            <p className="text-sm text-gray-600">Não é possível criar SRPA</p>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">{error.message}</h4>
              <p className="text-sm text-red-700 mt-1">{error.details}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">Informações da Cirurgia</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Paciente:</span>
              <span className="text-gray-900">{patient.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Procedimento:</span>
              <span className="text-gray-900">{surgery.procedimento || 'Não especificado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status da Cirurgia:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                surgery.status === 'Concluída' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {surgery.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={fetchAnesthesia}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (anesthesia) {
    return (
      <div className="bg-white rounded-lg border border-green-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Anestesia Validada</h3>
            <p className="text-sm text-gray-600">Pronto para criar SRPA</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Anestesia concluída encontrada</h4>
              <p className="text-sm text-green-700 mt-1">
                SRPA pode ser criado com base nesta anestesia.
              </p>
            </div>
          </div>
        </div>

        {/* Resumo da anestesia */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Resumo da Anestesia
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Data da Cirurgia:</span>
              <p className="text-gray-900 font-medium">{formatDate(anesthesia.surgeryDate)}</p>
            </div>
            
            <div>
              <span className="text-gray-600">Anestesista:</span>
              <p className="text-gray-900">{anesthesia.metadata?.createdBy || 'N/A'}</p>
            </div>
            
            <div>
              <span className="text-gray-600">Horário da Anestesia:</span>
              <p className="text-gray-900">
                {formatTime(anesthesia.anesthesiaTimeStart)} - {formatTime(anesthesia.anesthesiaTimeEnd)}
              </p>
            </div>
            
            <div>
              <span className="text-gray-600">Posição do Paciente:</span>
              <p className="text-gray-900">{anesthesia.patientPosition}</p>
            </div>
            
            <div className="md:col-span-2">
              <span className="text-gray-600">Descrição:</span>
              <p className="text-gray-900">{anesthesia.description}</p>
            </div>
          </div>

          {/* Medicações */}
          {anesthesia.medications && anesthesia.medications.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-600 text-sm block mb-2">Medicações utilizadas:</span>
              <div className="flex flex-wrap gap-1">
                {anesthesia.medications.map((medication, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {medication}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sinais vitais */}
          {anesthesia.vitalSigns && (
            <div className="mt-4">
              <span className="text-gray-600 text-sm block mb-2">Sinais vitais finais:</span>
              <div className="flex gap-4 text-xs">
                <span>PA: {anesthesia.vitalSigns.bloodPressure}</span>
                <span>FC: {anesthesia.vitalSigns.heartRate} bpm</span>
                <span>T°: {anesthesia.vitalSigns.temperature}°C</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Redirecionando para criação do SRPA...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AnesthesiaValidator;