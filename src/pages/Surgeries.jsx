import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserSurgeries, getUserSurgeriesCount } from '../services/firestore';
import { 
  Filter, 
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const Surgeries = () => {
  const { userProfile } = useAuth();
  
  // Estados principais
  const [allSurgeries, setAllSurgeries] = useState([]);
  const [filteredSurgeries, setFilteredSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    patientName: '',
    procedure: '',
    surgeon: '',
    hospital: '',
    insurance: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Carregar todas as cirurgias
  useEffect(() => {
    const loadAllSurgeries = async () => {
      if (!userProfile?.uid) return;
      
      try {
        setLoading(true);
        console.log('🔍 Carregando todas as cirurgias...');
        
        // Buscar todas as cirurgias (sem limit) e o total
        const [surgeries, total] = await Promise.all([
          getUserSurgeries(userProfile.uid, 1000), // Limit alto para pegar todas
          getUserSurgeriesCount(userProfile.uid)
        ]);
        
        console.log('📋 Total de cirurgias encontradas:', surgeries.length);
        
        setAllSurgeries(surgeries);
        setFilteredSurgeries(surgeries);
        setTotalCount(total);
        
      } catch (error) {
        console.error('❌ Erro ao carregar cirurgias:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllSurgeries();
  }, [userProfile]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...allSurgeries];
    
    // Filtro por nome do paciente
    if (filters.patientName) {
      filtered = filtered.filter(surgery =>
        surgery.patientName?.toLowerCase().includes(filters.patientName.toLowerCase())
      );
    }
    
    // Filtro por procedimento
    if (filters.procedure) {
      filtered = filtered.filter(surgery => {
        const procedure = surgery.proposedSurgery || getProcedureDisplay(surgery);
        return procedure?.toLowerCase().includes(filters.procedure.toLowerCase());
      });
    }
    
    // Filtro por cirurgião
    if (filters.surgeon) {
      filtered = filtered.filter(surgery =>
        surgery.mainSurgeon?.toLowerCase().includes(filters.surgeon.toLowerCase())
      );
    }
    
    // Filtro por hospital
    if (filters.hospital) {
      filtered = filtered.filter(surgery => {
        const hospitalName = getHospitalName(surgery);
        return hospitalName?.toLowerCase().includes(filters.hospital.toLowerCase());
      });
    }
    
    // Filtro por convênio
    if (filters.insurance) {
      filtered = filtered.filter(surgery =>
        surgery.insuranceName?.toLowerCase().includes(filters.insurance.toLowerCase())
      );
    }
    
    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(surgery =>
        surgery.status === filters.status
      );
    }
    
    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter(surgery =>
        surgery.type === filters.type
      );
    }
    
    // Filtro por data
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(surgery => {
        const surgeryDate = surgery.surgeryDate ? new Date(surgery.surgeryDate) : 
                           surgery.createdAt?.seconds ? new Date(surgery.createdAt.seconds * 1000) : 
                           new Date(surgery.createdAt);
        return surgeryDate >= fromDate;
      });
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Final do dia
      filtered = filtered.filter(surgery => {
        const surgeryDate = surgery.surgeryDate ? new Date(surgery.surgeryDate) : 
                           surgery.createdAt?.seconds ? new Date(surgery.createdAt.seconds * 1000) : 
                           new Date(surgery.createdAt);
        return surgeryDate <= toDate;
      });
    }
    
    setFilteredSurgeries(filtered);
    setCurrentPage(1); // Reset para primeira página
  }, [filters, allSurgeries]);

  // Funções auxiliares
  const getProcedureDisplay = (surgery) => {
    if (surgery.proposedSurgery) {
      return surgery.proposedSurgery;
    }
    
    if (surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0) {
      const validProcedures = surgery.cbhpmProcedures.filter(p => p.procedimento && p.procedimento.trim() !== '');
      
      if (validProcedures.length === 0) {
        return 'Procedimento não informado';
      }
      
      if (validProcedures.length === 1) {
        return validProcedures[0].procedimento;
      } else {
        const remaining = validProcedures.length - 1;
        return `${validProcedures[0].procedimento} (+${remaining} ${remaining === 1 ? 'outro' : 'outros'})`;
      }
    }
    
    return 'Procedimento não informado';
  };

  const getHospitalName = (surgery) => {
    const rawHospital = surgery?.hospital;
  
    if (!rawHospital) return 'Não informado';
  
    if (typeof rawHospital === 'string') {
      try {
        const parsed = JSON.parse(rawHospital);
        return parsed?.name || rawHospital;
      } catch {
        return rawHospital;
      }
    }
  
    if (typeof rawHospital === 'object') {
      return rawHospital?.name || 'Não informado';
    }
  
    return 'Não informado';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'completado') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Finalizada</span>;
    }
    if (status === 'em_andamento') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Em andamento</span>;
    }
    if (status === 'aguardando_finalizacao') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Aguardando</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Desconhecido</span>;
  };

  const getTypeBadge = (type, insuranceName) => {
    if (type === 'sus') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">SUS</span>;
    }
    
    const displayName = insuranceName || 'Convênio';
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{displayName}</span>;
  };

  const clearFilters = () => {
    setFilters({
      patientName: '',
      procedure: '',
      surgeon: '',
      hospital: '',
      insurance: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Paginação
  const totalPages = Math.ceil(filteredSurgeries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSurgeries = filteredSurgeries.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todas as Cirurgias</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? 'Carregando...' : `${filteredSurgeries.length} de ${totalCount} cirurgias`}
            {hasActiveFilters && ' (filtradas)'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-50 text-primary-700' : ''}`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {Object.values(filters).filter(f => f !== '').length}
              </span>
            )}
          </button>
          
          <Link to="/new-surgery" className="btn-primary flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Nova Cirurgia
          </Link>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Paciente
              </label>
              <input
                type="text"
                value={filters.patientName}
                onChange={(e) => handleFilterChange('patientName', e.target.value)}
                placeholder="Buscar por nome..."
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Procedimento
              </label>
              <input
                type="text"
                value={filters.procedure}
                onChange={(e) => handleFilterChange('procedure', e.target.value)}
                placeholder="Buscar procedimento..."
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cirurgião
              </label>
              <input
                type="text"
                value={filters.surgeon}
                onChange={(e) => handleFilterChange('surgeon', e.target.value)}
                placeholder="Buscar cirurgião..."
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital
              </label>
              <input
                type="text"
                value={filters.hospital}
                onChange={(e) => handleFilterChange('hospital', e.target.value)}
                placeholder="Buscar hospital..."
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Convênio
              </label>
              <input
                type="text"
                value={filters.insurance}
                onChange={(e) => handleFilterChange('insurance', e.target.value)}
                placeholder="Buscar convênio..."
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">Todos os status</option>
                <option value="completado">Finalizada</option>
                <option value="em_andamento">Em andamento</option>
                <option value="aguardando_finalizacao">Aguardando</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input-field"
              >
                <option value="">SUS e Convênio</option>
                <option value="sus">SUS</option>
                <option value="convenio">Convênio</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de Cirurgias */}
      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredSurgeries.length > 0 ? (
          <>
            {/* Tabela para desktop */}
            <div className="hidden lg:block overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procedimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cirurgião
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hospital
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSurgeries.map((surgery) => (
                    <tr 
                      key={surgery.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/surgery/${surgery.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary-600 font-medium">
                        {surgery.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {surgery.patientName || 'Nome não informado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={getProcedureDisplay(surgery)}>
                          {getProcedureDisplay(surgery)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {surgery.mainSurgeon || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getHospitalName(surgery)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(surgery.surgeryDate || surgery.createdAt)}
                        <div className="text-xs text-gray-400">
                          {formatTime(surgery.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(surgery.status)}
                          {getTypeBadge(surgery.type, surgery.insuranceName)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/surgery/${surgery.id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Cards para tablet/mobile */}
            <div className="block lg:hidden space-y-4">
              {currentSurgeries.map((surgery) => (
                <div
                  key={surgery.id}
                  className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/surgery/${surgery.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-base font-semibold text-gray-900">
                        {surgery.patientName || 'Nome não informado'}
                      </div>
                      <div className="text-sm font-mono text-primary-600">
                        {surgery.id}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 truncate" title={getProcedureDisplay(surgery)}>
                      <strong>Procedimento:</strong> {getProcedureDisplay(surgery)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><strong>Cirurgião:</strong> {surgery.mainSurgeon || 'N/A'}</div>
                      <div><strong>Hospital:</strong> {getHospitalName(surgery)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div>
                        {formatDate(surgery.surgeryDate || surgery.createdAt)} às {formatTime(surgery.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(surgery.status)}
                        {getTypeBadge(surgery.type, surgery.insuranceName)}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <Link
                        to={`/surgery/${surgery.id}`}
                        className="text-primary-600 hover:text-primary-900 flex items-center gap-1 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Ficha Completa
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
                
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredSurgeries.length)}</span> de{' '}
                      <span className="font-medium">{filteredSurgeries.length}</span> resultados
                    </p>
                  </div>
                  
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              pageNum === currentPage
                                ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
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
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'Nenhuma cirurgia encontrada' : 'Nenhuma cirurgia cadastrada'}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters 
                ? 'Tente ajustar os filtros para encontrar o que procura.'
                : 'Comece criando sua primeira cirurgia.'
              }
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="btn-primary">
                Limpar Filtros
              </button>
            ) : (
              <Link to="/new-surgery" className="btn-primary">
                Criar Primeira Cirurgia
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Surgeries;