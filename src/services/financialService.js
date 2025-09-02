// src/services/financialService.js
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  getDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ===== VALIDAÇÕES =====

/**
 * Validar se a anestesia é de convênio, baseado nos dados da cirurgia
 */
const validateConvenioAnesthesia = (anesthesiaData, surgeryData) => {
  if (!anesthesiaData) {
    throw new Error('Dados da anestesia não encontrados');
  }

  if (!surgeryData || surgeryData.procedureType !== 'convenio') {
    throw new Error('Operações financeiras só são permitidas para procedimentos de convênio');
  }

  return true;
};

/**
 * Normalizar dados financeiros
 */
const normalizeFinancialData = (financial) => {
  if (!financial) return null;
  
  // Garantir que finalValue seja calculado corretamente
  const finalValue = financial.glosa?.hasGlosa 
    ? (financial.value || 0) - (financial.glosa?.glosedValue || 0)
    : financial.value || 0;
    
  return {
    value: financial.value || 0,
    paymentDate: financial.paymentDate || null,
    paid: financial.paid || false,
    glosa: {
      hasGlosa: financial.glosa?.hasGlosa || false,
      glosedValue: financial.glosa?.glosedValue || 0,
      finalValue: finalValue
    },
    notes: financial.notes || ''
  };
};

// ===== OPERAÇÕES BÁSICAS =====

/**
 * Atualizar dados financeiros de uma anestesia
 */
export const updateAnesthesiaFinancial = async (patientId, surgeryId, anesthesiaId, financialData, currentUserId) => {
  try {
    // Validar parâmetros
    if (!patientId || !surgeryId || !anesthesiaId || !currentUserId) {
      throw new Error('Parâmetros obrigatórios não fornecidos');
    }

    // Buscar anestesia atual para validação
    const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
    const anesthesiaDoc = await getDoc(anesthesiaRef);
    
    if (!anesthesiaDoc.exists()) {
      throw new Error('Anestesia não encontrada');
    }

    // Buscar dados da cirurgia
    const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
    const surgeryDoc = await getDoc(surgeryRef);
    if (!surgeryDoc.exists()) throw new Error('Cirurgia não encontrada');
    const surgeryData = surgeryDoc.data();

    const anesthesiaData = anesthesiaDoc.data();
    validateConvenioAnesthesia(anesthesiaData, surgeryData);

    // Normalizar e validar dados financeiros
    const normalizedFinancial = normalizeFinancialData(financialData);
    
    if (normalizedFinancial.value < 0) {
      throw new Error('Valor não pode ser negativo');
    }
    
    if (normalizedFinancial.glosa.glosedValue < 0) {
      throw new Error('Valor da glosa não pode ser negativo');
    }
    
    if (normalizedFinancial.glosa.glosedValue > normalizedFinancial.value) {
      throw new Error('Valor da glosa não pode ser maior que o valor total');
    }

    // Atualizar dados
    await updateDoc(anesthesiaRef, {
      financial: normalizedFinancial,
      'metadata.updatedAt': serverTimestamp(),
      'metadata.updatedBy': currentUserId
    });

    console.log('Dados financeiros atualizados com sucesso');
    return {
      success: true,
      financial: normalizedFinancial
    };
    
  } catch (error) {
    console.error('Erro ao atualizar dados financeiros:', error);
    throw error;
  }
};

/**
 * Buscar dados financeiros de uma anestesia
 */
export const getAnesthesiaFinancial = async (patientId, surgeryId, anesthesiaId) => {
  try {
    const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
    const anesthesiaDoc = await getDoc(anesthesiaRef);
    
    if (!anesthesiaDoc.exists()) {
      return null;
    }

    // Buscar dados da cirurgia
    const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
    const surgeryDoc = await getDoc(surgeryRef);
    if (!surgeryDoc.exists()) throw new Error('Cirurgia não encontrada');
    const surgeryData = surgeryDoc.data();

    const anesthesiaData = anesthesiaDoc.data();
    validateConvenioAnesthesia(anesthesiaData, surgeryData);

    return normalizeFinancialData(anesthesiaData.financial);
    
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    throw error;
  }
};

