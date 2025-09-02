// src/new/newfinancial/components/FinancialSummary.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Users,
  AlertTriangle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useMonthlySummary } from '../hooks/useMonthlySummary';

const FinancialSummary = () => {
  const { monthlySummary, loading, error, refreshMonthlySummary } = useMonthlySummary();

  // Formatar nome do mês
  const getCurrentMonthName = () => {
    const currentDate = new Date();
    return currentDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  // Formatar valores em moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-26"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro no resumo mensal</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={refreshMonthlySummary}
              className="text-red-600 hover:text-red-800 p-1"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!monthlySummary) {
    return (
      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-gray-600">
            Não há anestesias registradas para este mês.
          </p>
        </div>
      </div>
    );
  }

  const { particular, convenio, breakdown } = monthlySummary;

  return (
    <div className="space-y-6 mb-6">
      
      {/* Header com nome do mês */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Resumo Financeiro - {getCurrentMonthName()}
        </h2>
      </div>
      
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card Particular */}
        <div className="bg-white border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Particular</h3>
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Procedimentos:</span>
              <span className="font-semibold text-gray-900">{particular.count}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Faturado:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(particular.faturado)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recebido:</span>
              <span className="font-semibold text-green-600">{formatCurrency(particular.recebido)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendente:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(particular.pendente)}</span>
            </div>
          </div>
        </div>

        {/* Card Convênios */}
        <div className="bg-white border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Convênios</h3>
            <div className="p-2 bg-purple-100 rounded-full">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Procedimentos:</span>
              <span className="font-semibold text-gray-900">{convenio.count}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Faturado:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(convenio.faturado)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recebido:</span>
              <span className="font-semibold text-green-600">{formatCurrency(convenio.recebido)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendente:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(convenio.pendente)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Glosado:</span>
              <span className="font-semibold text-red-600">{formatCurrency(convenio.glosado)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de distribuição */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Distribuição por Convênio
          </h3>
          <button
            onClick={refreshMonthlySummary}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        {breakdown && breakdown.length > 0 ? (
          <div className="space-y-3">
            {breakdown.map((item, index) => (
              <div 
                key={item.insuranceName}
                className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {index + 1}.
                  </span>
                  <span className="font-medium text-gray-900">
                    {item.insuranceName}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {item.count} {item.count === 1 ? 'procedimento' : 'procedimentos'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Nenhum procedimento registrado este mês
          </p>
        )}
      </div>

      {/* Botão para mais detalhes */}
      <div className="text-center">
        <Link 
          to="/anesthesia/financial/details"
          className="inline-flex items-center px-6 py-3 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          Ver Análise Detalhada
        </Link>
      </div>
    </div>
  );
};

export default FinancialSummary;