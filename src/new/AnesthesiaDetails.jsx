import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Activity, 
  Pill, 
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatient, updatePatient } from '../services/patientService';
import { getSurgery, updateSurgery } from '../services/surgeryService';
import AnesthesiaIdentification from './newanesthesia/AnesthesiaIdentification';
import { getSurgeryAnesthesia, getSurgeryPreAnesthesia } from '../services/anesthesiaService';
import PreAnestheticForm from './PreAnestheticForm';
import PreAnestheticDisplay from '../newvariations/PreAnestheticDisplay';
import MedicationsSection from '../newlist/MedicationsSection';
import { updateAnesthesia } from '../services/anesthesiaService';
import VitalSignsSection from './VitalSigns/VitalSignsSection';
import AnesthesiaDescription from './anesthesiadescription/AnesthesiaDescription';
import AnesthesiaPreview from './newpreview/AnesthesiaPreview'

// Componentes de Tab distintos por device
const TabButtonMobile = React.memo(function TabButtonMobileMemo({ id, label, icon: Icon, isActive, onClick, hasData, isRequired, activeRef }) {
  const handleClick = React.useCallback(() => onClick(id), [onClick, id]);
  return (
    <button
      onClick={() => onClick(id)}
      className={`relative flex flex-col items-center justify-start pt-1 px-3 py-3 font-medium text-xs transition-all duration-200 whitespace-nowrap flex-1 basis-0 rounded-lg ${
        isActive ? 'transform scale-105' : 'hover:scale-102'
      }`}
    >
      {/* Ícone */}
      <div className={`relative rounded-full p-2 flex items-center justify-center transition-all duration-200 ${
        isActive 
          ? 'bg-white text-blue-700 shadow-lg' 
          : 'text-white/85 hover:bg-white/10'
      }`}>
        <Icon className="w-5 h-5 [stroke-width:2.7]" />
      </div>

      {/* Label flutuante - bem próxima do ícone */}
      {isActive && (
        <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 -mt-2 rounded-lg px-2 py-0.5 text-[11px] font-bold bg-white/95 text-blue-900 shadow ring-1 ring-white/60 whitespace-nowrap z-10">
          {label}
        </span>
      )}
    </button>
  );
}, (prev, next) => (
  prev.id === next.id &&
  prev.label === next.label &&
  prev.icon === next.icon &&
  prev.isActive === next.isActive &&
  prev.onClick === next.onClick &&
  prev.activeRef === next.activeRef
));

