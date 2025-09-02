// src/services/surgeryService.js
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    doc,
    getDoc,
    limit,
    orderBy,
    deleteDoc,
    serverTimestamp,
    collectionGroup,
    documentId,
    getCountFromServer
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  /**
   * Gerar código único para cirurgia
   */
  export const generateSurgeryCode = async () => {
    const year = new Date().getFullYear();
    let attempts = 0;
    const maxAttempts = 10;
  
    while (attempts < maxAttempts) {
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const code = `S${year}-${random}`;
      
      const exists = await checkSurgeryCodeExists(code);
      if (!exists) {
        return code;
      }
      
      attempts++;
    }
    
    // Fallback com timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `S${year}-${timestamp}`;
  };
  
  /**
   * Verificar se código de cirurgia já existe
   */
  export const checkSurgeryCodeExists = async (code) => {
    try {
      // Buscar em todos os patients
      const patientsRef = collection(db, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);
      
      for (const patientDoc of patientsSnapshot.docs) {
        const surgeriesRef = collection(db, 'patients', patientDoc.id, 'surgeries');
        const surgeriesQuery = query(surgeriesRef, where('code', '==', code));
        const surgeriesSnapshot = await getDocs(surgeriesQuery);
        
        if (!surgeriesSnapshot.empty) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar código da cirurgia:', error);
      return false;
    }
  };
  
  /**
   * Verificar cirurgias similares (mesmo procedimento/hospital)
   */
  export const checkSimilarSurgeries = async (patientId, surgeryData) => {
    try {
      const surgeriesRef = collection(db, 'patients', patientId, 'surgeries');
      const q = query(
        surgeriesRef,
        where('status', 'in', ['Agendada', 'Em andamento'])
      );
      
      const snapshot = await getDocs(q);
      const existingSurgeries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      // Filtrar por procedimentos similares
      const similarSurgeries = existingSurgeries.filter(existing => {
        // Para SUS: comparar proposedSurgery
        if (surgeryData.procedureType === 'sus') {
          return existing.proposedSurgery === surgeryData.proposedSurgery &&
                 existing.hospital === surgeryData.hospital;
        }
        
        // Para Convênio: comparar códigos CBHPM
        if (surgeryData.procedureType === 'convenio' && 
            existing.cbhpmProcedures && 
            surgeryData.cbhpmProcedures) {
          
          const existingCodes = existing.cbhpmProcedures
            .map(p => p.codigo)
            .sort();
          const newCodes = surgeryData.cbhpmProcedures
            .map(p => p.codigo)
            .sort();
  
          return existingCodes.length === newCodes.length &&
                 existingCodes.every((code, index) => code === newCodes[index]);
        }
        
        return false;
      });
  
      return similarSurgeries;
    } catch (error) {
      console.error('Erro ao verificar cirurgias similares:', error);
      throw error;
    }
  };
  
  /**
   * Criar nova cirurgia
   */
  export const createSurgery = async (patientId, surgeryData, currentUserId) => {
    try {
      const code = await generateSurgeryCode();
      
      const surgeryWithMetadata = {
        ...surgeryData,
        code,
        status: 'Agendada',
        sharedWith: surgeryData.sharedWith || [],
        metadata: {
          createdAt: serverTimestamp(),
          createdBy: currentUserId
        }
      };
  
      const surgeriesRef = collection(db, 'patients', patientId, 'surgeries');
      const surgeryDocRef = await addDoc(surgeriesRef, surgeryWithMetadata);
      
      console.log('Cirurgia criada com sucesso:', code);
      return { 
        id: surgeryDocRef.id, 
        ...surgeryWithMetadata,
        metadata: {
          ...surgeryWithMetadata.metadata,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao criar cirurgia:', error);
      throw error;
    }
  };
  
  /**
   * Atualizar cirurgia existente
   */
  export const updateSurgery = async (patientId, surgeryId, updates, currentUserId) => {
    try {
      const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
      
      // Incrementar versão para controle de alterações
      const currentDoc = await getDoc(surgeryRef);
      const currentVersion = currentDoc.exists() ? (currentDoc.data().version || 1) : 1;
      
      await updateDoc(surgeryRef, {
        ...updates,
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId,
        version: currentVersion + 1
      });
      
      console.log('Cirurgia atualizada:', surgeryId);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cirurgia:', error);
      throw error;
    }
  };
  
  /**
   * Buscar cirurgia específica
   */
  export const getSurgery = async (patientId, surgeryId) => {
    try {
      const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
      const surgeryDoc = await getDoc(surgeryRef);
      
      if (surgeryDoc.exists()) {
        return { id: surgeryDoc.id, ...surgeryDoc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar cirurgia:', error);
      throw error;
    }
  };
  
  /**
   * Buscar todas as cirurgias de um paciente
   */
  export const getPatientSurgeries = async (patientId, userId = null) => {
    try {
      const surgeriesRef = collection(db, 'patients', patientId, 'surgeries');
      const q = query(surgeriesRef, orderBy('metadata.createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      let surgeries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Se userId foi fornecido, filtrar por permissões
      if (userId) {
        surgeries = surgeries.filter(surgery => 
          surgery.metadata?.createdBy === userId || 
          (surgery.sharedWith || []).includes(userId)
        );
      }
      
      return surgeries;
    } catch (error) {
      console.error('Erro ao buscar cirurgias do paciente:', error);
      throw error;
    }
  };
  
  /**
   * Buscar cirurgias do usuário (todas)
   */
  export const getUserSurgeries = async (userId, limitCount = 10) => {
    try {
    
      const surgeriesRef = collectionGroup(db, 'surgeries');
      
      const createdQuery = query(
        surgeriesRef,
        where('metadata.createdBy', '==', userId),
        orderBy('metadata.createdAt', 'desc'),
        limit(limitCount * 2) // Pegar extra para account for shared duplicates
      );
      
      // Query para surgeries compartilhadas 
      const sharedQuery = query(
        surgeriesRef,
        where('sharedWith', 'array-contains', userId),
        orderBy('metadata.createdAt', 'desc'),
        limit(limitCount)
      );
      
      const [createdSnapshot, sharedSnapshot] = await Promise.all([
        getDocs(createdQuery),
        getDocs(sharedQuery)
      ]);
      
      // Coletar todas as surgeries com patientId
      const allSurgeries = new Map();
      
      // Processar surgeries criadas
      createdSnapshot.forEach(doc => {
        const data = doc.data();
        const patientId = doc.ref.parent.parent.id; // Parent da subcollection
        
        allSurgeries.set(doc.id, {
          id: doc.id,
          ...data,
          patientId,
          isOwner: true
        });
      });
      
      // Processar surgeries compartilhadas (sem duplicar)
      sharedSnapshot.forEach(doc => {
        if (!allSurgeries.has(doc.id)) {
          const data = doc.data();
          const patientId = doc.ref.parent.parent.id;
          
          allSurgeries.set(doc.id, {
            id: doc.id,
            ...data,
            patientId,
            isOwner: false
          });
        }
      });
      
      // Agora buscar dados dos pacientes (apenas os necessários)
      const patientIds = [...new Set(Array.from(allSurgeries.values()).map(s => s.patientId))];
      const patientData = new Map();
      
      // Buscar dados dos pacientes em batches de 10 (limite do Firestore para 'in')
      const batches = [];
      for (let i = 0; i < patientIds.length; i += 10) {
        const batch = patientIds.slice(i, i + 10);
        batches.push(batch);
      }
      
      for (const batch of batches) {
        const patientsQuery = query(
          collection(db, 'patients'),
          where(documentId(), 'in', batch)
        );
        const snapshot = await getDocs(patientsQuery);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          patientData.set(doc.id, {
            patientName: data.patientName,
            patientBirthDate: data.patientBirthDate,
            patientSex: data.patientSex,
            patientCNS: data.patientCNS
          });
        });
      }
      
      // Combinar dados
      const result = Array.from(allSurgeries.values())
        .map(surgery => ({
          ...surgery,
          ...patientData.get(surgery.patientId)
        }))
        .sort((a, b) => {
          const timeA = a.metadata?.createdAt?.seconds || 0;
          const timeB = b.metadata?.createdAt?.seconds || 0;
          return timeB - timeA;
        })
        .slice(0, limitCount);
      return result;
      
    } catch (error) {
      console.error('Erro ao buscar cirurgias do usuário:', error);
      return [];
    }
  };
  
export const getUserSurgeriesSimple = async (userId, limitCount = 10) => {
  try {
    const result = [];
    
    // Buscar apenas pacientes que têm relação com o usuário
    const patientsQuery = query(
      collection(db, 'patients'),
      where('metadata.createdBy', '==', userId) // Só pacientes do usuário
    );
    
    const patientsSnapshot = await getDocs(patientsQuery);
    
    // Para cada patient, buscar surgeries (muito menos loops agora)
    const promises = patientsSnapshot.docs.map(async (patientDoc) => {
      const patientData = patientDoc.data();
      const surgeriesRef = collection(db, 'patients', patientDoc.id, 'surgeries');
      
      const surgeryQuery = query(
        surgeriesRef,
        orderBy('metadata.createdAt', 'desc'),
        limit(5) // Limitar por patient
      );
      
      const surgerySnapshot = await getDocs(surgeryQuery);
      
      return surgerySnapshot.docs.map(surgeryDoc => ({
        id: surgeryDoc.id,
        ...surgeryDoc.data(),
        patientId: patientDoc.id,
        patientName: patientData.patientName,
        patientBirthDate: patientData.patientBirthDate,
        patientSex: patientData.patientSex,
        patientCNS: patientData.patientCNS
      }));
    });
    
    const allResults = await Promise.all(promises);
    const flattened = allResults.flat();
    
    // Ordenar e limitar
    return flattened
      .sort((a, b) => {
        const timeA = a.metadata?.createdAt?.seconds || 0;
        const timeB = b.metadata?.createdAt?.seconds || 0;
        return timeB - timeA;
      })
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('Erro na versão simples:', error);
    return [];
  }
};

/**
 * Contar total de cirurgias do usuário (criadas por ele)
 * Usa aggregate count (getCountFromServer) em collectionGroup para performance
 */
export const getUserSurgeriesCount = async (userId) => {
  try {
    const surgeriesGroup = collectionGroup(db, 'surgeries');
    const q = query(
      surgeriesGroup,
      where('metadata.createdBy', '==', userId)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count || 0;
  } catch (error) {
    console.error('Erro ao contar cirurgias do usuário:', error);
    return 0;
  }
};
  
  /**
   * Buscar cirurgias ativas do usuário
   */
  export const getActiveSurgeries = async (userId) => {
    try {
      const activeSurgeries = [];
      
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
        
        surgeriesSnapshot.forEach((surgeryDoc) => {
          const surgeryData = surgeryDoc.data();
          
          activeSurgeries.push({
            id: surgeryDoc.id,
            ...surgeryData,
            patientId: patientDoc.id,
            patientName: patientData.patientName,
            patientBirthDate: patientData.patientBirthDate
          });
        });

        // Buscar cirurgias ativas compartilhadas com o usuário
        const sharedActiveQuery = query(
          surgeriesRef,
          where('sharedWith', 'array-contains', userId),
          where('status', 'in', ['Agendada', 'Em andamento'])
        );
        const sharedActiveSnapshot = await getDocs(sharedActiveQuery);
        sharedActiveSnapshot.forEach((surgeryDoc) => {
          const surgeryData = surgeryDoc.data();
          activeSurgeries.push({
            id: surgeryDoc.id,
            ...surgeryData,
            patientId: patientDoc.id,
            patientName: patientData.patientName,
            patientBirthDate: patientData.patientBirthDate
          });
        });
      }
      
      // Remover duplicatas e ordenar
      const uniqueActive = Object.values(activeSurgeries.reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {}));
      return uniqueActive.sort((a, b) => {
        const dateA = a.metadata?.createdAt?.seconds ? 
          new Date(a.metadata.createdAt.seconds * 1000) : 
          new Date(a.metadata?.createdAt);
        const dateB = b.metadata?.createdAt?.seconds ? 
          new Date(b.metadata.createdAt.seconds * 1000) : 
          new Date(b.metadata?.createdAt);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Erro ao buscar cirurgias ativas:', error);
      return [];
    }
  };
  
/**
 * Compartilhar cirurgia com outros usuários
 */
export const shareSurgery = async (patientId, surgeryId, userIds, currentUserId, validUserIds = []) => {
  try {
    const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
    const surgerySnap = await getDoc(surgeryRef);

    if (!surgerySnap.exists()) {
      throw new Error('Cirurgia não encontrada');
    }

    const existingData = surgerySnap.data();
    const previousSharedWith = existingData.sharedWith || [];

    // Merge sem duplicados e remoção de usuários inválidos
    const mergedSharedWith = Array.from(new Set([
      ...previousSharedWith,
      ...userIds
    ])).filter(id => validUserIds.includes(id));

    await updateDoc(surgeryRef, {
      sharedWith: mergedSharedWith,
      'metadata.updatedAt': serverTimestamp(),
      'metadata.updatedBy': currentUserId
    });

    console.log('Cirurgia compartilhada com:', mergedSharedWith);
    return true;
  } catch (error) {
    console.error('Erro ao compartilhar cirurgia:', error);
    throw error;
  }
};
  
  /**
   * Finalizar cirurgia
   */
  export const finalizeSurgery = async (patientId, surgeryId, finalData, currentUserId) => {
    try {
      const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
      
      await updateDoc(surgeryRef, {
        ...finalData,
        status: 'Concluída',
        'metadata.finishedAt': serverTimestamp(),
        'metadata.updatedAt': serverTimestamp(),
        'metadata.updatedBy': currentUserId
      });
      
      console.log('Cirurgia finalizada');
      return true;
    } catch (error) {
      console.error('Erro ao finalizar cirurgia:', error);
      throw error;
    }
  };

  /**
 * Excluir cirurgia e todas suas subcoleções
 */
export const deleteSurgery = async (patientId, surgeryId, currentUserId) => {
    try {
      // 1. Excluir subcoleções primeiro
      const subcollections = ['anesthesia', 'preAnesthesia', 'srpa'];
      
      for (const subcollection of subcollections) {
        const subRef = collection(db, 'patients', patientId, 'surgeries', surgeryId, subcollection);
        const subSnapshot = await getDocs(subRef);
        
        for (const subDoc of subSnapshot.docs) {
          await deleteDoc(doc(db, 'patients', patientId, 'surgeries', surgeryId, subcollection, subDoc.id));
        }
      }
      
      // 2. Excluir a cirurgia
      const surgeryRef = doc(db, 'patients', patientId, 'surgeries', surgeryId);
      await deleteDoc(surgeryRef);
      
      console.log('Cirurgia excluída:', surgeryId);
      return true;
    } catch (error) {
      console.error('Erro ao excluir cirurgia:', error);
      throw error;
    }
  };