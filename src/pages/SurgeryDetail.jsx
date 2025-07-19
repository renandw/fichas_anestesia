import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSurgery, updateSurgery, getActiveSurgeries } from '../services/firestore';
import {
  MedicationsSection,
  VitalSignsSection,
  IdentificationSection,
  DescriptionSection,
  FichaPreview,
  PreAnestheticEvaluationSection
} from '../components/surgery';

import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Pill,
  Activity,
  FileText,
  IdCardLanyard,
  Eye,
  UserCheck
} from 'lucide-react';

import toast from 'react-hot-toast';

const SurgeryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [surgery, setSurgery] = useState(null);
  const [activeSurgeries, setActiveSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('identification');

  const [medications, setMedications] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);

  useEffect(() => {
    const loadSurgery = async () => {
      try {
        setLoading(true);
        console.log('Carregando cirurgia:', id);

        const surgeryData = await getSurgery(id);
        console.log('Dados da cirurgia carregados:', surgeryData);

        if (!surgeryData) {
          toast.error('Cirurgia não encontrada');
          navigate('/dashboard');
          return;
        }

        setSurgery(surgeryData);
        setMedications(surgeryData.medications || []);
        setVitalSigns(surgeryData.vitalSigns || []);

        if (userProfile?.uid) {
          try {
            const active = await getActiveSurgeries(userProfile.uid);
            setActiveSurgeries(active);
          } catch (indexError) {
            console.log('Index não criado ainda para cirurgias ativas, usando lista vazia');
            setActiveSurgeries([]);
          }
        }
      } catch (error) {
        console.error('Erro detalhado ao carregar cirurgia:', error);
        toast.error(`Erro ao carregar dados da cirurgia: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile && id) {
      loadSurgery();
    }
  }, [id, userProfile, navigate]);

  const autoSave = async (data) => {
    setSaving(true);
    try {
      await updateSurgery(id, data);
    } catch (error) {
      console.error('Erro no AutoSave:', error);
    } finally {
      setSaving(false);
    }
  };

  const getElapsedTime = () => {
    const baseTime = surgery?.startTime || surgery?.createdAt;
    if (!baseTime) return '00:00';
  
    let startDate;
    if (baseTime.seconds) {
      startDate = new Date(baseTime.seconds * 1000);
    } else if (baseTime.toDate) {
      startDate = baseTime.toDate();
    } else if (typeof baseTime === 'string') {
      startDate = new Date(baseTime);
    } else {
      startDate = new Date(baseTime);
    }
  
    let endDate = new Date();
    const completed = surgery?.completedAt;
    if (completed) {
      if (completed.seconds) {
        endDate = new Date(completed.seconds * 1000);
      } else if (completed.toDate) {
        endDate = completed.toDate();
      } else if (typeof completed === 'string') {
        endDate = new Date(completed);
      } else {
        endDate = new Date(completed);
      }
    }
  
    const diff = Math.floor((endDate - startDate) / 1000 / 60);
    if (diff < 0) return '00:00';
  
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
  
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleEditSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleIdentificationChange = (updatedData) => {
    setSurgery(prev => ({ ...prev, ...updatedData }));
  };

  const handleMedicationsChange = (updatedMedications) => {
    setMedications(updatedMedications);
  };

  const handleVitalSignsChange = (updatedVitalSigns) => {
    setVitalSigns(updatedVitalSigns);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cirurgia…</p>
        </div>
      </div>
    );
  }

  if (!surgery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cirurgia não encontrada</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'identification', name: 'Identificação', icon: IdCardLanyard },
    { id: 'preanesthetic', name: 'Pré-Anestésica', icon: UserCheck },
    { id: 'medications', name: 'Medicações', icon: Pill },
    { id: 'vitals', name: 'Sinais Vitais', icon: Activity },
    { id: 'description', name: 'Descrição', icon: FileText },
    { id: 'preview', name: 'Pré-Visualização', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Cirurgia - Sempre fixo no topo */}
      <div
        data-surgery-header
        // Header da cirurgia
        className="bg-white shadow-sm border-b fixed top-0 left-0 lg:left-64 right-0 z-40"
      >
        <div className="px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1 md:p-2 -ml-1 md:-ml-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <div className="flex-1 min-w-0 mx-2 md:mx-3">
              <div className="text-center">
                <h1 className="text-base md:text-lg font-semibold text-gray-900 font-mono">
                  {surgery.id}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  {surgery.patientName || 'Paciente não informado'}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="text-right">
                <div className="flex items-center text-xs md:text-sm font-medium text-primary-600">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  {getElapsedTime()}
                </div>
                {surgery.status === 'completado' && (
                  <div className="flex items-center text-xs text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="sm:inline">Finalizada</span>
                  </div>
                )}
                {saving && (
                  <p className="text-xs text-gray-500">Salvando...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação - Fixa abaixo do header da cirurgia */}
      <div 
        // Headers e tabs respeitam apenas a sidebar esquerda
        className="bg-white border-b border-gray-200 fixed left-0 lg:left-64 right-0 z-40"
        style={{ top: '64px' }} // Altura do header da cirurgia
      >
        <div className="flex gap-1 px-2 lg:justify-end">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center justify-center transition-all duration-200 ease-in-out
                  ${isActive 
                    ? 'px-4 py-3 text-sm font-bold border-b-3 border-primary-700 text-white bg-primary-600 shadow-sm rounded-t-lg' 
                    : 'px-3 py-3 text-xs md:text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-t-lg'
                  }
                `}
              >
                {/* MOBILE: Ícone sempre, texto só se ativo */}
                <Icon className={`h-5 w-5 md:h-4 md:w-4 ${isActive ? 'mr-2' : 'md:mr-2'}`} />
                
                {/* Mobile: texto só na tab ativa */}
                {isActive && (
                  <span className="whitespace-nowrap md:hidden">
                    {section.name}
                  </span>
                )}
                
                {/* Desktop: texto sempre visível */}
                <span className="hidden md:inline whitespace-nowrap">
                  {section.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout principal com sidebar e conteúdo */}
      <div className="flex" style={{ paddingTop: '120px' }}> {/* Espaço para headers fixos */}
        
        {/* Sidebar com cirurgias ativas - Desktop apenas */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Cirurgias Ativas</h3>
            <div className="space-y-2">
              {activeSurgeries.map((activeSurgery) => (
                <button
                  key={activeSurgery.id}
                  onClick={() => navigate(`/surgery/${activeSurgery.id}`)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    activeSurgery.id === id 
                      ? 'bg-primary-50 border-primary-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-mono text-sm font-medium">
                    {activeSurgery.id}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {activeSurgery.patientName || 'Sem nome'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo principal - Área scrollável */}
        <div className="flex-1 bg-gray-50 h-screen overflow-y-auto">
          <div className="p-3 md:p-4">
            {activeSection === 'identification' && (
              <IdentificationSection
                surgery={surgery}
                onDataChange={handleIdentificationChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'preanesthetic' && (
              <PreAnestheticEvaluationSection
                surgery={surgery}
                onDataChange={handleIdentificationChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'medications' && (
              <MedicationsSection
                medications={medications}
                surgery={surgery}
                patientWeight={surgery.patientWeight}
                onMedicationsChange={handleMedicationsChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'vitals' && (
              <VitalSignsSection
                vitalSigns={vitalSigns}
                surgery={surgery}
                onVitalSignsChange={handleVitalSignsChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'description' && (
              <DescriptionSection
                surgery={surgery}
                onDataChange={handleIdentificationChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'preview' && (
              <FichaPreview
                surgery={surgery}
                onEditSection={handleEditSection}
                autoSave={autoSave}
                userProfile={userProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurgeryDetail;