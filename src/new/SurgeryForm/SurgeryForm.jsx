import React from 'react';
import SurgeryFormCreator from './SurgeryFormCreator';
import SurgeryFormEditor from './SurgeryFormEditor';

/**
 * SurgeryForm - Componente Orquestrador
 * 
 * Responsabilidades:
 * - Manter interface pública original (compatibilidade)
 * - Decidir qual componente renderizar baseado no mode
 * - Repassar todas as props para o componente apropriado
 */
const SurgeryForm = ({ 
  mode = "create", // "create" | "edit"
  existingSurgery = null,
  selectedPatient, 
  currentFlow = "anesthesia",
  onSurgerySelected,
  onSurgeryUpdated,
  ...otherProps // Para futuras props sem quebrar compatibilidade
}) => {
  
  // Validação básica de props obrigatórias
  if (!selectedPatient) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro: Paciente não selecionado</p>
      </div>
    );
  }

  // Validação para modo edit
  if (mode === "edit" && !existingSurgery) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800">Erro: Dados da cirurgia não fornecidos para edição</p>
      </div>
    );
  }

  // Props comuns para ambos os componentes
  const commonProps = {
    selectedPatient,
    currentFlow,
    onSurgerySelected,
    onSurgeryUpdated,
    ...otherProps
  };

  // Decisão de qual componente renderizar
  if (mode === "edit") {
    return (
      <SurgeryFormEditor
        existingSurgery={existingSurgery}
        {...commonProps}
      />
    );
  }

  return (
    <SurgeryFormCreator
      {...commonProps}
    />
  );
};

export default SurgeryForm;