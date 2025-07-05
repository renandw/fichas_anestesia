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
    limit
  } from 'firebase/firestore';
  import { db } from './firebase';
  
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