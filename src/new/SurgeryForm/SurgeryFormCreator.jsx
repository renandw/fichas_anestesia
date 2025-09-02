import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createSurgery, checkSimilarSurgeries } from '../../services/surgeryService';
import { checkSubcollectionExists } from '../../services/anesthesiaService';
import SurgeryFormFields from './SurgeryFormFields';

// Utilitários para Data Pura (YYYY-MM-DD) — evitam problemas de fuso horário
const isValidDateOnly = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mo < 1 || mo > 12) return false;
  const daysInMonth = new Date(y, mo, 0).getDate(); // construtor local seguro
  return d >= 1 && d <= daysInMonth;
};

const dateOnlyToLocalDate = (dateStr) => {
  // Constrói um Date local (00:00 local) a partir de YYYY-MM-DD sem UTC shift
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  return new Date(y, m - 1, d);
};

/**
 * SurgeryFormCreator - Lógica para Criação de Cirurgias
 * 
 * Responsabilidades:
 * - Gerenciar lógica específica de criação
 * - Verificar cirurgias similares
 * - Gerenciar modais de conflito
 * - Integração com Firebase para criação
 */
const SurgeryFormCreator = ({
  selectedPatient,
  currentFlow = "anesthesia", 
  onSurgerySelected
}) => {
  const { currentUserId } = useAuth();

  // Estados específicos para criação
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [similarSurgeriesFound, setSimilarSurgeriesFound] = useState([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictSurgery, setConflictSurgery] = useState(null);

  // Validação do formulário
  const validateForm = (surgeryData) => {
    const newErrors = {};
    
    // Validação da data da cirurgia (data PURA: YYYY-MM-DD)
    if (!surgeryData.surgeryDate) {
      newErrors.surgeryDate = 'Data da cirurgia é obrigatória';
    } else if (!isValidDateOnly(surgeryData.surgeryDate)) {
      newErrors.surgeryDate = 'Data da cirurgia inválida (use AAAA-MM-DD)';
    } else {
      // Se quiser garantir que não seja futura, use a verificação abaixo (mantida sem erro por enquanto):
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      // const surgeryLocal = dateOnlyToLocalDate(surgeryData.surgeryDate);
      // if (surgeryLocal > today) newErrors.surgeryDate = 'Data da cirurgia não pode ser futura';
    }
    
    if (!surgeryData.procedureType) {
      newErrors.procedureType = 'Tipo de procedimento é obrigatório';
    }
    
    if (!surgeryData.patientWeight) {
      newErrors.patientWeight = 'Peso do paciente é obrigatório';
    }
    
    if (!surgeryData.mainSurgeon.trim()) {
      newErrors.mainSurgeon = 'Cirurgião principal é obrigatório';
    }
    
    if (!surgeryData.hospital.trim()) {
      newErrors.hospital = 'Hospital é obrigatório';
    }

    if (surgeryData.procedureType === 'sus') {
      if (!surgeryData.hospitalRecord.trim()) {
        newErrors.hospitalRecord = 'Registro hospitalar é obrigatório para SUS';
      }
      if (!surgeryData.proposedSurgery.trim()) {
        newErrors.proposedSurgery = 'Cirurgia proposta é obrigatória para SUS';
      }
    }

    if (surgeryData.procedureType === 'convenio') {
      if (!surgeryData.insuranceNumber.trim()) {
        newErrors.insuranceNumber = 'Número do convênio é obrigatório';
      }
      if (!surgeryData.insuranceName.trim()) {
        newErrors.insuranceName = 'Nome do convênio é obrigatório';
      }
      if (surgeryData.cbhpmProcedures.length === 0) {
        newErrors.cbhpmProcedures = 'Ao menos um procedimento CBHPM é obrigatório para convênio';
      }
    }

    return newErrors;
  };

  // Submissão do formulário - INTEGRADO COM FIREBASE
  const handleSubmit = async (surgeryData) => {
    const validationErrors = validateForm(surgeryData);
    if (Object.keys(validationErrors).length > 0) {
      return { success: false, errors: validationErrors };
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔍 Verificando cirurgias similares...');
      const similarSurgeries = await checkSimilarSurgeries(
        selectedPatient.id, 
        surgeryData
      );
      
      if (similarSurgeries.length > 0) {
        console.log('⚠️ Cirurgias similares encontradas:', similarSurgeries);
        setSimilarSurgeriesFound(similarSurgeries);
        setShowSimilarModal(true);
        return { success: false, showModal: true };
      } else {
        console.log('✅ Nenhuma similar - criando nova cirurgia');
        await createNewSurgery(surgeryData);
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Erro ao processar cirurgia:', error);
      return { 
        success: false, 
        errors: { general: 'Erro ao processar cirurgia. Tente novamente.' }
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Criar nova cirurgia - INTEGRADO COM FIREBASE
  const createNewSurgery = async (surgeryData) => {
    try {
      console.log('🆕 Criando nova cirurgia no Firebase...');
      const newSurgery = await createSurgery(
        selectedPatient.id, 
        surgeryData, 
        currentUserId
      );
      
      console.log('✅ Cirurgia criada:', newSurgery);
      if (onSurgerySelected) {
        onSurgerySelected(newSurgery);
      }
    } catch (error) {
      console.error('❌ Erro ao criar cirurgia:', error);
      throw error;
    }
  };

  // Selecionar cirurgia existente - INTEGRADO COM FIREBASE
  const handleSelectExisting = async (surgery) => {
    setShowSimilarModal(false);
    
    try {
      console.log('🔍 Verificando subcoleção existente...');
      const subcollectionExists = await checkSubcollectionExists(
        selectedPatient.id, 
        surgery.id, 
        currentFlow
      );
      
      if (subcollectionExists.exists) {
        console.log('⚠️ Subcoleção já existe:', currentFlow);
        setConflictSurgery(surgery);
        setShowConflictModal(true);
      } else {
        console.log('✅ Subcoleção livre - usando cirurgia existente');
        if (onSurgerySelected) {
          onSurgerySelected(surgery);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar subcoleção:', error);
    }
  };

  // Forçar criação de nova cirurgia (ignorar similares)
  const handleForceCreate = async (surgeryData) => {
    setShowSimilarModal(false);
    try {
      await createNewSurgery(surgeryData);
    } catch (error) {
      console.error('❌ Erro ao criar nova cirurgia:', error);
    }
  };

  // Props para SurgeryFormFields
  const fieldsProps = {
    mode: "create",
    selectedPatient,
    currentFlow,
    onSubmit: handleSubmit,
    isSubmitting,
    canEdit: true,
    submitButtonText: isSubmitting ? "Verificando cirurgia..." : "Continuar",
    showSubmitButton: true
  };

  const flowLabels = {
    anesthesia: 'Ficha Anestésica',
    preAnesthesia: 'Avaliação Pré-Anestésica',
    srpa: 'Ficha SRPA'
  };

  return (
    <>
      <SurgeryFormFields {...fieldsProps} />

      {/* Modal de Cirurgia Similar */}
      {showSimilarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold">Cirurgia Similar Encontrada</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Encontramos uma cirurgia similar para este paciente:
            </p>

            {similarSurgeriesFound.map(surgery => (
              <div key={surgery.id} className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium">{surgery.procedimento || 'Procedimento não informado'}</p>
                <p className="text-sm text-gray-600">Status: {surgery.status}</p>
                <p className="text-sm text-gray-600">Código: {surgery.code}</p>
                {surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0 && (
                  <p className="text-sm text-gray-600">
                    CBHPM: {surgery.cbhpmProcedures.map(p => p.codigo).join(', ')}
                  </p>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={() => handleSelectExisting(similarSurgeriesFound[0])}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Selecionar Existente
              </button>
              <button
                onClick={() => setShowSimilarModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Interromper
              </button>
              <button
                onClick={() => handleForceCreate()}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                Criar Nova
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conflito de Subcoleção */}
      {showConflictModal && conflictSurgery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Conflito Detectado</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Já existe {flowLabels[currentFlow]} para esta cirurgia.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  if (onSurgerySelected) {
                    onSurgerySelected(conflictSurgery);
                  }
                }}
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700"
              >
                Editar Dados
              </button>
              <button
                onClick={() => setShowConflictModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Cancelar Fluxo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SurgeryFormCreator;