const TabButtonDesktop = React.memo(function TabButtonDesktopMemo({ id, label, icon: Icon, isActive, onClick, hasData, isRequired, activeRef }) {
  const handleClick = React.useCallback(() => onClick(id), [onClick, id]);
  return (
    <button
      ref={isActive ? activeRef : null}
      onClick={handleClick}
      className={`flex items-center ${isActive ? 'gap-2 px-5 py-3' : 'gap-2 px-4 py-2'} font-medium text-base transition-all whitespace-nowrap snap-start shrink-0 rounded-t-lg ${
        isActive 
          ? 'border-b-4 border-blue-800 text-white bg-blue-700 shadow-sm' 
          : 'border-b-2 border-transparent text-white bg-gray-500 hover:bg-gray-600'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {hasData && (
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      )}
      {isRequired && !hasData && (
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      )}
    </button>
  );
}, (prev, next) => (
  prev.id === next.id &&
  prev.label === next.label &&
  prev.icon === next.icon &&
  prev.isActive === next.isActive &&
  prev.hasData === next.hasData &&
  prev.isRequired === next.isRequired &&
  prev.onClick === next.onClick &&
  prev.activeRef === next.activeRef
));

// TabBars separadas por device
const MobileTabBar = React.memo(function MobileTabBarMemo({ tabs, activeTab, setActiveTab, activeTabRef }) {
  return (
    <div className="flex sm:hidden items-stretch w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-2 pt-2 pb-5 shadow-inner rounded-t-lg mb-2">
      {tabs.map(tab => (
        <TabButtonMobile
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id}
          onClick={setActiveTab}
          hasData={tab.hasData}
          isRequired={tab.isRequired}
          activeRef={activeTab === tab.id ? activeTabRef : undefined}
        />
      ))}
    </div>
  );
}, (prev, next) => prev.tabs === next.tabs && prev.activeTab === next.activeTab);

const DesktopTabBar = React.memo(function DesktopTabBarMemo({ tabs, activeTab, setActiveTab, activeTabRef }) {
  return (
    <div className="hidden sm:flex flex-wrap bg-white border-b border-gray-200 px-4 sm:px-6">
      {tabs.map(tab => (
        <TabButtonDesktop
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id}
          onClick={setActiveTab}
          hasData={tab.hasData}
          isRequired={tab.isRequired}
          activeRef={activeTab === tab.id ? activeTabRef : undefined}
        />
      ))}
    </div>
  );
}, (prev, next) => prev.tabs === next.tabs && prev.activeTab === next.activeTab);



const MedicationsTab = ({ anesthesia, surgery, onUpdate }) => (
  <MedicationsSection 
    anesthesia={anesthesia}
    surgery={surgery}
    onUpdate={onUpdate}
  />
);

const VitalSignsTab = React.memo(function VitalsTabMemo({ patientId, surgeryId, anesthesia, surgery }) {
  return (
    <VitalSignsSection
      patientId={patientId}
      surgeryId={surgeryId}
      anesthesiaId={anesthesia?.id}
      surgery={surgery}
    />
  );
}, (prev, next) => (
  prev.patientId === next.patientId &&
  prev.surgeryId === next.surgeryId &&
  prev.anesthesia?.id === next.anesthesia?.id &&
  prev.surgery?.id === next.surgery?.id &&
  prev.surgery?.startAt === next.surgery?.startAt &&
  prev.surgery?.date === next.surgery?.date
));


// Componente principal
const AnesthesiaDetails = () => {
  const { patientId, surgeryId } = useParams();
  const navigate = useNavigate();
  const { currentUserId, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('identification');
  const [patient, setPatient] = useState(null);
  const [surgery, setSurgery] = useState(null);
  const [anesthesia, setAnesthesia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [preAnesthesia, setPreAnesthesia] = useState(null);
  const [isEditingPreAnesthesia, setIsEditingPreAnesthesia] = useState(false);

  // Ref da aba ativa para auto-scroll
  const activeTabRef = React.useRef(null);

  // Garante que a aba ativa fique visível
  useEffect(() => {
    if (activeTabRef.current) {
      try {
        activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (e) {
        // fallback silencioso
      }
    }
  }, [activeTab]);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {
        navigate('/signin');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Carregar dados em paralelo
        const [patientData, surgeryData] = await Promise.all([
          getPatient(patientId),
          getSurgery(patientId, surgeryId)
        ]);

        setPatient(patientData);
        setSurgery(surgeryData);

        // Buscar anestesia existente
        const anesthesiaData = await getSurgeryAnesthesia(patientId, surgeryId);

        setAnesthesia(anesthesiaData);

        // Buscar pré-anestesia existente
        const preAnesthesiaData = await getSurgeryPreAnesthesia(patientId, surgeryId);

        setPreAnesthesia(preAnesthesiaData);

        if (!anesthesiaData) {
          // Anestesia não encontrada - mostrar erro

          setError('Anestesia não encontrada. Verifique se a ficha foi criada corretamente.');
        }

      } catch (err) {
        console.error('❌ Erro ao carregar dados:', err);
        setError('Erro ao carregar dados da anestesia');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId, surgeryId, currentUserId, isAuthenticated, navigate]);

  const handlePatientUpdate = async (updatedPatient) => {
    try {
      setPatient(updatedPatient);
    } catch (err) {
      console.error('❌ Erro ao atualizar paciente:', err);
    }
  };

  const handleSurgeryUpdate = async (updatedSurgery) => {
    try {
      setSurgery(updatedSurgery);
    } catch (err) {
      console.error('❌ Erro ao atualizar cirurgia:', err);
    }
  };

  const handleAnesthesiaUpdate = async (updates) => {
    try {

      await updateAnesthesia(
        patientId,
        surgeryId,
        anesthesia?.id,
        updates,
        currentUserId
      );

      const updatedDoc = await getSurgeryAnesthesia(patientId, surgeryId);
      setAnesthesia(updatedDoc);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('❌ Erro ao atualizar anestesia:', err);
    }
  };

  // Alterar status da anestesia
  const handleStatusChange = async (newStatus) => {
    try {
      const updates = { 
        status: newStatus,
        ...(newStatus === 'Concluída' && { anesthesiaTimeEnd: new Date().toLocaleTimeString('pt-BR', { hour12: false }) })
      };
      
      await handleAnesthesiaUpdate(updates);
      
      if (newStatus === 'Concluída') {
        // Redirecionar para SRPA ou dashboard
        alert('Anestesia finalizada! Deseja criar ficha SRPA?');
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  // PreAnesthesiaTab deve ser declarado antes de tabs!
  const PreAnesthesiaTab = () => {
    if (isEditingPreAnesthesia) {
      return (
        <PreAnestheticForm 
          patientId={patientId}
          surgeryId={surgeryId}
          onCancel={() => setIsEditingPreAnesthesia(false)}
          onSuccess={() => setIsEditingPreAnesthesia(false)}
        />
      );
    }

    return (
      <PreAnestheticDisplay 
        preAnesthesia={preAnesthesia}
        onEdit={() => setIsEditingPreAnesthesia(true)}
      />
    );
  };

  // Definir abas (memoizado)
  const identificationProps = React.useMemo(() => ({
    onPatientUpdate: handlePatientUpdate,
    onSurgeryUpdate: handleSurgeryUpdate,
    onUpdate: handleAnesthesiaUpdate
  }), [handlePatientUpdate, handleSurgeryUpdate, handleAnesthesiaUpdate]);

  const vitalSignsProps = React.useMemo(() => ({
    patientId,
    surgeryId,
    anesthesia,
    surgery
  }), [patientId, surgeryId, anesthesia, surgery]);

  const tabs = React.useMemo(() => ([
    { 
      id: 'identification', 
      label: 'Dados', 
      icon: User, 
      component: AnesthesiaIdentification,
      hasData: !!(patient && surgery && anesthesia),
      isRequired: true,
      componentProps: identificationProps
    },
    { 
      id: 'preanesthesia', 
      label: 'APA', 
      icon: FileText, 
      component: PreAnesthesiaTab,
      hasData: !!preAnesthesia,
      isRequired: false 
    },
    { 
      id: 'medications', 
      label: 'Medicações', 
      icon: Pill, 
      component: MedicationsTab,
      hasData: !!(anesthesia?.medications && anesthesia.medications.length > 0),
      isRequired: true 
    },
    { 
      id: 'vitalsigns', 
      label: 'Sinais Vitais', 
      icon: Activity, 
      component: VitalSignsTab,
      hasData: !!(anesthesia?.vitalSigns),
      isRequired: true,
      componentProps: vitalSignsProps
    },
    { 
      id: 'evolution', 
      label: 'Evolução', 
      icon: Clock, 
      component: AnesthesiaDescription,
      hasData: !!(anesthesia?.anesthesiaDescription),
      isRequired: false 
    },
    { 
      id: 'preview', 
      label: 'Preview', 
      icon: Eye, 
      component: AnesthesiaPreview,
      hasData: !!(anesthesia || surgery || patient),
      isRequired: false,
      componentProps: { patient, surgery, anesthesia, preAnesthesia, patientId, surgeryId}
    }
  ]), [patient, surgery, anesthesia, preAnesthesia, identificationProps, vitalSignsProps]);

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4 sm:px-6">
          <p className="text-red-600 mb-4 text-base sm:text-lg">Acesso não autorizado</p>
          <button 
            onClick={() => navigate('/signin')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4 sm:px-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg">Carregando dados da anestesia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4 sm:px-6">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-base sm:text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      {/* Topbar Mobile */}
      <div className="sm:hidden fixed top-4 left-[2.5%] right-[2.5%] z-30 flex items-center justify-between h-14 pl-2 pr-4 bg-white shadow-md border-b border-gray-200">
        <button
          onClick={() => navigate(`/patients/${patientId}/surgeries/${surgeryId}/surgery`)}
          className="text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute left-1/2 transform -translate-x-1/2 truncate max-w-[50%] text-base font-semibold text-gray-900 text-center">
          {surgery?.proposedSurgery || 'Ficha Anestésica'}
        </div>
        <span className={`ml-2 px-2 py-1 rounded-full text-xs border ${
          anesthesia?.status === 'Em andamento'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : anesthesia?.status === 'Concluída'
            ? 'bg-green-100 text-green-800 border-green-200'
            : anesthesia?.status === 'Pausada'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
            : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          {anesthesia?.status || 'Não iniciada'}
        </span>
      </div>
      {/* Breadcrumb Desktop */}
      <div className="hidden sm:flex items-center gap-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-base mb-1 mx-2">
        <a href="/patients" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Pacientes
        </a>
        <span className="text-gray-400">›</span>
        <a href={`/patients/${patientId}`} className="text-blue-600 hover:underline">
          {patient?.patientName || '...'}
        </a>
        <span className="text-gray-400">›</span>
        <a href={`/patients/${patientId}/surgeries/${surgeryId}/surgery`} className="text-blue-600 hover:underline">
          {surgery?.proposedSurgery || 'Cirurgia'}
        </a>
        <span className="text-gray-400">›</span>
        <span className="font-semibold text-gray-900">Ficha Anestesia</span>
        <span className={`ml-2 px-2 py-1 rounded-full text-xs border ${
          anesthesia?.status === 'Em andamento'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : anesthesia?.status === 'Concluída'
            ? 'bg-green-100 text-green-800 border-green-200'
            : anesthesia?.status === 'Pausada'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
            : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          {anesthesia?.status || 'Não iniciada'}
        </span>
      </div>
      {/* Header fixo separado para mobile e desktop */}
      {/* Mobile: fixo, arredondado, espaçamento lateral */}
      <div className="sm:hidden fixed top-[86px] left-[2.5%] right-[2.5%] z-20 bg-white shadow-sm rounded-t-lg">
        <MobileTabBar 
          tabs={tabs} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          activeTabRef={activeTabRef} 
        />
      </div>
      {/* Desktop: padrão, não fixo */}
      <div className="hidden sm:block">
        <DesktopTabBar 
          tabs={tabs} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          activeTabRef={activeTabRef} 
        />
      </div>

      {/* Indicador de mudanças não salvas */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 py-2">
          <p className="text-sm text-yellow-800">
            ⚠️ Você tem alterações não salvas. Os dados são salvos automaticamente.
          </p>
        </div>
      )}

      {/* Conteúdo da aba */}
      {/* Mobile */}
      <div className="sm:hidden pt-[152px] min-h-screen">
        <div className="bg-white">
          {ActiveComponent && (
            <ActiveComponent
              patient={patient}
              surgery={surgery}
              anesthesia={anesthesia}
              onUpdate={handleAnesthesiaUpdate}
              {...(activeTabData?.componentProps || {})}
            />
          )}
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden sm:block pt-4 min-h-screen">
        <div className="bg-white">
          {ActiveComponent && (
            <ActiveComponent
              patient={patient}
              surgery={surgery}
              anesthesia={anesthesia}
              onUpdate={handleAnesthesiaUpdate}
              {...(activeTabData?.componentProps || {})}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnesthesiaDetails;