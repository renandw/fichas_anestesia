import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Heart,
  AlarmCheckIcon,
  Zap,
  Baby,
  AlertTriangle,
  Save,
  Check,
  X,
  Stethoscope
} from 'lucide-react';
import PatientFormBase from './PatientFormBase';

const PatientFormPreAnesthetic = ({ 
  initialData = {}, 
  surgeryType = 'sus', // 'sus' ou 'convenio'
  onSubmit, 
  isLoading = false,
  submitButtonText = "Salvar Avaliação Pré-Anestésica",
  showTitle = true,
  mode = "create",
  onPatientSearch = null,
  onPatientCreate = null,
  onPatientUpdate = null
}) => {
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      // Informações especiais
      isPregnant: initialData?.isPregnant || false,
      pregnancyWeeks: initialData?.pregnancyWeeks || '',
      pregnancyComorbidities: initialData?.pregnancyComorbidities || {},
      pregnancyConsiderations: initialData?.pregnancyConsiderations || {},
      pregnancyOther: initialData?.pregnancyOther || '',
      
      isInfant: initialData?.isInfant || false,
      infantMonths: initialData?.infantMonths || '',
      pediatricConsiderations: initialData?.pediatricConsiderations || {},
      pediatricOther: initialData?.pediatricOther || '',

      // Comorbidades por sistema
      cardiovascular: initialData?.cardiovascular || {},
      cardiovascularOther: initialData?.cardiovascularOther || '',
      respiratory: initialData?.respiratory || {},
      respiratoryOther: initialData?.respiratoryOther || '',
      endocrine: initialData?.endocrine || {},
      endocrineOther: initialData?.endocrineOther || '',
      digestive: initialData?.digestive || {},
      digestiveOther: initialData?.digestiveOther || '',
      hematologic: initialData?.hematologic || {},
      hematologicOther: initialData?.hematologicOther || '',
      musculoskeletal: initialData?.musculoskeletal || {},
      musculoskeletalOther: initialData?.musculoskeletalOther || '',
      genitourinary: initialData?.genitourinary || {},
      genitourinaryOther: initialData?.genitourinaryOther || '',
      neurologic: initialData?.neurologic || {},
      neurologicOther: initialData?.neurologicOther || '',
      geneticSyndromes: initialData?.geneticSyndromes || {},
      geneticSyndromeOther: initialData?.geneticSyndromeOther || '',

      // Histórico
      noPreviousSurgeries: initialData?.noPreviousSurgeries || false,
      previousSurgeries: initialData?.previousSurgeries || '',
      noAnestheticComplications: initialData?.noAnestheticComplications || false,
      anestheticComplications: initialData?.anestheticComplications || '',

      // Medicamentos e alergias
      currentMedications: initialData?.currentMedications || '',
      noAllergies: initialData?.noAllergies || false,
      allergies: initialData?.allergies || '',

      // ASA
      asaClassification: initialData?.asaClassification || '',

      // Via aérea
      mallampati: initialData?.mallampati || '',
      airwayFindings: initialData?.airwayFindings || {},
      airwayOther: initialData?.airwayOther || '',

      // Exame físico
      physicalExam: initialData?.physicalExam || 'Sem alterações dignas de nota',

      // Exames complementares
      labResults: initialData?.labResults || {},
      otherLabResults: initialData?.otherLabResults || '',
      ecgStatus: initialData?.ecgStatus || '',
      ecgAbnormal: initialData?.ecgAbnormal || '',
      chestXrayStatus: initialData?.chestXrayStatus || '',
      chestXrayAbnormal: initialData?.chestXrayAbnormal || '',
      otherExams: initialData?.otherExams || '',

      // Técnica anestésica
      anestheticTechnique: initialData?.anestheticTechnique || {},
      combinedTechnique: initialData?.combinedTechnique || '',

      // Procedimento planejado
      plannedProcedure: initialData?.plannedProcedure || '',
      estimatedDuration: initialData?.estimatedDuration || '',
      urgencyLevel: initialData?.urgencyLevel || '',

      // Liberação
      clearanceStatus: initialData?.clearanceStatus || '',
      clearanceRestrictions: initialData?.clearanceRestrictions || '',
      notClearedReason: initialData?.notClearedReason || ''
    }
  });

  // Estados
  const [patientFormData, setPatientFormData] = useState(null);
  const [showPreAnestheticForm, setShowPreAnestheticForm] = useState(false);

  // Watch para valores que afetam a exibição
  const watchIsPregnant = watch('isPregnant');
  const watchIsInfant = watch('isInfant');
  const watchNoAllergies = watch('noAllergies');
  const watchClearanceStatus = watch('clearanceStatus');

  // Handle submit do PatientFormBase
  const handlePatientSubmit = (patientResult) => {
    setPatientFormData(patientResult);
    setShowPreAnestheticForm(true);
  };

  // Handle submit final
  const handleFinalSubmit = (preAnestheticData) => {
    const completeData = {
      // Dados do paciente
      ...patientFormData,
      
      // Dados da avaliação pré-anestésica
      preAnestheticEvaluation: {
        ...preAnestheticData,
        evaluationDate: new Date().toISOString(),
        evaluatedBy: 'Anestesiologista' // Poderia vir do contexto do usuário
      },
      
      // Metadados
      type: 'preAnesthetic',
      surgeryType: surgeryType,
      createdAt: new Date().toISOString()
    };

    onSubmit(completeData);
  };

  // Voltar para edição do paciente
  const backToPatientForm = () => {
    setShowPreAnestheticForm(false);
  };

  // Função para marcar "paciente hígido"
  const markHealthyPatient = () => {
    const healthyDefaults = {
      cardiovascular: { none: true },
      respiratory: { none: true },
      endocrine: { none: true },
      digestive: { none: true },
      hematologic: { none: true },
      musculoskeletal: { none: true },
      genitourinary: { none: true },
      neurologic: { none: true },
      geneticSyndromes: { none: true },
      noPreviousSurgeries: true,
      noAnestheticComplications: true,
      noAllergies: true,
      asaClassification: 'I',
      physicalExam: 'Sem alterações dignas de nota',
      airwayFindings: { none: true },
      clearanceStatus: 'cleared'
    };

    Object.keys(healthyDefaults).forEach(key => {
      setValue(key, healthyDefaults[key]);
    });
  };

  // Se ainda não coletou dados do paciente, mostra PatientFormBase
  if (!showPreAnestheticForm) {
    return (
      <PatientFormBase
        initialData={initialData?.patientData}
        formType={surgeryType}
        onSubmit={handlePatientSubmit}
        isLoading={isLoading}
        submitButtonText="Continuar para Avaliação Pré-Anestésica"
        showTitle={showTitle}
        mode={mode}
        onPatientSearch={onPatientSearch}
        onPatientCreate={onPatientCreate}
        onPatientUpdate={onPatientUpdate}
      />
    );
  }

  // Formulário de avaliação pré-anestésica
  return (
    <div className="space-y-6">
      
      {/* Resumo do paciente */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-green-800">Paciente:</p>
            <p className="text-green-700">{patientFormData.patient?.name}</p>
            <p className="text-sm text-green-600">
              {patientFormData.patient?.sex}, {patientFormData.patient?.weight}kg
            </p>
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
            <Stethoscope className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Editando Avaliação Pré-Anestésica' : 'Avaliação Pré-Anestésica'}
              </h2>
              <p className="text-sm text-gray-600">
                Tipo: {surgeryType === 'sus' ? 'SUS' : 'Convênio'}
              </p>
            </div>
          </div>
        )}

        {/* Botão paciente hígido */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={markHealthyPatient}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Heart className="h-4 w-4 mr-2" />
            Marcar Paciente Hígido
          </button>
        </div>

        {/* 1. Procedimento Planejado */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Procedimento Planejado</h4>
          
          <div className="space-y-4">
            <div>
              <label className="label">Procedimento *</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Descreva o procedimento a ser realizado..."
                {...register('plannedProcedure', {
                  required: 'Procedimento planejado é obrigatório'
                })}
              />
              {errors.plannedProcedure && (
                <p className="error-text">{errors.plannedProcedure.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Duração Estimada</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: 2 horas"
                  {...register('estimatedDuration')}
                />
              </div>

              <div>
                <label className="label">Urgência</label>
                <select
                  className="input-field"
                  {...register('urgencyLevel')}
                >
                  <option value="">Selecione</option>
                  <option value="eletiva">Eletiva</option>
                  <option value="urgencia">Urgência</option>
                  <option value="emergencia">Emergência</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Informações Especiais */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Baby className="h-5 w-5 text-primary-600 mr-2" />
            Informações Especiais
          </h4>
          
          <div className="space-y-4">
            {/* Gestação */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPregnant"
                className="rounded border-gray-300"
                {...register('isPregnant')}
              />
              <label htmlFor="isPregnant" className="font-medium">Gestante</label>
              {watchIsPregnant && (
                <input
                  type="number"
                  min="1"
                  max="42"
                  placeholder="Semanas IG"
                  className="input-field w-24"
                  {...register('pregnancyWeeks')}
                />
              )}
            </div>

            {/* Seção gestacional expandida */}
            {watchIsPregnant && (
              <div className="ml-6 pl-4 border-l-2 border-pink-200 space-y-4">
                <div>
                  <h5 className="font-medium text-pink-800 mb-2">Comorbidades Gestacionais</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.none')} />
                      Sem comorbidades gestacionais
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.preeclampsia')} />
                      Pré-eclâmpsia
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.gestationalDm')} />
                      Diabetes gestacional
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.gestationalHtn')} />
                      Hipertensão gestacional
                    </label>
                  </div>
                  <textarea
                    placeholder="Outras comorbidades..."
                    className="input-field mt-2"
                    rows="2"
                    {...register('pregnancyOther')}
                  />
                </div>

                <div>
                  <h5 className="font-medium text-pink-800 mb-2">Peculiaridades</h5>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyConsiderations.reducedFasting')} />
                      Jejum reduzido (risco aspiração)
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyConsiderations.difficultIntubation')} />
                      Dificuldade de IOT (edema VA)
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyConsiderations.supineHypotension')} />
                      Hipotensão supina
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Criança < 1 ano */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isInfant"
                className="rounded border-gray-300"
                {...register('isInfant')}
              />
              <label htmlFor="isInfant" className="font-medium">Criança &lt; 1 ano</label>
              {watchIsInfant && (
                <input
                  type="number"
                  min="0"
                  max="12"
                  placeholder="Meses"
                  className="input-field w-24"
                  {...register('infantMonths')}
                />
              )}
            </div>

            {/* Seção pediátrica expandida */}
            {watchIsInfant && (
              <div className="ml-6 pl-4 border-l-2 border-blue-200 space-y-4">
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Considerações Pediátricas</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.premature')} />
                      Prematuro
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.lowBirthWeight')} />
                      Baixo peso ao nascer
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.congenitalHeart')} />
                      Cardiopatia congênita
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.geneticSyndrome')} />
                      Síndrome genética
                    </label>
                  </div>
                  <textarea
                    placeholder="Outras considerações..."
                    className="input-field mt-2"
                    rows="2"
                    {...register('pediatricOther')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Comorbidades Resumidas */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Heart className="h-5 w-5 text-primary-600 mr-2" />
            Comorbidades Principais
          </h4>
          
          <div className="space-y-4">
            {/* Cardiovascular */}
            <div>
              <h5 className="font-medium text-red-700 mb-2">Cardiovascular</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('cardiovascular.none')} />
                  <span className="font-medium">Sem doença cardiovascular</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('cardiovascular.hypertension')} />
                  HAS
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('cardiovascular.heartFailure')} />
                  ICC
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('cardiovascular.coronaryDisease')} />
                  DAC
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('cardiovascular.arrhythmias')} />
                  Arritmias
                </label>
              </div>
              <input
                type="text"
                placeholder="Outras..."
                className="input-field mt-2"
                {...register('cardiovascularOther')}
              />
            </div>

            {/* Respiratório */}
            <div>
              <h5 className="font-medium text-blue-700 mb-2">Respiratório</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('respiratory.none')} />
                  <span className="font-medium">Sem doença respiratória</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('respiratory.asthma')} />
                  Asma
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('respiratory.copd')} />
                  DPOC
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('respiratory.smoking')} />
                  Tabagismo
                </label>
              </div>
              <input
                type="text"
                placeholder="Outras..."
                className="input-field mt-2"
                {...register('respiratoryOther')}
              />
            </div>

            {/* Endócrino */}
            <div>
              <h5 className="font-medium text-green-700 mb-2">Endócrino</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('endocrine.none')} />
                  <span className="font-medium">Sem doença endócrina</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('endocrine.diabetes')} />
                  DM
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('endocrine.hypothyroid')} />
                  Hipotireoidismo
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('endocrine.obesity')} />
                  Obesidade
                </label>
              </div>
              <input
                type="text"
                placeholder="Outras..."
                className="input-field mt-2"
                {...register('endocrineOther')}
              />
            </div>
          </div>
        </div>

        {/* 4. Medicamentos e Alergias */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Medicamentos e Alergias</h4>
          
          <div className="space-y-4">
            <div>
              <label className="label">Medicamentos em Uso</label>
              <textarea
                placeholder="Listar medicamentos atuais..."
                className="input-field"
                rows="3"
                {...register('currentMedications')}
              />
            </div>

            <div>
              <label className="flex items-center text-sm mb-2">
                <input type="checkbox" className="mr-2" {...register('noAllergies')} />
                <span className="font-medium">Sem alergias conhecidas</span>
              </label>
              {!watchNoAllergies && (
                <textarea
                  placeholder="Medicamentos, alimentos, látex, etc..."
                  className="input-field"
                  rows="2"
                  {...register('allergies')}
                />
              )}
            </div>
          </div>
        </div>

        {/* 5. ASA */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Classificação ASA</h4>
          
          <div className="flex flex-wrap gap-4">
            {['I', 'II', 'III', 'IV', 'V'].map((asa) => (
              <label key={asa} className="flex items-center">
                <input
                  type="radio"
                  value={asa}
                  className="mr-2"
                  {...register('asaClassification', { required: 'ASA é obrigatório' })}
                />
                <span className="font-medium">ASA {asa}</span>
              </label>
            ))}
          </div>
          {errors.asaClassification && (
            <p className="error-text mt-2">{errors.asaClassification.message}</p>
          )}
        </div>

        {/* 6. Via Aérea */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <AlarmCheckIcon className="h-5 w-5 text-primary-600 mr-2" />
            Via Aérea
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="label">Mallampati</label>
              <div className="flex gap-4">
                {['I', 'II', 'III', 'IV'].map((grade) => (
                  <label key={grade} className="flex items-center">
                    <input
                      type="radio"
                      value={grade}
                      className="mr-2"
                      {...register('mallampati')}
                    />
                    <span>{grade}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.none')} />
                <span className="font-medium">Sem alterações</span>
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.mouthOpening')} />
                Abertura bucal limitada
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.neckLimitation')} />
                Limitação cervical
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.looseTeeth')} />
                Dentes soltos
              </label>
            </div>

            <textarea
              placeholder="Outras alterações da via aérea..."
              className="input-field"
              rows="2"
              {...register('airwayOther')}
            />
          </div>
        </div>

        {/* 7. Exames Laboratoriais Principais */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Exames Laboratoriais</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label text-sm">Hb (g/dL)</label>
              <input
                type="text"
                className="input-field"
                placeholder="12.5"
                {...register('labResults.hemoglobin')}
              />
            </div>
            <div>
              <label className="label text-sm">Ht (%)</label>
              <input
                type="text"
                className="input-field"
                placeholder="37"
                {...register('labResults.hematocrit')}
              />
            </div>
            <div>
              <label className="label text-sm">Glicemia (mg/dL)</label>
              <input
                type="number"
                className="input-field"
                placeholder="90"
                {...register('labResults.glucose')}
              />
            </div>
            <div>
              <label className="label text-sm">Creatinina (mg/dL)</label>
              <input
                type="text"
                className="input-field"
                placeholder="1.0"
                {...register('labResults.creatinine')}
              />
            </div>
          </div>
          
          <textarea
            placeholder="Outros exames laboratoriais..."
            className="input-field mt-4"
            rows="2"
            {...register('otherLabResults')}
          />
        </div>

        {/* 8. Técnica Anestésica Proposta */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 text-primary-600 mr-2" />
            Técnica Anestésica Proposta
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.generalBalanced')} />
              Geral balanceada
            </label>
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.generalIv')} />
              Geral venosa
            </label>
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.spinal')} />
              Raquianestesia
            </label>
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.epidural')} />
              Peridural
            </label>
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.plexusBlock')} />
              Bloqueio de plexo
            </label>
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.sedation')} />
              Sedação
            </label>
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.local')} />
              Local
            </label>
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('anestheticTechnique.combined')} />
              Combinada
            </label>
          </div>

          {watch('anestheticTechnique.combined') && (
            <textarea
              placeholder="Especificar técnica combinada..."
              className="input-field mt-3"
              rows="2"
              {...register('combinedTechnique')}
            />
          )}
        </div>

        {/* 9. Liberação */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Liberação para Anestesia</h4>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cleared"
                  className="mr-2"
                  {...register('clearanceStatus', { required: 'Status de liberação é obrigatório' })}
                />
                <span className="font-medium text-green-700 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Liberado sem ressalvas
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="cleared_with_restrictions"
                  className="mr-2"
                  {...register('clearanceStatus')}
                />
                <span className="font-medium text-yellow-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Liberado com ressalvas
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="not_cleared"
                  className="mr-2"
                  {...register('clearanceStatus')}
                />
                <span className="font-medium text-red-700 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  Não liberado
                </span>
              </label>
            </div>

            {watchClearanceStatus === 'cleared_with_restrictions' && (
              <textarea
                placeholder="Especificar ressalvas (ex: monitorização adicional, cuidados especiais)..."
                className="input-field"
                rows="3"
                {...register('clearanceRestrictions', {
                  required: 'Ressalvas são obrigatórias quando liberado com restrições'
                })}
              />
            )}

            {watchClearanceStatus === 'not_cleared' && (
              <textarea
                placeholder="Motivo da não liberação (ex: necessita otimização clínica, exames adicionais)..."
                className="input-field"
                rows="3"
                {...register('notClearedReason', {
                  required: 'Motivo é obrigatório quando não liberado'
                })}
              />
            )}

            {errors.clearanceStatus && (
              <p className="error-text">{errors.clearanceStatus.message}</p>
            )}
            {errors.clearanceRestrictions && (
              <p className="error-text">{errors.clearanceRestrictions.message}</p>
            )}
            {errors.notClearedReason && (
              <p className="error-text">{errors.notClearedReason.message}</p>
            )}
          </div>
        </div>

        {/* Status visual da liberação */}
        {watchClearanceStatus && (
          <div
            className={`p-4 rounded-lg border-2 ${
              watchClearanceStatus === 'cleared'
                ? 'bg-green-50 border-green-200'
                : watchClearanceStatus === 'cleared_with_restrictions'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center">
              {watchClearanceStatus === 'cleared' && (
                <Check className="h-5 w-5 text-green-600 mr-2" />
              )}
              {watchClearanceStatus === 'cleared_with_restrictions' && (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              )}
              {watchClearanceStatus === 'not_cleared' && (
                <X className="h-5 w-5 text-red-600 mr-2" />
              )}
              <div>
                <p className="font-medium">
                  {watchClearanceStatus === 'cleared' && 'Paciente liberado para anestesia'}
                  {watchClearanceStatus === 'cleared_with_restrictions' && 'Paciente liberado com ressalvas'}
                  {watchClearanceStatus === 'not_cleared' && 'Paciente não liberado para anestesia'}
                </p>
                <p className="text-sm text-gray-600">
                  Esta avaliação será registrada no prontuário do paciente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de ação */}
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
              <>
                <Save className="h-4 w-4 mr-2" />
                {submitButtonText}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientFormPreAnesthetic;