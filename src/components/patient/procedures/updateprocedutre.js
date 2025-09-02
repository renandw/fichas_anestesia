// Adicionar ao seu arquivo services/firestore.js

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Atualiza um procedimento existente
 * @param {string} patientId - ID do paciente
 * @param {string} procedureId - ID do procedimento
 * @param {Object} updateData - Dados para atualizar
 * @returns {Promise<Object>} - Resultado da operação
 */
export const updateProcedure = async (patientId, procedureId, updateData) => {
  try {
    console.log('🔄 Atualizando procedimento:', { patientId, procedureId, updateData });

    // Referência ao documento do procedimento
    const procedureRef = doc(db, 'patients', patientId, 'procedures', procedureId);

    // Preparar dados para update
    const dataToUpdate = {
      ...updateData,
      lastUpdated: new Date()
    };

    // Atualizar o documento
    await updateDoc(procedureRef, dataToUpdate);

    console.log('✅ Procedimento atualizado com sucesso');

    return {
      success: true,
      message: 'Procedimento atualizado com sucesso',
      procedureId: procedureId,
      patientId: patientId
    };

  } catch (error) {
    console.error('❌ Erro ao atualizar procedimento:', error);
    throw new Error(`Erro ao atualizar procedimento: ${error.message}`);
  }
};

/**
 * Atualiza apenas campos específicos de um procedimento (para auto-save)
 * @param {string} patientId - ID do paciente
 * @param {string} procedureId - ID do procedimento
 * @param {Object} fields - Campos específicos para atualizar
 * @returns {Promise<void>}
 */
export const updateProcedureFields = async (patientId, procedureId, fields) => {
  try {
    const procedureRef = doc(db, 'patients', patientId, 'procedures', procedureId);
    
    const updateData = {
      ...fields,
      lastUpdated: new Date()
    };

    await updateDoc(procedureRef, updateData);
    
  } catch (error) {
    console.error('Erro no update de campos específicos:', error);
    throw error;
  }
};

/**
 * Atualiza o status de um procedimento
 * @param {string} patientId - ID do paciente
 * @param {string} procedureId - ID do procedimento
 * @param {string} newStatus - Novo status ('planned', 'in_progress', 'completed', 'cancelled')
 * @param {string} updatedBy - ID do usuário que está atualizando
 * @returns {Promise<Object>} - Resultado da operação
 */
export const updateProcedureStatus = async (patientId, procedureId, newStatus, updatedBy) => {
  try {
    const procedureRef = doc(db, 'patients', patientId, 'procedures', procedureId);
    
    const updateData = {
      status: newStatus,
      lastUpdated: new Date(),
      lastUpdatedBy: updatedBy,
      ...(newStatus === 'completed' && { completedAt: new Date() }),
      ...(newStatus === 'cancelled' && { cancelledAt: new Date() })
    };

    await updateDoc(procedureRef, updateData);

    const statusMessages = {
      planned: 'Procedimento marcado como planejado',
      in_progress: 'Procedimento marcado como em andamento', 
      completed: 'Procedimento marcado como concluído',
      cancelled: 'Procedimento cancelado'
    };

    return {
      success: true,
      message: statusMessages[newStatus] || 'Status atualizado',
      procedureId,
      patientId,
      newStatus
    };

  } catch (error) {
    console.error('Erro ao atualizar status do procedimento:', error);
    throw new Error(`Erro ao atualizar status: ${error.message}`);
  }
};