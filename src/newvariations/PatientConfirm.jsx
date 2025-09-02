import React, { useState } from 'react';
import { User, Edit, Check } from 'lucide-react';

const PatientConfirm = ({ patient, onConfirm, allowChange = true }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Simula delay de confirmação
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onConfirm(patient);
    setIsConfirming(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCNS = (cns) => {
    // Formatar CNS: 123 4567 8901 2345
    return cns.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Paciente Selecionado</h3>
            <p className="text-sm text-gray-600">Confirme os dados do paciente</p>
          </div>
        </div>
        
        {allowChange && (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
            Trocar Paciente
          </button>
        )}
      </div>

      {/* Card com dados do paciente */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600">Nome Completo:</span>
            <p className="text-gray-900 font-medium">{patient.patientName}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Data de Nascimento:</span>
              <p className="text-gray-900">{formatDate(patient.patientBirthDate)}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-600">Sexo:</span>
              <p className="text-gray-900">{patient.patientSex === 'M' ? 'Masculino' : 'Feminino'}</p>
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-600">CNS:</span>
            <p className="text-gray-900 font-mono">{formatCNS(patient.patientCNS)}</p>
          </div>
        </div>
      </div>

      {/* Informações adicionais se disponíveis */}
      {patient.metadata && (
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Informações do Cadastro</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              Cadastrado em: {new Date(patient.metadata.createdAt).toLocaleString('pt-BR')}
            </p>
            {patient.metadata.updatedAt && (
              <p>
                Última atualização: {new Date(patient.metadata.updatedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botão de confirmação */}
      <div className="pt-4">
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isConfirming ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Confirmando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmar Paciente
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PatientConfirm;