// ===== OPERAÇÕES DE PAGAMENTO =====

/**
 * Marcar anestesia como paga
 */
export const markAsPaid = async (patientId, surgeryId, anesthesiaId, paymentDate, currentUserId) => {
  try {
    const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
    const anesthesiaDoc = await getDoc(anesthesiaRef);
    
    if (!anesthesiaDoc.exists()) {
      throw new Error('Anestesia não encontrada');
    }

    // Buscar dados da cirurgia
    const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
    const surgeryDoc = await getDoc(surgeryRef);
    if (!surgeryDoc.exists()) throw new Error('Cirurgia não encontrada');
    const surgeryData = surgeryDoc.data();

    const anesthesiaData = anesthesiaDoc.data();
    validateConvenioAnesthesia(anesthesiaData, surgeryData);

    const currentFinancial = anesthesiaData.financial || {};
    const normalizedFinancial = normalizeFinancialData(currentFinancial);

    await updateDoc(anesthesiaRef, {
      'financial.paid': true,
      'financial.paymentDate': paymentDate,
      'metadata.updatedAt': serverTimestamp(),
      'metadata.updatedBy': currentUserId
    });

    console.log('Anestesia marcada como paga');
    return true;
    
  } catch (error) {
    console.error('Erro ao marcar como paga:', error);
    throw error;
  }
};

/**
 * Marcar anestesia como não paga
 */
export const markAsUnpaid = async (patientId, surgeryId, anesthesiaId, currentUserId) => {
  try {
    const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
    const anesthesiaDoc = await getDoc(anesthesiaRef);
    
    if (!anesthesiaDoc.exists()) {
      throw new Error('Anestesia não encontrada');
    }

    // Buscar dados da cirurgia
    const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
    const surgeryDoc = await getDoc(surgeryRef);
    if (!surgeryDoc.exists()) throw new Error('Cirurgia não encontrada');
    const surgeryData = surgeryDoc.data();

    const anesthesiaData = anesthesiaDoc.data();
    validateConvenioAnesthesia(anesthesiaData, surgeryData);

    await updateDoc(anesthesiaRef, {
      'financial.paid': false,
      'financial.paymentDate': null,
      'metadata.updatedAt': serverTimestamp(),
      'metadata.updatedBy': currentUserId
    });

    console.log('Anestesia marcada como não paga');
    return true;
    
  } catch (error) {
    console.error('Erro ao marcar como não paga:', error);
    throw error;
  }
};

// ===== OPERAÇÕES DE GLOSA =====

/**
 * Adicionar ou atualizar glosa
 */
export const updateGlosa = async (patientId, surgeryId, anesthesiaId, glosedValue, currentUserId) => {
  try {
    const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
    const anesthesiaDoc = await getDoc(anesthesiaRef);
    
    if (!anesthesiaDoc.exists()) {
      throw new Error('Anestesia não encontrada');
    }

    // Buscar dados da cirurgia
    const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
    const surgeryDoc = await getDoc(surgeryRef);
    if (!surgeryDoc.exists()) throw new Error('Cirurgia não encontrada');
    const surgeryData = surgeryDoc.data();

    const anesthesiaData = anesthesiaDoc.data();
    validateConvenioAnesthesia(anesthesiaData, surgeryData);

    const currentFinancial = anesthesiaData.financial || {};
    const originalValue = currentFinancial.value || 0;
    
    if (glosedValue < 0) {
      throw new Error('Valor da glosa não pode ser negativo');
    }
    
    if (glosedValue > originalValue) {
      throw new Error('Valor da glosa não pode ser maior que o valor total');
    }

    const finalValue = originalValue - glosedValue;
    const hasGlosa = glosedValue > 0;

    await updateDoc(anesthesiaRef, {
      'financial.glosa.hasGlosa': hasGlosa,
      'financial.glosa.glosedValue': glosedValue,
      'financial.glosa.finalValue': finalValue,
      'metadata.updatedAt': serverTimestamp(),
      'metadata.updatedBy': currentUserId
    });

    console.log('Glosa atualizada com sucesso');
    return {
      hasGlosa,
      glosedValue,
      finalValue
    };
    
  } catch (error) {
    console.error('Erro ao atualizar glosa:', error);
    throw error;
  }
};

/**
 * Remover glosa
 */
export const removeGlosa = async (patientId, surgeryId, anesthesiaId, currentUserId) => {
  return updateGlosa(patientId, surgeryId, anesthesiaId, 0, currentUserId);
};

// ===== BUSCAS E RELATÓRIOS =====

/**
 * Buscar todas as anestesias de convênio com dados financeiros do usuário
 */
export const getConvenioAnesthesias = async (userId, filters = {}) => {
  try {
    const convenioAnesthesias = [];
    
    // Buscar todos os pacientes
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);

    const patientDataMap = new Map();
    for (const patientDoc of patientsSnapshot.docs) {
      patientDataMap.set(patientDoc.id, patientDoc.data());
    }

    // Buscar cirurgias de convênio do usuário
    const surgeryPromises = [];
    for (const [patientId, patientData] of patientDataMap.entries()) {
      const surgeriesRef = collection(db, 'patients', patientId, 'surgeries');
      const surgeriesQuery = query(
        surgeriesRef,
        where('metadata.createdBy', '==', userId),
        where('procedureType', '==', 'convenio')
      );
      surgeryPromises.push(
        getDocs(surgeriesQuery).then(snapshot => ({
          patientId,
          patientData,
          surgeries: snapshot.docs
        }))
      );
    }
    const surgeryResults = await Promise.all(surgeryPromises);

    // Buscar anestesias dessas cirurgias
    const anesthesiaPromises = [];
    for (const { patientId, patientData, surgeries } of surgeryResults) {
      for (const surgeryDoc of surgeries) {
        const surgeryId = surgeryDoc.id;
        const surgeryData = surgeryDoc.data();
        const anesthesiasRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia');
        anesthesiaPromises.push(
          getDocs(anesthesiasRef).then(anesthesiaSnapshot => {
            return anesthesiaSnapshot.docs.map((anesthesiaDoc) => {
              const anesthesiaData = anesthesiaDoc.data();
              return {
                id: anesthesiaDoc.id,
                ...anesthesiaData,
                patientId,
                surgeryId,
                patientName: patientData.patientName,
                patientBirthDate: patientData.patientBirthDate,
                procedureType: surgeryData.procedureType,
                hospital: surgeryData.hospital,
                mainSurgeon: surgeryData.mainSurgeon,
                code: surgeryData.code,
                proposedSurgery: surgeryData.proposedSurgery,
                cbhpmProcedures: surgeryData.cbhpmProcedures,
                insuranceName: surgeryData.insuranceName,
                financial: normalizeFinancialData(anesthesiaData.financial)
              };
            });
          })
        );
      }
    }
    
    const anesthesiaResults = await Promise.all(anesthesiaPromises);
    const allConvenioAnesthesias = anesthesiaResults.flat();

    // Aplicar filtros
    let filtered = allConvenioAnesthesias;

    // Filtro por status de pagamento
    if (filters.paid !== undefined) {
      filtered = filtered.filter(a => a.financial?.paid === filters.paid);
    }

    // Filtro por glosa
    if (filters.hasGlosa !== undefined) {
      filtered = filtered.filter(a => a.financial?.glosa?.hasGlosa === filters.hasGlosa);
    }

    // Filtro por valor mínimo
    if (filters.minValue !== undefined) {
      filtered = filtered.filter(a => (a.financial?.value || 0) >= filters.minValue);
    }

    // Filtro por valor máximo
    if (filters.maxValue !== undefined) {
      filtered = filtered.filter(a => (a.financial?.value || 0) <= filters.maxValue);
    }

    // Filtro por data de pagamento
    if (filters.paymentDateFrom) {
      const fromDate = new Date(filters.paymentDateFrom);
      filtered = filtered.filter(a => {
        if (!a.financial?.paymentDate) return false;
        const paymentDate = new Date(a.financial.paymentDate);
        return paymentDate >= fromDate;
      });
    }

    if (filters.paymentDateTo) {
      const toDate = new Date(filters.paymentDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(a => {
        if (!a.financial?.paymentDate) return false;
        const paymentDate = new Date(a.financial.paymentDate);
        return paymentDate <= toDate;
      });
    }

    // Ordenar por data de criação (mais recente primeiro)
    filtered.sort((a, b) => {
      const dateA = a.metadata?.createdAt?.seconds
        ? new Date(a.metadata.createdAt.seconds * 1000)
        : new Date(a.metadata?.createdAt);
      const dateB = b.metadata?.createdAt?.seconds
        ? new Date(b.metadata.createdAt.seconds * 1000)
        : new Date(b.metadata?.createdAt);
      return dateB - dateA;
    });

    return filtered;
    
  } catch (error) {
    console.error('Erro ao buscar anestesias de convênio:', error);
    return [];
  }
};

