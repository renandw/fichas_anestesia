import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getPatientsBasic, getPatientProcedures } from '../services/firestore';
import { 
  Search, 
  User, 
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader,
  AlertCircle
} from 'lucide-react';

const MyPatients = () => {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de filtro e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'procedures'
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [procedureTypeFilter, setProcedureTypeFilter] = useState('all'); // 'all', 'sus', 'convenio'
  
  const navigate = useNavigate();
  
  const goBack = () => {
    navigate('/dashboard');
  };  

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Buscar pacientes
  useEffect(() => {
    async function fetchPatientsAndProcedures() {
      setIsLoading(true);
      setError(null);
      
      try {
        // ETAPA 1: Carregar pacientes (rápido)
        const patientsData = await getPatientsBasic();
        setPatients(patientsData); // Mostra na tela imediatamente
        setIsLoading(false); // Página já utilizável
        
        // ETAPA 2: Carregar procedimentos em background
        const patientsWithProcedures = [];
        
        for (const patient of patientsData) {
          try {
            const procedures = await getPatientProcedures(patient.id);
            patientsWithProcedures.push({
              ...patient,
              procedures: procedures
            });
          } catch (procError) {
            patientsWithProcedures.push({
              ...patient,
              procedures: []
            });
          }
        }
        // Deduplicate patients by id
        const uniquePatients = patientsWithProcedures.filter(
          (p, index, arr) => index === arr.findIndex(o => o.id === p.id)
        );
        setPatients(uniquePatients);
        
      } catch (e) {
        setError('Erro ao carregar pacientes. Tente novamente.');
        setPatients([]);
        setIsLoading(false);
      }
    }
    
    fetchPatientsAndProcedures();
  }, []);


  // Filtros e busca otimizados
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(patient => 
        patient.name?.toLowerCase().includes(term) ||
        patient.cns?.includes(term) ||
        patient.procedures?.some(proc => 
          proc.procedimento?.toLowerCase().includes(term) ||
          proc.hospital?.toLowerCase().includes(term)
        )
      );
    }

    // Filtro por tipo de procedimento
    if (procedureTypeFilter !== 'all') {
      filtered = filtered.filter(patient => 
        patient.procedures?.some(proc => proc.procedureType === procedureTypeFilter)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'date':
          const dateA = new Date(a.birthDate || '1900-01-01');
          const dateB = new Date(b.birthDate || '1900-01-01');
          comparison = dateA - dateB;
          break;
        case 'procedures':
          comparison = (b.procedures?.length || 0) - (a.procedures?.length || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [patients, searchTerm, sortBy, sortOrder, procedureTypeFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);
  const paginatedPatients = filteredAndSortedPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Função para alternar ordenação
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Função para calcular idade
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';

    const birth = new Date(birthDate);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      return `${years} ano${years !== 1 ? 's' : ''}` + (months > 0 ? `, ${months} ${months !== 1 ? 'meses' : 'mês'}` : '');
    } else if (months > 0) {
      return `${months} ${months !== 1 ? 'meses' : 'mês'}` + (days > 0 ? `, ${days} dia${days !== 1 ? 's' : ''}` : '');
    } else {
      return `${days} dia${days !== 1 ? 's' : ''}`;
    }
  };

  // Componente de cabeçalho da tabela
  const TableHeader = ({ field, children, className = "" }) => (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === field && (
          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Erro ao carregar pacientes</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile-only header */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
        <button
          onClick={goBack}
          className="text-gray-400 hover:text-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <span className="ml-2 text-lg font-semibold text-gray-900">Pacientes</span>
        </div>
        <div className="w-6"></div>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between m-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Pacientes</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedPatients.length} paciente{filteredAndSortedPatients.length !== 1 ? 's' : ''} encontrado{filteredAndSortedPatients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/new-patient" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Link>
      </div>

      {/* Barra de busca e filtros */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-4">
          {/* Busca principal */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CNS ou procedimento…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Botão para mostrar/ocultar filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros avançados
            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </button>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Tipo de Procedimento</label>
                  <select
                    className="input-field"
                    value={procedureTypeFilter}
                    onChange={(e) => {
                      setProcedureTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="sus">SUS</option>
                    <option value="convenio">Convênio</option>
                  </select>
                </div>
                <div>
                  <label className="label">Ordenar por</label>
                  <select
                    className="input-field"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="name">Nome</option>
                    <option value="date">Data de Nascimento</option>
                    <option value="procedures">Número de Procedimentos</option>
                  </select>
                </div>
                <div>
                  <label className="label">Ordem</label>
                  <select
                    className="input-field"
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards para Mobile */}
      <div className="space-y-4 md:hidden">
        {filteredAndSortedPatients.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum paciente encontrado</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || procedureTypeFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando seu primeiro paciente.'
              }
            </p>
            {!searchTerm && procedureTypeFilter === 'all' && (
              <Link to="/new-patient-procedure" className="btn-primary">
                Criar Primeiro Paciente
              </Link>
            )}
          </div>
        ) : (
          filteredAndSortedPatients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-lg border p-4 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <Link to={`/patients/${patient.id}`} className="font-medium text-primary-600 hover:underline">
                    {patient.name || 'Nome não informado'}
                  </Link>
                  <p className="text-sm text-gray-500 capitalize">{patient.sex}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Idade:</strong> {calculateAge(patient.birthDate)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Nascimento:</strong> {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : 'Data não informada'}
              </p>
              <p className="text-sm text-gray-600"><strong>CNS:</strong> {patient.cns || '-'}</p>
              
              <div className="mt-2">
                {patient.procedures?.length > 0 ? (
                  patient.procedures.slice(0, 2).map((proc) => (
                    <Link key={proc.id} to={`/patients/${patient.id}/procedures/${proc.id}`} className="block text-sm text-primary-600 hover:underline">
                      {proc.procedimento || 'Procedimento'} {proc.hospital && `- ${proc.hospital}`}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Nenhum procedimento</span>
                )}
                {patient.procedures?.length > 2 && (
                  <p className="text-xs text-gray-500">+{patient.procedures.length - 2} outros...</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabela para telas maiores */}
      <div className="hidden md:block">
        {filteredAndSortedPatients.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum paciente encontrado</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || procedureTypeFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando seu primeiro paciente.'
              }
            </p>
            {!searchTerm && procedureTypeFilter === 'all' && (
              <Link to="/new-patient-procedure" className="btn-primary">
                Criar Primeiro Paciente
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHeader field="name">Nome do Paciente</TableHeader>
                      <TableHeader field="date">Idade</TableHeader>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CNS
                      </th>
                      <TableHeader field="procedures">Procedimentos</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <Link to={`/patients/${patient.id}`} className="text-sm font-medium text-primary-600 hover:underline">
                                {patient.name || 'Nome não informado'}
                              </Link>
                              <div className="text-sm text-gray-500 capitalize">
                                {patient.sex || 'Sexo não informado'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {calculateAge(patient.birthDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : 'Data não informada'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.cns || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="space-y-1">
                          {patient.procedures && patient.procedures.length > 0 ? (
                              patient.procedures.slice(0, 3).map((proc) => (
                              <div key={proc.id}>
                                  <Link 
                                  to={`/patients/${patient.id}/procedures/${proc.id}`}
                                  className="text-sm text-primary-600 hover:text-primary-800 hover:underline block"
                                  >
                                  {proc.procedimento || 'Procedimento'} 
                                  {proc.hospital && ` - ${proc.hospital}`}
                                  </Link>
                                  <div className="text-xs text-gray-500">
                                  {proc.procedureType === 'sus' ? 'SUS' : 'Convênio'} • 
                                  {proc.status === 'planned' ? ' Planejado' : ' ' + (proc.status || 'Status não definido')}
                                  </div>
                              </div>
                              ))
                          ) : (
                              <span className="text-sm text-gray-500">Nenhum procedimento</span>
                          )}
                          {patient.procedures && patient.procedures.length > 3 && (
                              <div className="text-xs text-gray-500">
                              +{patient.procedures.length - 3} procedimento{patient.procedures.length - 3 !== 1 ? 's' : ''}
                              </div>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedPatients.length)} de {filteredAndSortedPatients.length} resultados
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border text-sm rounded-md ${
                          currentPage === page
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyPatients;