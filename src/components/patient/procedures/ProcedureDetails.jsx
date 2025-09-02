import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useProcedureDetails } from '../../../hooks/useProcedureDetails';
import { 
  ArrowLeft,
  User,
  FileText,
  Stethoscope,
  Activity,
  Clock,
  Users,
  AlertCircle,
  IdCard,
  UserCheck,
  Pill,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  MedicationsSection,
  VitalSignsSection,
  DescriptionSection,
  FichaPreview,
  PreAnestheticEvaluationSection
} from '../../../components/surgery';

// Função para pegar o hash da URL e retornar a seção/tab correspondente
const getSectionFromHash = () => window.location.hash.replace('#', '') || 'identification';

const ProcedureDetails = () => {
  const { patientId, procedureId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const { 
    patient, 
    procedure, 
    surgery, 
    preAnesthetic, 
    srpa, 
    loading, 
    error 
  } = useProcedureDetails(patientId, procedureId);

  const [calculatedAge, setCalculatedAge] = useState('');
  // Agora a tab inicial é definida pelo hash da URL, se existir
  const [activeSection, setActiveSection] = useState(getSectionFromHash());
  const [medications, setMedications] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    const onHashChange = () => setActiveSection(getSectionFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Definição das seções/tabs
  const sections = [
    { id: 'identification', name: 'Identificação', icon: IdCard },
    { id: 'preanesthetic', name: 'Pré-Anestésica', icon: UserCheck },
    { id: 'medications', name: 'Medicações', icon: Pill },
    { id: 'vitals', name: 'Sinais Vitais', icon: Activity },
    { id: 'description', name: 'Descrição', icon: FileText },
    { id: 'preview', name: 'Pré-Visualização', icon: Eye },
    { id: 'srpa', name: 'SRPA', icon: Clock }
  ];

  // Calcular idade do paciente
  useEffect(() => {
    if (patient?.birthDate) {
      const birth = new Date(patient.birthDate);
      const now = new Date();
      
      if (birth > now) {
        setCalculatedAge('Data inválida');
        return;
      }

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

      let ageText = '';
      if (years > 0) {
        ageText += `${years} ano${years !== 1 ? 's' : ''}`;
        if (months > 0) ageText += `, ${months} ${months !== 1 ? 'meses' : 'mês'}`;
      } else if (months > 0) {
        ageText += `${months} mês${months !== 1 ? 'es' : ''}`;
        if (days > 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
      } else {
        ageText = `${days} dia${days !== 1 ? 's' : ''}`;
      }

      setCalculatedAge(ageText);
    }
  }, [patient?.birthDate]);
  
  useEffect(() => {
    if (surgery) {
      setMedications(surgery.medications || []);
      setVitalSigns(surgery.vitalSigns || []);
    }
  }, [surgery]);

  // Handlers
  const handleGoBack = () => {
    navigate(`/patients/${patientId}`);
  };

  const handleEditSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleIdentificationChange = (data) => {
    // Handler para mudanças na seção de identificação
    console.log('Identification data changed:', data);
  };

  const handleMedicationsChange = (medicationsData) => {
    setMedications(medicationsData);
  };

  const handleVitalSignsChange = (vitalSignsData) => {
    setVitalSigns(vitalSignsData);
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner mr-2"></div>
        <p className="text-sm md:text-base">Carregando procedimento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-base md:text-lg font-medium text-red-800">Erro ao carregar procedimento</h3>
          </div>
          <p className="text-sm md:text-base text-red-700 mt-2">{error}</p>
          <button
            onClick={handleGoBack}
            className="mt-4 btn-primary"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!patient || !procedure) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-base md:text-lg font-medium text-yellow-800">Procedimento não encontrado</h3>
          </div>
          <p className="text-sm md:text-base text-yellow-700 mt-2">
            O procedimento solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
          </p>
          <button
            onClick={handleGoBack}
            className="mt-4 btn-primary"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Componente da seção de Identificação
  const IdentificationSection = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Card: Informações do Paciente */}
      <div className="card">
        <div className="flex items-center mb-3 md:mb-4">
          <User className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-base md:text-lg font-medium text-gray-900">Paciente</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="label">Nome</label>
            <p className="font-medium text-gray-900 text-sm md:text-base">{patient.name}</p>
          </div>
          <div>
            <label className="label">Sexo</label>
            <p className="font-medium text-gray-900 text-sm md:text-base capitalize">{patient.sex}</p>
          </div>
          <div>
            <label className="label">Idade</label>
            <p className="font-medium text-gray-900 text-sm md:text-base">
              {calculatedAge || 'N/A'}
            </p>
          </div>
          <div>
            <label className="label">Peso</label>
            <p className="font-medium text-gray-900 text-sm md:text-base">{procedure.patientWeight} kg</p>
          </div>
        </div>
      </div>

      {/* Card: Detalhes do Procedimento */}
      <div className="card">
        <div className="flex items-center mb-3 md:mb-4">
          <FileText className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-base md:text-lg font-medium text-gray-900">Detalhes da Cirurgia</h3>
        </div>
        
        {/* Informações Básicas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <label className="label">Tipo</label>
            <p className="font-medium text-gray-900 text-sm md:text-base capitalize">
              {procedure.procedureType === 'sus' ? 'SUS' : 'Convênio'}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">Hospital</label>
            <p className="font-medium text-gray-900 text-sm md:text-base">{procedure.hospital}</p>
          </div>
          {procedure.procedureType === 'sus' && procedure.hospitalRecord && (
            <div>
              <label className="label">Registro</label>
              <p className="font-medium text-gray-900 text-sm md:text-base">{procedure.hospitalRecord}</p>
            </div>
          )}
        </div>

        {/* Procedimento */}
        <div className="mb-4 md:mb-6">
          <label className="label">
            {procedure.procedureType === 'sus' ? 'Cirurgia Proposta' : 'Procedimentos'}
          </label>
          {procedure.procedureType === 'sus' ? (
            <p className="font-medium text-gray-900 text-sm md:text-base">{procedure.procedimento}</p>
          ) : (
            procedure.cbhpmProcedures && procedure.cbhpmProcedures.length > 0 && (
              <div className="space-y-2">
                {procedure.cbhpmProcedures.map((proc, index) => (
                  proc.procedimento && (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-900 text-sm md:text-base">
                        {proc.codigo} - {proc.procedimento}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">
                        Porte: {proc.porte_anestesico}
                      </p>
                    </div>
                  )
                ))}
              </div>
            )
          )}
        </div>

        {/* Dados do Convênio */}
        {procedure.procedureType === 'convenio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <label className="label">Convênio</label>
              <p className="font-medium text-gray-900 text-sm md:text-base">{procedure.insuranceName}</p>
            </div>
            <div>
              <label className="label">Matrícula</label>
              <p className="font-medium text-gray-900 text-sm md:text-base">{procedure.insuranceNumber}</p>
            </div>
          </div>
        )}

        {/* Equipe Cirúrgica */}
        <div className="border-t border-gray-200 pt-4 md:pt-6">
          <div className="flex items-center mb-3">
            <Users className="h-5 w-5 text-primary-600 mr-2" />
            <h4 className="text-sm md:text-base font-medium text-gray-900">Equipe Cirúrgica</h4>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Cirurgião Principal</label>
              <p className="font-medium text-gray-900 text-sm md:text-base">{procedure.mainSurgeon}</p>
            </div>
            {procedure.auxiliarySurgeons && procedure.auxiliarySurgeons.some(surgeon => surgeon.name) && (
              <div>
                <label className="label">Auxiliares</label>
                <div className="space-y-1">
                  {procedure.auxiliarySurgeons
                    .filter(surgeon => surgeon.name)
                    .map((surgeon, index) => (
                      <p key={index} className="text-gray-900 text-sm md:text-base">{surgeon.name}</p>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Componentes placeholder para outras seções
  const PlaceholderSection = ({ title, description }) => (
    <div className="card text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        {/* Barra de navegação principal */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex items-center">
            <button
              onClick={handleGoBack}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 ml-2 truncate">
              {procedure.procedimento || 'Procedimento'}
            </h1>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex overflow-x-auto scrollbar-hide">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => handleEditSection(section.id)}
                    className={`
                      flex items-center justify-center transition-all duration-200 ease-in-out
                      ${isActive 
                        ? 'px-4 py-3 text-sm font-bold border-b-3 border-primary-700 text-white bg-primary-600 shadow-sm rounded-t-lg' 
                        : 'px-3 py-3 text-xs md:text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-t-lg'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'mr-2' : 'mr-0 md:mr-2'}`} />
                    
                    {/* Mobile: texto apenas quando ativo */}
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
        </div>
      </div>

      {/* Conteúdo das Seções */}
      <div className="flex-1 bg-gray-50 h-screen overflow-y-auto">
        <div className="p-3 md:p-4">
          <div className="max-w-6xl mx-auto">
            {activeSection === 'identification' && (
              <IdentificationSection
                surgery={surgery}
                patient={patient}
                procedure={procedure}
                onDataChange={handleIdentificationChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'preanesthetic' && (
              <PreAnestheticEvaluationSection
                surgery={surgery}
                patient={patient}
                procedure={procedure}
                onDataChange={handleIdentificationChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'medications' && (
              <MedicationsSection
                medications={medications}
                surgery={surgery}
                patient={patient}
                procedure={procedure}
                patientWeight={procedure.patientWeight}
                onMedicationsChange={handleMedicationsChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'vitals' && (
              <VitalSignsSection
                vitalSigns={vitalSigns}
                surgery={surgery}
                patient={patient}
                procedure={procedure}
                onVitalSignsChange={handleVitalSignsChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'description' && (
              <DescriptionSection
                surgery={surgery}
                patient={patient}
                procedure={procedure}
                onDataChange={handleIdentificationChange}
                autoSave={autoSave}
              />
            )}

            {activeSection === 'preview' && (
              <FichaPreview
                surgery={surgery}
                patient={patient}
                procedure={procedure}
                onEditSection={handleEditSection}
                autoSave={autoSave}
                userProfile={userProfile}
              />
            )}

            {activeSection === 'srpa' && (
              <PlaceholderSection 
                title="SRPA" 
                description="Seção em desenvolvimento - sala de recuperação pós-anestésica"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcedureDetails;