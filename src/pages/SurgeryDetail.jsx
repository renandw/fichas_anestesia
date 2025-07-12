// Importações (adicionar a nova seção)
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
  PreAnestheticEvaluationSection // NOVA IMPORTAÇÃO
} from '../components/surgery';

import { 
  ArrowLeft, 
  Clock, 
  User, 
  Stethoscope,
  Activity,
  Pill,
  Droplets,
  FileText,
  Save,
  CheckCircle,
  CreditCard,
  Eye,
  UserCheck // NOVO ÍCONE PARA AVALIAÇÃO PRÉ-ANESTÉSICA
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

  // Estados para medicações e sinais vitais
  const [medications, setMedications] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);

  // Carregar dados da cirurgia
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
        
        // Carregar cirurgias ativas para sidebar
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

  // AutoSave
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

  // Calcular tempo decorrido desde o início clínico da cirurgia
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

    const now = new Date();
    const diff = Math.floor((now - startDate) / 1000 / 60);

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
          <p className="text-gray-600">Carregando cirurgia...</p>
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

  // SEÇÕES ATUALIZADAS COM A NOVA ABA DE AVALIAÇÃO PRÉ-ANESTÉSICA
  const sections = [
    { id: 'identification', name: 'Identificação', icon: CreditCard },
    { id: 'preanesthetic', name: 'Pré-Anestésica', icon: UserCheck }, // NOVA ABA
    { id: 'medications', name: 'Medicações', icon: Pill },
    { id: 'vitals', name: 'Sinais Vitais', icon: Activity },
    { id: 'description', name: 'Descrição', icon: FileText },
    { id: 'preview', name: 'Pré-Visualização', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo - Mobile optimized */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 min-w-0 mx-3">
              <div className="text-center">
                <h1 className="text-lg font-semibold text-gray-900 font-mono">
                  {surgery.id}
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  {surgery.patientName || 'Paciente não informado'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
                <div className="text-right">
                    <div className="flex items-center text-sm font-medium text-primary-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {getElapsedTime()}
                    </div>
                    {surgery.status === 'completado' && (
                    <div className="flex items-center text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Finalizada
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

      <div className="flex h-screen pt-16">
        {/* Sidebar - Cirurgias ativas (Hidden on mobile, show on tablet+) */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto">
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
                  <div className="text-xs text-gray-600 truncate">
                    {activeSurgery.patientName || 'Sem nome'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navegação por seções - Mobile tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex-shrink-0 flex items-center px-4 py-3 text-sm font-medium border-b-2 ${
                      activeSection === section.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {section.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* Seção de Identificação */}
              {activeSection === 'identification' && (
                <IdentificationSection
                  surgery={surgery}
                  onDataChange={handleIdentificationChange}
                  autoSave={autoSave}
                />
              )}

              {/* NOVA SEÇÃO DE AVALIAÇÃO PRÉ-ANESTÉSICA */}
              {activeSection === 'preanesthetic' && (
                <PreAnestheticEvaluationSection
                  surgery={surgery}
                  onDataChange={handleIdentificationChange}
                  autoSave={autoSave}
                />
              )}

              {/* Seção de Medicações */}
              {activeSection === 'medications' && (
                <MedicationsSection
                  medications={medications}
                  surgery={surgery}
                  patientWeight={surgery.patientWeight}
                  onMedicationsChange={handleMedicationsChange}
                  autoSave={autoSave}
                />
              )}

              {/* Seção de Sinais Vitais */}
              {activeSection === 'vitals' && (
                <VitalSignsSection
                  vitalSigns={vitalSigns}
                  surgery={surgery}
                  onVitalSignsChange={handleVitalSignsChange}
                  autoSave={autoSave}
                />
              )}

              {/* Seção de Descrição */}
              {activeSection === 'description' && (
                <DescriptionSection
                  surgery={surgery}
                  onDataChange={handleIdentificationChange}
                  autoSave={autoSave}
                />
              )}

              {/* Seção de Pré-Visualização */}
              {activeSection === 'preview' && (
                <FichaPreview
                  surgery={surgery}
                  onEditSection={handleEditSection}
                  autoSave={autoSave}          // ADICIONAR
                  userProfile={userProfile}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurgeryDetail;