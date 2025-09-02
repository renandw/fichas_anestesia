import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Search } from 'lucide-react';

const PatientFormBase = ({ 
  initialData = {}, 
  formType = 'sus', // 'sus', 'convenio', ou 'both'
  onSubmit, 
  isLoading = false,
  submitButtonText = "Continuar",
  showTitle = true,
  mode = "create",
  onPatientSearch = null, // Callback para buscar paciente existente
  showPatientSearch = true,
  onPatientCreate = null, // Callback para criar novo paciente
  onPatientUpdate = null  // Callback para atualizar paciente existente
}) => {
  
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
    defaultValues: {
      // Dados básicos do paciente
      patientName: initialData?.patientName || '',
      patientBirthDate: initialData?.patientBirthDate || '',
      patientSex: initialData?.patientSex || '',
      patientWeight: initialData?.patientWeight || '',
      patientHeight: initialData?.patientHeight || '',
      
      // Campos SUS
      patientCNS: initialData?.patientCNS || '',
      hospitalRecord: initialData?.hospitalRecord || '',
      
      // Campos Convênio
      insuranceNumber: initialData?.insuranceNumber || '',
      insuranceName: initialData?.insuranceName || '',
      
      // Campos de busca
      searchTerm: ''
    }
  });

  // Estados
  const [calculatedAge, setCalculatedAge] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [insuranceChanged, setInsuranceChanged] = useState(false);

  // Watch da data de nascimento para calcular idade
  const birthDate = watch('patientBirthDate');
  const searchTerm = watch('searchTerm');
  const currentInsuranceName = watch('insuranceName');
  const currentInsuranceNumber = watch('insuranceNumber');

  // Lista de convênios
  const insuranceOptions = [
    'Unimed', 'Bradesco', 'Amil', 'SulAmérica', 'ASSEFAZ', 'Astir', 
    'Capesesp', 'Cassi', 'Funsa', 'Fusex', 'Geap', 'Ipam', 'Life', 
    'Saúde Caixa', 'Innova', 'Particular', 'Outros'
  ];

  // Calcular idade baseado na data de nascimento
  // Reset form quando initialData muda
  useEffect(() => {
    if (birthDate) {
      const birth = new Date(birthDate);
      const now = new Date();
      
      if (birth > now) {
        setCalculatedAge('Data inválida');
        return;
      }

      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();

      // Ajustar se os dias são negativos
      if (days < 0) {
        months--;
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
      }

      // Ajustar se os meses são negativos
      if (months < 0) {
        years--;
        months += 12;
      }

      // Formatação da idade
      let ageText = '';
      if (years > 0) {
        ageText += `${years} ano${years !== 1 ? 's' : ''}`;
        if (months > 0) ageText += `, ${months} mês${months !== 1 ? 'es' : ''}`;
        if (days > 0 && years === 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
      } else if (months > 0) {
        ageText += `${months} mês${months !== 1 ? 'es' : ''}`;
        if (days > 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
      } else {
        ageText = `${days} dia${days !== 1 ? 's' : ''}`;
      }

      setCalculatedAge(ageText);
    } else {
      setCalculatedAge('');
    }
  }, [birthDate]);

  // Detectar mudança de convênio
  useEffect(() => {
    if (selectedPatient && (formType === 'convenio' || formType === 'both')) {
      const originalInsurance = selectedPatient.currentInsuranceName || '';
      const originalNumber = selectedPatient.currentInsuranceNumber || '';
      
      const hasInsuranceChanged = 
        currentInsuranceName !== originalInsurance || 
        currentInsuranceNumber !== originalNumber;
      
      setInsuranceChanged(hasInsuranceChanged);
    } else {
      setInsuranceChanged(false);
    }
  }, [selectedPatient, currentInsuranceName, currentInsuranceNumber, formType]);
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        patientName: initialData?.patientName || '',
        patientBirthDate: initialData?.patientBirthDate || '',
        patientSex: initialData?.patientSex || '',
        patientWeight: initialData?.patientWeight || '',
        patientHeight: initialData?.patientHeight || '',
        patientCNS: initialData?.patientCNS || '',
        hospitalRecord: initialData?.hospitalRecord || '',
        insuranceNumber: initialData?.insuranceNumber || '',
        insuranceName: initialData?.insuranceName || '',
        searchTerm: ''
      });
    }
  }, [initialData, reset]);

  // Buscar paciente
  const handlePatientSearch = async () => {
    if (!searchTerm.trim() || !onPatientSearch) return;
    
    setIsSearching(true);
    try {
      const results = await onPatientSearch(searchTerm);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Selecionar paciente da busca
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setValue('searchTerm', '');
    
    // Preencher campos com dados do paciente
    setValue('patientName', patient.name || '');
    setValue('patientBirthDate', patient.birthDate || '');
    setValue('patientSex', patient.sex || '');
    setValue('patientWeight', patient.weight || '');
    setValue('patientHeight', patient.height || '');
    setValue('patientCNS', patient.cns || patient.patientCNS || '');
    setValue('hospitalRecord', patient.hospitalRecord || '');
    setValue('insuranceNumber', patient.currentInsuranceNumber || patient.insuranceNumber || '');
    setValue('insuranceName', patient.currentInsuranceName || patient.insuranceName || '');
  };

  // Limpar seleção de paciente
  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setInsuranceChanged(false);
    reset({
      patientName: '',
      patientBirthDate: '',
      patientSex: '',
      patientWeight: '',
      patientHeight: '',
      patientCNS: '',
      hospitalRecord: '',
      insuranceNumber: '',
      insuranceName: '',
      searchTerm: ''
    });
  };

  // Validar CNS (simples)
  const validateCNS = (value) => {
    if (!value) return formType === 'sus' ? 'CNS é obrigatório' : true;
    const cleanCNS = value.replace(/\D/g, '');
    return cleanCNS.length === 15 || 'CNS deve ter 15 dígitos';
  };

  // Handle submit com lógica de criação/atualização
  const handleFormSubmit = async (formData) => {
    try {
      let patientResult;

      if (selectedPatient) {
        // Paciente existente - verificar se precisa atualizar
        const updates = {};
        
        // Campos básicos que podem ter mudado
        if (formData.patientName !== selectedPatient.name) updates.name = formData.patientName;
        if (formData.patientBirthDate !== selectedPatient.birthDate) updates.birthDate = formData.patientBirthDate;
        if (formData.patientSex !== selectedPatient.sex) updates.sex = formData.patientSex;
        if (formData.patientWeight !== selectedPatient.weight) updates.weight = formData.patientWeight;
        if (formData.patientHeight !== selectedPatient.height) updates.height = formData.patientHeight;
        if (formData.patientCNS !== selectedPatient.cns) updates.cns = formData.patientCNS;
        if (formData.hospitalRecord !== selectedPatient.hospitalRecord) updates.hospitalRecord = formData.hospitalRecord;
        
        // Mudança de convênio (detectada pelo estado insuranceChanged)
        if (insuranceChanged) {
          updates.currentInsuranceName = formData.insuranceName;
          updates.currentInsuranceNumber = formData.insuranceNumber;
        }

        // Se há updates, chama função de atualização
        if (Object.keys(updates).length > 0 && onPatientUpdate) {
          await onPatientUpdate(selectedPatient.id, updates);
        }

        patientResult = { ...selectedPatient, ...updates };
      } else {
        // Paciente novo
        const patientData = {
          name: formData.patientName,
          birthDate: formData.patientBirthDate,
          sex: formData.patientSex,
          weight: formData.patientWeight,
          height: formData.patientHeight,
          cns: formData.patientCNS,
          hospitalRecord: formData.hospitalRecord,
          currentInsuranceName: formData.insuranceName,
          currentInsuranceNumber: formData.insuranceNumber
        };

        if (onPatientCreate) {
          patientResult = await onPatientCreate(patientData);
        } else {
          patientResult = patientData;
        }
      }

      // Chama callback original com dados do paciente processado
      if (onSubmit) {
        onSubmit({
          ...formData,
          patient: patientResult,
          patientId: patientResult.id,
          isNewPatient: !selectedPatient,
          insuranceChanged: insuranceChanged
        });
      }
    } catch (error) {
      console.error('Erro ao processar dados do paciente:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      
      {/* Título opcional */}
      {showTitle && (
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-primary-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Editando Dados do Paciente' : 'Dados do Paciente'}
            </h2>
            <p className="text-sm text-gray-600">
              {formType === 'sus' ? 'Atendimento SUS' : 
               formType === 'convenio' ? 'Atendimento Convênio' : 
               'Buscar ou cadastrar paciente'}
            </p>
          </div>
        </div>
      )}

      {/* Busca de paciente existente */}
      {showPatientSearch && onPatientSearch && !selectedPatient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Buscar Paciente Existente</h3>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                className="input-field"
                placeholder="Digite nome, CNS ou matrícula do convênio..."
                {...register('searchTerm')}
              />
            </div>
            <button
              type="button"
              onClick={handlePatientSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="btn-secondary flex items-center px-4"
            >
              {isSearching ? (
                <div className="loading-spinner mr-2"></div>
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar
            </button>
          </div>

          {/* Resultados da busca */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Pacientes encontrados:</p>
              {searchResults.map((patient) => (
                <div 
                  key={patient.id} 
                  className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => selectPatient(patient)}
                >
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-gray-600">
                    {patient.birthDate && `Nascimento: ${new Date(patient.birthDate).toLocaleDateString('pt-BR')}`}
                    {patient.cns && ` • CNS: ${patient.cns}`}
                    {patient.currentInsuranceName && ` • ${patient.currentInsuranceName}`}
                    {patient.insuranceName && ` • ${patient.insuranceName}`}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Ou cadastre um novo paciente abaixo</p>
          </div>
        </div>
      )}

      {/* Paciente selecionado */}
      {selectedPatient && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">Paciente selecionado:</p>
              <p className="text-green-700">{selectedPatient.name}</p>
              {selectedPatient.currentInsuranceName && (
                <p className="text-sm text-green-600">
                  Convênio atual: {selectedPatient.currentInsuranceName}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={clearPatientSelection}
              className="text-red-600 hover:text-red-800"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* Alerta de mudança de convênio */}
      {insuranceChanged && selectedPatient && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Convênio Alterado</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>Convênio atual do paciente: <strong>{selectedPatient.currentInsuranceName || 'Não informado'}</strong></p>
                <p>Convênio para este atendimento: <strong>{currentInsuranceName || 'Não informado'}</strong></p>
                <p className="mt-1 text-xs">O histórico de convênios do paciente será atualizado automaticamente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dados básicos do paciente */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedPatient ? 'Confirmar/Atualizar Dados' : 'Cadastrar Novo Paciente'}
        </h3>

        {/* Nome e Sexo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="label">Nome Completo do Paciente *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Nome completo do paciente"
              style={{ textTransform: 'capitalize' }}
              {...register('patientName', {
                required: 'Nome é obrigatório',
                minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' },
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                }
              })}
            />
            {errors.patientName && (
              <p className="error-text">{errors.patientName.message}</p>
            )}
          </div>

          <div>
            <label className="label">Sexo *</label>
            <select
              className="input-field"
              {...register('patientSex', {
                required: 'Sexo é obrigatório'
              })}
            >
              <option value="">Selecione</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outros">Outros</option>
            </select>
            {errors.patientSex && (
              <p className="error-text">{errors.patientSex.message}</p>
            )}
          </div>
        </div>

        {/* Data de nascimento e medidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <label className="label">Data de Nascimento *</label>
            <input
              type="date"
              className="input-field"
              {...register('patientBirthDate', {
                required: 'Data de nascimento é obrigatória',
                validate: (value) => {
                  const birth = new Date(value);
                  const now = new Date();
                  return birth <= now || 'Data de nascimento inválida';
                }
              })}
            />
            {errors.patientBirthDate && (
              <p className="error-text">{errors.patientBirthDate.message}</p>
            )}
            {calculatedAge && (
              <p className="text-sm text-primary-600 mt-1">
                Idade: {calculatedAge}
              </p>
            )}
          </div>

          <div>
            <label className="label">Peso (kg) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="300"
              className="input-field"
              placeholder="70.5"
              {...register('patientWeight', {
                required: 'Peso é obrigatório',
                min: { value: 0.1, message: 'Peso deve ser maior que 0' },
                max: { value: 300, message: 'Peso deve ser menor que 300kg' }
              })}
            />
            {errors.patientWeight && (
              <p className="error-text">{errors.patientWeight.message}</p>
            )}
          </div>

          <div>
            <label className="label">Altura (cm)</label>
            <input
              type="number"
              min="30"
              max="250"
              className="input-field"
              placeholder="170"
              {...register('patientHeight', {
                min: { value: 30, message: 'Altura deve ser maior que 30cm' },
                max: { value: 250, message: 'Altura deve ser menor que 250cm' }
              })}
            />
            {errors.patientHeight && (
              <p className="error-text">{errors.patientHeight.message}</p>
            )}
          </div>
        </div>

        {/* Campos SUS */}
        {(formType === 'sus' || formType === 'both') && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-4">Dados SUS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  CNS (Cartão Nacional de Saúde) {formType === 'sus' ? '*' : ''}
                </label>
                <input
                  type="text"
                  maxLength="18"
                  className="input-field"
                  placeholder="123 4567 8901 2345"
                  {...register('patientCNS', {
                    validate: validateCNS
                  })}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
                    e.target.value = formatted;
                  }}
                />
                {errors.patientCNS && (
                  <p className="error-text">{errors.patientCNS.message}</p>
                )}
              </div>

              <div>
                <label className="label">Registro do Hospital</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="12345"
                  {...register('hospitalRecord')}
                />
                {errors.hospitalRecord && (
                  <p className="error-text">{errors.hospitalRecord.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campos Convênio */}
        {(formType === 'convenio' || formType === 'both') && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-4">Dados do Convênio</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  Matrícula do Convênio {formType === 'convenio' ? '*' : ''}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="123456789"
                  {...register('insuranceNumber', {
                    required: formType === 'convenio' ? 'Matrícula do convênio é obrigatória' : false
                  })}
                />
                {errors.insuranceNumber && (
                  <p className="error-text">{errors.insuranceNumber.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  Nome do Convênio {formType === 'convenio' ? '*' : ''}
                </label>
                <select
                  className="input-field"
                  {...register('insuranceName', {
                    required: formType === 'convenio' ? 'Nome do convênio é obrigatório' : false
                  })}
                >
                  <option value="">Selecione o convênio</option>
                  {insuranceOptions.map((insurance) => (
                    <option key={insurance} value={insurance}>
                      {insurance}
                    </option>
                  ))}
                </select>
                {errors.insuranceName && (
                  <p className="error-text">{errors.insuranceName.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão de submit */}
      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner mr-2"></div>
              Salvando...
            </>
          ) : (
            submitButtonText
          )}
        </button>
      </div>
    </form>
  );
};

export default PatientFormBase;