import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Stethoscope, 
  FileText, 
  Activity,
  Clock,
  AlertCircle,
  Lock,
  Users,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatient } from '../services/patientService';
import { getSurgery, updateSurgery } from '../services/surgeryService';
import { 
  getSurgeryAnesthesia, 
  getSurgeryPreAnesthesia, 
  getSurgerySRPA,
  checkSubcollectionExists 
} from '../services/anesthesiaService';
import PatientDisplay from '../newvariations/PatientDisplay';
import SurgeryForm from './SurgeryForm/SurgeryForm';
import ShareSurgery from '../new/ShareSurgery';
import SurgeryDisplay from '../newvariations/SurgeryDisplay';
import AnesthesiaFormComponent from './AnesthesiaFormComponent';
import PreAnestheticDisplay from '../newvariations/PreAnestheticDisplay';
import AnesthesiaDisplay from '../newvariations/AnesthesiaDisplay';

const SurgeryDetails = () => {
  console.log("Current pathname:", window.location.pathname);
  const { patientId, surgeryId } = useParams();
  console.log("Params:", { patientId, surgeryId });
  const navigate = useNavigate();
  const { currentUserId, isAuthenticated } = useAuth();

  // Estados principais
  const [patient, setPatient] = useState(null);
  const [surgery, setSurgery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de UI
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInlineAnesthesiaForm, setShowInlineAnesthesiaForm] = useState(false);

  // Estados das subcoleções
  const [subcollections, setSubcollections] = useState({
    anesthesia: { exists: false, data: null, status: null },
    preAnesthesia: { exists: false, data: null, status: null },
    srpa: { exists: false, data: null, status: null }
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Carregando dados da cirurgia:', { patientId, surgeryId });

      // Carregar paciente e cirurgia
      const [patientData, surgeryData] = await Promise.all([
        getPatient(patientId),
        getSurgery(patientId, surgeryId)
      ]);

      if (!patientData) {
        throw new Error('Paciente não encontrado');
      }
      if (!surgeryData) {
        throw new Error('Cirurgia não encontrada');
      }

      setPatient(patientData);
      setSurgery({ ...surgeryData, patientId });

      // Carregar subcoleções
      await loadSubcollections();

      console.log('✅ Dados carregados com sucesso');
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar subcoleções
  const loadSubcollections = async () => {
    try {
      console.log('🔍 Verificando subcoleções...');

      const [anesthesiaData, preAnesthesiaData, srpaData] = await Promise.all([
        getSurgeryAnesthesia(patientId, surgeryId),
        getSurgeryPreAnesthesia(patientId, surgeryId),
        getSurgerySRPA(patientId, surgeryId)
      ]);

      setSubcollections({
        anesthesia: {
          exists: !!anesthesiaData,
          data: anesthesiaData,
          status: anesthesiaData?.status || null
        },
        preAnesthesia: {
          exists: !!preAnesthesiaData,
          data: preAnesthesiaData,
          status: preAnesthesiaData?.status || null
        },
        srpa: {
          exists: !!srpaData,
          data: srpaData,
          status: srpaData?.status || null
        }
      });

      console.log('✅ Subcoleções carregadas:', {
        anesthesia: !!anesthesiaData,
        preAnesthesia: !!preAnesthesiaData,
        srpa: !!srpaData
      });
    } catch (err) {
      console.error('❌ Erro ao carregar subcoleções:', err);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect triggered", patientId, surgeryId);
    if (patientId && surgeryId) {
      loadData();
    }
  }, [patientId, surgeryId]);

  // Atualizar status automático da cirurgia
  const updateSurgeryStatus = async () => {
    if (!surgery) return;

    let newStatus = surgery.status;

    // Lógica de status automático
    if (subcollections.srpa.exists && subcollections.srpa.status === 'Concluída') {
      newStatus = 'Concluída';
    } else if (subcollections.anesthesia.exists && subcollections.anesthesia.status === 'Em andamento') {
      newStatus = 'Em andamento';
    } else if (!subcollections.anesthesia.exists && !subcollections.preAnesthesia.exists) {
      newStatus = 'Agendada';
    }

    // Atualizar se mudou
    if (newStatus !== surgery.status) {
      try {
        await updateSurgery(patientId, surgeryId, { status: newStatus }, currentUserId);
        setSurgery(prev => ({ ...prev, status: newStatus }));
        console.log(`✅ Status da cirurgia atualizado para: ${newStatus}`);
      } catch (err) {
        console.error('❌ Erro ao atualizar status:', err);
      }
    }
  };

  useEffect(() => {
    updateSurgeryStatus();
  }, [subcollections]);

  // Verificar autenticação
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Handlers
  const handleSurgeryUpdated = (updatedSurgery) => {
    setSurgery(updatedSurgery);
    setIsEditing(false);
    console.log('✅ Cirurgia atualizada');
  };

  const handleShareComplete = (updatedSurgery, selectedUserIds) => {
    setSurgery(updatedSurgery);
    setShowShareModal(false);
    console.log('✅ Compartilhamento atualizado');
  };

  const handleNavigateToSubcollection = (type) => {
    let targetRoute;

    if (type === 'anesthesia') {
      const anesthesiaId = subcollections?.anesthesia?.data?.id;
      if (!anesthesiaId) {
        console.warn('⚠️ Anesthesia ID não encontrado.');
        return;
      }
      targetRoute = `/patients/${patientId}/surgeries/${surgeryId}/anesthesia/${anesthesiaId}`;
    } else if (type === 'preAnesthesia') {
      targetRoute = `/patients/${patientId}/surgeries/${surgeryId}/preanesthesia`;
    } else if (type === 'srpa') {
      targetRoute = `/patients/${patientId}/surgeries/${surgeryId}/srpa`;
    }

    navigate(targetRoute);
  };

  const handleCreateSubcollection = (type) => {
    if (type === 'anesthesia') {
      setShowInlineAnesthesiaForm(true);
      return;
    }
    const routes = {
      anesthesia: `/patients/${patientId}/surgeries/${surgeryId}/anesthesia/new`,
      preAnesthesia: `/patients/${patientId}/surgeries/${surgeryId}/preanesthesia/new`, 
      srpa: `/patients/${patientId}/surgeries/${surgeryId}/srpa/new`
    };
    navigate(routes[type]);
  };

  // Componente de card de subcoleção - versão mobile e desktop
  const SubcollectionCard = ({ type, title, icon: Icon, data, canCreate = true, children }) => {
    const { exists, status } = subcollections[type];
    const isBlocked = type === 'srpa' && (!subcollections.anesthesia.exists || subcollections.anesthesia.status !== 'Concluída');

    const getStatusColor = (status) => {
      const colors = {
        'Em andamento': 'bg-green-100 text-green-800 border-green-200',
        'Concluída': 'bg-blue-100 text-blue-800 border-blue-200',
        'Pausada': 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
      return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDateTime = (dateTime) => {
      if (!dateTime) return null;
      return new Date(dateTime).toLocaleDateString('pt-BR');
    };

    // Mobile View
    const MobileView = () => (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${isBlocked ? 'opacity-50 bg-gray-50' : ''}`}>
        {/* Header */}
        <div className={`px-3 py-2 ${
          isBlocked ? 'bg-gray-100' : 
          type === 'anesthesia' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
          type === 'preAnesthesia' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
          'bg-gradient-to-r from-emerald-500 to-emerald-600'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              {isBlocked ? <Lock className="w-3 h-3 text-white" /> : <Icon className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm leading-tight truncate">{title}</h3>
              {isBlocked && (
                <p className="text-white/70 text-xs truncate">Requer anestesia concluída</p>
              )}
            </div>
            {exists && status && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border bg-white/90 ${getStatusColor(status).replace('bg-', 'text-').replace('-100', '-700')}`}>
                {status}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {exists ? (
            <div className="space-y-3">
              {data?.surgeryDate && (
                <div className="text-xs text-gray-600 flex items-center gap-1 leading-tight">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(data.surgeryDate)}
                </div>
              )}

              {(data?.anesthesiaTimeStart || data?.sRPATimeStart) && (
                <div className="text-xs text-gray-600 flex items-center gap-1 leading-tight">
                  <Clock className="w-3 h-3" />
                  {data.anesthesiaTimeStart || data.sRPATimeStart} - {data.anesthesiaTimeEnd || data.sRPATimeEnd || 'Em andamento'}
                </div>
              )}

              {/* Render children instead of default button for anesthesia and preAnesthesia */}
              {(type === "preAnesthesia" || type === "anesthesia")
                ? children
                : (
                  <button
                    onClick={() => handleNavigateToSubcollection(type)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                      type === 'anesthesia' ? 'bg-purple-600 hover:bg-purple-700' :
                      type === 'preAnesthesia' ? 'bg-indigo-600 hover:bg-indigo-700' :
                      'bg-emerald-600 hover:bg-emerald-700'
                    } text-white`}
                  >
                    <FileText className="w-3 h-3" />
                    Ver Detalhes
                  </button>
                )
              }
            </div>
          ) : (
            <div className="text-center py-3">
              {isBlocked ? (
                <div className="text-gray-500">
                  <Lock className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs">Bloqueado</p>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 mb-2">
                    <Icon className="w-6 h-6 mx-auto" />
                  </div>
                  {canCreate && (
                    <button
                      onClick={() => handleCreateSubcollection(type)}
                      className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 text-xs flex items-center justify-center gap-1"
                    >
                      <Icon className="w-3 h-3" />
                      Criar {title}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    // Desktop View
    const DesktopView = () => (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all ${isBlocked ? 'opacity-50 bg-gray-50' : 'hover:shadow-sm'}`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b ${
          isBlocked ? 'bg-gray-100 border-gray-200' : 
          type === 'anesthesia' ? 'bg-purple-50 border-purple-100' :
          type === 'preAnesthesia' ? 'bg-indigo-50 border-indigo-100' :
          'bg-emerald-50 border-emerald-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isBlocked ? 'bg-gray-200' :
                type === 'anesthesia' ? 'bg-purple-100' :
                type === 'preAnesthesia' ? 'bg-indigo-100' :
                'bg-emerald-100'
              }`}>
                {isBlocked ? <Lock className="w-4 h-4 text-gray-500" /> : 
                <Icon className={`w-4 h-4 ${
                  type === 'anesthesia' ? 'text-purple-600' :
                  type === 'preAnesthesia' ? 'text-indigo-600' :
                  'text-emerald-600'
                }`} />}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 leading-snug">{title}</h3>
                {isBlocked && (
                  <p className="text-sm text-gray-500 truncate">Requer anestesia concluída</p>
                )}
              </div>
            </div>
            
            {exists && status && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                {status}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4">
          {exists ? (
            <div className="space-y-4">
              {data?.surgeryDate && (
                <div className="text-sm text-gray-600 flex items-center gap-1 leading-snug">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(data.surgeryDate)}
                </div>
              )}

              {(data?.anesthesiaTimeStart || data?.sRPATimeStart) && (
                <div className="text-sm text-gray-600 flex items-center gap-1 leading-snug">
                  <Clock className="w-3 h-3" />
                  {data.anesthesiaTimeStart || data.sRPATimeStart} - {data.anesthesiaTimeEnd || data.sRPATimeEnd || 'Em andamento'}
                </div>
              )}

              {/* Render children instead of default button for anesthesia and preAnesthesia */}
              {(type === "preAnesthesia" || type === "anesthesia")
                ? children
                : (
                  <button
                    onClick={() => handleNavigateToSubcollection(type)}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                      type === 'anesthesia' ? 'bg-purple-600 hover:bg-purple-700' :
                      type === 'preAnesthesia' ? 'bg-indigo-600 hover:bg-indigo-700' :
                      'bg-emerald-600 hover:bg-emerald-700'
                    } text-white transition-colors`}
                  >
                    <FileText className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                )
              }
            </div>
          ) : (
            <div className="text-center py-4">
              {isBlocked ? (
                <div className="text-gray-500">
                  <Lock className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">Bloqueado</p>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 mb-3">
                    <Icon className="w-8 h-8 mx-auto" />
                  </div>
                  {canCreate && (
                    <button
                      onClick={() => handleCreateSubcollection(type)}
                      className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      Criar {title}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    return (
      <>
        <div className="block md:hidden">
          <MobileView />
        </div>
        <div className="hidden md:block">
          <DesktopView />
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da cirurgia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-6 text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao Carregar</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Bar - FORA do container */}
      <div className="sm:hidden relative flex items-center h-14 mb-4 px-4 bg-white shadow-md border-b border-gray-200">
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold text-gray-900 truncate max-w-[60%]">
          {surgery?.code || 'Cirurgia'}
        </h1>
      </div>
      
      {/* Container apenas para o conteúdo */}
      <div className="max-width">
        {/* Header e Breadcrumb */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="flex-1 min-w-0">
              <nav aria-label="breadcrumb" className="hidden sm:flex items-center gap-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-base mb-1">
                <button 
                  onClick={() => navigate('/patients')} 
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Pacientes
                </button>
                <span className="text-gray-400">›</span>
                <button 
                  onClick={() => navigate(`/patients/${patientId}`)} 
                  className="text-blue-600 hover:underline"
                >
                  {patient?.patientName}
                </button>
                <span className="text-gray-400">›</span>
                <span className="font-semibold text-gray-900">{surgery?.code || 'Cirurgia'}</span>
              </nav>
            </div>
          </div>

          {/* Status da cirurgia */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${
              surgery?.status === 'Concluída' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              surgery?.status === 'Em andamento' ? 'bg-green-100 text-green-800 border-green-200' :
              'bg-gray-100 text-gray-800 border-gray-200'
            }`}>
              {surgery?.status || 'Agendada'}
            </span>
            
            {surgery?.sharedWith?.length > 0 && (
              <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Compartilhada com {surgery.sharedWith.length} usuário(s)</span>
                <span className="md:hidden">{surgery.sharedWith.length} usuário(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-3">
          {/* Dados do Paciente */}
         <div className="bg-white rounded-lg border border-gray-200 p-4">
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-3">
               <div>
                 <h3 className="ext-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-6">Paciente</h3>
               </div>
             </div>
           </div>
           <PatientDisplay patient={patient} compact={false} />
         </div>

          {/* Dados da Cirurgia */}
          <div className="relative">
            {isEditing ? (
              <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4 text-blue-600" />
                    <h2 className="text-base md:text-lg font-semibold text-blue-700">Editar dados da cirurgia</h2>
                  </div>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
                <SurgeryForm
                  mode="edit"
                  existingSurgery={surgery}
                  selectedPatient={patient}
                  onSurgeryUpdated={handleSurgeryUpdated}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {/* Header das Cirurgias */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="ext-base md:text-lg font-semibold text-gray-900">Cirurgia</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit className="w-3 h-3 md:w-4 md:h-4" />
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </button>
                    
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden md:inline">Gerenciar Acesso</span>
                      <span className="md:hidden">Acesso</span>
                    </button>
                  </div>
                </div>
                <SurgeryDisplay surgery={surgery} compact={false} />
              </div>
            )}
          </div>



          {/* Cards das Subcoleções */}
          {showInlineAnesthesiaForm && (
            <div className="bg-white rounded-lg md:rounded-xl border border-purple-200 p-4 md:p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-semibold text-purple-700">Nova Ficha Anestésica</h2>
                <button
                  onClick={() => setShowInlineAnesthesiaForm(false)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Cancelar
                </button>
              </div>
              <AnesthesiaFormComponent
                mode="create"
                selectedPatient={patient}
                selectedSurgery={surgery}
                onAnesthesiaCreated={(newData) => {
                  setShowInlineAnesthesiaForm(false);
                  loadSubcollections();
                }}
                onCancel={() => setShowInlineAnesthesiaForm(false)}
              />
            </div>
          )}
          <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-8">Documentos Anestésicos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <SubcollectionCard
                type="anesthesia"
                title="Ficha Anestésica"
                icon={Stethoscope}
                data={subcollections.anesthesia.data}
              >
                {subcollections.anesthesia.exists && (
                  <button
                    onClick={() => handleNavigateToSubcollection("anesthesia")}
                    className="w-full text-left hover:ring-2 hover:ring-purple-300 rounded-lg transition"
                  >
                    <AnesthesiaDisplay
                      anesthesia={subcollections.anesthesia.data}
                      compact
                    />
                  </button>
                )}
              </SubcollectionCard>
              
              <SubcollectionCard
                type="preAnesthesia"
                title="Avaliação Pré-anestésica"
                icon={FileText}
                data={subcollections.preAnesthesia.data}
                canCreate={!subcollections.preAnesthesia.exists}
              >
                {subcollections.preAnesthesia.exists && (
                  <button
                    onClick={() => handleNavigateToSubcollection("preAnesthesia")}
                    className="w-full text-left hover:ring-2 hover:ring-indigo-300 rounded-lg transition"
                  >
                    <PreAnestheticDisplay
                      preAnesthesia={subcollections.preAnesthesia.data}
                      compact
                    />
                  </button>
                )}
              </SubcollectionCard>
              
              <SubcollectionCard
                type="srpa"
                title="SRPA"
                icon={Activity}
                data={subcollections.srpa.data}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg md:rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Gerenciar Acesso à Cirurgia</h3>
            </div>
            <div className="p-4">
              <ShareSurgery
                surgery={surgery}
                onShareComplete={handleShareComplete}
                onSkip={() => setShowShareModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurgeryDetails;