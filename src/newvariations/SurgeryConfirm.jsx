import React, { useState } from 'react';
import { Stethoscope, Edit, Check, Building, CreditCard, Clock, User } from 'lucide-react';

const SurgeryConfirm = ({ surgery, patient, currentFlow, onConfirm, allowChange = true }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Simula delay de confirmação
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onConfirm(surgery);
    setIsConfirming(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    const colors = {
      'Agendada': 'bg-blue-100 text-blue-800 border-blue-200',
      'Em andamento': 'bg-green-100 text-green-800 border-green-200',
      'Concluída': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cancelada': 'bg-red-100 text-red-800 border-red-200',
      'Expirada': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const flowLabels = {
    anesthesia: 'Ficha Anestésica',
    preAnesthesia: 'Avaliação Pré-Anestésica',
    srpa: 'Ficha SRPA'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Stethoscope className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cirurgia Selecionada</h3>
            <p className="text-sm text-gray-600">
              Para: {patient?.patientName} - {flowLabels[currentFlow]}
            </p>
          </div>
        </div>
        
        {allowChange && (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 hover:text-green-700 border border-green-200 rounded-lg hover:bg-green-50"
          >
            <Edit className="w-4 h-4" />
            Trocar Cirurgia
          </button>
        )}
      </div>

      {/* Card principal da cirurgia */}
      <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
        
        {/* Header com status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {surgery.procedureType === 'sus' ? (
              <Building className="w-4 h-4 text-blue-600" />
            ) : (
              <CreditCard className="w-4 h-4 text-purple-600" />
            )}
            <span className="font-medium text-gray-900">
              {surgery.procedureType === 'sus' ? 'SUS' : 'Convênio'}
            </span>
          </div>
          
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(surgery.status)}`}>
            {surgery.status}
          </span>
        </div>

        {/* Informações principais */}
        <div className="space-y-3">
          {/* Procedimento */}
          {surgery.procedimento && (
            <div>
              <span className="text-sm font-medium text-gray-600">Procedimento:</span>
              <p className="text-gray-900">{surgery.procedimento}</p>
            </div>
          )}

          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Peso do Paciente:</span>
              <p className="text-gray-900">{surgery.patientWeight} kg</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-600">Cirurgião Principal:</span>
              <p className="text-gray-900">{surgery.mainSurgeon}</p>
            </div>
          </div>

          {/* Hospital */}
          <div>
            <span className="text-sm font-medium text-gray-600">Hospital:</span>
            <p className="text-gray-900">{surgery.hospital}</p>
          </div>

          {/* Cirurgiões auxiliares */}
          {surgery.auxiliarySurgeons && surgery.auxiliarySurgeons.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-600">Cirurgiões Auxiliares:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {surgery.auxiliarySurgeons.map((surgeon, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {surgeon.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção específica por tipo */}
      {surgery.procedureType === 'sus' && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Dados SUS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Registro Hospitalar:</span>
              <p className="text-gray-900 font-medium">{surgery.hospitalRecord}</p>
            </div>
            <div>
              <span className="text-gray-600">Cirurgia Proposta:</span>
              <p className="text-gray-900">{surgery.proposedSurgery}</p>
            </div>
          </div>
        </div>
      )}

      {surgery.procedureType === 'convenio' && (
        <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Dados Convênio
          </h4>
          
          {/* Informações do convênio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-600">Número do Convênio:</span>
              <p className="text-gray-900 font-medium">{surgery.insuranceNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Nome do Convênio:</span>
              <p className="text-gray-900">{surgery.insuranceName}</p>
            </div>
          </div>

          {/* Procedimentos CBHPM */}
          {surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-600 mb-2 block">Procedimentos CBHPM:</span>
              <div className="space-y-2">
                {surgery.cbhpmProcedures.map((proc, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{proc.codigo} - {proc.procedimento}</p>
                        <p className="text-xs text-gray-600">Porte Anestésico: {proc.porte_anestesico}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Datas importantes */}
      {surgery.surgeryDate && (
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Data da Cirurgia</span>
          </div>
          <p className="text-gray-900">{formatDate(surgery.surgeryDate)}</p>
        </div>
      )}

      {/* Metadados */}
      {surgery.metadata && (
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Informações do Cadastro</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              Cadastrada em: {new Date(surgery.metadata.createdAt).toLocaleString('pt-BR')}
            </p>
            {surgery.metadata.updatedAt && (
              <p>
                Última atualização: {new Date(surgery.metadata.updatedAt).toLocaleString('pt-BR')}
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
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isConfirming ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Confirmando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmar Cirurgia
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SurgeryConfirm;