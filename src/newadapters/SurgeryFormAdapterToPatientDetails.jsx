import React, { useState } from 'react';
import { X } from 'lucide-react';
import SurgeryForm from '../new/SurgeryForm/SurgeryForm';

/**
 * Adapter para usar SurgeryForm dentro do PatientDetails
 * Traduz props e callbacks entre as duas interfaces
 * 
 * ATUALIZADO para funcionar com a nova arquitetura refatorada:
 * - SurgeryForm (orquestrador)
 * - SurgeryFormCreator (lógica criação)  
 * - SurgeryFormEditor (lógica edição)
 * - SurgeryFormFields (UI compartilhada)
 */
const SurgeryFormAdapterToPatientDetails = ({
  patientId,
  patientName = 'Paciente', // ✅ NOVO: Nome do paciente para exibição
  initialData = null,
  onSave,
  onCancel,
  mode = "create", // "create" | "edit"
  currentFlow = "anesthesia" // ✅ NOVO: Permitir customizar flow
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ MELHORADO: Converter patientId para formato que SurgeryForm espera
  const selectedPatient = {
    id: patientId,
    patientName: patientName || 'Paciente', // Usar nome fornecido ou fallback
  };

  // ✅ MELHORADO: Validação mais robusta para existingSurgery
  const existingSurgery = mode === "edit" && initialData ? {
    // Garantir que tem ID (obrigatório para edit)
    id: initialData.id || `temp-${Date.now()}`,
    
    // Garantir status padrão se não fornecido
    status: initialData.status || 'Agendada',
    
    // Espalhar todos os outros dados
    ...initialData,
    
    // ✅ NOVO: Garantir estruturas de array se não existirem
    auxiliarySurgeons: initialData.auxiliarySurgeons || [],
    cbhpmProcedures: initialData.cbhpmProcedures || [],
  } : null;

  // ✅ MELHORADO: Adapter para onSurgerySelected (modo create)
  const handleSurgerySelected = async (createdSurgery) => {
    if (!onSave) return;
    
    setIsProcessing(true);
    try {
      console.log('🎯 Adapter: Cirurgia criada, chamando onSave...', createdSurgery);
      
      // Chamar onSave com dados da cirurgia criada
      // Note: alguns adapters podem esperar dois parâmetros (surgery, surgeryData)
      await onSave(createdSurgery, createdSurgery);
      
      console.log('✅ Adapter: onSave executado com sucesso');
    } catch (error) {
      console.error('❌ Adapter: Erro no callback onSave:', error);
      // Não re-throw para não quebrar o fluxo do SurgeryForm
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ MELHORADO: Adapter para onSurgeryUpdated (modo edit)
  const handleSurgeryUpdated = async (updatedSurgery) => {
    if (!onSave) return;
    
    setIsProcessing(true);
    try {
      console.log('🎯 Adapter: Cirurgia atualizada, chamando onSave...', updatedSurgery);
      
      // Para modo edit, onSave recebe apenas a cirurgia atualizada
      await onSave(updatedSurgery);
      
      console.log('✅ Adapter: onSave executado com sucesso');
    } catch (error) {
      console.error('❌ Adapter: Erro no callback onSave:', error);
      // Não re-throw para não quebrar o fluxo do SurgeryForm
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ NOVO: Validação de props obrigatórias
  if (!patientId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro: ID do paciente é obrigatório</p>
      </div>
    );
  }

  if (mode === "edit" && !initialData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800">Erro: Dados iniciais são obrigatórios para modo de edição</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Overlay de processamento */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">
              {mode === "edit" ? "Salvando alterações..." : "Criando cirurgia..."}
            </span>
          </div>
        </div>
      )}

      {/* ✅ SurgeryForm com props adaptadas - COMPATÍVEL COM NOVA ARQUITETURA */}
      <SurgeryForm
        mode={mode}
        existingSurgery={existingSurgery}
        selectedPatient={selectedPatient}
        currentFlow={currentFlow}
        onSurgerySelected={handleSurgerySelected}
        onSurgeryUpdated={handleSurgeryUpdated}
      />
    </div>
  );
};

export default SurgeryFormAdapterToPatientDetails;