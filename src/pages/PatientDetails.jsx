import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  getPatient,
  getPatientProcedures,
  deletePatient,
  deleteProcedure
} from '../services/firestore';
import { 
  ArrowLeft,
  User,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Stethoscope,
  Building2,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [patient, setPatient] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  // Carregar dados do paciente e procedimentos
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) {
        setError('ID do paciente não fornecido');
        return;
      }

      try {
        setLoading(true);
        
        // Carregar paciente e procedimentos em paralelo
        const [patientData, proceduresData] = await Promise.all([
          getPatient(patientId),
          getPatientProcedures(patientId)
        ]);
        
        if (!patientData) {
          setError('Paciente não encontrado');
          return;
        }

        setPatient(patientData);
        setProcedures(proceduresData || []);
        
      } catch (err) {
        console.error('Erro ao carregar dados do paciente:', err);
        setError('Erro ao carregar dados do paciente');
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  // Calcular idade
  const calculateAge = (birthDate) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  // Formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Status do procedimento
  const getProcedureStatus = (procedure) => {
    if (procedure.status === 'completed') return { label: 'Concluído', color: 'green' };
    if (procedure.status === 'in_progress') return { label: 'Em Andamento', color: 'blue' };
    if (procedure.status === 'planned') return { label: 'Planejado', color: 'yellow' };
    return { label: 'Ativo', color: 'gray' };
  };

  // Verificar permissões
  const canEdit = (item) => {
    return item.createdBy === userProfile?.uid || 
           item.sharedWith?.includes(userProfile?.uid);
  };

  // Excluir paciente
  const handleDeletePatient = async () => {
    try {
      await deletePatient(patientId);
      toast.success('Paciente excluído com sucesso');
      navigate('/patients');
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast.error('Erro ao excluir paciente');
    }
  };

  // Excluir procedimento
  const handleDeleteProcedure = async (procedureId) => {
    try {
      await deleteProcedure(patientId, procedureId);
      setProcedures(procedures.filter(p => p.id !== procedureId));
      toast.success('Procedimento excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir procedimento:', error);
      toast.error('Erro ao excluir procedimento');
    }
  };

  // Confirmar exclusão
  const confirmDelete = (item, type) => {
    setDeletingItem({ ...item, type });
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (deletingItem.type === 'patient') {
      await handleDeletePatient();
    } else if (deletingItem.type === 'procedure') {
      await handleDeleteProcedure(deletingItem.id);
    }
    setShowDeleteModal(false);
    setDeletingItem(null);
  };

  const goBack = () => {
    navigate('/patients');
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados do paciente...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Erro</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={goBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Lista de Pacientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
        <button
          onClick={goBack}
          className="text-gray-400 hover:text-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <User className="h-5 w-5 text-blue-600" />
          <span className="ml-2 text-lg font-semibold text-gray-900">Paciente</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {showActionsMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <Link
                to={`/patients/${patientId}/edit`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Editar Paciente
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Paciente</h1>
            <p className="text-sm text-gray-600">
              Visualize e gerencie as informações do paciente e seus procedimentos
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/patients/${patientId}/newproceduresurgery`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Ficha Anestésica
          </Link>
          <Link
            to={`/patients/${patientId}/edit`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Identificação
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Informações do Paciente */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card: Dados Pessoais */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
              <User className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nome Completo</label>
                <p className="font-medium text-gray-900">{patient.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Data de Nascimento</label>
                  <p className="font-medium text-gray-900">{formatDate(patient.birthDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Idade</label>
                  <p className="font-medium text-gray-900">{calculateAge(patient.birthDate)} anos</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Sexo</label>
                <p className="font-medium text-gray-900 capitalize">{patient.sex}</p>
              </div>
              
              {patient.cns && (
                <div>
                  <label className="text-sm text-gray-600">CNS</label>
                  <p className="font-medium text-gray-900">{patient.cns}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Botões de Ação */}
          <div className="lg:hidden space-y-3">
            <Link
              to={`/patients/${patientId}/newproceduresurgery`}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Nova Ficha Anestésica
            </Link>
          </div>
        </div>

        {/* Coluna Procedimentos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header dos Procedimentos */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">
                {procedures.length} Cirurgia(s) Registrada(s)
              </p>
            </div>
          </div>

          {/* Lista de Procedimentos */}
          {procedures.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum procedimento registrado</h3>
              <p className="text-gray-600 mb-4">
                Comece criando o primeiro procedimento para este paciente.
              </p>
              <Link
                to={`/patients/${patientId}/newproceduresurgery`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Iniciar Ficha Anestésica
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {procedures.map((procedure) => {
                const canEditProcedure = canEdit(procedure);
                const formattedDate = formatDate(procedure.createdAt?.toDate?.() || procedure.createdAt);
                return (
                  <div
                    key={procedure.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Linha 1: Nome do procedimento à esquerda, data à direita */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-1">
                      <span className="text-xl font-bold text-gray-900">{procedure.procedimento || 'Procedimento'}</span>
                      <span className="text-sm text-gray-500">{formattedDate}</span>
                    </div>
                    {/* Linha 2: Hospital • Cirurgião */}
                    <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 mb-2 text-base text-gray-700">
                      <span>{procedure.hospital}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="md:ml-0">{procedure.mainSurgeon}</span>
                    </div>
                    {/* Linha 3: Botões de edição */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Link
                        to={`/patients/${patientId}/procedures/${procedure.id}`}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
                      >
                        <Stethoscope className="h-3 w-3 mr-1" />
                        Editar Ficha Anestésica
                      </Link>
                      <Link
                        to={`/patients/${patientId}/procedures/${procedure.id}#preanesthetic`}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 flex items-center"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Editar Avaliação Pré-Anestésica
                      </Link>
                      <Link
                        to={`/patients/${patientId}/procedures/${procedure.id}#srpa`}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center"
                      >
                        <User className="h-3 w-3 mr-1" />
                        Editar Fichas RPA
                      </Link>
                      {/* Botões de ações (editar/excluir) à direita, só se pode editar */}
                      {canEditProcedure && (
                        <>
                          <Link
                            to={`/patients/${patientId}/procedures/${procedure.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => confirmDelete(procedure, 'procedure')}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    {/* Linha 4: Botões de visualização */}
                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      <Link
                        to={`/patients/${patientId}/procedures/${procedure.id}/surgeries`}
                        className="px-3 py-1 bg-white text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Visualizar Ficha Anestésica
                      </Link>
                      <Link
                        to={`/patients/${patientId}/procedures/${procedure.id}/preanesthetic/view`}
                        className="px-3 py-1 bg-white text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Visualizar Avaliação Pré-Anestésica
                      </Link>
                      <Link
                        to={`/patients/${patientId}/procedures/${procedure.id}/rpa/view`}
                        className="px-3 py-1 bg-white text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Ver Ficha de SRPA
                      </Link>
                    </div>
                    {/* Rodapé: Tipo e Peso */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        Tipo: {procedure.procedureType === 'sus' ? 'SUS' : 'Convênio'}
                        {procedure.patientWeight && ` • Peso: ${procedure.patientWeight}kg`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar Exclusão
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {deletingItem?.type === 'patient' 
                  ? `Tem certeza que deseja excluir o paciente "${patient.name}"? Esta ação não pode ser desfeita e removerá todos os procedimentos associados.`
                  : `Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita.`
                }
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;