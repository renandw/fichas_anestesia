import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Stethoscope, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSentEmail(data.email);
      setEmailSent(true);
      toast.success('Email de recuperação enviado!');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      
      // Tratar erros específicos
      const errorMessages = {
        'auth/user-not-found': 'Não encontramos uma conta com este email.',
        'auth/invalid-email': 'Email inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      };
      
      const message = errorMessages[error.code] || 'Erro ao enviar email de recuperação. Tente novamente.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, sentEmail);
      toast.success('Email reenviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao reenviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-primary-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Email Enviado!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enviamos um link para redefinir sua senha para:
            </p>
            <p className="mt-1 text-sm font-medium text-primary-600">
              {sentEmail}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Mail className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Verifique sua caixa de entrada</p>
                <p>
                  Se você não receber o email em alguns minutos, verifique sua pasta de spam 
                  ou lixo eletrônico.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={isLoading}
              className="w-full btn-outline"
            >
              {isLoading ? (
                <div className="loading-spinner mx-auto"></div>
              ) : (
                'Reenviar Email'
              )}
            </button>

            <Link
              to="/signin"
              className="w-full btn-primary flex justify-center items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Login
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Lembrou da senha?{' '}
              <Link
                to="/signin"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-primary-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-3 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Esqueceu sua senha?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex justify-center py-3"
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </button>

            <Link
              to="/signin"
              className="w-full btn-outline flex justify-center items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Login
            </Link>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;