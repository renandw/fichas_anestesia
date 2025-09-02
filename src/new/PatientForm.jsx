import React, { useState } from 'react';
import { X, User, AlertTriangle, Check } from 'lucide-react';
import { checkForDuplicates, createPatient, updatePatient } from '../services/patientService';
import { useAuth } from '../contexts/AuthContext';

// Mover componentes para fora para evitar recriação
const MobileView = ({ 
  patientData, 
  errors, 
  isSubmitting, 
  handleInputChange, 
  handleSubmit 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    {/* Header compacto */}
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm leading-tight">
            Dados do Paciente
          </h3>
          <p className="text-blue-100 text-xs">
            Preencha as informações
          </p>
        </div>
      </div>
    </div>

    {/* Conteúdo */}
    <div className="p-3 space-y-3">
      {/* Nome do Paciente */}
      <div>
        <label htmlFor="patientNameMobile" className="block text-xs font-medium text-gray-700 mb-1">Nome Completo *</label>
        <input
          id="patientNameMobile"
          name="patientName"
          type="text"
          value={patientData.patientName}
          onChange={(e) => handleInputChange('patientName', e.target.value)}
          className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.patientName ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Nome completo do paciente"
          disabled={isSubmitting}
        />
        {errors.patientName && (
          <p className="mt-1 text-xs text-red-600">{errors.patientName}</p>
        )}
      </div>

      {/* Data de Nascimento e Sexo */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="patientBirthDateMobile" className="block text-xs font-medium text-gray-700 mb-1">Data Nascimento *</label>
          <input
            id="patientBirthDateMobile"
            name="patientBirthDate"
            type="date"
            value={patientData.patientBirthDate}
            onChange={(e) => handleInputChange('patientBirthDate', e.target.value)}
            className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientBirthDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.patientBirthDate && (
            <p className="mt-1 text-xs text-red-600">{errors.patientBirthDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="patientSexMobile" className="block text-xs font-medium text-gray-700 mb-1">Sexo *</label>
          <select
            id="patientSexMobile"
            name="patientSex"
            value={patientData.patientSex}
            onChange={(e) => handleInputChange('patientSex', e.target.value)}
            className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientSex ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Selecione</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          {errors.patientSex && (
            <p className="mt-1 text-xs text-red-600">{errors.patientSex}</p>
          )}
        </div>
      </div>

      {/* CNS */}
      <div>
        <label htmlFor="patientCNSMobile" className="block text-xs font-medium text-gray-700 mb-1">CNS *</label>
        <input
          id="patientCNSMobile"
          name="patientCNS"
          type="text"
          value={patientData.patientCNS}
          onChange={(e) => handleInputChange('patientCNS', e.target.value)}
          className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.patientCNS ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="123 4567 8901 2345"
          disabled={isSubmitting}
          maxLength="18"
        />
        {errors.patientCNS && (
          <p className="mt-1 text-xs text-red-600">{errors.patientCNS}</p>
        )}
      </div>

      {/* Botão Submit */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-xs"
        >
          {isSubmitting ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Verificando...
            </>
          ) : (
            'Continuar'
          )}
        </button>
      </div>
    </div>
  </div>
);

const DesktopView = ({ 
  patientData, 
  errors, 
  isSubmitting, 
  handleInputChange, 
  handleSubmit 
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Dados do Paciente</h3>
          <p className="text-xs text-gray-600">Preencha as informações do paciente</p>
        </div>
      </div>
    </div>

    {/* Conteúdo */}
    <div className="p-4 space-y-4">
      {/* Nome do Paciente */}
      <div>
        <label htmlFor="patientNameDesktop" className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
        <input
          id="patientNameDesktop"
          name="patientName"
          type="text"
          value={patientData.patientName}
          onChange={(e) => handleInputChange('patientName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.patientName ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Digite o nome completo do paciente"
          disabled={isSubmitting}
        />
        {errors.patientName && (
          <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
        )}
      </div>

      {/* Data de Nascimento e Sexo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="patientBirthDateDesktop" className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento *</label>
          <input
            id="patientBirthDateDesktop"
            name="patientBirthDate"
            type="date"
            value={patientData.patientBirthDate}
            onChange={(e) => handleInputChange('patientBirthDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientBirthDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.patientBirthDate && (
            <p className="mt-1 text-sm text-red-600">{errors.patientBirthDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="patientSexDesktop" className="block text-sm font-medium text-gray-700 mb-2">Sexo *</label>
          <select
            id="patientSexDesktop"
            name="patientSex"
            value={patientData.patientSex}
            onChange={(e) => handleInputChange('patientSex', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientSex ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Selecione o sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          {errors.patientSex && (
            <p className="mt-1 text-sm text-red-600">{errors.patientSex}</p>
          )}
        </div>
      </div>

      {/* CNS */}
      <div>
        <label htmlFor="patientCNSDesktop" className="block text-sm font-medium text-gray-700 mb-2">Cartão Nacional de Saúde (CNS) *</label>
        <input
          id="patientCNSDesktop"
          name="patientCNS"
          type="text"
          value={patientData.patientCNS}
          onChange={(e) => handleInputChange('patientCNS', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.patientCNS ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="123 4567 8901 2345"
          disabled={isSubmitting}
          maxLength="18"
        />
        {errors.patientCNS && (
          <p className="mt-1 text-sm text-red-600">{errors.patientCNS}</p>
        )}
      </div>

      {/* Botão Submit */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Verificando paciente...
            </>
          ) : (
            'Continuar'
          )}
        </button>
      </div>
    </div>
  </div>
);

const PatientForm = ({ 
  mode = "create", // "create" | "edit"
  initialData = null,
  onPatientSelected 
}) => {
  const { currentUserId } = useAuth();
  
  // Estados principais
  const [patientData, setPatientData] = useState(
    mode === "edit" && initialData ? initialData : {
      patientName: '',
      patientBirthDate: '',
      patientSex: '',
      patientCNS: ''
    }
  );

  // Estados de controle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicatesFound, setDuplicatesFound] = useState([]);
  const [duplicateType, setDuplicateType] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [fieldsToUpdate, setFieldsToUpdate] = useState({});
  const [errors, setErrors] = useState({});

  // Função para formatar CNS
  const formatCNS = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 15 dígitos
    const limitedNumbers = numbers.slice(0, 15);
    
    // Aplica a formatação XXX XXXX XXXX XXXX
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 11) {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3, 7)} ${limitedNumbers.slice(7)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3, 7)} ${limitedNumbers.slice(7, 11)} ${limitedNumbers.slice(11)}`;
    }
  };

  // Formata e limpa o nome do paciente
  const formatPatientName = (name) => {
    const cleaned = name
      .replace(/[^A-Za-zÀ-ÿ\s'´~˜ˆ]/g, '') // remove números e símbolos, exceto acentos e símbolos permitidos
      .replace(/\s{2,}/g, ' ') // substitui dois ou mais espaços por apenas um
      .trimStart(); // mantém o espaço no meio enquanto digita

    const capitalized = cleaned
      .split(' ')
      .map(word => word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1).toLowerCase())
      .join(' ');

    return capitalized;
  };

  // Função para extrair apenas números do CNS formatado
  const unformatCNS = (formattedCNS) => {
    return formattedCNS.replace(/\D/g, '');
  };

  // Formatar data pura (YYYY-MM-DD) sem usar Date (evita problemas de fuso)
  const formatDateOnly = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  // Alteração nos campos
  const handleInputChange = (field, value) => {
    let newValue = value;

    if (field === 'patientCNS') {
      newValue = formatCNS(value);
    } else if (field === 'patientName') {
      newValue = formatPatientName(value);
    }

    setPatientData(prev => ({ ...prev, [field]: newValue }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validação dos campos
  const validateForm = () => {
    const newErrors = {};
    
    if (!patientData.patientName.trim()) {
      newErrors.patientName = 'Nome é obrigatório';
    }
    
    if (!patientData.patientBirthDate) {
      newErrors.patientBirthDate = 'Data de nascimento é obrigatória';
    }
    
    if (!patientData.patientSex) {
      newErrors.patientSex = 'Sexo é obrigatório';
    }
    
    if (!patientData.patientCNS.trim()) {
      newErrors.patientCNS = 'CNS é obrigatório';
    } else {
      // Verifica se tem 15 dígitos (removendo a formatação)
      const numbersOnly = unformatCNS(patientData.patientCNS);
      if (numbersOnly.length !== 15) {
        newErrors.patientCNS = 'CNS deve ter 15 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão do formulário - INTEGRADO COM FIREBASE
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Se for modo edição, apenas atualiza e retorna
    if (mode === "edit") {
      try {
        const dataToUpdate = {
          ...patientData,
          metadata: {
            ...(patientData.metadata || {}),
            updatedBy: currentUserId || null,
            updatedAt: new Date().toISOString()
          }
        };
        const updated = await updatePatient(initialData.id, dataToUpdate);
        onPatientSelected(updated);
      } catch (error) {
        console.error('❌ Erro ao atualizar paciente (modo edição):', error);
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔍 Verificando duplicatas no Firebase...');
      
      // Preparar dados com CNS sem formatação para o Firebase
      const dataToSubmit = {
        ...patientData,
        patientCNS: unformatCNS(patientData.patientCNS)
      };
      
      const duplicateResult = await checkForDuplicates({
        ...dataToSubmit,
        currentUserId
      });
      
      if (duplicateResult.type !== 'none') {
        setDuplicatesFound(duplicateResult.patients);
        setDuplicateType(duplicateResult.type);
        setShowDuplicateModal(true);
      } else {
        // Nenhuma duplicata encontrada - criar paciente
        await createNewPatient();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar duplicatas:', error);
      // TODO: Mostrar erro para usuário
    } finally {
      setIsSubmitting(false);
    }
  };

  // Criar novo paciente - INTEGRADO COM FIREBASE
  const createNewPatient = async () => {
    try {
      console.log('🆕 Criando novo paciente no Firebase...');
      
      // Preparar dados com CNS sem formatação para o Firebase
      const dataToSubmit = {
        ...patientData,
        patientCNS: unformatCNS(patientData.patientCNS)
      };
      
      const newPatient = await createPatient(dataToSubmit, currentUserId);
      
      console.log('✅ Paciente criado:', newPatient);
      onPatientSelected(newPatient);
    } catch (error) {
      console.error('❌ Erro ao criar paciente:', error);
      // TODO: Mostrar erro para usuário
    }
  };

  // Usar paciente existente
  const handleUseExisting = (patient) => {
    console.log('📋 Usando paciente existente:', patient.id);
    setShowDuplicateModal(false);
    onPatientSelected(patient);
  };

  // Preparar atualização
  const handlePrepareUpdate = (patient) => {
    setCurrentPatient(patient);
    setShowDuplicateModal(false);
    setShowUpdateModal(true);
    
    // Identificar campos diferentes
    const updates = {};
    Object.keys(patientData).forEach(key => {
      if (patientData[key] !== patient[key]) {
        updates[key] = true;
      }
    });
    setFieldsToUpdate(updates);
  };

  // Confirmar atualização - INTEGRADO COM FIREBASE
  const handleConfirmUpdate = async () => {
    try {
      console.log('🔄 Atualizando paciente no Firebase...');
      
      // Preparar dados para atualização (com CNS sem formatação)
      const updatesData = Object.keys(fieldsToUpdate).reduce((acc, key) => {
        if (fieldsToUpdate[key]) {
          if (key === 'patientCNS') {
            acc[key] = unformatCNS(patientData[key]);
          } else {
            acc[key] = patientData[key];
          }
        }
        return acc;
      }, {});
      
      // Atualizar no Firebase
      await updatePatient(currentPatient.id, updatesData, currentUserId);
      
      // Criar objeto paciente atualizado
      const updatedPatient = {
        ...currentPatient,
        ...updatesData,
        metadata: {
          ...currentPatient.metadata,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserId
        }
      };
      
      console.log('✅ Paciente atualizado:', updatedPatient);
      setShowUpdateModal(false);
      onPatientSelected(updatedPatient);
    } catch (error) {
      console.error('❌ Erro ao atualizar paciente:', error);
      // TODO: Mostrar erro para usuário
    }
  };

  // Função para formatar tipo de duplicata para exibição
  const getDuplicateTypeMessage = (type) => {
    const messages = {
      'cns_match': {
        title: 'Paciente já cadastrado',
        description: 'Encontramos um paciente com o mesmo CNS:'
      },
      'name_date_match': {
        title: 'Paciente encontrado',
        description: 'Encontramos um paciente com o mesmo nome e data de nascimento:'
      },
      'similar_match': {
        title: 'Pacientes similares encontrados',
        description: 'Encontramos pacientes com dados similares:'
      }
    };
    
    return messages[type] || messages.name_date_match;
  };

  return (
    <div className="w-full">
      {/* Mobile View - visível apenas em telas pequenas */}
      <div className="block md:hidden">
        <MobileView 
          patientData={patientData}
          errors={errors}
          isSubmitting={isSubmitting}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </div>
      
      {/* Desktop View - visível em telas médias e grandes */}
      <div className="hidden md:block">
        <DesktopView 
          patientData={patientData}
          errors={errors}
          isSubmitting={isSubmitting}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </div>

      {/* Modal de Duplicata - MELHORADO */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg md:rounded-xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
              <h3 className="text-base md:text-lg font-semibold">
                {getDuplicateTypeMessage(duplicateType).title}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">
              {getDuplicateTypeMessage(duplicateType).description}
            </p>

            <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
              {duplicatesFound.map((patient, index) => (
                <div key={patient.id || index} className="bg-gray-50 rounded-lg p-2 md:p-3">
                  <p className="font-medium text-sm md:text-base">{patient.patientName}</p>
                  <p className="text-xs md:text-sm text-gray-600">
                    Nascimento: {formatDateOnly(patient.patientBirthDate)}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">CNS: {patient.patientCNS}</p>
                  {patient.similarity && (
                    <p className="text-xs md:text-sm text-blue-600">
                      Similaridade: {patient.similarity}% {patient.analysisDetails && `(${patient.analysisDetails})`}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <button
                onClick={() => handleUseExisting(duplicatesFound[0])}
                className="flex-1 bg-blue-600 text-white py-2 px-3 md:px-4 rounded-lg hover:bg-blue-700 text-xs md:text-sm"
              >
                Usar Paciente
              </button>
              <button
                onClick={() => handlePrepareUpdate(duplicatesFound[0])}
                className="flex-1 bg-amber-600 text-white py-2 px-3 md:px-4 rounded-lg hover:bg-amber-700 text-xs md:text-sm"
              >
                Atualizar Dados
              </button>
              {duplicateType !== 'cns_match' && (
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    createNewPatient();
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-3 md:px-4 rounded-lg hover:bg-gray-700 text-xs md:text-sm"
                >
                  Criar Novo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atualização */}
      {showUpdateModal && currentPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg md:rounded-xl max-w-lg w-full p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold">Atualizar Dados do Paciente</h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">
              Selecione quais dados devem ser atualizados:
            </p>

            <div className="space-y-2 md:space-y-3">
              {Object.keys(patientData).map(key => {
                const labels = {
                  patientName: 'Nome',
                  patientBirthDate: 'Data de Nascimento',
                  patientSex: 'Sexo',
                  patientCNS: 'CNS'
                };
                
                const currentValue = currentPatient[key];
                const newValue = patientData[key];
                
                if (currentValue === newValue) return null;
                
                return (
                  <div key={key} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={fieldsToUpdate[key] || false}
                      onChange={(e) => setFieldsToUpdate(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-xs md:text-sm">{labels[key]}</p>
                      <div className="text-xs text-gray-600">
                        <span className="line-through">
                          {key === 'patientBirthDate' ? formatDateOnly(currentValue) : currentValue}
                        </span>
                        <span className="ml-2 text-green-600">
                          → {key === 'patientBirthDate' ? formatDateOnly(newValue) : newValue}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 mt-4 md:mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-3 md:px-4 rounded-lg hover:bg-gray-700 text-xs md:text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpdate}
                className="flex-1 bg-blue-600 text-white py-2 px-3 md:px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
              >
                <Check className="w-3 h-3 md:w-4 md:h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientForm;