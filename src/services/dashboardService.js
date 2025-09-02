// src/services/dashboardService.js
import { 
  collection, 
  getDocs, 
  query, 
  where,
  collectionGroup
} from 'firebase/firestore';
import { db } from './firebase';

const normalizeTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') {
    try { return timestamp.toDate(); } catch { return null; }
  }
  if (timestamp.seconds != null) {
    return new Date(timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1e6));
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) ? date : null;
  }
  return null;
};

const getUserAnesthesiasForDashboard = async (userId) => {
  try {
    // Busca todas as anestesias criadas pelo usuário usando collectionGroup
    const anesthesiasQuery = query(
      collectionGroup(db, 'anesthesia'),
      where('metadata.createdBy', '==', userId)
    );
    
    const anesthesiasSnapshot = await getDocs(anesthesiasQuery);
    
    if (anesthesiasSnapshot.empty) {
      return [];
    }

    // Extrai IDs de pacientes e cirurgias únicos das anestesias
    const patientIds = new Set();
    const surgeryPaths = new Map(); // patientId -> Set(surgeryIds)
    
    anesthesiasSnapshot.docs.forEach(doc => {
      const path = doc.ref.path; // patients/{patientId}/surgeries/{surgeryId}/anesthesia/{anesthesiaId}
      const pathParts = path.split('/');
      const patientId = pathParts[1];
      const surgeryId = pathParts[3];
      
      patientIds.add(patientId);
      if (!surgeryPaths.has(patientId)) {
        surgeryPaths.set(patientId, new Set());
      }
      surgeryPaths.get(patientId).add(surgeryId);
    });

    // Busca dados dos pacientes em paralelo
    const patientPromises = Array.from(patientIds).map(async (patientId) => {
      const patientDoc = await getDocs(query(collection(db, 'patients'), where('__name__', '==', patientId)));
      return { id: patientId, data: patientDoc.docs[0]?.data() };
    });
    
    const patientsData = await Promise.all(patientPromises);
    const patientsMap = new Map(patientsData.map(p => [p.id, p.data]));

    // Busca dados das cirurgias em paralelo
    const surgeryPromises = [];
    for (const [patientId, surgeryIds] of surgeryPaths.entries()) {
      for (const surgeryId of surgeryIds) {
        surgeryPromises.push(
          getDocs(query(collection(db, 'patients', patientId, 'surgeries'), where('__name__', '==', surgeryId)))
          .then(snapshot => ({
            patientId,
            surgeryId,
            data: snapshot.docs[0]?.data()
          }))
        );
      }
    }
    
    const surgeriesData = await Promise.all(surgeryPromises);
    const surgeriesMap = new Map();
    surgeriesData.forEach(s => {
      if (!surgeriesMap.has(s.patientId)) {
        surgeriesMap.set(s.patientId, new Map());
      }
      surgeriesMap.get(s.patientId).set(s.surgeryId, s.data);
    });

    // Combina dados das anestesias com dados dos pacientes e cirurgias
    const combinedAnesthesias = anesthesiasSnapshot.docs.map(doc => {
      const anesthesiaData = doc.data();
      const path = doc.ref.path;
      const pathParts = path.split('/');
      const patientId = pathParts[1];
      const surgeryId = pathParts[3];
      
      const patientData = patientsMap.get(patientId) || {};
      const surgeryData = surgeriesMap.get(patientId)?.get(surgeryId) || {};

      return {
        id: doc.id,
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
        cbhpmProcedures: surgeryData.cbhpmProcedures
      };
    });

    return combinedAnesthesias;

  } catch (error) {
    console.error('Erro ao buscar anestesias para dashboard:', error);
    return [];
  }
};

/**
 * Calcula estatísticas do dashboard com dados mensais
 */
export const getDashboardStats = async (userId) => {
  try {
    // Busca todas as anestesias do usuário (sem recorrer ao anesthesiaService)
    const allAnesthesias = await getUserAnesthesiasForDashboard(userId);
    
    if (!allAnesthesias || allAnesthesias.length === 0) {
      return {
        anesthesias: { current: 0, previous: 0, total: 0 },
        patients: { current: 0, previous: 0, total: 0 },
        surgeries: { current: 0, previous: 0, total: 0 }
      };
    }

    // Configura datas para filtros mensais
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Função helper para extrair a data real da anestesia (prioriza quando foi realizada)
    const getAnesthesiaDate = (anesthesia) => {
      const anesthesiaStart = anesthesia?.anesthesiaStart;

      // Tenta usar anesthesia.anesthesiaStart primeiro
      if (anesthesiaStart) {
        // Se é um Date object
        if (anesthesiaStart instanceof Date) return anesthesiaStart;

        // Se tem método toDate (Firestore Timestamp)
        if (typeof anesthesiaStart.toDate === 'function') {
          try { return anesthesiaStart.toDate(); } catch { /* ignore */ }
        }

        // Se tem estrutura de Firestore Timestamp (seconds/nanoseconds)
        if (anesthesiaStart.seconds != null) {
          return new Date(
            anesthesiaStart.seconds * 1000 +
            Math.floor((anesthesiaStart.nanoseconds || 0) / 1e6)
          );
        }

        // Tenta converter string/number para Date
        if (typeof anesthesiaStart === 'string' || typeof anesthesiaStart === 'number') {
          const date = new Date(anesthesiaStart);
          if (!isNaN(date.getTime())) return date;
        }
      }

      // Fallback: usa metadata.createdAt (data em que foi digitada no sistema)
      const createdAt = anesthesia?.metadata?.createdAt;
      if (!createdAt) return null;

      // Se é um Date object
      if (createdAt instanceof Date) return createdAt;

      // Se tem método toDate (Firestore Timestamp)
      if (typeof createdAt.toDate === 'function') {
        try { return createdAt.toDate(); } catch { return null; }
      }

      // Se tem estrutura de Firestore Timestamp (seconds/nanoseconds)
      if (createdAt.seconds != null) {
        return new Date(createdAt.seconds * 1000 + Math.floor((createdAt.nanoseconds || 0) / 1e6));
      }

      // Tenta converter string/number para Date
      if (typeof createdAt === 'string' || typeof createdAt === 'number') {
        const date = new Date(createdAt);
        return !isNaN(date.getTime()) ? date : null;
      }

      return null;
    };

    // Filtra anestesias por período
    const anesthesiasCurrentMonth = allAnesthesias.filter(anesthesia => {
      const date = getAnesthesiaDate(anesthesia);
      return date && date >= currentMonthStart;
    });

    const anesthesiasPreviousMonth = allAnesthesias.filter(anesthesia => {
      const date = getAnesthesiaDate(anesthesia);
      return date && date >= previousMonthStart && date <= previousMonthEnd;
    });

    // Função para obter pacientes únicos
    const getUniquePatients = (anesthesias) => {
      const uniquePatientIds = new Set();
      anesthesias.forEach(anesthesia => {
        if (anesthesia.patientId) {
          uniquePatientIds.add(anesthesia.patientId);
        }
      });
      return uniquePatientIds.size;
    };

    // Calcula estatísticas
    const stats = {
      anesthesias: {
        current: anesthesiasCurrentMonth.length,
        previous: anesthesiasPreviousMonth.length,
        total: allAnesthesias.length
      },
      patients: {
        current: getUniquePatients(anesthesiasCurrentMonth),
        previous: getUniquePatients(anesthesiasPreviousMonth),
        total: getUniquePatients(allAnesthesias)
      },
      surgeries: {
        current: anesthesiasCurrentMonth.length, // 1:1 com anestesias
        previous: anesthesiasPreviousMonth.length,
        total: allAnesthesias.length
      }
    };

    return stats;

  } catch (error) {
    console.error('Erro ao calcular estatísticas do dashboard:', error);
    
    // Retorna estrutura padrão em caso de erro
    return {
      anesthesias: { current: 0, previous: 0, total: 0 },
      patients: { current: 0, previous: 0, total: 0 },
      surgeries: { current: 0, previous: 0, total: 0 }
    };
  }
};

/**
 * Calcula a variação percentual entre dois valores
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Formata as estatísticas com variações percentuais
 */
export const formatDashboardStats = (stats) => {
  return {
    anesthesias: {
      ...stats.anesthesias,
      change: calculatePercentageChange(stats.anesthesias.current, stats.anesthesias.previous),
      trend: stats.anesthesias.current >= stats.anesthesias.previous ? 'up' : 'down'
    },
    patients: {
      ...stats.patients,
      change: calculatePercentageChange(stats.patients.current, stats.patients.previous),
      trend: stats.patients.current >= stats.patients.previous ? 'up' : 'down'
    },
    surgeries: {
      ...stats.surgeries,
      change: calculatePercentageChange(stats.surgeries.current, stats.surgeries.previous),
      trend: stats.surgeries.current >= stats.surgeries.previous ? 'up' : 'down'
    }
  };
};

/**
 * Obter nome do mês atual em português
 */
export const getCurrentMonthName = () => {
  const now = new Date();
  return now.toLocaleDateString('pt-BR', { month: 'long' });
};

/**
 * Obter nome do mês anterior em português
 */
export const getPreviousMonthName = () => {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return previousMonth.toLocaleDateString('pt-BR', { month: 'long' });
};