import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, Clock, User, Stethoscope, Building, CreditCard, Eye, Plus, ChevronDown, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAnesthesias, getActiveAnesthesias } from '../services/anesthesiaService';

const AnesthesiaList = ({ 
  title = "Anestesias Recentes",
  filterByStatus = null, // null, 'Em andamento', 'Concluída', etc.
  showFilters = true,
  showSearch = true,
  onCreateNew,
  onViewDetails,
  onCreateSRPA 
}) => {
  const navigate = useNavigate();
  const { currentUserId, isAuthenticated } = useAuth();

  // Estados principais
  const [anesthesias, setAnesthesias] = useState([]);
  const [filteredAnesthesias, setFilteredAnesthesias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filterByStatus || 'all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, sus, convenio
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Buscar anestesias do Firebase
  const fetchAnesthesias = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Buscando anestesias do Firebase...');
      
      let anesthesias;
      if (filterByStatus === 'Em andamento') {
        console.log('📊 Buscando anestesias ativas');
        anesthesias = await getActiveAnesthesias(currentUserId);
      } else {
        console.log('📋 Buscando todas as anestesias do usuário');
        anesthesias = await getUserAnesthesias(currentUserId, 50); // limit 50
      }
      
      console.log(`✅ ${anesthesias.length} anestesias encontradas`);
      setAnesthesias(anesthesias);
    } catch (err) {
      console.error('❌ Erro ao carregar anestesias:', err);
      setError('Erro ao carregar anestesias. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId && isAuthenticated) {
      fetchAnesthesias();
    } else if (!isAuthenticated) {
      setIsLoading(false);
    }
  }, [currentUserId, filterByStatus, isAuthenticated]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...anesthesias];

    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(anesthesia =>
        anesthesia.patientName?.toLowerCase().includes(searchLower) ||
        anesthesia.procedimento?.toLowerCase().includes(searchLower) ||
        anesthesia.proposedSurgery?.toLowerCase().includes(searchLower) ||
        anesthesia.mainSurgeon?.toLowerCase().includes(searchLower) ||
        anesthesia.hospital?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(anesthesia => anesthesia.status === statusFilter);
    }

    // Filtro de tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(anesthesia => anesthesia.procedureType === typeFilter);
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(anesthesia => {
        const anesthesiaDate = new Date(anesthesia.surgeryDate);
        
        switch (dateFilter) {
          case 'today':
            return anesthesiaDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return anesthesiaDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return anesthesiaDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredAnesthesias(filtered);
    setCurrentPage(1);
  }, [anesthesias, searchTerm, statusFilter, typeFilter, dateFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredAnesthesias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnesthesias = filteredAnesthesias.slice(startIndex, startIndex + itemsPerPage);

  // Formatações
  const formatDate = (dateString) => {
    if (!dateString) return '--/--/----';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    return timeString || '--:--';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Em andamento': 'bg-green-100 text-green-800 border-green-200',
      'Concluída': 'bg-blue-100 text-blue-800 border-blue-200',
      'Cancelada': 'bg-red-100 text-red-800 border-red-200',
      'Pausada': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '--';
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getFullYear() - birth.getFullYear();
  };

  // Handlers para ações
  const handleViewDetails = (anesthesia) => {
    if (onViewDetails) {
      onViewDetails(anesthesia);
    } else {
      // Navegação padrão
      navigate(`/patients/${anesthesia.patientId}/surgeries/${anesthesia.surgeryId}/anesthesia`);
    }
  };

  const handleCreateSRPA = (anesthesia) => {
    if (onCreateSRPA) {
      onCreateSRPA(anesthesia);
    } else {
      // Navegação padrão
      navigate(`/patients/${anesthesia.patientId}/surgeries/${anesthesia.surgeryId}/srpa/new`);
    }
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      // Navegação padrão
      navigate('/anesthesia/new');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">Você precisa estar logado para ver as anestesias.</p>
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
            <p className="text-gray-600">Carregando anestesias...</p>
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
              onClick={fetchAnesthesias}
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">
              {filteredAnesthesias.length} {filteredAnesthesias.length === 1 ? 'anestesia encontrada' : 'anestesias encontradas'}
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
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
                placeholder="Buscar por paciente, procedimento, cirurgião ou hospital..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Filtros */}
          {showFilters && (
            <div>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
              >
                <Filter className="w-4 h-4" />
                Filtros
                <ChevronDown className={`w-4 h-4 transition-transform ${showFiltersPanel ? 'rotate-180' : ''}`} />
              </button>

              {showFiltersPanel && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os status</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="Pausada">Pausada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os tipos</option>
                      <option value="sus">SUS</option>
                      <option value="convenio">Convênio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Todos os períodos</option>
                      <option value="today">Hoje</option>
                      <option value="week">Última semana</option>
                      <option value="month">Último mês</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de anestesias */}
      {filteredAnesthesias.length === 0 ? (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Nenhuma anestesia encontrada</p>
          <p className="text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Ainda não há anestesias cadastradas'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && dateFilter === 'all' && (
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
          {paginatedAnesthesias.map((anesthesia) => (
            <div
              key={anesthesia.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header do card */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium text-gray-900">
                        {anesthesia.patientName || 'Nome não disponível'}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({calculateAge(anesthesia.patientBirthDate)} anos)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(anesthesia.status)}`}>
                        {anesthesia.status}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {anesthesia.procedureType === 'sus' ? (
                          <Building className="w-3 h-3 text-blue-600" />
                        ) : (
                          <CreditCard className="w-3 h-3 text-purple-600" />
                        )}
                        <span className="text-xs text-gray-600">
                          {anesthesia.procedureType === 'sus' ? 'SUS' : 'Convênio'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Procedimento:</p>
                      <p className="font-medium text-gray-900">
                        {anesthesia.procedimento || anesthesia.proposedSurgery || 'Não especificado'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Hospital:</p>
                      <p className="text-gray-900">{anesthesia.hospital || 'Não especificado'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Cirurgião:</p>
                      <p className="text-gray-900">{anesthesia.mainSurgeon || 'Não especificado'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Criada por:</p>
                      <p className="text-gray-900">
                        {anesthesia.metadata?.createdBy || 'Não disponível'}
                      </p>
                    </div>
                  </div>

                  {/* Dados da anestesia */}
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(anesthesia.surgeryDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(anesthesia.anesthesiaTimeStart)} - {formatTime(anesthesia.anesthesiaTimeEnd)}
                      </span>
                    </div>
                    
                    {anesthesia.patientPosition && (
                      <div>
                        <span>Posição: {anesthesia.patientPosition}</span>
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  {anesthesia.description && (
                    <p className="text-sm text-gray-700 mb-3">
                      {anesthesia.description}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(anesthesia)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                  
                  {anesthesia.status === 'Concluída' && (
                    <button
                      onClick={() => handleCreateSRPA(anesthesia)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 border border-green-200 rounded-lg hover:bg-green-50"
                    >
                      <Plus className="w-4 h-4" />
                      Criar SRPA
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredAnesthesias.length)} de {filteredAnesthesias.length} anestesias
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

export default AnesthesiaList;