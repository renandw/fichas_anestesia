// src/services/anesthesiaService.js
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    doc,
    getDoc,
    orderBy,
    collectionGroup,
    getCountFromServer,
    limit,
    serverTimestamp
  } from 'firebase/firestore';
import { db } from './firebase';

// ===== Helpers de Normalização (Timestamp → Date) =====
const toDateSafe = (v) => {
  if (v instanceof Date) return v;
  if (v && typeof v.toDate === 'function') {
    try { return v.toDate(); } catch { /* ignore */ }
  }
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  if (v && typeof v === 'object' && (v.seconds != null)) {
    // Firestore Timestamp-like shape
    return new Date(v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6));
  }
  return null;
};

export async function getUserAnesthesiasCount(userId) {
  const q = query(
    collectionGroup(db, 'anesthesia'),
    where('metadata.createdBy', '==', userId)  // só as criadas pelo usuário
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export const normalizeAnesthesiaRecord = (rec) => {
  if (!rec) return rec;
  const out = { ...rec };
  const dateFields = [
    'anesthesiaStart', 'anesthesiaEnd',
    'surgeryStart', 'surgeryEnd',
  ];
  for (const f of dateFields) {
    out[f] = toDateSafe(rec[f]);
  }
  if (out.metadata) {
    out.metadata = { ...out.metadata };
    for (const k of ['createdAt', 'updatedAt', 'finishedAt']) {
      if (out.metadata[k] != null) {
        const d = toDateSafe(out.metadata[k]);
        if (d) out.metadata[k] = d;
      }
    }
  }
  return out;
};
  
  // ============= ANESTHESIA =============
  
  /**
   * Criar ficha anestésica
   */
  export const createAnesthesia = async (patientId, surgeryId, anesthesiaData, currentUserId) => {
    try {
      const anesthesiaWithMetadata = {
        ...anesthesiaData,
        status: 'Em andamento',
        metadata: {
          createdAt: serverTimestamp(),
          createdBy: currentUserId
        }
      };
  
      const anesthesiaRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia');
      const anesthesiaDocRef = await addDoc(anesthesiaRef, anesthesiaWithMetadata);
      
      console.log('Ficha anestésica criada com sucesso');
      return { 
        id: anesthesiaDocRef.id, 
        ...anesthesiaWithMetadata,
        metadata: {
          ...anesthesiaWithMetadata.metadata,
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('Erro ao criar ficha anestésica:', error);
      throw error;
    }
  };
  
  /**
   * Atualizar ficha anestésica
   */
  export const updateAnesthesia = async (patientId, surgeryId, anesthesiaId, updates, currentUserId) => {
    try {
      const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
      
      await updateDoc(anesthesiaRef, {
        ...updates,
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId
      });
      
      console.log('Ficha anestésica atualizada');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar ficha anestésica:', error);
      throw error;
    }
  };
  
  /**
   * Buscar ficha anestésica
   */
  export const getAnesthesia = async (patientId, surgeryId, anesthesiaId) => {
    try {
      const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
      const anesthesiaDoc = await getDoc(anesthesiaRef);
      
      if (anesthesiaDoc.exists()) {
        return normalizeAnesthesiaRecord({ id: anesthesiaDoc.id, ...anesthesiaDoc.data() });
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar ficha anestésica:', error);
      throw error;
    }
  };
  
  /**
   * Buscar primeira ficha anestésica de uma cirurgia
   */
  export const getSurgeryAnesthesia = async (patientId, surgeryId) => {
    try {
      const anesthesiaRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia');
      const q = query(anesthesiaRef, orderBy('metadata.createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const anesthesiaDoc = snapshot.docs[0];
        return normalizeAnesthesiaRecord({ id: anesthesiaDoc.id, ...anesthesiaDoc.data() });
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar anestesia da cirurgia:', error);
      throw error;
    }
  };
  
  /**
   * Finalizar anestesia
   */
  export const finalizeAnesthesia = async (patientId, surgeryId, anesthesiaId, finalData, currentUserId) => {
    try {
      const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
      
      await updateDoc(anesthesiaRef, {
        ...finalData,
        status: 'Concluída',
        'metadata.finishedAt': serverTimestamp(),
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId
      });
      
      console.log('Anestesia finalizada');
      return true;
    } catch (error) {
      console.error('Erro ao finalizar anestesia:', error);
      throw error;
    }
  };

  export const finalizeAnesthesiaAndSurgery = async (
    patientId,
    surgeryId,
    anesthesiaId,
    anesthesiaFinalData = {},
    surgeryFinalData = {},
    currentUserId
  ) => {
    try {
      const anesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'anesthesia', anesthesiaId);
      const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);

      // Tenta obter o último absoluteTimestamp dos sinais vitais para calcular anesthesiaEnd e surgeryEnd
      let computedAnesthesiaEnd = null;
      let computedSurgeryEnd = null;
      try {
        const anesthesiaSnap = await getDoc(anesthesiaRef);
        if (anesthesiaSnap.exists()) {
          const aData = anesthesiaSnap.data() || {};
          const vital = aData.vitalSigns; // pode ser array ou objeto-map
          let items = [];
          if (Array.isArray(vital)) {
            items = vital;
          } else if (vital && typeof vital === 'object') {
            items = Object.values(vital);
          }
          let latest = null;
          for (const it of items) {
            const ts = it?.absoluteTimestamp;
            if (!ts) continue;
            let d = null;
            if (ts instanceof Date) {
              d = ts;
            } else if (ts?.seconds) {
              d = new Date(ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6));
            } else if (typeof ts === 'string' || typeof ts === 'number') {
              const parsed = new Date(ts);
              if (!isNaN(parsed.getTime())) d = parsed;
            }
            if (d && (!latest || d > latest)) latest = d;
          }
          if (latest) {
            // anesthesiaEnd = latest + 2 minutos; surgeryEnd = latest - 7 minutos
            computedAnesthesiaEnd = new Date(latest.getTime() + 2 * 60 * 1000);
            computedSurgeryEnd = new Date(latest.getTime() - 7 * 60 * 1000);
          }
        }
      } catch (e) {
        console.warn('Não foi possível calcular anesthesiaEnd/surgeryEnd a partir de vitalSigns:', e);
      }

      const chosenSurgeryEnd = surgeryFinalData?.surgeryEnd ?? computedSurgeryEnd;
      const payloadAnesthesia = {
        ...anesthesiaFinalData,
        // anesthesiaEnd calculado, se não veio no finalData da anestesia
        ...(anesthesiaFinalData?.anesthesiaEnd == null && computedAnesthesiaEnd ? { anesthesiaEnd: computedAnesthesiaEnd } : {}),
        // espelho de surgeryEnd também na anesthesia,
        // usa o valor manual de surgeryFinalData se existir; senão, o calculado
        ...(anesthesiaFinalData?.surgeryEnd == null && chosenSurgeryEnd ? { surgeryEnd: chosenSurgeryEnd } : {}),
        status: 'Concluída',
        'metadata.finishedAt': serverTimestamp(),
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId,
      };

      const payloadSurgery = {
        ...surgeryFinalData,
        ...(surgeryFinalData?.surgeryEnd == null && computedSurgeryEnd ? { surgeryEnd: computedSurgeryEnd } : {}),
        status: 'Concluída',
        'metadata.finishedAt': serverTimestamp(),
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId,
      };

      // Commit único (all-or-nothing)
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      batch.update(anesthesiaRef, payloadAnesthesia);
      batch.update(surgeryRef, payloadSurgery);
      await batch.commit();

      console.log('Anestesia e cirurgia finalizadas em operação atômica');
      return true;
    } catch (error) {
      console.error('Erro ao finalizar anestesia e cirurgia em batch:', error);
      throw error;
    }
  };
  
  // ============= PRE-ANESTHESIA =============
  
  /**
   * Criar avaliação pré-anestésica
   */
  export const createPreAnesthesia = async (patientId, surgeryId, preAnesthesiaData, currentUserId) => {
    try {
      const preAnesthesiaWithMetadata = {
        ...preAnesthesiaData,
        status: 'Concluída',
        metadata: {
          createdAt: serverTimestamp(),
          createdBy: currentUserId
        }
      };
  
      const preAnesthesiaRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'preAnesthesia');
      const preAnesthesiaDocRef = await addDoc(preAnesthesiaRef, preAnesthesiaWithMetadata);
      
      console.log('Avaliação pré-anestésica criada com sucesso');
      return { 
        id: preAnesthesiaDocRef.id, 
        ...preAnesthesiaWithMetadata,
        metadata: {
          ...preAnesthesiaWithMetadata.metadata,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao criar avaliação pré-anestésica:', error);
      throw error;
    }
  };
  
  /**
   * Atualizar avaliação pré-anestésica
   */
  export const updatePreAnesthesia = async (patientId, surgeryId, preAnesthesiaId, updates, currentUserId) => {
    try {
      const preAnesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'preAnesthesia', preAnesthesiaId);
      
      await updateDoc(preAnesthesiaRef, {
        ...updates,
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId
      });
      
      console.log('Avaliação pré-anestésica atualizada');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar avaliação pré-anestésica:', error);
      throw error;
    }
  };
  
  /**
   * Buscar avaliação pré-anestésica
   */
  export const getPreAnesthesia = async (patientId, surgeryId, preAnesthesiaId) => {
    try {
      const preAnesthesiaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'preAnesthesia', preAnesthesiaId);
      const preAnesthesiaDoc = await getDoc(preAnesthesiaRef);
      
      if (preAnesthesiaDoc.exists()) {
        return { id: preAnesthesiaDoc.id, ...preAnesthesiaDoc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar avaliação pré-anestésica:', error);
      throw error;
    }
  };
  
  /**
   * Buscar primeira avaliação pré-anestésica de uma cirurgia
   */
  export const getSurgeryPreAnesthesia = async (patientId, surgeryId) => {
    try {
      const preAnesthesiaRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'preAnesthesia');
      const q = query(preAnesthesiaRef, orderBy('metadata.createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const preAnesthesiaDoc = snapshot.docs[0];
        return { id: preAnesthesiaDoc.id, ...preAnesthesiaDoc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar pré-anestésica da cirurgia:', error);
      throw error;
    }
  };
  
  // ============= SRPA =============
  
  /**
   * Criar ficha SRPA
   */
  export const createSRPA = async (patientId, surgeryId, srpaData, currentUserId) => {
    try {
      const srpaWithMetadata = {
        ...srpaData,
        status: 'Em andamento',
        metadata: {
          createdAt: serverTimestamp(),
          createdBy: currentUserId
        }
      };
  
      const srpaRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'srpa');
      const srpaDocRef = await addDoc(srpaRef, srpaWithMetadata);
      
      console.log('Ficha SRPA criada com sucesso');
      return { 
        id: srpaDocRef.id, 
        ...srpaWithMetadata,
        metadata: {
          ...srpaWithMetadata.metadata,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao criar ficha SRPA:', error);
      throw error;
    }
  };
  
  /**
   * Atualizar ficha SRPA
   */
  export const updateSRPA = async (patientId, surgeryId, srpaId, updates, currentUserId) => {
    try {
      const srpaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'srpa', srpaId);
      
      await updateDoc(srpaRef, {
        ...updates,
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId
      });
      
      console.log('Ficha SRPA atualizada');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar ficha SRPA:', error);
      throw error;
    }
  };
  
  /**
   * Buscar ficha SRPA
   */
  export const getSRPA = async (patientId, surgeryId, srpaId) => {
    try {
      const srpaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'srpa', srpaId);
      const srpaDoc = await getDoc(srpaRef);
      
      if (srpaDoc.exists()) {
        return { id: srpaDoc.id, ...srpaDoc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar ficha SRPA:', error);
      throw error;
    }
  };
  
  /**
   * Buscar primeira ficha SRPA de uma cirurgia
   */
export const getSurgerySRPA = async (patientId, surgeryId) => {
  try {
    if (!patientId || !surgeryId) {
      console.warn("⚠️ getSurgerySRPA chamado com parâmetros inválidos", { patientId, surgeryId });
      return null;
    }
    const srpaRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, 'srpa');
    const q = query(srpaRef, orderBy('metadata.createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const srpaDoc = snapshot.docs[0];
      return { id: srpaDoc.id, ...srpaDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar SRPA da cirurgia:', error);
    throw error;
  }
};
  
  /**
   * Finalizar SRPA
   */
  export const finalizeSRPA = async (patientId, surgeryId, srpaId, finalData, currentUserId) => {
    try {
      const srpaRef = doc(db, 'patients', patientId, 'surgeries', surgeryId, 'srpa', srpaId);
      
      await updateDoc(srpaRef, {
        ...finalData,
        status: 'Concluída',
        'metadata.finishedAt': serverTimestamp(),
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId
      });
      
      console.log('SRPA finalizada');
      return true;
    } catch (error) {
      console.error('Erro ao finalizar SRPA:', error);
      throw error;
    }
  };
  
  // ============= VALIDAÇÕES =============
  
  /**
   * Verificar se anestesia está concluída (para SRPA)
   */
  export const validateAnesthesiaForSRPA = async (patientId, surgeryId) => {
    try {
      const anesthesia = await getSurgeryAnesthesia(patientId, surgeryId);
      
      if (!anesthesia) {
        return {
          valid: false,
          error: 'NO_ANESTHESIA',
          message: 'Não há ficha anestésica para esta cirurgia'
        };
      }
      
      if (anesthesia.status !== 'Concluída') {
        return {
          valid: false,
          error: 'ANESTHESIA_NOT_FINISHED',
          message: 'A anestesia precisa ser finalizada antes de criar a SRPA'
        };
      }
      
      return {
        valid: true,
        anesthesia: anesthesia
      };
    } catch (error) {
      console.error('Erro ao validar anestesia para SRPA:', error);
      return {
        valid: false,
        error: 'VALIDATION_ERROR',
        message: 'Erro ao validar requisitos para SRPA'
      };
    }
  };
  
  /**
   * Verificar se já existe subcoleção
   */
  export const checkSubcollectionExists = async (patientId, surgeryId, subcollectionType) => {
    try {
      const subcollectionRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, subcollectionType);
      const snapshot = await getDocs(subcollectionRef);
      
      return {
        exists: !snapshot.empty,
        count: snapshot.size,
        documents: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
    } catch (error) {
      console.error(`Erro ao verificar ${subcollectionType}:`, error);
      return { exists: false, count: 0, documents: [] };
    }
  };
  
  // ============= BUSCA GERAL =============
  
/**
 * Buscar todas as anestesias do usuário (paralelizando buscas)
 */
export const getUserAnesthesias = async (userId, limitCount = 10) => {
  try {
    // Buscar todos os pacientes
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);

    const patientDataMap = new Map();
    for (const patientDoc of patientsSnapshot.docs) {
      patientDataMap.set(patientDoc.id, patientDoc.data());
    }

    // Buscar todas as cirurgias criadas pelo usuário, em paralelo
    const surgeryPromises = [];
    for (const [patientId, patientData] of patientDataMap.entries()) {
      const surgeriesRef = collection(db, 'patients', patientId, 'surgeries');
      const surgeriesQuery = query(
        surgeriesRef,
        where('metadata.createdBy', '==', userId)
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

    // Montar pares patientId, surgeryId, surgeryData, patientData
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
                ...normalizeAnesthesiaRecord(anesthesiaData),
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
          })
        );
      }
    }
    const anesthesiaResults = await Promise.all(anesthesiaPromises);
    const allAnesthesias = anesthesiaResults.flat();

    // Ordenar por data de criação (mais recente primeiro)
    allAnesthesias.sort((a, b) => {
      const dateA = a.metadata?.createdAt?.seconds
        ? new Date(a.metadata.createdAt.seconds * 1000)
        : new Date(a.metadata?.createdAt);
      const dateB = b.metadata?.createdAt?.seconds
        ? new Date(b.metadata.createdAt.seconds * 1000)
        : new Date(b.metadata?.createdAt);
      return dateB - dateA;
    });

    return allAnesthesias.slice(0, limitCount);
  } catch (error) {
    console.error('Erro ao buscar anestesias do usuário:', error);
    return [];
  }
};
  
  /**
   * Buscar anestesias ativas do usuário
   */
  export const getActiveAnesthesias = async (userId) => {
    try {
      const activeAnesthesias = [];
      
      const patientsRef = collection(db, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);
      
      for (const patientDoc of patientsSnapshot.docs) {
        const patientData = patientDoc.data();
        
        const surgeriesRef = collection(db, 'patients', patientDoc.id, 'surgeries');
        const surgeriesQuery = query(
          surgeriesRef,
          where('metadata.createdBy', '==', userId),
          where('status', 'in', ['Agendada', 'Em andamento'])
        );
        const surgeriesSnapshot = await getDocs(surgeriesQuery);
        
        for (const surgeryDoc of surgeriesSnapshot.docs) {
          const surgeryData = surgeryDoc.data();
          
          const anesthesiasRef = collection(db, 'patients', patientDoc.id, 'surgeries', surgeryDoc.id, 'anesthesia');
          const anesthesiasQuery = query(
            anesthesiasRef,
            where('status', '==', 'Em andamento')
          );
          const anesthesiasSnapshot = await getDocs(anesthesiasQuery);
          
          anesthesiasSnapshot.forEach((anesthesiaDoc) => {
            const anesthesiaData = anesthesiaDoc.data();
            activeAnesthesias.push({
              id: anesthesiaDoc.id,
              ...normalizeAnesthesiaRecord(anesthesiaData),
              patientId: patientDoc.id,
              surgeryId: surgeryDoc.id,
              patientName: patientData.patientName,
              patientBirthDate: patientData.patientBirthDate,
              procedureType: surgeryData.procedureType,
              hospital: surgeryData.hospital,
              mainSurgeon: surgeryData.mainSurgeon
            });
          });
        }
      }
      
      return activeAnesthesias.sort((a, b) => {
        const dateA = a.metadata?.createdAt?.seconds ? 
          new Date(a.metadata.createdAt.seconds * 1000) : 
          new Date(a.metadata?.createdAt);
        const dateB = b.metadata?.createdAt?.seconds ? 
          new Date(b.metadata.createdAt.seconds * 1000) : 
          new Date(b.metadata?.createdAt);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Erro ao buscar anestesias ativas:', error);
      return [];
    }
  };