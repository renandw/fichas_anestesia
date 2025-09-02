import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateSurgery } from '../../services/surgeryService';
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
 * SurgeryFormEditor - Lógica para Edição de Cirurgias
 * 
 * Responsabilidades:
 * - Gerenciar lógica específica de edição
 * - Detectar mudanças nos dados
 * - Controlar permissões de edição
 * - Integração com Firebase para atualização
 */
const SurgeryFormEditor = ({
  existingSurgery,
  selectedPatient,
  onSurgeryUpdated
}) => {
  const { currentUserId } = useAuth();

  // Estados específicos para edição
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentSurgeryData, setCurrentSurgeryData] = useState(null);

  // Inicializar dados da cirurgia existente
  useEffect(() => {
    if (existingSurgery) {
      const initialData = {
        surgeryDate: existingSurgery.surgeryDate || '',
        procedureType: existingSurgery.procedureType || 'convenio',
        patientWeight: existingSurgery.patientWeight || '',
        mainSurgeon: existingSurgery.mainSurgeon || '',
        auxiliarySurgeons: existingSurgery.auxiliarySurgeons || [],
        hospital: existingSurgery.hospital || '',
        hospitalRecord: existingSurgery.hospitalRecord || '',
        proposedSurgery: existingSurgery.proposedSurgery || '',
        insuranceNumber: existingSurgery.insuranceNumber || '',
        insuranceName: existingSurgery.insuranceName || '',
        cbhpmProcedures: existingSurgery.cbhpmProcedures || [],
        procedimento: existingSurgery.procedimento || ''
      };
      setCurrentSurgeryData(initialData);
    }
  }, [existingSurgery]);

  // Detectar mudanças para controle de botões
  const detectChanges = (newData) => {
    if (!existingSurgery || !newData) return false;

    const hasChanged = Object.keys(newData).some(key => {
      const current = newData[key];
      const original = existingSurgery[key];
      
      if (Array.isArray(current) && Array.isArray(original)) {
        return JSON.stringify(current) !== JSON.stringify(original);
      }
      
      return current !== original;
    });

    return hasChanged;
  };

  // Callback quando dados são alterados no formulário
  const handleDataChange = (newData) => {
    setCurrentSurgeryData(newData);
    const changes = detectChanges(newData);
    setHasChanges(changes);
  };

  // Validação do formulário
  const validateForm = (surgeryData) => {
    const newErrors = {};
    
    // Validação da data da cirurgia (data PURA: YYYY-MM-DD)
    if (!surgeryData.surgeryDate) {
      newErrors.surgeryDate = 'Data da cirurgia é obrigatória';
    } else if (!isValidDateOnly(surgeryData.surgeryDate)) {
      newErrors.surgeryDate = 'Data da cirurgia inválida (use AAAA-MM-DD)';
    } else {
      // (Opcional) Se quiser impedir datas futuras, descomente:
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

    if (!hasChanges) {
      return { 
        success: false, 
        errors: { general: 'Nenhuma alteração foi feita' }
      };
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔄 Atualizando cirurgia existente...');
      await updateSurgery(
        selectedPatient.id, 
        existingSurgery.id, 
        surgeryData, 
        currentUserId
      );
      
      console.log('✅ Cirurgia atualizada');
      
      // Atualizar dados locais
      setCurrentSurgeryData(surgeryData);
      setHasChanges(false);
      
      if (onSurgeryUpdated) {
        // Usar dados locais ao invés do retorno do service
        onSurgeryUpdated({ 
          id: existingSurgery.id, 
          ...surgeryData 
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar cirurgia:', error);
      return { 
        success: false, 
        errors: { general: 'Erro ao atualizar cirurgia. Tente novamente.' }
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descartar alterações - voltar ao estado original
  const handleDiscardChanges = () => {
    if (existingSurgery) {
      const originalData = {
        surgeryDate: existingSurgery.surgeryDate || '',
        procedureType: existingSurgery.procedureType || 'convenio',
        patientWeight: existingSurgery.patientWeight || '',
        mainSurgeon: existingSurgery.mainSurgeon || '',
        auxiliarySurgeons: existingSurgery.auxiliarySurgeons || [],
        hospital: existingSurgery.hospital || '',
        hospitalRecord: existingSurgery.hospitalRecord || '',
        proposedSurgery: existingSurgery.proposedSurgery || '',
        insuranceNumber: existingSurgery.insuranceNumber || '',
        insuranceName: existingSurgery.insuranceName || '',
        cbhpmProcedures: existingSurgery.cbhpmProcedures || [],
        procedimento: existingSurgery.procedimento || ''
      };
      
      setCurrentSurgeryData(originalData);
      setHasChanges(false);
      
      return originalData; // Retorna para o SurgeryFormFields resetar
    }
  };

  // Determinar se pode editar baseado no status
  const canEdit = existingSurgery?.status === "Agendada";

  // Determinar texto do botão
  const getSubmitButtonText = () => {
    if (isSubmitting) return "Salvando alterações...";
    if (!hasChanges) return "Nenhuma Alteração";
    return "Salvar Alterações";
  };

  // Props para SurgeryFormFields
  const fieldsProps = {
    mode: "edit",
    existingSurgery,
    selectedPatient,
    initialData: currentSurgeryData,
    onSubmit: handleSubmit,
    onDataChange: handleDataChange,
    onDiscardChanges: handleDiscardChanges,
    isSubmitting,
    canEdit,
    hasChanges,
    submitButtonText: getSubmitButtonText(),
    showSubmitButton: canEdit,
    showDiscardButton: hasChanges && canEdit
  };

  // Loading inicial
  if (!currentSurgeryData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Carregando dados da cirurgia...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Alert para cirurgias que não podem ser editadas */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Edição Limitada</h4>
              <p className="text-sm text-amber-700 mt-1">
                Esta cirurgia tem status "{existingSurgery?.status}" e só permite edições limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de mudanças não salvas */}
      {hasChanges && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <p className="text-sm text-blue-800">Você tem alterações não salvas</p>
          </div>
        </div>
      )}

      <SurgeryFormFields {...fieldsProps} />
    </>
  );
};

export default SurgeryFormEditor;