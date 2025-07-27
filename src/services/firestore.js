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