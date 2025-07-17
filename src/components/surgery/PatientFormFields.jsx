import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Calendar,
  Clock,
  Building2,
  User,
  Users,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import cbhpmCodesData from '../data/cbhpm_codes.json';

const PatientFormFields = ({ 
  initialData = {}, 
  surgeryType, 
  onSubmit, 
  isLoading = false,
  submitButtonText = "Continuar",
  showTitle = true,
  mode = "create",
  onAutoSave = null
}) => {
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, control, reset } = useForm({
    defaultValues: {
      surgeryDate: initialData?.surgeryDate || '',
      surgeryTime: initialData?.surgeryTime || '',
      hospital: initialData?.hospital?.name || '',
      proposedSurgery: initialData?.proposedSurgery || '',
      performedSurgery: initialData?.performedSurgery || '',
      cbhpmProcedures: initialData?.cbhpmProcedures || [{ codigo: '', procedimento: '', porte_anestesico: '' }], // Array de procedimentos
      patientName: initialData?.patientName || '',
      patientBirthDate: initialData?.patientBirthDate || '',
      patientSex: initialData?.patientSex || '',
      patientWeight: initialData?.patientWeight || '',
      patientCNS: initialData?.patientCNS || '',
      hospitalRecord: initialData?.hospitalRecord || '',
      insuranceNumber: initialData?.insuranceNumber || '',
      insuranceName: initialData?.insuranceName || '',
      mainSurgeon: initialData?.mainSurgeon || '',
      auxiliarySurgeons: initialData?.auxiliarySurgeons || [{ name: '' }], // Array de auxiliares
      patientPosition: initialData?.patientPosition || ''
    }
  });

  // UseFieldArray para gerenciar arrays dinâmicos
  const { fields: cbhpmFields, append: appendCbhpm, remove: removeCbhpm } = useFieldArray({
    control,
    name: "cbhpmProcedures"
  });

  const { fields: surgeonFields, append: appendSurgeon, remove: removeSurgeon } = useFieldArray({
    control,
    name: "auxiliarySurgeons"
  });

  // Estado para idade calculada
  const [calculatedAge, setCalculatedAge] = useState('');

  // Watch da data de nascimento para calcular idade
  const birthDate = watch('patientBirthDate');

  // Hospitais SUS
  const susHospitals = [
    {
      id: 1,
      name: 'Hospital de Base - Centro Cirúrgico',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Centro Cirúrgico',
      shortName: 'HB - Centro Cirúrgico'
    },
    {
      id: 2,
      name: 'Hospital de Base - UNACON',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'UNACON',
      shortName: 'HB - Unacon'
    },
    {
      id: 3,
      name: 'Hospital de Base - Hemodinâmica',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Hemodinâmica',
      shortName: 'HB - Hemodinâmica'
    },
    {
      id: 4,
      name: 'Hospital de Base - Centro Obstétrico',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Centro Obstétrico',
      shortName: 'HB - Centro Obstétrico'
    },
    {
      id: 5,
      name: 'Hospital de Base - Centro Diagnóstico',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Centro Diagnóstico',
      shortName: 'HB - Diagnóstico'
    },
    {
      id: 6,
      name: 'Hospital João Paulo II - Centro Cirúrgico',
      address: 'Av. Campos Sales, 4295 - Nova Floresta, Porto Velho - RO, 76807-005',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital João Paulo II'
    },
    {
      id: 7,
      name: 'Hospital de Campanha - Centro Cirúrgico',
      address: 'R. Joaquim Nabuco, 2718 - Olaria, Porto Velho - RO, 76804-074',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital de Campanha'
    },
    {
      id: 8,
      name: 'Hospital Regional - Centro Cirúrgico',
      address: 'Av. Rosilene Xavier Transpadini, 2200 - Jardim Eldorado, Cacoal - RO, 76963-767',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital Regional Cacoal'
    },
    {
      id: 9,
      name: 'Hospital HEURO - Centro Cirúrgico',
      address: 'Av. Malaquita, 3581 - Josino Brito, Cacoal - RO, 76961-887',
      sector: 'Centro Cirúrgico',
      shortName: 'Heuro Cacoal'
    },
    {
      id: 10,
      name: 'Hospital do Amor - Centro Cirúrgico',
      address: '15, BR-364, Porto Velho - RO, 76834-899',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital do Amor'
    },
    {
      id: 11,
      name: 'Hospital Regional Extrema - Centro Cirúrgico',
      address: 'R. Abunã, 308 - Santa Bárbara, Porto Velho - RO, 76847-000',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital Extrema'
    },
    {
      id: 12,
      name: 'Hospital Regional São Francisco do Guaporé - Centro Cirúrgico',
      address: 'Av. Brasil, 4375 - Cidade Alta, São Francisco do Guaporé - RO, 76935-000',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital São Francisco do Guaporé'
    },
    {
      id: 13,
      name: 'Hospital Regional Humaitá - Centro Cirúrgico',
      address: 'R. Dom José - São Sebastião, Humaitá - AM, 69800-000',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital Humaitá'
    }
  ];

  // CBHPM codes - importar do JSON
  // import cbhpmCodesData from '../../data/cbhpm_codes.json';
  // Por enquanto, usando dados mock até o arquivo JSON ser criado
  const cbhpmCodes = cbhpmCodesData.map(item => ({
    codigo: item.codigo,
    procedimento: item.procedimento,
    porte_anestesico: item.porte_anestesico || 'N/A'
  }));

  const positionOptions = [
    'Decúbito Dorsal',
    'Decúbito Ventral', 
    'Decúbito Lateral direito',
    'Decúbito Lateral esquerdo',
    'Trendelenburg',
    'Canivete',
    'Litotomia',
    'Cadeira de Praia'
  ];

  // Calcular idade baseado na data de nascimento
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

  // Reset form quando initialData muda
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        surgeryDate: initialData?.surgeryDate || '',
        surgeryTime: initialData?.surgeryTime || '',
        hospital: typeof initialData?.hospital === 'string' ? initialData.hospital : initialData?.hospital?.name || '',
        proposedSurgery: initialData?.proposedSurgery || '',
        performedSurgery: initialData?.performedSurgery || '',
        cbhpmProcedures: initialData?.cbhpmProcedures || [{ codigo: '', procedimento: '', porte_anestesico: '' }],
        patientName: initialData?.patientName || '',
        patientBirthDate: initialData?.patientBirthDate || '',
        patientSex: initialData?.patientSex || '',
        patientWeight: initialData?.patientWeight || '',
        patientCNS: initialData?.patientCNS || '',
        hospitalRecord: initialData?.hospitalRecord || '',
        insuranceNumber: initialData?.insuranceNumber || '',
        insuranceName: initialData?.insuranceName || '',
        mainSurgeon: initialData?.mainSurgeon || '',
        auxiliarySurgeons: initialData?.auxiliarySurgeons || [{ name: '' }],
        patientPosition: initialData?.patientPosition || ''
      });
    }
  }, [initialData, reset]);

  // Função para adicionar novo procedimento CBHPM
  const addCbhpmProcedure = () => {
    appendCbhpm({ codigo: '', procedimento: '', porte_anestesico: '' });
  };

  // Função para adicionar novo cirurgião auxiliar
  const addAuxiliarySurgeon = () => {
    appendSurgeon({ name: '' });
  };

  // Função para autocompletar CBHPM
  const handleCbhpmChange = (index, value) => {
    const selectedProcedure = cbhpmCodes.find(item => 
      value.startsWith(item.codigo) || value.includes(item.procedimento)
    );
    
    if (selectedProcedure) {
      setValue(`cbhpmProcedures.${index}.codigo`, selectedProcedure.codigo);
      setValue(`cbhpmProcedures.${index}.procedimento`, selectedProcedure.procedimento);
      setValue(`cbhpmProcedures.${index}.porte_anestesico`, selectedProcedure.porte_anestesico);
      
      // Trigger AutoSave com delay para garantir que setValue foi processado
      if (mode === 'edit' && onAutoSave) {
        setTimeout(() => {
          const currentData = watch();
          onAutoSave(currentData);
        }, 100);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Título opcional */}
      {showTitle && (
        <div className="flex items-center mb-6">
          <Calendar className="h-6 w-6 text-primary-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Editando Dados da Cirurgia' : 'Dados da Cirurgia'}
            </h2>
            <p className="text-sm text-gray-600">
              Tipo: {surgeryType === 'sus' ? 'SUS' : surgeryType === 'convenio' ? 'Convênio' : 'A definir'}
            </p>
          </div>
        </div>
      )}

      {/* Dados básicos da cirurgia */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Básicos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data */}
          <div>
            <label className="label">Data da Cirurgia *</label>
            <input
              type="date"
              className="input-field"
              {...register('surgeryDate', {
                required: 'Data é obrigatória'
              })}
            />
            {errors.surgeryDate && (
              <p className="error-text">{errors.surgeryDate.message}</p>
            )}
          </div>

          {/* Hora */}
          <div>
            <label className="label">Horário de Início *</label>
            <input
              type="time"
              className="input-field"
              {...register('surgeryTime', {
                required: 'Horário é obrigatório'
              })}
            />
            {errors.surgeryTime && (
              <p className="error-text">{errors.surgeryTime.message}</p>
            )}
          </div>
        </div>

        {/* Hospital */}
        <div className="mt-6">
          <label className="label">Hospital *</label>
          {surgeryType === 'sus' ? (
            <select
              className="input-field"
              {...register('hospital', {
                required: 'Hospital é obrigatório'
              })}
            >
              <option value="">Selecione o hospital</option>
              {susHospitals.map((hospital) => (
                <option key={hospital.id} value={JSON.stringify(hospital)}>
                  {hospital.shortName}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="input-field"
              placeholder="Nome do hospital ou clínica"
              {...register('hospital', {
                required: 'Hospital é obrigatório'
              })}
            />
          )}
          {errors.hospital && (
            <p className="error-text">{errors.hospital.message}</p>
          )}
        </div>

        {/* Procedimentos baseado no tipo */}
        {surgeryType === 'sus' && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Procedimentos SUS</h4>
            <div>
              <label className="label">Cirurgia Proposta *</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Descreva o procedimento inicialmente planejado"
                {...register('proposedSurgery', {
                  required: 'Cirurgia proposta é obrigatória'
                })}
              />
              {errors.proposedSurgery && (
                <p className="error-text">{errors.proposedSurgery.message}</p>
              )}
            </div>

            <div>
              <label className="label">Cirurgia Realizada</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Descreva o procedimento efetivamente realizado"
                {...register('performedSurgery')}
              />
              <p className="text-xs text-gray-500 mt-1">
                Pode ser preenchido durante ou após o procedimento.
              </p>
            </div>
          </div>
        )}

        {surgeryType === 'convenio' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Procedimentos CBHPM</h4>
              <button
                type="button"
                onClick={addCbhpmProcedure}
                className="btn-secondary flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Procedimento
              </button>
            </div>
            
            <div className="space-y-4">
              {cbhpmFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <label className="label">
                        Código e Procedimento {index === 0 ? '*' : ''}
                      </label>
                      <input
  type="text"
  className="input-field"
  placeholder="Digite código ou nome do procedimento..."
  list={`cbhpm-options-${index}`}
  {...register(`cbhpmProcedures.${index}.codigo`, {
    required: index === 0 ? 'Pelo menos um procedimento é obrigatório' : false,
    onBlur: (e) => handleCbhpmChange(index, e.target.value) // Detecta quando sai do campo
  })}
/>
                      <datalist id={`cbhpm-options-${index}`}>
                        {cbhpmCodes.map((item) => (
                          <option key={item.codigo} value={`${item.codigo} - ${item.procedimento}`} />
                        ))}
                      </datalist>
                      
                      {/* Erro de validação */}
                      {errors.cbhpmProcedures?.[index]?.codigo && (
                        <p className="error-text">{errors.cbhpmProcedures[index].codigo.message}</p>
                      )}
                      
                      {/* Mostrar procedimento selecionado */}
                      {watch(`cbhpmProcedures.${index}.procedimento`) && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800">
                                ✓ {watch(`cbhpmProcedures.${index}.codigo`)} - {watch(`cbhpmProcedures.${index}.procedimento`)}
                              </p>
                              <p className="text-xs text-green-600">
                                Porte Anestésico: {watch(`cbhpmProcedures.${index}.porte_anestesico`)}
                              </p>
                            </div>
                            {mode === 'edit' && (
                              <div className="text-xs text-green-600 font-medium">
                                Salvo automaticamente
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Campos hidden para garantir envio dos dados */}
                      <input
                        type="hidden"
                        {...register(`cbhpmProcedures.${index}.procedimento`)}
                      />
                      <input
                        type="hidden"
                        {...register(`cbhpmProcedures.${index}.porte_anestesico`)}
                      />
                    </div>
                    
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeCbhpm(index)}
                        className="mt-7 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dados do paciente */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Dados do Paciente</h3>
        </div>

        {/* Nome e Sexo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="label">Nome Completo do Paciente *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Nome completo do paciente"
              {...register('patientName', {
                required: 'Nome é obrigatório'
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

        {/* Data de nascimento e Peso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="label">Data de Nascimento *</label>
            <input
              type="date"
              className="input-field"
              {...register('patientBirthDate', {
                required: 'Data de nascimento é obrigatória'
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
        </div>

        {/* Campos específicos por tipo */}
        {surgeryType === 'sus' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">CNS (Cartão Nacional de Saúde) *</label>
              <input
                type="text"
                maxLength="18"
                className="input-field"
                placeholder="123 4567 8901 2345"
                {...register('patientCNS', {
                  required: 'CNS é obrigatório'
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
              <label className="label">Registro do Hospital *</label>
              <input
                type="text"
                className="input-field"
                placeholder="12345"
                {...register('hospitalRecord', {
                  required: 'Registro do hospital é obrigatório'
                })}
              />
              {errors.hospitalRecord && (
                <p className="error-text">{errors.hospitalRecord.message}</p>
              )}
            </div>
          </div>
        )}

        {surgeryType === 'convenio' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Matrícula do Convênio *</label>
              <input
                type="text"
                className="input-field"
                placeholder="123456789"
                {...register('insuranceNumber', {
                  required: 'Matrícula do convênio é obrigatória'
                })}
              />
              {errors.insuranceNumber && (
                <p className="error-text">{errors.insuranceNumber.message}</p>
              )}
            </div>

            <div>
              <label className="label">Nome do Convênio *</label>
              <select
                className="input-field"
                {...register('insuranceName', {
                  required: 'Nome do convênio é obrigatório'
                })}
              >
                <option value="">Selecione o convênio</option>
                <option value="Unimed">Unimed</option>
                <option value="Bradesco">Bradesco</option>
                <option value="Amil">Amil</option>
                <option value="Sulamerica">SulAmérica</option>
                <option value="ASSEFAZ">ASSEFAZ</option>
                <option value="Astir">Astir</option>
                <option value="Capesesp">Capesesp</option>
                <option value="Cassi">Cassi</option>
                <option value="Funsa">Funsa</option>
                <option value="Fusex">Fusex</option>
                <option value="Geap">Geap</option>
                <option value="Ipam">Ipam</option>
                <option value="Life">Life</option>
                <option value="Saude Caixa">Saúde Caixa</option>
                <option value="Innova">Innova</option>
                <option value="Particular">Particular</option>
                <option value="outros">Outros</option>
              </select>
              {errors.insuranceName && (
                <p className="error-text">{errors.insuranceName.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Equipe cirúrgica */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Equipe Cirúrgica</h3>
        </div>

        {/* Cirurgião Principal */}
        <div className="mb-6">
          <label className="label">Cirurgião Principal *</label>
          <input
            type="text"
            className="input-field"
            placeholder="Dr. João Silva"
            {...register('mainSurgeon', {
              required: 'Cirurgião principal é obrigatório'
            })}
          />
          {errors.mainSurgeon && (
            <p className="error-text">{errors.mainSurgeon.message}</p>
          )}
        </div>

        {/* Cirurgiões Auxiliares */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="label mb-0">Cirurgiões Auxiliares</label>
            <button
              type="button"
              onClick={addAuxiliarySurgeon}
              className="btn-secondary flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Auxiliar
            </button>
          </div>
          
          <div className="space-y-3">
            {surgeonFields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Dr. Maria Santos (opcional)"
                    {...register(`auxiliarySurgeons.${index}.name`)}
                  />
                </div>
                
                {surgeonFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSurgeon(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Posicionamento */}
        <div>
          <label className="label">Posicionamento do Paciente *</label>
          <select
            className="input-field"
            {...register('patientPosition', {
              required: 'Posicionamento é obrigatório'
            })}
          >
            <option value="">Selecione o posicionamento</option>
            {positionOptions.map((position) => (
              <option key={position} value={position.toLowerCase()}>
                {position}
              </option>
            ))}
          </select>
          {errors.patientPosition && (
            <p className="error-text">{errors.patientPosition.message}</p>
          )}
        </div>
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

export default PatientFormFields;