import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/firestore';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebase';
import { 
  User, 
  Mail,  
  Lock, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { userProfile, loadUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form para dados do perfil
  const profileForm = useForm({
    defaultValues: {
      name: '',
      phone: '',
      companies: []
    }
  });

  // Form para email
  const emailForm = useForm({
    defaultValues: {
      email: '',
      currentPassword: ''
    }
  });

  // Form para senha
  const passwordForm = useForm();

  // Carregar dados do usuário
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        companies: userProfile.companies || []
      });
      emailForm.reset({
        email: userProfile.email || '',
        currentPassword: ''
      });
    }
  }, [userProfile, profileForm, emailForm]);

  // Atualizar perfil (nome, telefone, empresas)
  const onUpdateProfile = async (data) => {
    setIsLoading(true);
    try {
      await updateUserProfile(userProfile.uid, {
        name: data.name,
        phone: data.phone,
        companies: data.companies
      });
      
      await loadUserProfile(userProfile.uid);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar email
  const onUpdateEmail = async (data) => {
    setIsLoading(true);
    try {
      console.log('Tentando atualizar email de', userProfile.email, 'para', data.email);
      
      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(userProfile.email, data.currentPassword);
      console.log('Reautenticando usuário...');
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Atualizar email no Firebase Auth
      console.log('Atualizando email no Firebase Auth...');
      await updateEmail(auth.currentUser, data.email);
      
      // Atualizar email no Firestore
      console.log('Atualizando email no Firestore...');
      await updateUserProfile(userProfile.uid, { email: data.email });
      
      await loadUserProfile(userProfile.uid);
      emailForm.reset({ email: data.email, currentPassword: '' });
      toast.success('Email atualizado com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao atualizar email:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('Senha atual incorreta.');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Este email já está em uso.');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Por segurança, faça login novamente antes de alterar o email.');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Verificação de email obrigatória. Enviando email de verificação...');
        try {
          await sendEmailVerification(auth.currentUser);
          toast.success('Email de verificação enviado! Verifique sua caixa de entrada.');
        } catch (verifyError) {
          toast.error('Erro ao enviar email de verificação.');
        }
      } else {
        toast.error(`Erro: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar senha
  const onUpdatePassword = async (data) => {
    setIsLoading(true);
    try {
      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(userProfile.email, data.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Atualizar senha
      await updatePassword(auth.currentUser, data.newPassword);
      
      passwordForm.reset();
      toast.success('Senha atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Senha atual incorreta.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      } else {
        toast.error('Erro ao atualizar senha. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    
    let formatted = limitedNumbers;
    if (limitedNumbers.length >= 11) {
      formatted = limitedNumbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (limitedNumbers.length >= 10) {
      formatted = limitedNumbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (limitedNumbers.length >= 6) {
      formatted = limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (limitedNumbers.length >= 2) {
      formatted = limitedNumbers.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    
    return formatted;
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'password', name: 'Senha', icon: Lock }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie seus dados pessoais e configurações da conta</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Informações atuais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Dados atuais da conta</h3>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p><strong>Nome:</strong> {userProfile?.name}</p>
              <p><strong>Email:</strong> {userProfile?.email}</p>
              <p><strong>CRM:</strong> {userProfile?.crm}</p>
              <p><strong>Telefone:</strong> {userProfile?.phone || 'Não informado'}</p>
              <p><strong>Empresas:</strong> {userProfile?.companies?.join(', ') || 'Nenhuma'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Aba Perfil */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Dados do Perfil</h2>
                <p className="text-sm text-gray-600">Atualize seu nome, telefone e empresas</p>
              </div>
            </div>

            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="md:col-span-2">
                  <label className="label">Nome Completo</label>
                  <input
                    type="text"
                    className="input-field"
                    {...profileForm.register('name', {
                      required: 'Nome é obrigatório'
                    })}
                  />
                  {profileForm.formState.errors.name && (
                    <p className="error-text">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="label">Telefone</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="(11) 99999-9999"
                    {...profileForm.register('phone')}
                    onChange={(e) => {
                      e.target.value = formatPhone(e.target.value);
                    }}
                  />
                </div>

                {/* CRM (somente leitura) */}
                <div>
                  <label className="label">CRM</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50"
                    value={userProfile?.crm || ''}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">CRM não pode ser alterado</p>
                </div>
              </div>

              {/* Empresas */}
              <div>
                <label className="label">Empresas</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="CLIAN"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      {...profileForm.register('companies')}
                    />
                    <span className="ml-2 text-sm text-gray-700">CLIAN</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="CMA"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      {...profileForm.register('companies')}
                    />
                    <span className="ml-2 text-sm text-gray-700">CMA</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  {isLoading ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Aba Email */}
        {activeTab === 'email' && (
          <div>
            <div className="flex items-center mb-6">
              <Mail className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Alterar Email</h2>
                <p className="text-sm text-gray-600">Para alterar seu email, confirme sua senha atual</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Importante:</p>
                  <p>Após alterar o email, você precisará fazer login novamente com o novo email.</p>
                </div>
              </div>
            </div>

            <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="space-y-6">
              <div>
                <label className="label">Novo Email</label>
                <input
                  type="email"
                  className="input-field"
                  {...emailForm.register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                />
                {emailForm.formState.errors.email && (
                  <p className="error-text">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Senha Atual</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Digite sua senha atual"
                  {...emailForm.register('currentPassword', {
                    required: 'Senha atual é obrigatória'
                  })}
                />
                {emailForm.formState.errors.currentPassword && (
                  <p className="error-text">{emailForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  {isLoading ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Alterar Email
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Aba Senha */}
        {activeTab === 'password' && (
          <div>
            <div className="flex items-center mb-6">
              <Lock className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Alterar Senha</h2>
                <p className="text-sm text-gray-600">Mantenha sua conta segura com uma senha forte</p>
              </div>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-6">
              <div>
                <label className="label">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Digite sua senha atual"
                    {...passwordForm.register('currentPassword', {
                      required: 'Senha atual é obrigatória'
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="error-text">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="label">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Digite sua nova senha"
                    {...passwordForm.register('newPassword', {
                      required: 'Nova senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Senha deve ter pelo menos 6 caracteres'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="error-text">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="label">Confirmar Nova Senha</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Confirme sua nova senha"
                  {...passwordForm.register('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: value =>
                      value === passwordForm.watch('newPassword') || 'Senhas não coincidem'
                  })}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="error-text">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  {isLoading ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Alterar Senha
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;