/**
 * Gerar resumo financeiro
 */
export const getFinancialSummary = async (userId, filters = {}) => {
  try {
    const convenioAnesthesias = await getConvenioAnesthesias(userId, filters);
    
    let totalFaturado = 0;
    let totalGlosado = 0;
    let totalFinal = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let countTotal = convenioAnesthesias.length;
    let countPaid = 0;
    let countWithGlosa = 0;

    convenioAnesthesias.forEach(anesthesia => {
      const financial = anesthesia.financial;
      if (financial) {
        totalFaturado += financial.value || 0;
        totalGlosado += financial.glosa?.glosedValue || 0;
        totalFinal += financial.glosa?.finalValue || financial.value || 0;
        
        if (financial.paid) {
          totalPago += financial.glosa?.finalValue || financial.value || 0;
          countPaid++;
        } else {
          totalPendente += financial.glosa?.finalValue || financial.value || 0;
        }
        
        if (financial.glosa?.hasGlosa) {
          countWithGlosa++;
        }
      }
    });

    return {
      totalFaturado,
      totalGlosado,
      totalFinal,
      totalPago,
      totalPendente,
      counts: {
        total: countTotal,
        paid: countPaid,
        pending: countTotal - countPaid,
        withGlosa: countWithGlosa
      },
      percentages: {
        paid: countTotal > 0 ? (countPaid / countTotal) * 100 : 0,
        withGlosa: countTotal > 0 ? (countWithGlosa / countTotal) * 100 : 0
      }
    };
    
  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    throw error;
  }
};

/**
 * Buscar anestesias por status de pagamento
 */
export const getAnesthesiasByPaymentStatus = async (userId, paid = true) => {
  return getConvenioAnesthesias(userId, { paid });
};

/**
 * Buscar anestesias com glosa
 */
export const getAnesthesiasWithGlosa = async (userId) => {
  return getConvenioAnesthesias(userId, { hasGlosa: true });
};

/**
 * Gerar resumo financeiro mensal específico (Particular vs Convênios)
 */
export const getMonthlyFinancialSummary = async (userId, year, month) => {
  try {
    // Calcular início e fim do mês
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Buscar todos os pacientes
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);

    const patientDataMap = new Map();
    for (const patientDoc of patientsSnapshot.docs) {
      patientDataMap.set(patientDoc.id, patientDoc.data());
    }

    // Buscar cirurgias do mês específico
    const monthlyAnesthesias = [];
    const surgeryPromises = [];

    for (const [patientId, patientData] of patientDataMap.entries()) {
      const surgeriesRef = collection(db, 'patients', patientId, 'surgeries');
      const surgeriesQuery = query(
        surgeriesRef,
        where('metadata.createdBy', '==', userId),
        where('surgeryDate', '>=', startOfMonth.toISOString().split('T')[0]),
        where('surgeryDate', '<=', endOfMonth.toISOString().split('T')[0])
      );
      
      surgeryPromises.push(
        getDocs(surgeriesQuery).then(snapshot => ({
          patientId,
          patientData,
          surgeries: snapshot.docs
        }))
      );
    }

    const surgeryResults = await Promise.all(surgeryPromises);

    // Buscar anestesias das cirurgias do mês
    const anesthesiaPromises = [];
    for (const { patientId, patientData, surgeries } of surgeryResults) {
      for (const surgeryDoc of surgeries) {
        const surgeryId = surgeryDoc.id;
        const surgeryData = surgeryDoc.data();
        
        // Filtrar apenas procedimentos de convênio
        if (surgeryData.procedureType === 'convenio') {
          const anesthesiasRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia');
          anesthesiaPromises.push(
            getDocs(anesthesiasRef).then(anesthesiaSnapshot => {
              return anesthesiaSnapshot.docs.map((anesthesiaDoc) => {
                const anesthesiaData = anesthesiaDoc.data();
                return {
                  id: anesthesiaDoc.id,
                  ...anesthesiaData,
                  patientId,
                  surgeryId,
                  patientName: patientData.patientName,
                  procedureType: surgeryData.procedureType,
                  insuranceName: surgeryData.insuranceName,
                  financial: normalizeFinancialData(anesthesiaData.financial)
                };
              });
            })
          );
        }
      }
    }

    const anesthesiaResults = await Promise.all(anesthesiaPromises);
    const allMonthlyAnesthesias = anesthesiaResults.flat();

    // Separar dados por tipo dentro dos procedimentos de convênio
    const particulares = [];
    const convenios = [];

    allMonthlyAnesthesias.forEach(anesthesia => {
      if (anesthesia.insuranceName === 'Particular') {
        particulares.push(anesthesia);
      } else {
        convenios.push(anesthesia);
      }
    });

    // Calcular totais para particulares
    const particularSummary = {
      count: particulares.length,
      faturado: 0,
      recebido: 0,
      pendente: 0
    };

    particulares.forEach(anesthesia => {
      const financial = anesthesia.financial;
      if (financial) {
        const finalValue = financial.glosa?.finalValue || financial.value || 0;
        particularSummary.faturado += financial.value || 0;
        if (financial.paid) {
          particularSummary.recebido += finalValue;
        } else {
          particularSummary.pendente += finalValue;
        }
      }
    });

    // Calcular totais para convênios
    const convenioSummary = {
      count: convenios.length,
      faturado: 0,
      recebido: 0,
      pendente: 0,
      glosado: 0
    };

    convenios.forEach(anesthesia => {
      const financial = anesthesia.financial;
      if (financial) {
        const finalValue = financial.glosa?.finalValue || financial.value || 0;
        convenioSummary.faturado += financial.value || 0;
        convenioSummary.glosado += financial.glosa?.glosedValue || 0;
        if (financial.paid) {
          convenioSummary.recebido += finalValue;
        } else {
          convenioSummary.pendente += finalValue;
        }
      }
    });

    // Gerar breakdown por insuranceName
    const breakdownMap = new Map();
    // Adicionar particulares
    if (particulares.length > 0) {
      breakdownMap.set('Particular', particulares.length);
    }
    // Adicionar convênios
    convenios.forEach(anesthesia => {
      const insuranceName = anesthesia.insuranceName || 'Convênio não identificado';
      breakdownMap.set(insuranceName, (breakdownMap.get(insuranceName) || 0) + 1);
    });

    // Converter para array ordenado
    const breakdown = Array.from(breakdownMap.entries())
      .map(([insuranceName, count]) => ({ insuranceName, count }))
      .sort((a, b) => b.count - a.count);

    return {
      particular: particularSummary,
      convenio: convenioSummary,
      breakdown: breakdown
    };

  } catch (error) {
    console.error('Erro ao gerar resumo financeiro mensal:', error);
    throw error;
  }
};

/**
 * Gerar relatório financeiro por período
 */
export const getUserFinancialReport = async (userId, dateFrom, dateTo) => {
  try {
    const filters = {};
    
    if (dateFrom) {
      filters.paymentDateFrom = dateFrom;
    }
    
    if (dateTo) {
      filters.paymentDateTo = dateTo;
    }

    const anesthesias = await getConvenioAnesthesias(userId, filters);
    const summary = await getFinancialSummary(userId, filters);

    return {
      period: {
        from: dateFrom,
        to: dateTo
      },
      summary,
      anesthesias,
      generatedAt: new Date()
    };
    
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    throw error;
  }
};