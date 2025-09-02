// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============= SERVIÇOS DE USUÁRIO ATUALIZADOS =============

/**
 * Verificar se CRM já existe
 */
const checkCRMExists = async (crm) => {
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

/**
 * Salvar perfil do usuário (atualizado para nova estrutura)
 */
const saveUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userProfile = {
      ...userData,
      uid,
      status: 'online',
      metadata: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    };
    
    await setDoc(userRef, userProfile);
    return userProfile;
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    throw error;
  }
};

/**
 * Atualizar status online/offline
 */
const updateUserStatus = async (uid, status) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status: status,
      lastSeen: serverTimestamp(),
      'metadata.updatedAt': serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user.uid);
        // Marcar como online quando logado
        await updateUserStatus(user.uid, 'online');
      } else {
        // Marcar como offline quando deslogado
        if (user?.uid) {
          await updateUserStatus(user.uid, 'offline');
        }
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Cleanup para marcar offline quando sair da aplicação
    const handleBeforeUnload = () => {
      if (user?.uid) {
        updateUserStatus(user.uid, 'offline');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserProfile(profile);
        return profile;
      } else {
        console.warn('Perfil do usuário não encontrado');
        return null;
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  };

  const signup = async (userData) => {
    try {
      const { email, password, name, crm, phone, companies } = userData;
      
      console.log('🔍 Verificando se CRM já existe...');
      const crmExists = await checkCRMExists(crm);
      if (crmExists) {
        throw new Error('CRM_ALREADY_EXISTS');
      }
      
      console.log('🆕 Criando usuário no Firebase Auth...');
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('📝 Atualizando nome no perfil...');
      await updateProfile(user, { displayName: name });
      
      console.log('💾 Salvando dados no Firestore...');
      const userProfile = {
        name,
        email,
        crm,
        phone,
        companies: companies || [],
        specialty: 'Anestesiologia' // Padrão
      };
      
      const savedProfile = await saveUserProfile(user.uid, userProfile);
      setUserProfile(savedProfile);
      
      console.log('✅ Conta criada com sucesso!');
      toast.success('Conta criada com sucesso!');
      return { user, userProfile: savedProfile };
      
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      
      if (error.message === 'CRM_ALREADY_EXISTS') {
        toast.error('Este CRM já está cadastrado. Se você já tem uma conta, tente fazer login ou recuperar sua senha.');
        throw error;
      }
      
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const signin = async (email, password) => {
    try {
      console.log('🔐 Fazendo login...');
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Login bem-sucedido:', user.uid);
      toast.success('Login realizado com sucesso!');
      return user;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      // Marcar como offline antes de sair
      if (user?.uid) {
        await updateUserStatus(user.uid, 'offline');
      }
      
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      
      console.log('✅ Logout realizado');
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const getErrorMessage = (errorCode) => {
    const messages = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Este email já está em uso. Se você já tem uma conta, tente fazer login ou recuperar sua senha.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/invalid-credential': 'Credenciais inválidas. Verifique email e senha.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    };
    return messages[errorCode] || 'Ocorreu um erro. Tente novamente.';
  };

  // Função para buscar outros usuários (para compartilhamento)
  const getOtherUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '!=', user?.uid || ''));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  const value = {
    // Estados
    user,
    userProfile,
    loading,
    
    // Métodos de autenticação
    signup,
    signin,
    logout,
    
    // Métodos auxiliares
    loadUserProfile,
    getOtherUsers,
    
    // Dados úteis para componentes
    currentUserId: user?.uid || null,
    isAuthenticated: !!user,
    userName: userProfile?.name || user?.displayName || '',
    userCRM: userProfile?.crm || ''
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};