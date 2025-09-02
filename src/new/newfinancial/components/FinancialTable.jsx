// src/new/newfinancial/components/FinancialTable.jsx
import React from 'react';
import { 
  Edit3,
  Eye,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  User,
  FileText
} from 'lucide-react';

const FinancialTable = ({ 
  anesthesias, 
  loading, 
  onEditFinancial, 
  onTogglePayment, 
  onViewAnesthesia,
  getProcedureDisplay,
  getHospitalName 
}) => {
  // Formatação de moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Formatação de data
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  // Status badges
  const getStatusBadge = (financial) => {
    if (!financial) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Não informado
        </span>
      );
    }

    if (financial.paid) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pago
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </span>
    );
  };

  // Glosa badge
  const getGlosaBadge = (financial) => {
    if (!financial?.glosa?.hasGlosa) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Sem Glosa
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Com Glosa
      </span>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Desktop skeleton */}
        <div className="hidden lg:block">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile skeleton */}
        <div className="lg:hidden p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (anesthesias.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma anestesia encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Não há anestesias de convênio que correspondam aos filtros aplicados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Procedimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Convênio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {anesthesias.map((anesthesia) => (
              <tr 
                key={anesthesia.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {anesthesia.patientName || 'Nome não informado'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {anesthesia.code || anesthesia.surgeryId}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={getProcedureDisplay(anesthesia)}>
                      {getProcedureDisplay(anesthesia)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getHospitalName(anesthesia)}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {anesthesia.insuranceName || 'Convênio'}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {anesthesia.financial ? (
                      <>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(anesthesia.financial.value)}
                        </div>
                        {anesthesia.financial.glosa?.hasGlosa && (
                          <>
                            <div className="text-xs text-red-600">
                              Glosa: -{formatCurrency(anesthesia.financial.glosa.glosedValue)}
                            </div>
                            <div className="text-xs font-medium text-gray-900">
                              Final: {formatCurrency(anesthesia.financial.glosa.finalValue)}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Não informado</span>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {getStatusBadge(anesthesia.financial)}
                    {getGlosaBadge(anesthesia.financial)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {anesthesia.financial?.paymentDate ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-green-600 mr-1" />
                        {formatDate(anesthesia.financial.paymentDate)}
                      </div>
                    ) : (
                      <span className="text-gray-400">Não pago</span>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditFinancial(anesthesia)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-1 rounded text-sm"
                      title="Editar dados financeiros"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span className="inline">Editar</span>
                    </button>
                    
                    <button
                      onClick={() => onViewAnesthesia(anesthesia)}
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 p-1 rounded"
                      title="Ver ficha anestésica"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="inline">Ver Ficha</span>
                    </button>
                    
                    <button
                      onClick={() => onTogglePayment(anesthesia)}
                      className={`flex items-center space-x-1 p-1 rounded ${
                        anesthesia.financial?.paid 
                          ? 'text-orange-600 hover:text-orange-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={anesthesia.financial?.paid ? 'Marcar como pendente' : 'Marcar como pago'}
                    >
                      {anesthesia.financial?.paid ? (
                        <>
                          <Clock className="h-4 w-4" />
                          <span className="inline">Marcar Pendente</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span className="inline">Marcar Pago</span>
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden p-4 space-y-4">
        {anesthesias.map((anesthesia) => (
          <div
            key={anesthesia.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {anesthesia.patientName || 'Nome não informado'}
                </h3>
                <p className="text-sm text-gray-500">
                  {anesthesia.code || anesthesia.surgeryId}
                </p>
              </div>
              
              <div className="flex items-center space-x-1">
                {getStatusBadge(anesthesia.financial)}
              </div>
            </div>

            {/* Procedimento e Hospital */}
            <div className="mb-3">
              <div className="flex items-start space-x-2 mb-2">
                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">
                    {getProcedureDisplay(anesthesia)}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {getHospitalName(anesthesia)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Convênio */}
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {anesthesia.insuranceName || 'Convênio'}
              </span>
            </div>

            {/* Valores */}
            <div className="mb-3">
              {anesthesia.financial ? (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Valor:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(anesthesia.financial.value)}
                    </span>
                  </div>
                  
                  {anesthesia.financial.glosa?.hasGlosa && (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-red-600">Glosa:</span>
                        <span className="text-xs font-medium text-red-600">
                          -{formatCurrency(anesthesia.financial.glosa.glosedValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium text-gray-700">Final:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(anesthesia.financial.glosa.finalValue)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {anesthesia.financial.paymentDate && (
                    <div className="flex items-center mt-2 pt-2 border-t">
                      <Calendar className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">
                        Pago em: {formatDate(anesthesia.financial.paymentDate)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <DollarSign className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                  <span className="text-sm text-gray-400">Valores não informados</span>
                </div>
              )}
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {getGlosaBadge(anesthesia.financial)}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t">
              <button
                onClick={() => onViewAnesthesia(anesthesia)}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Ficha</span>
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => onEditFinancial(anesthesia)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                
                <button
                  onClick={() => onTogglePayment(anesthesia)}
                  className={`flex items-center space-x-1 text-sm font-medium ${
                    anesthesia.financial?.paid 
                      ? 'text-orange-600 hover:text-orange-900' 
                      : 'text-green-600 hover:text-green-900'
                  }`}
                >
                  {anesthesia.financial?.paid ? (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Marcar Pendente</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Marcar Pago</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialTable;