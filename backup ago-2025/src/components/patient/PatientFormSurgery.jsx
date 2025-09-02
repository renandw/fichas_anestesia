import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Calendar,
  Users,
  Plus,
  Trash2,
  Hospital
} from 'lucide-react';
import PatientFormBase from './PatientFormBase';
import cbhpmCodesData from '../data/cbhpm_codes.json';

const PatientFormSurgery = ({ 
  initialData = {}, 
  surgeryType = 'sus', // 'sus' ou 'convenio'
  onSubmit, 
  isLoading = false,
  submitButtonText = "Criar Ficha Anestésica",
  showTitle = true,
  mode = "create",
  onPatientSearch = null,
  onPatientCreate = null,
  onPatientUpdate = null,
  onAutoSave = null
}) => {
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, control, reset } = useForm({
    defaultValues: {
      // Dados da cirurgia
      surgeryDate: initialData?.surgeryDate || '',
      surgeryTime: initialData?.surgeryTime || '',
      hospital: initialData?.hospital?.name || initialData?.hospital || '',
      proposedSurgery: initialData?.proposedSurgery || '',
      performedSurgery: initialData?.performedSurgery || '',
      cbhpmProcedures: initialData?.cbhpmProcedures || [{ codigo: '', procedimento: '', porte_anestesico: '' }],
      
      // Equipe cirúrgica
      mainSurgeon: initialData?.mainSurgeon || '',
      auxiliarySurgeons: initialData?.auxiliarySurgeons || [{ name: '' }],
      patientPosition: initialData?.patientPosition || '',
      
      // Dados do paciente (serão gerenciados pelo PatientFormBase)
      patientData: initialData?.patientData || {}
    }
  });

  // Estados
  const [patientFormData, setPatientFormData] = useState(null);
  const [showSurgeryForm, setShowSurgeryForm] = useState(false);

  // UseFieldArray para gerenciar arrays dinâmicos
  const { fields: cbhpmFields, append: appendCbhpm, remove: removeCbhpm } = useFieldArray({
    control,
    name: "cbhpmProcedures"
  });

  const { fields: surgeonFields, append: appendSurgeon, remove: removeSurgeon } = useFieldArray({
    control,
    name: "auxiliarySurgeons"
  });

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

  // CBHPM codes
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
          const currentData = { ...patientFormData, ...watch() };
          onAutoSave(currentData);
        }, 100);
      }
    }
  };

  // Handle submit do PatientFormBase
  const handlePatientSubmit = (patientResult) => {
    setPatientFormData(patientResult);
    setShowSurgeryForm(true);
  };

  // Handle submit final
  const handleFinalSubmit = (surgeryData) => {
    const completeData = {
      // Dados do paciente
      ...patientFormData,
      
      // Dados da cirurgia
      surgeryDate: surgeryData.surgeryDate,
      surgeryTime: surgeryData.surgeryTime,
      hospital: surgeryData.hospital,
      proposedSurgery: surgeryData.proposedSurgery,
      performedSurgery: surgeryData.performedSurgery,
      cbhpmProcedures: surgeryData.cbhpmProcedures,
      
      // Equipe cirúrgica
      mainSurgeon: surgeryData.mainSurgeon,
      auxiliarySurgeons: surgeryData.auxiliarySurgeons,
      patientPosition: surgeryData.patientPosition,
      
      // Metadados
      surgeryType: surgeryType,
      createdAt: new Date().toISOString()
    };

    onSubmit(completeData);
  };

  // Voltar para edição do paciente
  const backToPatientForm = () => {
    setShowSurgeryForm(false);
  };

  // Se ainda não coletou dados do paciente, mostra PatientFormBase
  if (!showSurgeryForm) {
    return (
      <PatientFormBase
        initialData={initialData?.patientData}
        formType={surgeryType}
        onSubmit={handlePatientSubmit}
        isLoading={isLoading}
        submitButtonText="Continuar para Dados da Cirurgia"
        showTitle={showTitle}
        mode={mode}
        onPatientSearch={onPatientSearch}
        onPatientCreate={onPatientCreate}
        onPatientUpdate={onPatientUpdate}
      />
    );
  }

  // Formulário de dados da cirurgia
  return (
    <div className="space-y-6">
      
      {/* Resumo do paciente */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-green-800">Paciente:</p>
            <p className="text-green-700">{patientFormData.patient?.name}</p>
            {patientFormData.insuranceChanged && (
              <p className="text-sm text-green-600">✓ Convênio atualizado</p>
            )}
          </div>
          <button
            type="button"
            onClick={backToPatientForm}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Editar dados do paciente
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-6">
        
        {/* Título */}
        {showTitle && (
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Editando Dados da Cirurgia' : 'Dados da Cirurgia'}
              </h2>
              <p className="text-sm text-gray-600">
                Tipo: {surgeryType === 'sus' ? 'SUS' : 'Convênio'}
              </p>
            </div>
          </div>
        )}

        {/* Dados básicos da cirurgia */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Hospital className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Dados Básicos</h3>
          </div>
          
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
                            onBlur: (e) => handleCbhpmChange(index, e.target.value)
                          })}
                        />
                        <datalist id={`cbhpm-options-${index}`}>
                          {cbhpmCodes.map((item) => (
                            <option key={item.codigo} value={`${item.codigo} - ${item.procedimento}`} />
                          ))}
                        </datalist>
                        
                        {errors.cbhpmProcedures?.[index]?.codigo && (
                          <p className="error-text">{errors.cbhpmProcedures[index].codigo.message}</p>
                        )}
                        
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
                        
                        <input type="hidden" {...register(`cbhpmProcedures.${index}.procedimento`)} />
                        <input type="hidden" {...register(`cbhpmProcedures.${index}.porte_anestesico`)} />
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
              style={{ textTransform: 'capitalize' }}
              {...register('mainSurgeon', {
                required: 'Cirurgião principal é obrigatório',
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                }
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
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={backToPatientForm}
            className="btn-secondary"
          >
            ← Voltar aos dados do paciente
          </button>
          
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
    </div>
  );
};

export default PatientFormSurgery;