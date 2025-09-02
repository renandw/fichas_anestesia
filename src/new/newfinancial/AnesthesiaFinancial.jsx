// src/new/newfinancial/AnesthesiaFinancial.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

// Componentes
import FinancialSummary from './components/FinancialSummary';
import FinancialFilters from './components/FinancialFilters';
import FinancialTable from './components/FinancialTable';
import FinancialEditModal from './components/FinancialEditModal';
import PaymentActions from './components/PaymentActions';

// Hook customizado
import { useFinancialData } from './hooks/useFinancialData';

const AnesthesiaFinancial = () => {
  const {
    // Dados
    anesthesias,
    summary,
    loading,
    error,
    
    // Filtros
    filters,
    handleFilterChange,
    clearFilters,
    hasActiveFilters,
    
    // Paginação
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
    
    // Operações
    updateFinancialData,
    markPaymentStatus,
    updateGlosaData,
    refreshData,
    
    // Utilitários
    getProcedureDisplay,
    getHospitalName
  } = useFinancialData();

  // Estados locais da página
  const [selectedAnesthesia, setSelectedAnesthesia] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Handlers para modal
  const handleEditFinancial = (anesthesia) => {
    setSelectedAnesthesia(anesthesia);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setSelectedAnesthesia(null);
    setShowEditModal(false);
  };

  const handleSaveFinancial = async (anesthesia, financialData) => {
    setActionLoading(true);
    try {
      const success = await updateFinancialData(
        anesthesia.patientId,
        anesthesia.surgeryId,
        anesthesia.id,
        financialData
      );
      return success;
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers para ações rápidas
  const handleTogglePayment = async (anesthesia) => {
    if (!anesthesia.financial?.value) {
      handleEditFinancial(anesthesia);
      return;
    }

    setActionLoading(true);
    try {
      const currentlyPaid = anesthesia.financial?.paid;
      const paymentDate = currentlyPaid ? null : new Date();
      
      await markPaymentStatus(
        anesthesia.patientId,
        anesthesia.surgeryId,
        anesthesia.id,
        !currentlyPaid,
        paymentDate
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async (anesthesia, paymentDate) => {
    setActionLoading(true);
    try {
      const success = await markPaymentStatus(
        anesthesia.patientId,
        anesthesia.surgeryId,
        anesthesia.id,
        true,
        paymentDate
      );
      return success;
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsUnpaid = async (anesthesia) => {
    setActionLoading(true);
    try {
      const success = await markPaymentStatus(
        anesthesia.patientId,
        anesthesia.surgeryId,
        anesthesia.id,
        false,
        null
      );
      return success;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGlosa = (anesthesia, action) => {
    // Abrir modal para edição de glosa
    handleEditFinancial(anesthesia);
  };

  // Navegação para ficha anestésica
  const handleViewAnesthesia = (anesthesia) => {
    const url = `/patients/${anesthesia.patientId}/surgeries/${anesthesia.surgeryId}/surgery`;
    window.open(url, '_blank');
  };

  // Paginação
  const paginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link 
            to="/dashboard" 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão Financeira
            </h1>
            <p className="text-sm text-gray-600">
              Controle de valores e pagamentos de anestesias de convênio
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link
            to="/anesthesia"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-colors"
          >
            Ver Todas as Anestesias
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={refreshData}
                className="text-sm text-red-800 underline hover:text-red-900 mt-2"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <FinancialSummary 
        summary={summary} 
        loading={loading} 
      />

      {/* Filters */}
      <FinancialFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        totalItems={totalItems}
      />

      {/* Main Table */}
      <FinancialTable
        anesthesias={anesthesias}
        loading={loading}
        onEditFinancial={handleEditFinancial}
        onTogglePayment={handleTogglePayment}
        onViewAnesthesia={handleViewAnesthesia}
        getProcedureDisplay={getProcedureDisplay}
        getHospitalName={getHospitalName}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between items-center sm:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
          
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de{' '}
                <span className="font-medium">{totalItems}</span> resultados
              </p>
            </div>
            
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {paginationNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <FinancialEditModal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        anesthesia={selectedAnesthesia}
        onSave={handleSaveFinancial}
        loading={actionLoading}
      />
    </div>
  );
};

export default AnesthesiaFinancial;