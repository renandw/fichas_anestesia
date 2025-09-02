import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Loader, AlertCircle,
 Stethoscope, Activity, Eye, Play, AlertTriangle,
 Edit3, Trash2, X, ArrowLeft, MoreVertical, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatient, updatePatient } from '../services/patientService';
import { getPatientSurgeries, updateSurgery, deleteSurgery } from '../services/surgeryService';
import { 
  getSurgeryAnesthesia, 
  getSurgeryPreAnesthesia, 
  getSurgerySRPA 
} from '../services/anesthesiaService';
import PatientForm from './PatientForm';
import SurgeryForm from './SurgeryForm/SurgeryForm';
import PatientDisplay from '../newvariations/PatientDisplay';
import SurgeryFormAdapterToPatientDetails from '../newadapters/SurgeryFormAdapterToPatientDetails';
import SurgeryDisplay from '../newvariations/SurgeryDisplay';


const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { currentUserId, isAuthenticated } = useAuth();

  // Estados principais
  const [patient, setPatient] = useState(null);
  const [surgeries, setSurgeries] = useState([]);
  const [subcollectionsCache, setSubcollectionsCache] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubcollections, setIsLoadingSubcollections] = useState(false);
  const [error, setError] = useState(null);

  // Estados de edição
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editingSurgeryId, setEditingSurgeryId] = useState(null);
  const [isCreatingNewSurgery, setIsCreatingNewSurgery] = useState(false);
  const [deletingConfirmation, setDeletingConfirmation] = useState(null);
  // Estado para menu de ações das cirurgias
  const [openActionsMenu, setOpenActionsMenu] = useState(null);

  // Estados de filtros (simplificados para foco no paciente)
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // all, sus, convenio
    status: 'all', // all, agendada, em_andamento, concluida
    hospital: 'all',
    surgeon: 'all',
    subcollectionStatus: 'all' // all, completo, incompleto, em_andamento
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Cache para listas de filtros
  const [filterOptions, setFilterOptions] = useState({
    hospitals: [],
    surgeons: []
  });

  // Buscar dados do paciente e suas cirurgias
  const fetchPatientData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 Buscando dados do paciente ${patientId}...`);

      // Buscar dados do paciente
      const patientData = await getPatient(patientId);
      if (!patientData) {
        setError('Paciente não encontrado.');
        return;
      }
      setPatient(patientData);

      // Buscar cirurgias do paciente
      const surgeriesData = await getPatientSurgeries(patientId, currentUserId);
      console.log(`📋 ${surgeriesData.length} cirurgias encontradas`);

      // Coletar dados para filtros
      const hospitals = new Set();
      const surgeons = new Set();

      surgeriesData.forEach(surgery => {
        if (surgery.hospital) hospitals.add(surgery.hospital);
        if (surgery.mainSurgeon) surgeons.add(surgery.mainSurgeon);
      });

      setFilterOptions({
        hospitals: Array.from(hospitals).sort(),
        surgeons: Array.from(surgeons).sort()
      });

      // Ordenar cirurgias por data (mais recente primeiro)
      const sortedSurgeries = surgeriesData.sort((a, b) => {
        const dateA = a.metadata?.createdAt?.seconds ? 
          new Date(a.metadata.createdAt.seconds * 1000) : 
          new Date(a.metadata?.createdAt || 0);
        const dateB = b.metadata?.createdAt?.seconds ? 
          new Date(b.metadata.createdAt.seconds * 1000) : 
          new Date(b.metadata?.createdAt || 0);
        return dateB - dateA;
      });

      setSurgeries(sortedSurgeries);

      console.log(`✅ Dados do paciente carregados com sucesso`);
      
      // Carregar subcoleções em background
      if (sortedSurgeries.length > 0) {
        loadSubcollectionsInBackground(sortedSurgeries);
      }
      
    } catch (err) {
      console.error('❌ Erro ao carregar dados do paciente:', err);
      setError('Erro ao carregar dados do paciente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  // Carregar subcoleções em background
  const loadSubcollectionsInBackground = useCallback(async (surgeriesData) => {
    setIsLoadingSubcollections(true);
    const newCache = new Map();

    try {
      for (const surgery of surgeriesData) {
        const cacheKey = `${patientId}-${surgery.id}`;
        
        try {
          const [anesthesia, preAnesthesia, srpa] = await Promise.all([
            getSurgeryAnesthesia(patientId, surgery.id).catch(() => null),
            getSurgeryPreAnesthesia(patientId, surgery.id).catch(() => null),
            getSurgerySRPA(patientId, surgery.id).catch(() => null)
          ]);

          const subcollections = {
            anesthesia: anesthesia ? { exists: true, status: anesthesia.status, data: anesthesia } : { exists: false, status: null },
            preAnesthesia: preAnesthesia ? { exists: true, status: preAnesthesia.status, data: preAnesthesia } : { exists: false, status: null },
            srpa: srpa ? { exists: true, status: srpa.status, data: srpa } : { exists: false, status: null }
          };

          newCache.set(cacheKey, subcollections);
        } catch (err) {
          console.warn(`Erro ao carregar subcoleções para ${cacheKey}:`, err);
        }
      }

      setSubcollectionsCache(newCache);
    } catch (err) {
      console.error('Erro ao carregar subcoleções:', err);
    } finally {
      setIsLoadingSubcollections(false);
    }
  }, [patientId]);

  // Filtros aplicados
  const filteredSurgeries = useMemo(() => {
    if (!surgeries) return [];
    
    let filtered = [...surgeries];

    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(surgery =>
        surgery.procedimento?.toLowerCase().includes(searchLower) ||
        surgery.proposedSurgery?.toLowerCase().includes(searchLower) ||
        surgery.hospital?.toLowerCase().includes(searchLower) ||
        surgery.mainSurgeon?.toLowerCase().includes(searchLower) ||
        surgery.code?.toLowerCase().includes(searchLower) ||
        surgery.cbhpmProcedures?.some(proc => 
          proc.procedimento?.toLowerCase().includes(searchLower) ||
          proc.codigo?.toLowerCase().includes(searchLower)
        )
      );
    }

    // Filtros específicos
    if (filters.type !== 'all') {
      filtered = filtered.filter(surgery => surgery.procedureType === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(surgery => {
        const status = surgery.status?.toLowerCase().replace(' ', '_');
        return status === filters.status;
      });
    }

    if (filters.hospital !== 'all') {
      filtered = filtered.filter(surgery => surgery.hospital === filters.hospital);
    }

    if (filters.surgeon !== 'all') {
      filtered = filtered.filter(surgery => surgery.mainSurgeon === filters.surgeon);
    }

    // Filtro por status de subcoleções
    if (filters.subcollectionStatus !== 'all') {
      filtered = filtered.filter(surgery => {
        const cacheKey = `${patientId}-${surgery.id}`;
        const subcollections = subcollectionsCache.get(cacheKey);
        
        if (!subcollections) return false;

        const completedCount = [
          subcollections.anesthesia,
          subcollections.preAnesthesia,
          subcollections.srpa
        ].filter(sub => sub.exists && sub.status === 'Concluída').length;

        const inProgressCount = [
          subcollections.anesthesia,
          subcollections.preAnesthesia,
          subcollections.srpa
        ].filter(sub => sub.exists && sub.status === 'Em andamento').length;

        switch (filters.subcollectionStatus) {
          case 'completo': return completedCount === 3;
          case 'incompleto': return completedCount < 3;
          case 'em_andamento': return inProgressCount > 0;
          default: return true;
        }
      });
    }

    return filtered;
  }, [surgeries, searchTerm, filters, subcollectionsCache, patientId]);

  // Paginação
  const totalPages = Math.ceil(filteredSurgeries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSurgeries = filteredSurgeries.slice(startIndex, startIndex + itemsPerPage);

  // Utilitários (reutilizando do PatientList)
  const getSubcollectionInfo = useCallback((surgery) => {
    const cacheKey = `${patientId}-${surgery.id}`;
    const subcollections = subcollectionsCache.get(cacheKey);
    
    if (!subcollections) {
      return {
        anesthesia: { exists: false, status: null },
        preAnesthesia: { exists: false, status: null },
        srpa: { exists: false, status: null },
        loading: isLoadingSubcollections
      };
    }

    return { ...subcollections, loading: false };
  }, [subcollectionsCache, isLoadingSubcollections, patientId]);

  const getStatusIcon = useCallback((subcollection, loading = false) => {
    if (loading) return <Loader className="w-3 h-3 animate-spin text-gray-400" />;
    if (!subcollection.exists) return '⚫';
    
    switch (subcollection.status) {
      case 'Concluída': return '🔵';
      case 'Em andamento': return '🟢';
      case 'Pausada': return '🟡';
      case 'Cancelada': return '🔴';
      default: return '⚫';
    }
  }, []);

  const getStatusText = useCallback((subcollection) => {
    if (!subcollection.exists) return '--';
    return subcollection.status || '--';
  }, []);

  const getCompletionInfo = useCallback((surgery) => {
    const subcollections = getSubcollectionInfo(surgery);
    
    if (subcollections.loading) {
      return { completion: '--', inProgress: false };
    }

    const completed = [
      subcollections.anesthesia,
      subcollections.preAnesthesia,
      subcollections.srpa
    ].filter(sub => sub.exists && sub.status === 'Concluída').length;

    const inProgress = [
      subcollections.anesthesia,
      subcollections.preAnesthesia,
      subcollections.srpa
    ].some(sub => sub.exists && sub.status === 'Em andamento');

    return {
      completion: `${completed}/3`,
      inProgress
    };
  }, [getSubcollectionInfo]);

  const getButtonActions = useCallback((surgery) => {
    const subcollections = getSubcollectionInfo(surgery);
    
    if (subcollections.loading) {
      return {
        preAnesthesia: { text: 'Carregando...', action: 'loading', disabled: true, variant: 'gray' },
        anesthesia: { text: 'Carregando...', action: 'loading', disabled: true, variant: 'gray' },
        srpa: { text: 'Carregando...', action: 'loading', disabled: true, variant: 'gray' }
      };
    }

    // Mesma lógica do PatientList
    const preAnesthesia = !subcollections.preAnesthesia.exists 
      ? { text: 'Criar Pré', action: 'create_pre', disabled: false, variant: 'blue', icon: Plus }
      : { text: subcollections.preAnesthesia.status === 'Em andamento' ? 'Continuar Pré' : 'Ver Pré', action: 'view_pre', disabled: false, variant: subcollections.preAnesthesia.status === 'Em andamento' ? 'green' : 'gray', icon: subcollections.preAnesthesia.status === 'Em andamento' ? Play : Eye };

    const anesthesia = !subcollections.anesthesia.exists 
      ? { text: 'Criar Anest', action: 'create_anesthesia', disabled: false, variant: 'blue', icon: Plus }
      : { text: subcollections.anesthesia.status === 'Em andamento' ? 'Continuar Anest' : 'Ver Anest', action: 'view_anesthesia', disabled: false, variant: subcollections.anesthesia.status === 'Em andamento' ? 'green' : 'gray', icon: subcollections.anesthesia.status === 'Em andamento' ? Play : Eye };

    const srpa = !subcollections.srpa.exists 
      ? { text: 'Criar SRPA', action: 'create_srpa', disabled: subcollections.anesthesia.status !== 'Concluída', variant: subcollections.anesthesia.status === 'Concluída' ? 'blue' : 'gray', icon: Plus }
      : { text: subcollections.srpa.status === 'Em andamento' ? 'Continuar SRPA' : 'Ver SRPA', action: 'view_srpa', disabled: false, variant: subcollections.srpa.status === 'Em andamento' ? 'green' : 'gray', icon: subcollections.srpa.status === 'Em andamento' ? Play : Eye };

    return { preAnesthesia, anesthesia, srpa };
  }, [getSubcollectionInfo]);

  const formatProcedure = useCallback((surgery) => {
    if (surgery.procedureType === 'sus') {
      return surgery.proposedSurgery || 'Cirurgia não especificada';
    } else {
      if (surgery.cbhpmProcedures?.length > 0) {
        return surgery.cbhpmProcedures
          .map(proc => proc.procedimento)
          .join(' + ');
      }
      return surgery.procedimento || 'Procedimento não especificado';
    }
  }, []);

  const getInsuranceDisplay = useCallback((surgery) => {
    if (surgery.procedureType === 'sus') {
      return 'SUS';
    }
    return surgery.insuranceName || 'Convênio';
  }, []);

  // Handlers
  const handleBack = useCallback(() => {
    navigate('/patients');
  }, [navigate]);

  const handleButtonAction = useCallback((surgery, action) => {
    const surgeryId = surgery.id;

    switch (action) {
      case 'create_pre':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/preanesthesia/new`);
        break;
      case 'view_pre':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/preanesthesia`);
        break;
      case 'create_anesthesia':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/anesthesia/new`);
        break;
      case 'view_anesthesia': {
        const cacheKey = `${patientId}-${surgeryId}`;
        const subcollections = subcollectionsCache.get(cacheKey);
        const anesthesiaId = subcollections?.anesthesia?.data?.id;

        if (!anesthesiaId) {
          console.warn('⚠️ Anesthesia ID não encontrado para cirurgia', surgeryId);
          return;
        }

        navigate(`/patients/${patientId}/surgeries/${surgeryId}/anesthesia/${anesthesiaId}`);
        break;
      }
      case 'create_srpa':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/srpa/new`);
        break;
      case 'view_srpa':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/srpa`);
        break;
      default:
        navigate(`/patients/${patientId}/surgeries/${surgeryId}`);
    }
  }, [navigate, patientId, subcollectionsCache]);

  const handleViewSurgery = useCallback((surgery) => {
    navigate(`/patients/${patientId}/surgeries/${surgery.id}/surgery`);
  }, [navigate, patientId]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      status: 'all',
      hospital: 'all',
      surgeon: 'all',
      subcollectionStatus: 'all'
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const getButtonVariantClasses = useCallback((variant) => {
    switch (variant) {
      case 'blue':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'green':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'gray':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      default:
        return 'bg-gray-400 text-white cursor-not-allowed';
    }
  }, []);

  // Handlers de edição
  const handlePatientSaved = useCallback((updatedPatient) => {
    setPatient(updatedPatient);
    setIsEditingPatient(false);
  }, []);

  const handleSurgerySaved = useCallback(async (surgeryData, createdSurgery = null) => {
    try {
      if (editingSurgeryId) {
        // Editando cirurgia existente - dados já foram salvos pelo SurgeryForm
        setSurgeries(prev => prev.map(surgery => 
          surgery.id === editingSurgeryId 
            ? { ...surgery, ...surgeryData }
            : surgery
        ));
        setEditingSurgeryId(null);
      } else if (isCreatingNewSurgery) {
        // Criando nova cirurgia
        if (createdSurgery) {
          // Cirurgia criada com sucesso, adicionar à lista
          setSurgeries(prev => [createdSurgery, ...prev]);
        } else {
          // Fallback: recarregar dados
          await fetchPatientData();
        }
        setIsCreatingNewSurgery(false);
      }
      // Toast success seria aqui
      console.log('✅ Cirurgia salva com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar cirurgia:', error);
      // Toast error seria aqui
    }
  }, [editingSurgeryId, isCreatingNewSurgery, fetchPatientData]);

  const handleDeleteSurgery = useCallback(async (surgeryId) => {
    try {
      await deleteSurgery(patientId, surgeryId, currentUserId);
      setSurgeries(prev => prev.filter(surgery => surgery.id !== surgeryId));
      setDeletingConfirmation(null);
      // Toast success seria aqui
    } catch (error) {
      console.error('Erro ao excluir cirurgia:', error);
      // Toast error seria aqui
    }
  }, [patientId, currentUserId]);

  // Effects
  useEffect(() => {
    if (!currentUserId || !patientId) return;
    fetchPatientData();
  }, [currentUserId, patientId, fetchPatientData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Loading/Error states
  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">Você precisa estar logado para ver os detalhes do paciente.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900">Carregando Paciente</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados do paciente...</p>
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
          <h2 className="text-xl font-semibold text-gray-900">Erro</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchPatientData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Tentar Novamente
              </button>
              <button
                onClick={handleBack}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-only top bar */}
      <div className="sm:hidden relative flex items-center h-14 mb-4 px-4 bg-white shadow-md border-b border-gray-200">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold text-gray-900 truncate max-w-[60%]">
          {patient?.patientName || 'Paciente'}
        </h1>
      </div>
      {/* Breadcrumb - desktop only */}
      <nav className="hidden sm:flex items-center gap-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-base">
        <button 
          onClick={handleBack} 
          className="flex items-center text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Pacientes
        </button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-gray-900">{patient?.patientName}</span>
      </nav>

      {/* Patient Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Paciente</h3>
            </div>
          </div>
          {/* Edit buttons (desktop and mobile) */}
          {!isEditingPatient && (
            <>
              {/* Desktop Edit Button */}
              <div className="hidden sm:flex">
                <button
                  onClick={() => setIsEditingPatient(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:bg-gradient-to-r from-blue-500 to-blue-600 flex items-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Paciente
                </button>
              </div>
              {/* Mobile Edit Button */}
              <div className="flex sm:hidden">
                <button
                  onClick={() => setIsEditingPatient(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-lg hover:bg-gradient-to-r from-blue-500 to-blue-600 flex items-center gap-1 text-xs"
                >
                  <Edit3 className="w-3 h-3" />
                  Editar
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            {isEditingPatient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2 p-2">
                  <h2 className="text-base font-semibold text-gray-900">Editar dados do Paciente</h2>
                  <button
                    onClick={() => setIsEditingPatient(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <PatientForm
                  mode="edit"
                  initialData={{ id: patientId, ...patient }}
                  onPatientSelected={handlePatientSaved}
                />
              </div>
            ) : (
              <div>
                <PatientDisplay patient={patient} mode="detailed" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Surgeries Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Header das Cirurgias */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cirurgias</h3>
              <p className="text-sm text-gray-600">
                Cirurgias encontradas
              </p>
            </div>
          </div>
          {/* "+ Cirurgia" button aligned right */}
          {!isCreatingNewSurgery && (
            <>
            {/* Desktop Edit Button */}
            <div className="hidden sm:flex">
              <button
                onClick={() => setIsCreatingNewSurgery(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:bg-gradient-to-r from-green-500 to-green-600 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Nova Cirurgia
              </button>
            </div>
            {/* Mobile Edit Button */}
            <div className="flex sm:hidden">
              <button
                onClick={() => setIsCreatingNewSurgery(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-lg hover:bg-gradient-to-r from-green-600 to-green-600 flex items-center gap-1 text-xs"
              >
                <Plus className="w-3 h-3" />
                Nova Cirurgia
              </button>
            </div>
          </>


          )}
        </div>

        {/* Busca e Filtros Simplificados */}
        <div className="mb-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-xs text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por procedimento, código, hospital ou cirurgião..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Card de Criação de Nova Cirurgia */}
        {isCreatingNewSurgery && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between mb-2 p-2">
              <h2 className="text-base font-semibold text-gray-900">Nova Cirurgia</h2>
              <button
                onClick={() => setIsCreatingNewSurgery(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SurgeryFormAdapterToPatientDetails
              patientId={patientId}
              onSave={handleSurgerySaved}
              onCancel={() => setIsCreatingNewSurgery(false)}
              mode="create"
            />
          </div>
        )}

        {/* Lista de Cirurgias */}
        {filteredSurgeries.length === 0 && !isCreatingNewSurgery ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Nenhuma cirurgia encontrada</p>
            <p className="text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(v => v !== 'all')
                ? 'Tente ajustar os filtros de busca'
                : 'Este paciente ainda não possui cirurgias cadastradas'
              }
            </p>
            {!searchTerm && Object.values(filters).every(v => v === 'all') && (
              // The "+ Cirurgia" button is now in the header, so don't show here
              null
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedSurgeries.map((surgery, sIndex) => {
              const isEditing = editingSurgeryId === surgery.id;
              if (isEditing) {
                return (
                  <div
                    key={surgery.id || `surgery-${sIndex}`}
                    className="border border-gray-200 rounded-lg p-1 hover:bg-gray-50 transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2 p-2">
                        <h2 className="text-base font-semibold text-gray-900">Editar dados da cirurgia</h2>
                        <button
                          onClick={() => setEditingSurgeryId(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <SurgeryForm
                        selectedPatient={patient}
                        existingSurgery={surgery}
                        patientId={patientId}
                        initialData={{
                          procedureType: surgery.procedureType,
                          patientWeight: surgery.patientWeight || '',
                          mainSurgeon: surgery.mainSurgeon || '',
                          auxiliarySurgeons: surgery.auxiliarySurgeons || [],
                          hospital: surgery.hospital || '',
                          hospitalRecord: surgery.hospitalRecord || '',
                          proposedSurgery: surgery.proposedSurgery || '',
                          insuranceNumber: surgery.insuranceNumber || '',
                          insuranceName: surgery.insuranceName || '',
                          cbhpmProcedures: surgery.cbhpmProcedures || [],
                          procedimento: surgery.procedimento || ''
                        }}
                        onSave={handleSurgerySaved}
                        onCancel={() => setEditingSurgeryId(null)}
                        mode="edit"
                      />
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={surgery.id || `surgery-${sIndex}`}
                  className="rounded-lg border pb-4 hover:bg-gray-100 border-green-100 transition-colors"
                >
                  {/* Área clicável apenas para visualizar detalhes */}
                  <div
                    onClick={() => handleViewSurgery(surgery)}
                    className="cursor-pointer"
                  >
                    <SurgeryDisplay surgery={surgery}/>
                  </div>

                  {/* Área separada para botões de ação */}
                  <div className="flex justify-end mt-2">
                    <div className="relative">
                      <button
                        onClick={() => setOpenActionsMenu(openActionsMenu === surgery.id ? null : surgery.id)}
                        className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded"
                        title="Mais ações"
                      > <span className="text-xs text-gray-700">Opções</span>
                        <MoreVertical className="w-4 h-4 text-gray-700" />
                        
                      </button>
                      {openActionsMenu === surgery.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-48">
                          <button
                            onClick={() => {
                              setOpenActionsMenu(null);
                              setEditingSurgeryId(surgery.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setOpenActionsMenu(null);
                              handleViewSurgery(surgery);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              setOpenActionsMenu(null);
                              setDeletingConfirmation(surgery.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                          <button
                            onClick={() => setOpenActionsMenu(null)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredSurgeries.length)} de {filteredSurgeries.length} cirurgias
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

      {/* Modal de Confirmação de Exclusão */}
      {deletingConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta cirurgia? Esta ação não pode ser desfeita e todos os dados relacionados (anestesias, pré-anestésicas e SRPA) serão perdidos.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingConfirmation(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteSurgery(deletingConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;