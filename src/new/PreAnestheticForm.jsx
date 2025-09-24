// src/components/PreAnestheticForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Heart,
  AlarmCheck,
  Zap,
  User,
  Baby,
  AlertTriangle,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  createPreAnesthesia, 
  updatePreAnesthesia, 
  getSurgeryPreAnesthesia 
} from '../services/anesthesiaService';

const PreAnestheticForm = ({ 
  patientId, 
  surgeryId, 
  onCancel,
  onSuccess,
  initialData = null
}) => {
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [preAnesthesia, setPreAnesthesia] = useState(initialData);
  const [preAnesthesiaId, setPreAnesthesiaId] = useState(initialData?.id || null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const { currentUserId } = useAuth();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      // Informações especiais
      isPregnant: false,
      pregnancyWeeks: '',
      pregnancyComorbidities: {},
      pregnancyConsiderations: {},
      pregnancyOther: '',
      
      isInfant: false,
      infantMonths: '',
      pediatricConsiderations: {},
      pediatricOther: '',

      // Comorbidades por sistema
      cardiovascular: {
        cardiovascularOther: ''
      },
      respiratory: {
        respiratoryOther: ''
      },
      endocrine: {
        endocrineOther: ''
      },
      digestive: {
        digestiveOther: '',
      },
      hematologic: {
        hematologicOther: '',
      },
      musculoskeletal: {
        musculoskeletalOther: '',
      },
      genitourinary: {
        genitourinaryOther: '',
      },
      neurologic: {
        neurologicOther: '',
      },
      geneticSyndromes: {
        geneticSyndromeOther: '',
      },
      

      // Histórico
      noPreviousSurgeries: false,
      previousSurgeries: '',
      noAnestheticComplications: false,
      anestheticComplications: '',

      // Medicamentos e alergias
      currentMedications: '',
      noAllergies: false,
      allergies: '',

      // ASA
      asaClassification: '',

      // Via aérea
      mallampati: '',
      airwayFindings: {},
      airwayOther: '',

      // Exame físico
      physicalExam: 'Sem alterações dignas de nota',

      // Exames complementares
      labResults: {},
      otherLabResults: '',
      ecgStatus: '',
      ecgAbnormal: '',
      chestXrayStatus: '',
      chestXrayAbnormal: '',
      otherExams: '',

      // Técnica anestésica
      anestheticTechnique: {},
      combinedTechnique: '',

      // Liberação
      clearanceStatus: '',
      clearanceRestrictions: '',
      notClearedReason: ''
    }
  });

  // Watch para valores que afetam a exibição
  const watchIsPregnant = watch('isPregnant');
  const watchIsInfant = watch('isInfant');
  const watchNoAllergies = watch('noAllergies');
  const watchClearanceStatus = watch('clearanceStatus');
  const watchEcgStatus = watch('ecgStatus');
  const watchChestXrayStatus = watch('chestXrayStatus');
  const watchAnestheticTechnique = watch('anestheticTechnique');

  // Carregar dados existentes
  const loadPreAnesthesia = useCallback(async () => {
    if (!patientId || !surgeryId || initialData) return;

    try {
      setIsLoading(true);
      const data = await getSurgeryPreAnesthesia(patientId, surgeryId);
      
      if (data) {
        setPreAnesthesia(data);
        
        // Resetar form com dados existentes
        reset({
          isPregnant: data.isPregnant || false,
          pregnancyWeeks: data.pregnancyWeeks || '',
          pregnancyComorbidities: data.pregnancyComorbidities || {},
          pregnancyConsiderations: data.pregnancyConsiderations || {},
          pregnancyOther: data.pregnancyOther || '',
          
          isInfant: data.isInfant || false,
          infantMonths: data.infantMonths || '',
          pediatricConsiderations: data.pediatricConsiderations || {},
          pediatricOther: data.pediatricOther || '',

          cardiovascular: {
            ...data.cardiovascular,
            cardiovascularOther: data.cardiovascular?.cardiovascularOther ?? ''
          },

          respiratory: {
            ...data.respiratory,
            respiratoryOther: data.respiratory?.respiratoryOther ?? ''
          },

          endocrine: {
            ...data.endocrine,
            endocrineOther: data.endocrine?.endocrineOther ?? ''
          },

          digestive: {
            ...data.digestive,
            digestiveOther: data.digestive?.digestiveOther ?? ''
          },

          hematologic: {
            ...data.hematologic,
            hematologicOther: data.hematologic?.hematologicOther ?? ''
          },

          musculoskeletal: {
            ...data.musculoskeletal,
            musculoskeletalOther: data.musculoskeletal?.musculoskeletalOther ?? ''
          },

          genitourinary: {
            ...data.genitourinary,
            genitourinaryOther: data.genitourinary?.genitourinaryOther ?? ''
          },

          neurologic: {
            ...data.neurologic,
            neurologicOther: data.neurologic?.neurologicOther ?? ''
          },

          geneticSyndromes: {
            ...data.geneticSyndromes,
            geneticSyndromeOther: data.geneticSyndromes?.geneticSyndromeOther ?? ''
          },

          noPreviousSurgeries: data.noPreviousSurgeries || false,
          previousSurgeries: data.previousSurgeries || '',
          noAnestheticComplications: data.noAnestheticComplications || false,
          anestheticComplications: data.anestheticComplications || '',

          currentMedications: data.currentMedications || '',
          noAllergies: data.noAllergies || false,
          allergies: data.allergies || '',

          asaClassification: data.asaClassification || '',

          mallampati: data.mallampati || '',
          airwayFindings: data.airwayFindings || {},
          airwayOther: data.airwayOther || '',

          physicalExam: data.physicalExam || 'Sem alterações dignas de nota',

          labResults: data.labResults || {},
          otherLabResults: data.otherLabResults || '',
          ecgStatus: data.ecgStatus || '',
          ecgAbnormal: data.ecgAbnormal || '',
          chestXrayStatus: data.chestXrayStatus || '',
          chestXrayAbnormal: data.chestXrayAbnormal || '',
          otherExams: data.otherExams || '',

          anestheticTechnique: data.anestheticTechnique || {},
          combinedTechnique: data.combinedTechnique || '',

          clearanceStatus: data.clearanceStatus || '',
          clearanceRestrictions: data.clearanceRestrictions || '',
          notClearedReason: data.notClearedReason || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar pré-anestésica:', error);
      toast.error('Erro ao carregar dados da avaliação');
    } finally {
      setIsLoading(false);
    }
  }, [patientId, surgeryId, initialData, reset]);

  useEffect(() => {
    loadPreAnesthesia();
  }, [loadPreAnesthesia]);


  const handleSave = async (data) => {
    if (!currentUserId || !patientId || !surgeryId) {
      toast.error('Dados de autenticação ou identificação inválidos');
      return;
    }

    setIsSaving(true);
    try {
      let result;
      
      if (preAnesthesiaId) {
        // Atualizar existente usando ID salvo
        await updatePreAnesthesia(patientId, surgeryId, preAnesthesiaId, data, currentUserId);
        result = { ...preAnesthesia, ...data };
        console.log('✅ Pré-anestésica atualizada (manual):', preAnesthesiaId);
      } else {
        // Verificar se já existe antes de criar
        const existing = await getSurgeryPreAnesthesia(patientId, surgeryId);
        
        if (existing?.id) {
          // Já existe, atualizar
          await updatePreAnesthesia(patientId, surgeryId, existing.id, data, currentUserId);
          result = { ...existing, ...data };
          setPreAnesthesiaId(existing.id);
          console.log('✅ Pré-anestésica encontrada e atualizada (manual):', existing.id);
        } else {
          // Criar novo
          result = await createPreAnesthesia(patientId, surgeryId, data, currentUserId);
          setPreAnesthesiaId(result.id);
          console.log('✅ Nova pré-anestésica criada (manual):', result.id);
        }
      }
      
      setPreAnesthesia(result);
      
      toast.success('Avaliação pré-anestésica salva com sucesso!');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
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
      clearanceStatus: 'cleared'
    };

    Object.keys(healthyDefaults).forEach(key => {
      setValue(key, healthyDefaults[key]);
    });

    toast.success('Paciente hígido marcado!');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Carregando Avaliação Pré-Anestésica...</h3>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {preAnesthesia ? 'Editar' : 'Criar'} Avaliação Pré-Anestésica
          </h3>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markHealthyPatient}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <Heart className="h-4 w-4" />
            Paciente Hígido
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        {/* 1. Informações Especiais */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Baby className="h-5 w-5 text-blue-600 mr-2" />
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
                  className="px-3 py-1 border border-gray-300 rounded-lg w-24 text-sm"
                  {...register('pregnancyWeeks')}
                />
              )}
            </div>

            {/* Seção gestacional expandida */}
            {watchIsPregnant && (
              <div className="ml-6 pl-4 border-l-2 border-pink-200 space-y-4">
                <div>
                  <h5 className="font-medium text-pink-800 mb-2">Comorbidades Gestacionais</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.none')} />
                      Sem comorbidades gestacionais
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.preeclampsia')} />
                      Pré-eclâmpsia
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.gestationalDm')} />
                      Diabetes gestacional
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.gestationalHtn')} />
                      Hipertensão gestacional
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.placentaPrevia')} />
                      Placenta prévia
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.prematureLabor')} />
                      Trabalho de parto prematuro
                    </label>
                  </div>
                  <textarea
                    placeholder="Outras comorbidades..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
                    rows="2"
                    {...register('pregnancyOther')}
                  />
                </div>

                <div>
                  <h5 className="font-medium text-pink-800 mb-2">Peculiaridades</h5>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyConsiderations.reducedFasting')} />
                      Jejum reduzido (risco aspiração)
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pregnancyConsiderations.difficultIntubation')} />
                      Dificuldade de IOT (edema VA)
                    </label>
                    <label className="flex items-center text-sm">
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
                  className="px-3 py-1 border border-gray-300 rounded-lg w-24 text-sm"
                  {...register('infantMonths')}
                />
              )}
            </div>

            {/* Seção pediátrica expandida */}
            {watchIsInfant && (
              <div className="ml-6 pl-4 border-l-2 border-blue-200 space-y-4">
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Considerações Pediátricas</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.premature')} />
                      Prematuro
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.lowBirthWeight')} />
                      Baixo peso ao nascer
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.congenitalHeart')} />
                      Cardiopatia congênita
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.geneticSyndrome')} />
                      Síndrome genética
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.difficultAirway')} />
                      Via aérea difícil pediátrica
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.adaptedFasting')} />
                      Jejum adaptado para idade
                    </label>
                  </div>
                  <textarea
                    placeholder="Outras considerações..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
                    rows="2"
                    {...register('pediatricOther')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Comorbidades por Sistema */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Heart className="h-5 w-5 text-red-600 mr-2" />
            Comorbidades por Sistema
          </h4>
          
          <div className="space-y-6">
            {/* Cardiovascular */}
            <div>
              <h5 className="font-medium text-red-700 mb-2">CARDIOVASCULAR</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('cardiovascular.none')} />
                  <span className="font-medium">Sem diagnóstico de doença cardiovascular</span>
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
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('cardiovascular.valvular')} />
                  Valvulopatias
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('cardiovascular.cardiovascularOther')}
              />
            </div>

            {/* Neurológico */}
            <div>
              <h5 className="font-medium text-pink-700 mb-2">NEUROLÓGICO</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('neurologic.none')} />
                  <span className="font-medium">Sem diagnóstico de doença neurológico</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('neurologic.stroke')} />
                  AVC
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('neurologic.seizures')} />
                  Convulsão
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('neurologic.epilepsy')} />
                  Epilepsia
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('neurologic.aneurysm')} />
                  Aneurisma
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('neurologic.cerebralPalsy')} />
                  Paralisia cerebral
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('neurologic.neurologicOther')}
              />
            </div>

            {/* Respiratório */}
            <div>
              <h5 className="font-medium text-blue-700 mb-2">RESPIRATÓRIO</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('respiratory.none')} />
                  <span className="font-medium">Sem diagnóstico de doença respiratório</span>
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
                  <input type="checkbox" className="mr-2" {...register('respiratory.pneumonia')} />
                  Pneumonia prévia
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('respiratory.smoking')} />
                  Tabagismo
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('respiratory.sleepApnea')} />
                  Apneia do sono
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('respiratory.respiratoryOther')}
              />
            </div>

            {/* Endócrino */}
            <div>
              <h5 className="font-medium text-green-700 mb-2">ENDÓCRINO</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('endocrine.none')} />
                  <span className="font-medium">Sem diagnóstico de doença endócrino</span>
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
                  <input type="checkbox" className="mr-2" {...register('endocrine.hyperthyroid')} />
                  Hipertireoidismo
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('endocrine.obesity')} />
                  Obesidade
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('endocrine.methabolic')} />
                  Síndrome Metabólica
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('endocrine.endocrineOther')}
              />
            </div>

            {/* Digestivo */}
            <div>
              <h5 className="font-medium text-yellow-700 mb-2">DIGESTIVO</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('digestive.none')} />
                  <span className="font-medium">Sem diagnóstico de doença digestivo</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('digestive.gerd')} />
                  DRGE
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('digestive.hepatopathy')} />
                  Hepatopatia
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('digestive.pepticUlcer')} />
                  Úlcera péptica
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('digestive.varisis')} />
                  Varizes Esofágicas
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('digestive.digestiveOther')}
              />
            </div>

            {/* Hematológico */}
            <div>
              <h5 className="font-medium text-purple-700 mb-2">HEMATOLÓGICO</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('hematologic.none')} />
                  <span className="font-medium">Sem diagnóstico de doença hematológico</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('hematologic.anemia')} />
                  Anemia
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('hematologic.coagulopathy')} />
                  Coagulopatias
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('hematologic.anticoagulants')} />
                  Uso anticoagulantes
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('hematologic.anticoagulantsDisturbs')} />
                  Distúrbios de coagulação
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('hematologic.hematologicOther')}
              />
            </div>

            {/* Ósseo/Muscular */}
            <div>
              <h5 className="font-medium text-orange-700 mb-2">ÓSSEO/MUSCULAR</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('musculoskeletal.none')} />
                  <span className="font-medium">Sem diagnóstico de doença osteomuscular</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('musculoskeletal.arthritis')} />
                  Artrite/Artrose
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('musculoskeletal.osteoporosis')} />
                  Osteoporose
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('musculoskeletal.myopathy')} />
                  Miopatias
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('musculoskeletal.musculoskeletalOther')}
              />
            </div>

            {/* Geniturinário */}
            <div>
              <h5 className="font-medium text-indigo-700 mb-2">GENITURINÁRIO</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('genitourinary.none')} />
                  <span className="font-medium">Sem diagnóstico de doença geniturinário</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('genitourinary.chronicKidneyDisease')} />
                  DRC
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('genitourinary.recurrentUti')} />
                  ITU recorrente
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('genitourinary.prostaticHyperplasia')} />
                  Hiperplasia prostática
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('genitourinary.uniqueKidney')} />
                  Rim Único
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('genitourinary.genitourinaryOther')}
              />
            </div>

            {/* Genética */}
            <div>
              <h5 className="font-medium text-teal-700 mb-2">GENÉTICA</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('geneticSyndromes.none')} />
                  <span className="font-medium">Sem síndromes de doença genéticas</span>
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('geneticSyndromes.downSyndrome')} />
                  Síndrome de Down
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" {...register('geneticSyndromes.other')} />
                  Outras síndromes genéticas
                </label>
              </div>
              <textarea
                placeholder="Outras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="1"
                {...register('geneticSyndromes.geneticSyndromeOther')}
              />
            </div>
          </div>
        </div>

        {/* 3. Histórico Cirúrgico/Anestésico */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Histórico Cirúrgico/Anestésico</h4>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center text-sm mb-2">
                <input type="checkbox" className="mr-2" {...register('noPreviousSurgeries')} />
                <span className="font-medium">Sem cirurgias prévias</span>
              </label>
              <textarea
                placeholder="Cirurgias prévias (listar)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="2"
                {...register('previousSurgeries')}
              />
            </div>

            <div>
              <label className="flex items-center text-sm mb-2">
                <input type="checkbox" className="mr-2" {...register('noAnestheticComplications')} />
                <span className="font-medium">Sem complicações anestésicas prévias</span>
              </label>
              <textarea
                placeholder="Complicações anestésicas prévias..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="2"
                {...register('anestheticComplications')}
              />
            </div>
          </div>
        </div>

        {/* 4. Medicamentos e Alergias */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Medicamentos e Alergias</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medicamentos em Uso</label>
              <textarea
                placeholder="Listar medicamentos atuais..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
            <p className="text-red-600 text-sm mt-2">{errors.asaClassification.message}</p>
          )}
        </div>

        {/* 6. Via Aérea */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <AlarmCheck className="h-5 w-5 text-blue-600 mr-2" />
            Via Aérea
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mallampati</label>
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
                Sem alterações
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.mouthOpening')} />
                Abertura bucal &gt; 3cm
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.neckLimitation')} />
                Pescoço curto/limitação cervical
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.looseTeeth')} />
                Dentes soltos
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.dentures')} />
                Próteses
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('airwayFindings.beard')} />
                Barba densa
              </label>
            </div>

            <textarea
              placeholder="Outras alterações da via aérea..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="2"
              {...register('airwayOther')}
            />
          </div>
        </div>

        {/* 7. Exame Físico */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Exame Físico</h4>
          
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="3"
            {...register('physicalExam')}
          />
        </div>

        {/* 8. Exames Complementares */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Exames Complementares</h4>
          
          <div className="space-y-6">
            {/* Laboratório */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">LABORATÓRIO</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hb (g/dL)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    {...register('labResults.hemoglobin')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ht (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    {...register('labResults.hematocrit')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Glicemia (mg/dL)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    {...register('labResults.glucose')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ureia (mg/dL)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    {...register('labResults.urea')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Creatinina (mg/dL)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    {...register('labResults.creatinine')}
                  />
                </div>
              </div>
              <textarea
                placeholder="Outros exames laboratoriais..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-3"
                rows="2"
                {...register('otherLabResults')}
              />
            </div>

            {/* Imagem */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">IMAGEM</h5>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <label className="flex items-center">
                      <input type="radio" value="normal" className="mr-2" {...register('ecgStatus')} />
                      ECG normal
                    </label>
                    <label className="flex items-center">
                      <input type="radio" value="abnormal" className="mr-2" {...register('ecgStatus')} />
                      ECG alterado
                    </label>
                  </div>
                  {watchEcgStatus === 'abnormal' && (
                    <textarea
                      placeholder="Descrever alterações do ECG..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows="2"
                      {...register('ecgAbnormal')}
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <label className="flex items-center">
                      <input type="radio" value="normal" className="mr-2" {...register('chestXrayStatus')} />
                      RX tórax normal
                    </label>
                    <label className="flex items-center">
                      <input type="radio" value="abnormal" className="mr-2" {...register('chestXrayStatus')} />
                      RX tórax alterado
                    </label>
                  </div>
                  {watchChestXrayStatus === 'abnormal' && (
                    <textarea
                      placeholder="Descrever alterações do RX..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows="2"
                      {...register('chestXrayAbnormal')}
                    />
                  )}
                </div>

                <textarea
                  placeholder="Outros exames de imagem..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                  {...register('otherExams')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 9. Técnica Anestésica */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 text-blue-600 mr-2" />
            Técnica Anestésica
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
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

          {watchAnestheticTechnique?.combined && (
            <textarea
              placeholder="Especificar técnica combinada..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="2"
              {...register('combinedTechnique')}
            />
          )}
        </div>

        {/* 10. Liberação */}
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
                <span className="font-medium text-green-700">Liberado sem ressalvas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="cleared_with_restrictions"
                  className="mr-2"
                  {...register('clearanceStatus')}
                />
                <span className="font-medium text-yellow-700">Liberado com ressalvas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="not_cleared"
                  className="mr-2"
                  {...register('clearanceStatus')}
                />
                <span className="font-medium text-red-700">Não liberado</span>
              </label>
            </div>

            {watchClearanceStatus === 'cleared_with_restrictions' && (
              <textarea
                placeholder="Especificar ressalvas..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="2"
                {...register('clearanceRestrictions', {
                  required: 'Ressalvas são obrigatórias quando liberado com restrições'
                })}
              />
            )}

            {watchClearanceStatus === 'not_cleared' && (
              <textarea
                placeholder="Motivo da não liberação..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="2"
                {...register('notClearedReason', {
                  required: 'Motivo é obrigatório quando não liberado'
                })}
              />
            )}

            {errors.clearanceStatus && (
              <p className="text-red-600 text-sm">{errors.clearanceStatus.message}</p>
            )}
            {errors.clearanceRestrictions && (
              <p className="text-red-600 text-sm">{errors.clearanceRestrictions.message}</p>
            )}
            {errors.notClearedReason && (
              <p className="text-red-600 text-sm">{errors.notClearedReason.message}</p>
            )}
          </div>
        </div>

        {/* Botão de submit */}
        <div className="sticky bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 p-4 flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {preAnesthesia ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
              </>
            )}
          </button>
        </div>

        {/* Auto-save indicator */}
        {autoSaveTimeout && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Auto-salvando...
          </div>
        )}
      </form>
    </div>
  );
};

export default PreAnestheticForm;