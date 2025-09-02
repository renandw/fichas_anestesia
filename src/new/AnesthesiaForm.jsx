import { Stethoscope, Save, Clock, } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatient } from '../services/patientService';
import { getSurgery } from '../services/surgeryService';
import { getSurgeryAnesthesia } from '../services/anesthesiaService';
import AnesthesiaFormComponent from './AnesthesiaFormComponent';

// Componente de Header com informações básicas
const AnesthesiaFormHeader = ({ patient, surgery, mode }) => (
  <div className="bg-white border-b border-gray-200 p-4 md:p-6">
    <div className="flex items-center gap-3 md:gap-4 mb-4">
      <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
        <Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
      </div>
      <div>
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">
          {mode === "edit" ? "Editar Ficha Anestésica" : "Nova Ficha Anestésica"}
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          {mode === "edit" ? "Altere os dados da anestesia" : "Preencha os dados da anestesia"}
        </p>
      </div>
    </div>
  </div>
);

/**
 * AnesthesiaForm - Container principal para criação/edição de anestesia
 * 
 * Responsabilidades:
 * - Navegação e roteamento
 * - Carregamento de dados (paciente, cirurgia)
 * - Autenticação
 * - Layout da página
 * - Coordenação entre componentes
 */
const AnesthesiaForm = ({ 
  mode = "create", // "create" | "edit"
  initialData = null,
  selectedPatient = null,
  selectedSurgery = null,
  patientId: propPatientId,
  surgeryId: propSurgeryId,
  onAnesthesiaCreated,
  onAnesthesiaUpdated
}) => {
  const params = useParams();
  const patientId = propPatientId || params.patientId || selectedPatient?.id;
  const surgeryId = propSurgeryId || params.surgeryId || selectedSurgery?.id;
  const anesthesiaId = params.anesthesiaId;
  const navigate = useNavigate();
  const { currentUserId, isAuthenticated } = useAuth();
  
  // Estados para dados carregados
  const [patient, setPatient] = useState(selectedPatient);
  const [surgery, setSurgery] = useState(selectedSurgery);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar dados quando necessário
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {
        navigate('/signin');
        return;
      }

      // Se props foram fornecidos, use-os diretamente
      if (selectedPatient && selectedSurgery) {
        setPatient(selectedPatient);
        setSurgery(selectedSurgery);
        setIsLoading(false);
        return;
      }

      // Carregar dados do Firebase
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Carregando dados...');
        const [patientData, surgeryData] = await Promise.all([
          getPatient(patientId),
          getSurgery(patientId, surgeryId)
        ]);

        console.log('✅ Dados carregados:', { patientData, surgeryData });
        setPatient(patientData);
        setSurgery(surgeryData);

        // Para modo create, verificar se anestesia já existe
        if (mode === "create") {
          const existingAnesthesia = await getSurgeryAnesthesia(patientId, surgeryId);
          if (existingAnesthesia) {
            console.log('⚠️ Anestesia já existe - redirecionando para edição');
            navigate(`/patients/${patientId}/surgeries/${surgeryId}/anesthesia/${existingAnesthesia.id}`);
            return;
          }
        }

      } catch (err) {
        console.error('❌ Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId, surgeryId, currentUserId, isAuthenticated, navigate, mode, selectedPatient, selectedSurgery]);

  // Handlers para sucesso
  const handleAnesthesiaCreated = (newAnesthesia) => {
    console.log('✅ Anestesia criada com sucesso:', newAnesthesia);
    
    if (onAnesthesiaCreated) {
      onAnesthesiaCreated(newAnesthesia);
    } else {
      // Navegação padrão para detalhes
      navigate(`/patients/${patientId}/surgeries/${surgeryId}/anesthesia/${newAnesthesia.id}`);
    }
  };

  const handleAnesthesiaUpdated = (updatedAnesthesia) => {
    console.log('✅ Anestesia atualizada com sucesso:', updatedAnesthesia);
    
    if (onAnesthesiaUpdated) {
      onAnesthesiaUpdated(updatedAnesthesia);
    }
  };

  // Guards de autenticação
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Acesso não autorizado</p>
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        {/* Header com informações */}
        <AnesthesiaFormHeader patient={patient} surgery={surgery} mode={mode} />

        {/* Formulário - Componente Reutilizável */}
        <div className="mt-6">
          <AnesthesiaFormComponent
            mode={mode}
            initialData={initialData}
            selectedPatient={patient}
            selectedSurgery={surgery}
            onAnesthesiaCreated={handleAnesthesiaCreated}
            onAnesthesiaUpdated={handleAnesthesiaUpdated}
          />
        </div>
      </div>
    </div>
  );
};

export default AnesthesiaForm;