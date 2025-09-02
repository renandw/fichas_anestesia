import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  User, 
  Building, 
  CreditCard, 
  Plus, 
  ChevronDown, 
  Loader, 
  AlertCircle,
  Stethoscope,
  FileText,
  Activity,
  Eye,
  Play,
  Clock,
  Hospital,
  UserX
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSurgeries } from '../services/surgeryService';
import { 
  getSurgeryAnesthesia, 
  getSurgeryPreAnesthesia, 
  getSurgerySRPA 
} from '../services/anesthesiaService';
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
  const [subcollectionsCache, setSubcollectionsCache] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubcollections, setIsLoadingSubcollections] = useState(false);
  const [error, setError] = useState(null);

  // Estados de filtros expandidos
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // all, sus, convenio
    status: 'all', // all, agendada, em_andamento, concluida
    hospital: 'all',
    insurance: 'all',
    surgeon: 'all',
    dateRange: 'all', // all, hoje, semana, mes
    subcollectionStatus: 'all' // all, completo, incompleto, em_andamento
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Cache para listas de filtros
  const [filterOptions, setFilterOptions] = useState({
    hospitals: [],
    insurances: [],
    surgeons: []
  });

  // Buscar pacientes com suas cirurgias
  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Buscando pacientes e cirurgias...');

      // Buscar cirurgias do usuário
      const surgeries = await getUserSurgeries(currentUserId, 100);
      console.log(`📋 ${surgeries.length} cirurgias encontradas`);

      // Agrupar cirurgias por paciente
      const patientsMap = new Map();
      const hospitals = new Set();
      const insurances = new Set();
      const surgeons = new Set();

      for (const surgery of surgeries) {
        const patientId = surgery.patientId;
        surgery.surgeryId = surgery.id;
        
        // Coletar dados para filtros
        if (surgery.hospital) hospitals.add(surgery.hospital);
        if (surgery.mainSurgeon) surgeons.add(surgery.mainSurgeon);
        
        if (surgery.procedureType === 'convenio' && surgery.insuranceName) {
          insurances.add(surgery.insuranceName);
        } else if (surgery.procedureType === 'sus') {
          insurances.add('SUS');
        }

        if (!patientsMap.has(patientId)) {
          patientsMap.set(patientId, {
            id: patientId,
            patientName: surgery.patientName,
            patientBirthDate: surgery.patientBirthDate,
            patientSex: surgery.patientSex || 'N/A',
            patientCNS: surgery.patientCNS || 'N/A',
            surgeries: []
          });
        }

        patientsMap.get(patientId).surgeries.push(surgery);
      }

      // Atualizar opções de filtros
      setFilterOptions({
        hospitals: Array.from(hospitals).sort(),
        insurances: Array.from(insurances).sort(),
        surgeons: Array.from(surgeons).sort()
      });

      // Converter Map para Array e ordenar
      const patientsArray = Array.from(patientsMap.values()).sort((a, b) => 
        (a.patientName || '').localeCompare(b.patientName || '')
      );

      // Ordenar cirurgias de cada paciente por data
      patientsArray.forEach(patient => {
        patient.surgeries.sort((a, b) => {
          const dateA = a.metadata?.createdAt?.seconds ? 
            new Date(a.metadata.createdAt.seconds * 1000) : 
            new Date(a.metadata?.createdAt || 0);
          const dateB = b.metadata?.createdAt?.seconds ? 
            new Date(b.metadata.createdAt.seconds * 1000) : 
            new Date(b.metadata?.createdAt || 0);
          return dateB - dateA;
        });
      });

      console.log(`✅ ${patientsArray.length} pacientes processados`);
      setPatients(patientsArray);
      
      // Carregar subcoleções em background
      loadSubcollectionsInBackground(patientsArray);
      
    } catch (err) {
      console.error('❌ Erro ao carregar pacientes:', err);
      setError('Erro ao carregar pacientes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Carregar subcoleções em background (otimização de performance)
  const loadSubcollectionsInBackground = useCallback(async (patientsArray) => {
    setIsLoadingSubcollections(true);
    const newCache = new Map();

    try {
      // Carregar subcoleções em lotes para melhor performance
      for (const patient of patientsArray) {
        for (const surgery of patient.surgeries) {
          const cacheKey = `${patient.id}-${surgery.surgeryId}`;
          
          try {
            const [anesthesia, preAnesthesia, srpa] = await Promise.all([
              getSurgeryAnesthesia(patient.id, surgery.surgeryId).catch(() => null),
              getSurgeryPreAnesthesia(patient.id, surgery.surgeryId).catch(() => null),
              getSurgerySRPA(patient.id, surgery.surgeryId).catch(() => null)
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
      }

      setSubcollectionsCache(newCache);
    } catch (err) {
      console.error('Erro ao carregar subcoleções:', err);
    } finally {
      setIsLoadingSubcollections(false);
    }
  }, []);

  // Filtros aplicados com performance otimizada
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    
    let filtered = [...patients];

    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.patientName?.toLowerCase().includes(searchLower) ||
        patient.patientCNS?.toLowerCase().includes(searchLower) ||
        patient.surgeries.some(surgery => 
          surgery.procedimento?.toLowerCase().includes(searchLower) ||
          surgery.proposedSurgery?.toLowerCase().includes(searchLower) ||
          surgery.hospital?.toLowerCase().includes(searchLower) ||
          surgery.mainSurgeon?.toLowerCase().includes(searchLower) ||
          surgery.code?.toLowerCase().includes(searchLower) ||
          surgery.cbhpmProcedures?.some(proc => 
            proc.procedimento?.toLowerCase().includes(searchLower) ||
            proc.codigo?.toLowerCase().includes(searchLower)
          )
        )
      );
    }

    // Filtros específicos
    if (filters.type !== 'all') {
      filtered = filtered.filter(patient =>
        patient.surgeries.some(surgery => surgery.procedureType === filters.type)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(patient =>
        patient.surgeries.some(surgery => {
          const status = surgery.status?.toLowerCase().replace(' ', '_');
          return status === filters.status;
        })
      );
    }

    if (filters.hospital !== 'all') {
      filtered = filtered.filter(patient =>
        patient.surgeries.some(surgery => surgery.hospital === filters.hospital)
      );
    }

    if (filters.insurance !== 'all') {
      filtered = filtered.filter(patient =>
        patient.surgeries.some(surgery => {
          if (filters.insurance === 'SUS') return surgery.procedureType === 'sus';
          return surgery.insuranceName === filters.insurance;
        })
      );
    }

    if (filters.surgeon !== 'all') {
      filtered = filtered.filter(patient =>
        patient.surgeries.some(surgery => surgery.mainSurgeon === filters.surgeon)
      );
    }

    // Filtro por data
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(patient =>
        patient.surgeries.some(surgery => {
          const surgeryDate = surgery.metadata?.createdAt?.seconds ? 
            new Date(surgery.metadata.createdAt.seconds * 1000) : 
            new Date(surgery.metadata?.createdAt || 0);

          switch (filters.dateRange) {
            case 'hoje': return surgeryDate >= today;
            case 'semana': return surgeryDate >= weekAgo;
            case 'mes': return surgeryDate >= monthAgo;
            default: return true;
          }
        })
      );
    }

    // Filtro por status de subcoleções
    if (filters.subcollectionStatus !== 'all') {
      filtered = filtered.filter(patient =>
        patient.surgeries.some(surgery => {
          const cacheKey = `${patient.id}-${surgery.surgeryId}`;
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
        })
      );
    }

    return filtered;
  }, [patients, searchTerm, filters, subcollectionsCache]);

  // Paginação
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  // Utilitários para formatação e status
  const calculateAge = useCallback((birthDate) => {
    if (!birthDate) return '--';
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getFullYear() - birth.getFullYear();
  }, []);

  const getSubcollectionInfo = useCallback((patient, surgery) => {
    const cacheKey = `${patient.id}-${surgery.surgeryId}`;
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
  }, [subcollectionsCache, isLoadingSubcollections]);

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

  const getCompletionInfo = useCallback((patient, surgery) => {
    const subcollections = getSubcollectionInfo(patient, surgery);
    
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

  const getButtonActions = useCallback((patient, surgery) => {
    const subcollections = getSubcollectionInfo(patient, surgery);
    
    if (subcollections.loading) {
      return {
        preAnesthesia: { text: 'Carregando...', action: 'loading', disabled: true, variant: 'gray' },
        anesthesia: { text: 'Carregando...', action: 'loading', disabled: true, variant: 'gray' },
        srpa: { text: 'Carregando...', action: 'loading', disabled: true, variant: 'gray' }
      };
    }

    // Pré-anestésica
    const preAnesthesia = !subcollections.preAnesthesia.exists 
      ? { 
          text: 'Criar Pré', 
          action: 'create_pre', 
          disabled: false, 
          variant: 'blue',
          icon: Plus
        }
      : { 
          text: subcollections.preAnesthesia.status === 'Em andamento' ? 'Continuar Pré' : 'Ver Pré', 
          action: 'view_pre', 
          disabled: false, 
          variant: subcollections.preAnesthesia.status === 'Em andamento' ? 'green' : 'gray',
          icon: subcollections.preAnesthesia.status === 'Em andamento' ? Play : Eye
        };

    // Anestesia
    const anesthesia = !subcollections.anesthesia.exists 
      ? { 
          text: 'Criar Anest', 
          action: 'create_anesthesia', 
          disabled: false, 
          variant: 'blue',
          icon: Plus
        }
      : { 
          text: subcollections.anesthesia.status === 'Em andamento' ? 'Continuar Anest' : 'Ver Anest', 
          action: 'view_anesthesia', 
          disabled: false, 
          variant: subcollections.anesthesia.status === 'Em andamento' ? 'green' : 'gray',
          icon: subcollections.anesthesia.status === 'Em andamento' ? Play : Eye
        };

    // SRPA
    const srpa = !subcollections.srpa.exists 
      ? { 
          text: 'Criar SRPA', 
          action: 'create_srpa', 
          disabled: subcollections.anesthesia.status !== 'Concluída', 
          variant: subcollections.anesthesia.status === 'Concluída' ? 'blue' : 'gray',
          icon: Plus
        }
      : { 
          text: subcollections.srpa.status === 'Em andamento' ? 'Continuar SRPA' : 'Ver SRPA', 
          action: 'view_srpa', 
          disabled: false, 
          variant: subcollections.srpa.status === 'Em andamento' ? 'green' : 'gray',
          icon: subcollections.srpa.status === 'Em andamento' ? Play : Eye
        };

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
  const handleViewPatient = useCallback((patient) => {
    navigate(`/patients/${patient.id}`);
  }, [navigate]);

  const handleCreateNew = useCallback(() => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      navigate('/anesthesia/new');
    }
  }, [onCreateNew, navigate]);

  const handleButtonAction = useCallback((patient, surgery, action) => {
    const patientId = patient.id;
    const surgeryId = surgery.surgeryId;

    switch (action) {
      case 'create_pre':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/preanesthesia/new`);
        break;
      case 'view_pre':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/preanesthesia`);
        break;
      case 'create_anesthesia':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/anesthesia`);
        break;
      case 'view_anesthesia':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/anesthesia`);
        break;
      case 'create_srpa':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/srpa/new`);
        break;
      case 'view_srpa':
        navigate(`/patients/${patientId}/surgeries/${surgeryId}/srpa`);
        break;
      default:
        navigate(`/patients/${patientId}/surgeries/${surgeryId}`);
    }
  }, [navigate]);

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

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      status: 'all',
      hospital: 'all',
      insurance: 'all',
      surgeon: 'all',
      dateRange: 'all',
      subcollectionStatus: 'all'
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Effects
  useEffect(() => {
    if (!currentUserId) return;
    fetchPatients();
  }, [currentUserId, fetchPatients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

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
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
              {isLoadingSubcollections && (
                <span className="ml-2 text-blue-600 text-xs">
                  <Loader className="w-3 h-3 inline animate-spin mr-1" />
                  Carregando detalhes...
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nova Anestesia
        </button>
      </div>

      {/* Busca e Filtros */}
      {(showSearch || showFilters) && (
        <div className="mb-6 space-y-4">
          {/* Busca */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por paciente, CNS, procedimento, CBHPM, hospital ou cirurgião..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
          )}

          {/* Filtros */}
          {showFilters && (
            <div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
                >
                  <Filter className="w-4 h-4" />
                  Filtros Avançados
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFiltersPanel ? 'rotate-180' : ''}`} />
                </button>

                {(Object.values(filters).some(v => v !== 'all') || searchTerm) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

              {showFiltersPanel && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  {/* Tipo de Cirurgia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={filters.type}
                      onChange={(e) => updateFilter('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os tipos</option>
                      <option value="sus">SUS</option>
                      <option value="convenio">Convênio</option>
                    </select>
                  </div>

                  {/* Status da Cirurgia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os status</option>
                      <option value="agendada">Agendada</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluida">Concluída</option>
                    </select>
                  </div>

                  {/* Hospital */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                    <select
                      value={filters.hospital}
                      onChange={(e) => updateFilter('hospital', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os hospitais</option>
                      {filterOptions.hospitals.map(hospital => (
                        <option key={hospital} value={hospital}>{hospital}</option>
                      ))}
                    </select>
                  </div>

                  {/* Convênio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Convênio</label>
                    <select
                      value={filters.insurance}
                      onChange={(e) => updateFilter('insurance', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os convênios</option>
                      {filterOptions.insurances.map(insurance => (
                        <option key={insurance} value={insurance}>{insurance}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cirurgião */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgião</label>
                    <select
                      value={filters.surgeon}
                      onChange={(e) => updateFilter('surgeon', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os cirurgiões</option>
                      {filterOptions.surgeons.map(surgeon => (
                        <option key={surgeon} value={surgeon}>{surgeon}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => updateFilter('dateRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os períodos</option>
                      <option value="hoje">Hoje</option>
                      <option value="semana">Última semana</option>
                      <option value="mes">Último mês</option>
                    </select>
                  </div>

                  {/* Status das Subcoleções */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progresso</label>
                    <select
                      value={filters.subcollectionStatus}
                      onChange={(e) => updateFilter('subcollectionStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os progressos</option>
                      <option value="completo">Completo (3/3)</option>
                      <option value="incompleto">Incompleto</option>
                      <option value="em_andamento">Em andamento</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de pacientes */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Nenhum paciente encontrado</p>
          <p className="text-sm text-gray-500">
            {searchTerm || Object.values(filters).some(v => v !== 'all')
              ? 'Tente ajustar os filtros de busca'
              : 'Ainda não há pacientes com cirurgias cadastradas'
            }
          </p>
          {!searchTerm && Object.values(filters).every(v => v === 'all') && (
            <button
              onClick={handleCreateNew}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Criar primeira anestesia
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedPatients.map((patient, pIndex) => (
            <div
              key={patient.id || `patient-${pIndex}`}
              className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header do paciente */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  {/* Novo componente para exibir informações do paciente */}
                  <PatientDisplay patient={patient} compact={false} />

                  {/* Botão para ver detalhes do paciente */}
                  <button
                    onClick={() => handleViewPatient(patient)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 w-full sm:w-auto justify-center"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalhes do Paciente
                  </button>
                </div>

              {/* Cirurgias do paciente */}
              <div className="space-y-3">
                {patient.surgeries.slice(0, 2).map((surgery, sIndex) => {
                  const subcollectionInfo = getSubcollectionInfo(patient, surgery);
                  const completion = getCompletionInfo(patient, surgery);
                  
                  return (
                    <div 
                      key={surgery.surgeryId || `${patient.id}-surgery-${sIndex}`} 
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      {/* Header da cirurgia */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 text-sm">{surgery.code}</span>
                          <div className="flex items-center gap-1">
                            {surgery.procedureType === 'sus' ? (
                              <Building className="w-4 h-4 text-blue-600" />
                            ) : (
                              <CreditCard className="w-4 h-4 text-purple-600" />
                            )}
                            <span className="text-sm text-gray-600">
                              {getInsuranceDisplay(surgery)}
                            </span>
                          </div>
                        </div>

                        {/* Indicador de progresso */}
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            completion.inProgress ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {completion.completion}
                          </div>
                          {completion.inProgress && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">Ativo</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Procedimento */}
                      <p className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
                        {formatProcedure(surgery)}
                      </p>

                      {/* Informações da cirurgia */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                        {surgery.hospital && (
                          <div className="flex items-center gap-1">
                            <Hospital className="w-3 h-3" />
                            <span className="truncate">{surgery.hospital}</span>
                          </div>
                        )}
                        {surgery.mainSurgeon && (
                          <div className="flex items-center gap-1">
                            <UserX className="w-3 h-3" />
                            <span className="truncate">{surgery.mainSurgeon}</span>
                          </div>
                        )}
                      </div>

                      {/* Status das subcoleções */}
                      <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                        <div className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          {typeof getStatusIcon(subcollectionInfo.anesthesia, subcollectionInfo.loading) === 'string' ? (
                            <span>{getStatusIcon(subcollectionInfo.anesthesia, subcollectionInfo.loading)}</span>
                          ) : (
                            getStatusIcon(subcollectionInfo.anesthesia, subcollectionInfo.loading)
                          )}
                          <span>Anest: {getStatusText(subcollectionInfo.anesthesia)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {typeof getStatusIcon(subcollectionInfo.preAnesthesia, subcollectionInfo.loading) === 'string' ? (
                            <span>{getStatusIcon(subcollectionInfo.preAnesthesia, subcollectionInfo.loading)}</span>
                          ) : (
                            getStatusIcon(subcollectionInfo.preAnesthesia, subcollectionInfo.loading)
                          )}
                          <span>Pré: {getStatusText(subcollectionInfo.preAnesthesia)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {typeof getStatusIcon(subcollectionInfo.srpa, subcollectionInfo.loading) === 'string' ? (
                            <span>{getStatusIcon(subcollectionInfo.srpa, subcollectionInfo.loading)}</span>
                          ) : (
                            getStatusIcon(subcollectionInfo.srpa, subcollectionInfo.loading)
                          )}
                          <span>SRPA: {getStatusText(subcollectionInfo.srpa)}</span>
                        </div>
                      </div>

                      {/* Três botões de ação */}
                      <div className="flex flex-wrap gap-2 justify-end">
                        {(() => {
                          const actions = getButtonActions(patient, surgery);
                          return (
                            <>
                              {/* Botão Pré-anestésica */}
                              <button
                                onClick={() => handleButtonAction(patient, surgery, actions.preAnesthesia.action)}
                                disabled={actions.preAnesthesia.disabled}
                                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                  getButtonVariantClasses(actions.preAnesthesia.variant)
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="Pré-anestésica"
                              >
                                {actions.preAnesthesia.icon && <actions.preAnesthesia.icon className="w-3 h-3" />}
                                <span className="hidden sm:inline">{actions.preAnesthesia.text}</span>
                                <span className="sm:hidden">Pré</span>
                              </button>

                              {/* Botão Anestesia */}
                              <button
                                onClick={() => handleButtonAction(patient, surgery, actions.anesthesia.action)}
                                disabled={actions.anesthesia.disabled}
                                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                  getButtonVariantClasses(actions.anesthesia.variant)
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="Anestesia"
                              >
                                {actions.anesthesia.icon && <actions.anesthesia.icon className="w-3 h-3" />}
                                <span className="hidden sm:inline">{actions.anesthesia.text}</span>
                                <span className="sm:hidden">Anest</span>
                              </button>

                              {/* Botão SRPA */}
                              <button
                                onClick={() => handleButtonAction(patient, surgery, actions.srpa.action)}
                                disabled={actions.srpa.disabled}
                                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                  getButtonVariantClasses(actions.srpa.variant)
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={actions.srpa.disabled ? "SRPA só pode ser criada após anestesia concluída" : "SRPA"}
                              >
                                {actions.srpa.icon && <actions.srpa.icon className="w-3 h-3" />}
                                <span className="hidden sm:inline">{actions.srpa.text}</span>
                                <span className="sm:hidden">SRPA</span>
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}

                {/* Mostrar se há mais cirurgias */}
                {patient.surgeries.length > 2 && (
                  <div className="text-center py-2">
                    <button
                      onClick={() => handleViewPatient(patient)}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      +{patient.surgeries.length - 2} cirurgia(s) adicional(is) - Ver todas
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
  );
};

export default PatientList;