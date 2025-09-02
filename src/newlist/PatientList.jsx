import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PatientForm from '../new/PatientForm';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Plus, 
  X,
  Loader, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatientsByUser } from '../services/patientService';
import PatientDisplay from '../newvariations/PatientDisplay';

const PatientList = ({ 
  title = "Pacientes",
  showFilters = true,
  showSearch = true,
  onCreateNew
}) => {
  const navigate = useNavigate();
  const { currentUserId, isAuthenticated } = useAuth();

  // Estados principais
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showPatientForm, setShowPatientForm] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Buscar pacientes por usuário
  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const patientList = await getPatientsByUser(currentUserId);
      const sorted = patientList.sort((a, b) =>
        (a.patientName || '').localeCompare(b.patientName || '', 'pt-BR', { sensitivity: 'base' })
      );
      setPatients(sorted);
    } catch (err) {
      console.error('❌ Erro ao carregar pacientes:', err);
      setError('Erro ao carregar pacientes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);


  // Filtro apenas por busca
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    let filtered = [...patients];
    if (debouncedSearch) {
      const normalize = (str) =>
        str?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

      const searchNormalized = normalize(debouncedSearch);

      filtered = filtered.filter(patient =>
        normalize(patient.patientName).includes(searchNormalized) ||
        normalize(patient.patientCNS).includes(searchNormalized)
      );
    }
    return filtered;
  }, [patients, debouncedSearch]);

  // Paginação
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleViewPatient = useCallback((patient) => {
    navigate(`/patients/${patient.id}`);
  }, [navigate]);


  // Effects
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchPatients();
  }, [currentUserId, fetchPatients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Loading state
  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">Você precisa estar logado para ver os pacientes.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando pacientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPatients}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-only top bar with back button and title */}
      <div className="sm:hidden fixed top-4 left-[2.5%] right-[2.5%] z-30 flex items-center justify-start h-14 pl-2 pr-4 bg-white shadow-md border-b border-gray-200">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-2 z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Pacientes</h1>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 pt-20 pb-40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        {/* Títulos */}
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-600">Escolha ou busque um nome para obter detalhes</p>
        </div>

        {/* Botões */}
        <div className="flex justify-end w-full sm:w-auto sm:flex hidden">
          {!showPatientForm ? (
            <button
              onClick={() => setShowPatientForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 min-w-[140px] justify-center"
            >
              <Plus className="w-4 h-4" />
              Novo Paciente
            </button>
          ) : (
            <button
              onClick={() => setShowPatientForm(false)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 min-w-[140px] justify-center"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Busca */}
      {showSearch && (
        <div className="mb-6 space-y-4 sm:block hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busque um paciente…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>
        </div>
      )}

      {/* PatientForm for desktop */}
      {showPatientForm && (
        <div className="mb-6 border border-blue-800 rounded-lg sm:block hidden">
          <PatientForm
            onPatientSelected={(patient) => {
              setShowPatientForm(false);
              fetchPatients();
            }}
          />
        </div>
      )}

      {/* Lista de pacientes */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Nenhum paciente encontrado</p>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'Tente ajustar a busca'
              : 'Ainda não há pacientes com cirurgias cadastradas'
            }
          </p>
          {/* Removed button for creating new patient when no searchTerm, as PatientForm is now inline */}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedPatients.map((patient, pIndex) => (
              <div
                key={patient.id || `patient-${pIndex}`}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Header do paciente */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Novo componente para exibir informações do paciente */}
                  <div
                    onClick={() => handleViewPatient(patient)}
                    className="cursor-pointer hover:border-blue-400 hover:shadow-md active:bg-blue-50 transition-colors border border-transparent rounded-lg w-full bg-white shadow-sm active:scale-[0.98]"
                  >
                    <PatientDisplay patient={patient} compact={false} />
                    <div className="sm:hidden text-blue-600 text-xs mt-1 text-right pr-2">Toque para ver detalhes</div>
                  </div>
                </div>
                {/* Cirurgias do paciente removidas conforme solicitado */}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Botão Nova Anestesia centralizado abaixo da lista - REMOVIDO */}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredPatients.length)} de {filteredPatients.length} pacientes
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg">
              {currentPage} de {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Mobile-only bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-md p-3 mb-3">
        <div className="flex items-center gap-2">
          {/* Campo de busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar paciente…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            {!showPatientForm ? (
              <button
                onClick={() => setShowPatientForm(true)}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowPatientForm(false)}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {showPatientForm && (
              <div className="absolute bottom-14 right-0 left-auto bg-white border border-blue-800 rounded-lg shadow-lg z-40 w-[90vw] max-w-sm p-4">
                <PatientForm
                  onPatientSelected={(patient) => {
                    setShowPatientForm(false);
                    fetchPatients();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientList;