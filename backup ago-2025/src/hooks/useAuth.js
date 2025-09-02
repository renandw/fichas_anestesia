import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { checkCRMExists, saveUserProfile } from '../services/firestore';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Buscar perfil do usuário no Firestore
        await loadUserProfile(user.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const signup = async (userData) => {
    try {
      const { email, password, name, crm, phone, companies } = userData;
      
      // 1. Verificar se CRM já existe
      const crmExists = await checkCRMExists(crm);
      if (crmExists) {
        throw new Error('CRM_ALREADY_EXISTS');
      }
      
      // 2. Criar usuário no Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // 3. Atualizar nome no perfil
      await updateProfile(user, { displayName: name });
      
      // 4. Salvar dados adicionais no Firestore
      const userProfile = {
        name,
        email,
        crm,
        phone,
        companies
      };
      
      await saveUserProfile(user.uid, userProfile);
      setUserProfile({ ...userProfile, uid: user.uid });
      
      toast.success('Conta criada com sucesso!');
      return { user, userProfile };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      
      // Tratar erro customizado de CRM
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
      console.log('Tentando fazer login com email:', email);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login bem-sucedido, usuário:', user.uid);
      toast.success('Login realizado com sucesso!');
      return user;
    } catch (error) {
      console.error('Erro detalhado no login:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const getErrorMessage = (errorCode) => {
    const messages = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Este email já está em uso. Se você já tem uma conta, tente fazer login ou clique em "Esqueceu sua senha?"',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    };
    return messages[errorCode] || 'Ocorreu um erro. Tente novamente.';
  };

  const value = {
    user,
    userProfile,
    loading,
    signup,
    signin,
    logout,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};