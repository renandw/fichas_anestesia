// src/new/newfinancial/components/FinancialFilters.jsx
import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  Search,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const FinancialFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  hasActiveFilters, 
  totalItems 
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (field, value) => {
    onFilterChange(field, value);
  };

  const filterSections = [
    {
      title: 'Busca Geral',
      icon: Search,
      fields: [
        {
          name: 'patientName',
          label: 'Nome do Paciente',
          type: 'text',
          placeholder: 'Buscar por nome...'
        },
        {
          name: 'procedure',
          label: 'Procedimento',
          type: 'text',
          placeholder: 'Buscar procedimento...'
        },
        {
          name: 'hospital',
          label: 'Hospital',
          type: 'text',
          placeholder: 'Buscar hospital...'
        },
        {
          name: 'insuranceName',
          label: 'Convênio',
          type: 'text',
          placeholder: 'Buscar convênio...'
        }
      ]
    },
    {
      title: 'Status Financeiro',
      icon: CheckCircle,
      fields: [
        {
          name: 'paid',
          label: 'Status de Pagamento',
          type: 'select',
          options: [
            { value: '', label: 'Todos' },
            { value: 'true', label: 'Pagos' },
            { value: 'false', label: 'Pendentes' }
          ]
        },
        {
          name: 'hasGlosa',
          label: 'Status de Glosa',
          type: 'select',
          options: [
            { value: '', label: 'Todos' },
            { value: 'true', label: 'Com Glosa' },
            { value: 'false', label: 'Sem Glosa' }
          ]
        }
      ]
    },
    {
      title: 'Valores',
      icon: DollarSign,
      fields: [
        {
          name: 'minValue',
          label: 'Valor Mínimo (R$)',
          type: 'number',
          placeholder: '0,00',
          step: '0.01',
          min: '0'
        },
        {
          name: 'maxValue',
          label: 'Valor Máximo (R$)',
          type: 'number',
          placeholder: '9999,99',
          step: '0.01',
          min: '0'
        }
      ]
    },
    {
      title: 'Período de Pagamento',
      icon: Calendar,
      fields: [
        {
          name: 'paymentDateFrom',
          label: 'Data Inicial',
          type: 'date'
        },
        {
          name: 'paymentDateTo',
          label: 'Data Final',
          type: 'date'
        }
      ]
    }
  ];

  const activeFiltersCount = Object.values(filters).filter(f => f !== '').length;

  const renderField = (field) => {
    const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm";

    if (field.type === 'select') {
      return (
        <select
          key={field.name}
          value={filters[field.name] || ''}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          className={commonClasses}
        >
          {field.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        key={field.name}
        type={field.type}
        value={filters[field.name] || ''}
        onChange={(e) => handleInputChange(field.name, e.target.value)}
        placeholder={field.placeholder}
        step={field.step}
        min={field.min}
        className={commonClasses}
      />
    );
  };

  return (
    <>
      {/* Header de filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Gestão Financeira
          </h2>
          <p className="text-sm text-gray-600">
            {totalItems} anestesias de convênio
            {hasActiveFilters && ' (filtradas)'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros rápidos - Mobile */}
      <div className="sm:hidden mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleInputChange('paid', filters.paid === 'false' ? '' : 'false')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filters.paid === 'false' 
                ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Pendentes
          </button>
          
          <button
            onClick={() => handleInputChange('paid', filters.paid === 'true' ? '' : 'true')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filters.paid === 'true' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            <CheckCircle className="h-3 w-3" />
            Pagos
          </button>
          
          <button
            onClick={() => handleInputChange('hasGlosa', filters.hasGlosa === 'true' ? '' : 'true')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filters.hasGlosa === 'true' 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Com Glosa
          </button>
        </div>
      </div>

      {/* Panel de filtros expandido */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Filtros Avançados
            </h3>
            
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 sm:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Desktop/Tablet Layout */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <h4 className="font-medium text-gray-700 text-sm">
                        {section.title}
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                          </label>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden space-y-6">
            {filterSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-700 text-sm">
                      {section.title}
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {section.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ações do footer */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {totalItems} resultados
              {hasActiveFilters && ` com ${activeFiltersCount} filtros aplicados`}
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    onClearFilters();
                    setShowFilters(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Limpar e Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinancialFilters;