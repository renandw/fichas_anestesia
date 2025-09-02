import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    deleteDoc,
    orderBy,
    limit,
    addDoc,
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // ========== USUÁRIOS ==========
  
  // Verificar se CRM já existe no banco
  export const checkCRMExists = async (crm) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('crm', '==', crm));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar CRM:', error);
      throw error;
    }
  };
  
  // Buscar usuário por CRM (para verificações)
  export const getUserByCRM = async (crm) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('crm', '==', crm));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return querySnapshot.docs[0].data();
    } catch (error) {
      console.error('Erro ao buscar usuário por CRM:', error);
      throw error;
    }
  };
  
  // Verificar se email já existe (complemento ao Firebase Auth)
  export const checkEmailExists = async (email) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      throw error;
    }
  };
  
  // Salvar dados do usuário no Firestore
  export const saveUserProfile = async (uid, userData) => {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...userData,
        uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return userData;
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      throw error;
    }
  };
  
  // Atualizar dados do usuário
  export const updateUserProfile = async (uid, updates) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      return updates;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };
  
  // Buscar perfil do usuário
  export const getUserProfile = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  };
  
  // ========== CIRURGIAS ==========
  
  // Gerar código único para cirurgia
  export const generateSurgeryCode = async () => {
    const year = new Date().getFullYear();
    let attempts = 0;
    const maxAttempts = 10;
  
    while (attempts < maxAttempts) {
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const code = `C${year}-${random}`;
      
      // Verificar se código já existe
      const exists = await checkSurgeryCodeExists(code);
      if (!exists) {
        return code;
      }
      
      attempts++;
    }
    
    // Fallback com timestamp se não conseguir gerar código único
    const timestamp = Date.now().toString().slice(-6);
    return `C${year}-${timestamp}`;
  };
  
  // Verificar se código de cirurgia já existe
  export const checkSurgeryCodeExists = async (code) => {
    try {
      const surgeryRef = doc(db, 'surgeries', code);
      const surgeryDoc = await getDoc(surgeryRef);
      return surgeryDoc.exists();
    } catch (error) {
      console.error('Erro ao verificar código da cirurgia:', error);
      return false;
    }
  };
  
  // Salvar nova cirurgia
  export const saveSurgery = async (surgeryData) => {
    try {
      const code = await generateSurgeryCode();
      
      const surgeryWithMetadata = {
        ...surgeryData,
        id: code,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        version: 1
      };
  
      const surgeryRef = doc(db, 'surgeries', code);
      await setDoc(surgeryRef, surgeryWithMetadata);
      
      console.log('Cirurgia salva com sucesso:', code);
      return { ...surgeryWithMetadata, id: code };
    } catch (error) {
      console.error('Erro ao salvar cirurgia:', error);
      throw error;
    }
  };
  
  // Atualizar cirurgia existente (AutoSave)
  export const updateSurgery = async (surgeryId, updates) => {
    try {
      const surgeryRef = doc(db, 'surgeries', surgeryId);
      
      // Incrementar versão para controle de alterações
      const currentDoc = await getDoc(surgeryRef);
      const currentVersion = currentDoc.exists() ? (currentDoc.data().version || 1) : 1;
      
      await updateDoc(surgeryRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        version: currentVersion + 1
      });
      
      console.log('Cirurgia atualizada:', surgeryId);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cirurgia:', error);
      throw error;
    }
  };
  
  // Buscar cirurgia por ID
  export const getSurgery = async (surgeryId) => {
    try {
      const surgeryRef = doc(db, 'surgeries', surgeryId);
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
  
  // Buscar cirurgias do usuário (versão simplificada para evitar erro de índice)
  export const getUserSurgeries = async (userId, limit_count = 10) => {
    try {
      const surgeriesRef = collection(db, 'surgeries');
      // Query simplificada sem orderBy para evitar erro de índice
      const q = query(
        surgeriesRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
      
      const querySnapshot = await getDocs(q);
      const surgeries = [];
      
      querySnapshot.forEach((doc) => {
        surgeries.push({ id: doc.id, ...doc.data() });
      });
      
      // Ordenar no cliente por data de criação (menos eficiente, mas funciona)
      surgeries.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
        return dateB - dateA; // Mais recente primeiro
      });
      
      return surgeries;
    } catch (error) {
      console.error('Erro ao buscar cirurgias do usuário:', error);
      return []; // Retornar array vazio em caso de erro
    }
  };
  
  // Buscar cirurgias em andamento (versão simplificada para evitar erro de índice)
  export const getActiveSurgeries = async (userId) => {
    try {
      const surgeriesRef = collection(db, 'surgeries');
      // Query mais simples para evitar erro de índice composto
      const q = query(
        surgeriesRef,
        where('createdBy', '==', userId),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const surgeries = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Incluir cirurgias "ativas" (ainda editáveis)
        if (data.status === 'em_andamento' || data.status === 'aguardando_finalizacao') {
          surgeries.push({ id: doc.id, ...data });
        }
      });
      
      // Ordenar no cliente por data de criação
      surgeries.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
        return dateB - dateA; // Mais recente primeiro
      });
      
      return surgeries;
    } catch (error) {
      console.error('Erro ao buscar cirurgias ativas:', error);
      // Retornar array vazio em caso de erro
      return [];
    }
  };
  
  // Finalizar cirurgia
  export const finalizeSurgery = async (surgeryId, finalData) => {
    try {
      const surgeryRef = doc(db, 'surgeries', surgeryId);
      
      await updateDoc(surgeryRef, {
        ...finalData,
        status: 'finalizada',
        finishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Cirurgia finalizada:', surgeryId);
      return true;
    } catch (error) {
      console.error('Erro ao finalizar cirurgia:', error);
      throw error;
    }
  };

  export const getUserSurgeriesCount = async (userId) => {
    try {
      const surgeriesRef = collection(db, 'surgeries');
      const q = query(
        surgeriesRef,
        where('createdBy', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size; // Retorna o número total
    } catch (error) {
      console.error('Erro ao contar cirurgias do usuário:', error);
      return 0;
    }
  };

// ========== USUÁRIOS AUTORIZADOS EM CIRURGIA ==========

// Adicionar um anestesista autorizado a uma cirurgia existente
export const addAuthorizedUserToSurgery = async (surgeryId, userId) => {
  try {
    const surgeryRef = doc(db, 'surgeries', surgeryId);
    const surgeryDoc = await getDoc(surgeryRef);
    if (!surgeryDoc.exists()) throw new Error('Cirurgia não encontrada');

    const currentUsers = surgeryDoc.data().authorizedUsers || [];
    if (!currentUsers.includes(userId)) {
      await updateDoc(surgeryRef, {
        authorizedUsers: [...currentUsers, userId],
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (error) {
    console.error('Erro ao adicionar usuário autorizado:', error);
    throw error;
  }
};

// ========== FICHAS PRÉ-ANESTÉSICAS ==========

// Criar ficha pré-anestésica na coleção raiz
export const addPreAnestheticEvaluation = async (surgeryId, evaluationData) => {
  try {
    const evaluationsRef = collection(db, 'preAnestheticEvaluations');
    const newDocRef = await addDoc(evaluationsRef, {
      surgeryId,
      ...evaluationData,
      createdAt: serverTimestamp()
    });
    return { id: newDocRef.id, surgeryId, ...evaluationData };
  } catch (error) {
    console.error('Erro ao adicionar pré-anestésica:', error);
    throw error;
  }
};

// Buscar todas as fichas pré-anestésicas de uma cirurgia na coleção raiz
export const getPreAnestheticEvaluations = async (surgeryId) => {
  try {
    const evaluationsRef = collection(db, 'preAnestheticEvaluations');
    const q = query(evaluationsRef, where('surgeryId', '==', surgeryId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar pré-anestésicas:', error);
    throw error;
  }
};

// Atualizar ficha pré-anestésica existente na coleção raiz
export const autoSaveEvaluation = async (evaluationId, updates) => {
  try {
    const evalRef = doc(db, 'preAnestheticEvaluations', evaluationId);
    await updateDoc(evalRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('Pré-anestésica atualizada:', evaluationId);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar pré-anestésica:', error);
    throw error;
  }
};

// ========== FICHAS SRPA ==========


// Criar ficha SRPA na coleção raiz
export const addSRPAForm = async (surgeryId, formData) => {
  try {
    const srpaRef = collection(db, 'srpaForms');
    const newDocRef = await addDoc(srpaRef, {
      surgeryId,
      ...formData,
      createdAt: serverTimestamp()
    });
    return { id: newDocRef.id, surgeryId, ...formData };
  } catch (error) {
    console.error('Erro ao adicionar SRPA:', error);
    throw error;
  }
};

// Buscar todas as fichas SRPA de uma cirurgia
export const getSRPAForms = async (surgeryId) => {
  try {
    const srpaRef = collection(db, 'srpaForms');
    const q = query(srpaRef, where('surgeryId', '==', surgeryId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar SRPAs:', error);
    throw error;
  }
};

// Atualizar ficha SRPA existente na coleção raiz
export const autoSaveSRPAForm = async (srpaId, updates) => {
  try {
    const srpaRef = doc(db, 'srpaForms', srpaId);
    await updateDoc(srpaRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('Ficha SRPA atualizada:', srpaId);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar SRPA:', error);
    throw error;
  }
};

// ========== PACIENTES ==========

// Criar novo paciente
export const addPatient = async (patientData) => {
  try {
    const patientsRef = collection(db, 'patients');
    const newDocRef = await addDoc(patientsRef, {
      ...patientData,
      insuranceHistory: patientData.insuranceHistory || (patientData.currentInsuranceName ? [{
        name: patientData.currentInsuranceName,
        number: patientData.currentInsuranceNumber,
        from: new Date().toISOString(),
        to: null
      }] : []),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Paciente criado:', newDocRef.id);
    return { id: newDocRef.id, ...patientData };
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    throw error;
  }
};

// Atualizar paciente existente
export const updatePatient = async (patientId, updates) => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);
    let currentData = patientDoc.exists() ? patientDoc.data() : {};
    let newHistory = currentData.insuranceHistory || [];

    // Se houver mudança de convênio, encerra o registro anterior e adiciona um novo
    if (updates.currentInsuranceName && updates.currentInsuranceName !== currentData.currentInsuranceName) {
      newHistory = newHistory.map(h => ({ ...h, to: h.to || new Date().toISOString() }));
      newHistory.push({
        name: updates.currentInsuranceName,
        number: updates.currentInsuranceNumber || '',
        from: new Date().toISOString(),
        to: null
      });
    }

    await updateDoc(patientRef, {
      ...updates,
      insuranceHistory: newHistory,
      updatedAt: serverTimestamp()
    });
    console.log('Paciente atualizado com histórico de convênio:', patientId);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    throw error;
  }
};

// Buscar paciente por ID
export const getPatient = async (patientId) => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);
    if (patientDoc.exists()) {
      return { id: patientDoc.id, ...patientDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    throw error;
  }
};

// Buscar pacientes por CNS (exemplo de consulta)
export const getPatientByCNS = async (cns) => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('cns', '==', cns));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar paciente por CNS:', error);
    throw error;
  }
};

// Adicionar manualmente registro ao histórico de convênios do paciente
export const addInsuranceRecord = async (patientId, insuranceData) => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);
    if (!patientDoc.exists()) throw new Error('Paciente não encontrado');
    
    const currentData = patientDoc.data();
    const newHistory = [...(currentData.insuranceHistory || []), {
      name: insuranceData.name,
      number: insuranceData.number,
      from: insuranceData.from || new Date().toISOString(),
      to: insuranceData.to || null
    }];
    
    await updateDoc(patientRef, {
      insuranceHistory: newHistory,
      updatedAt: serverTimestamp()
    });
    console.log('Histórico de convênio atualizado para paciente:', patientId);
    return true;
  } catch (error) {
    console.error('Erro ao adicionar registro ao histórico de convênio:', error);
    throw error;
  }
};