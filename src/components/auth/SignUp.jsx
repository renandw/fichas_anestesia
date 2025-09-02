import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext'; // ✅ MUDOU: novo path
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [crmChecking, setCrmChecking] = useState(false);
  const { signup, user, isAuthenticated } = useAuth(); // ✅ MUDOU: usando isAuthenticated
  
  const { register, handleSubmit, formState: { errors }, watch, setError, clearErrors } = useForm();
  const watchPassword = watch('password');

  // ✅ MUDOU: Função de verificação de CRM movida para o componente
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

  // Verificar CRM em tempo real
  const validateCRM = async (crm) => {
    if (!crm || crm.length < 5) return true;
    
    setCrmChecking(true);
    try {
      const exists = await checkCRMExists(crm);
      if (exists) {
        setError('crm', { 
          type: 'manual', 
          message: 'Este CRM já está cadastrado. Tente fazer login ou recuperar sua senha.' 
        });
        return false;
      } else {
        clearErrors('crm');
        return true;
      }
    } catch (error) {
      console.error('Erro ao validar CRM:', error);
      return true;
    } finally {
      setCrmChecking(false);
    }
  };

  // ✅ MUDOU: Usando isAuthenticated em vez de só user
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('📝 Dados do formulário:', data);
      
      // ✅ MUDOU: Novo AuthContext já trata tudo automaticamente
      await signup(data);
      
      // Se chegou aqui, signup foi bem-sucedido
      // O AuthContext já mostra toast de sucesso
      console.log('✅ Cadastro realizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      // Erro já tratado no AuthContext com toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-primary-50 py-12">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-3 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Preencha seus dados para começar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Nome */}
            <div className="form-group">
              <label htmlFor="name" className="label">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="input-field"
                placeholder="Dr. João Silva"
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 2,
                    message: 'Nome deve ter pelo menos 2 caracteres'
                  }
                })}
              />
              {errors.name && (
                <p className="error-text">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="seu@email.com"
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
              />
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>

            {/* Celular */}
            <div className="form-group">
              <label htmlFor="phone" className="label">
                Celular
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="input-field"
                placeholder="(11) 99999-9999"
                {...register('phone', {
                  required: 'Celular é obrigatório'
                })}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '');
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
                  
                  e.target.value = formatted;
                }}
              />
              {errors.phone && (
                <p className="error-text">{errors.phone.message}</p>
              )}
            </div>

            {/* CRM */}
            <div className="form-group">
              <label htmlFor="crm" className="label">
                CRM *
              </label>
              <div className="relative">
                <input
                  id="crm"
                  type="text"
                  className={`input-field ${crmChecking ? 'pr-10' : ''}`}
                  placeholder="123456/SP"
                  {...register('crm', {
                    required: 'CRM é obrigatório',
                    pattern: {
                      value: /^\d+\/[A-Z]{2}$/,
                      message: 'Formato: 123456/SP'
                    },
                    validate: validateCRM
                  })}
                  onBlur={(e) => {
                    const crm = e.target.value;
                    if (crm && /^\d+\/[A-Z]{2}$/.test(crm)) {
                      validateCRM(crm);
                    }
                  }}
                />
                {crmChecking && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="loading-spinner w-4 h-4"></div>
                  </div>
                )}
              </div>
              {errors.crm && (
                <p className={`error-text ${errors.crm.message.includes('já está cadastrado') ? 'text-red-600 font-medium' : ''}`}>
                  {errors.crm.message}
                </p>
              )}
              {!errors.crm && !crmChecking && watch('crm') && /^\d+\/[A-Z]{2}$/.test(watch('crm')) && (
                <p className="text-green-600 text-sm mt-1">✓ CRM disponível</p>
              )}
            </div>

            {/* Empresas */}
            <div className="form-group">
              <label className="label">Empresas</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="CLIAN"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    {...register('companies', {
                      required: 'Selecione pelo menos uma empresa'
                    })}
                  />
                  <span className="ml-2 text-sm text-gray-700">CLIAN</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="CMA"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    {...register('companies')}
                  />
                  <span className="ml-2 text-sm text-gray-700">CMA</span>
                </label>
              </div>
              {errors.companies && (
                <p className="error-text">{errors.companies.message}</p>
              )}
            </div>

            {/* Senha */}
            <div className="form-group">
              <label htmlFor="password" className="label">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  placeholder="Mínimo 6 caracteres"
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="label">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="input-field"
                placeholder="Confirme sua senha"
                {...register('confirmPassword', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: value =>
                    value === watchPassword || 'Senhas não coincidem'
                })}
              />
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex justify-center py-3"
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                'Criar Conta'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                to="/signin"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Entre aqui
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;