import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Heart,
  AlarmCheckIcon,
  Zap,
  User,
  Baby,
  AlertTriangle,
  Save,
  Edit3,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const PreAnestheticEvaluationSection = ({ surgery, onDataChange, autoSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      // Informações especiais
      isPregnant: surgery?.preAnestheticEvaluation?.isPregnant || false,
      pregnancyWeeks: surgery?.preAnestheticEvaluation?.pregnancyWeeks || '',
      pregnancyComorbidities: surgery?.preAnestheticEvaluation?.pregnancyComorbidities || {},
      pregnancyConsiderations: surgery?.preAnestheticEvaluation?.pregnancyConsiderations || {},
      pregnancyOther: surgery?.preAnestheticEvaluation?.pregnancyOther || '',
      
      isInfant: surgery?.preAnestheticEvaluation?.isInfant || false,
      infantMonths: surgery?.preAnestheticEvaluation?.infantMonths || '',
      pediatricConsiderations: surgery?.preAnestheticEvaluation?.pediatricConsiderations || {},
      pediatricOther: surgery?.preAnestheticEvaluation?.pediatricOther || '',

      // Comorbidades por sistema
      cardiovascular: surgery?.preAnestheticEvaluation?.cardiovascular || {},
      cardiovascularOther: surgery?.preAnestheticEvaluation?.cardiovascularOther || '',
      respiratory: surgery?.preAnestheticEvaluation?.respiratory || {},
      respiratoryOther: surgery?.preAnestheticEvaluation?.respiratoryOther || '',
      endocrine: surgery?.preAnestheticEvaluation?.endocrine || {},
      endocrineOther: surgery?.preAnestheticEvaluation?.endocrineOther || '',
      digestive: surgery?.preAnestheticEvaluation?.digestive || {},
      digestiveOther: surgery?.preAnestheticEvaluation?.digestiveOther || '',
      hematologic: surgery?.preAnestheticEvaluation?.hematologic || {},
      hematologicOther: surgery?.preAnestheticEvaluation?.hematologicOther || '',
      musculoskeletal: surgery?.preAnestheticEvaluation?.musculoskeletal || {},
      musculoskeletalOther: surgery?.preAnestheticEvaluation?.musculoskeletalOther || '',
      genitourinary: surgery?.preAnestheticEvaluation?.genitourinary || {},
      genitourinaryOther: surgery?.preAnestheticEvaluation?.genitourinaryOther || '',
      neurologic: surgery?.preAnestheticEvaluation?.neurologic || {},
      neurologicOther: surgery?.preAnestheticEvaluation?.neurologicOther || '',
      geneticSyndromes: surgery?.preAnestheticEvaluation?.geneticSyndromes || {},
      geneticSyndromeOther: surgery?.preAnestheticEvaluation?.geneticSyndromeOther || '',

      // Histórico
      noPreviousSurgeries: surgery?.preAnestheticEvaluation?.noPreviousSurgeries || false,
      previousSurgeries: surgery?.preAnestheticEvaluation?.previousSurgeries || '',
      noAnestheticComplications: surgery?.preAnestheticEvaluation?.noAnestheticComplications || false,
      anestheticComplications: surgery?.preAnestheticEvaluation?.anestheticComplications || '',

      // Medicamentos e alergias
      currentMedications: surgery?.preAnestheticEvaluation?.currentMedications || '',
      noAllergies: surgery?.preAnestheticEvaluation?.noAllergies || false,
      allergies: surgery?.preAnestheticEvaluation?.allergies || '',

      // ASA
      asaClassification: surgery?.preAnestheticEvaluation?.asaClassification || '',

      // Via aérea
      mallampati: surgery?.preAnestheticEvaluation?.mallampati || '',
      airwayFindings: surgery?.preAnestheticEvaluation?.airwayFindings || {},
      airwayOther: surgery?.preAnestheticEvaluation?.airwayOther || '',

      // Exame físico
      physicalExam: surgery?.preAnestheticEvaluation?.physicalExam || 'Sem alterações dignas de nota',

      // Exames complementares
      labResults: surgery?.preAnestheticEvaluation?.labResults || {},
      otherLabResults: surgery?.preAnestheticEvaluation?.otherLabResults || '',
      ecgNormal: surgery?.preAnestheticEvaluation?.ecgNormal || false,
      ecgAbnormal: surgery?.preAnestheticEvaluation?.ecgAbnormal || '',
      chestXrayNormal: surgery?.preAnestheticEvaluation?.chestXrayNormal || false,
      chestXrayAbnormal: surgery?.preAnestheticEvaluation?.chestXrayAbnormal || '',
      otherExams: surgery?.preAnestheticEvaluation?.otherExams || '',

      // Técnica anestésica
      anestheticTechnique: surgery?.preAnestheticEvaluation?.anestheticTechnique || {},
      combinedTechnique: surgery?.preAnestheticEvaluation?.combinedTechnique || '',

      // Liberação
      clearanceStatus: surgery?.preAnestheticEvaluation?.clearanceStatus || '',
      clearanceRestrictions: surgery?.preAnestheticEvaluation?.clearanceRestrictions || '',
      notClearedReason: surgery?.preAnestheticEvaluation?.notClearedReason || ''
    }
  });

  // Watch para valores que afetam a exibição
  const watchIsPregnant = watch('isPregnant');
  const watchIsInfant = watch('isInfant');
  const watchNoAllergies = watch('noAllergies');
  const watchClearanceStatus = watch('clearanceStatus');

  // Reset form quando surgery muda
  useEffect(() => {
    if (surgery?.preAnestheticEvaluation) {
      reset({
        // Preencher com dados existentes...
        isPregnant: surgery.preAnestheticEvaluation.isPregnant || false,
        pregnancyWeeks: surgery.preAnestheticEvaluation.pregnancyWeeks || '',
        // ... resto dos campos
      });
    }
  }, [surgery, reset]);

  const handleAutoSave = async (data) => {
    try {
      const evaluationData = {
        preAnestheticEvaluation: data
      };
      await autoSave(evaluationData);
    } catch (error) {
      console.error('Erro no AutoSave:', error);
    }
  };

  const handleSave = async (data) => {
    setIsSaving(true);
    try {
      const evaluationData = {
        preAnestheticEvaluation: data
      };
      
      await autoSave(evaluationData);
      
      if (onDataChange) {
        onDataChange(evaluationData);
      }
      
      toast.success('Avaliação pré-anestésica atualizada!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
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

  // Rótulos amigáveis para os campos internos
  const LABELS = {
    cardiovascular: {
      hypertension: 'HAS',
      heartFailure: 'ICC',
      coronaryDisease: 'DAC',
      arrhythmias: 'Arritmias',
      valvular: 'Valvulopatias',
      none: 'Sem diagnóstico de doença cardiovascular'
    },
    respiratory: {
      asthma: 'Asma',
      copd: 'DPOC',
      sleepApnea: 'Apneia do sono',
      smoking: 'Tabagismo',
      none: 'Sem diagnóstico respiratório'
    },
    endocrine: {
      diabetes: 'Diabetes',
      hypothyroidism: 'Hipotireoidismo',
      hyperthyroidism: 'Hipertireoidismo',
      obesity: 'Obesidade',
      none: 'Sem diagnóstico endócrino'
    },
    airwayFindings: {
      mouthOpening: 'Abertura bucal > 3cm',
      neckLimitation: 'Limitação cervical',
      looseTeeth: 'Dentes soltos',
      dentures: 'Próteses dentárias',
      beard: 'Barba densa',
      none: 'Sem alterações'
    },
    anestheticTechnique: {
      generalBalanced: 'Geral Balanceada',
      generalTIVA: 'Geral Venosa Total',
      spinal: 'Raquianestesia',
      epidural: 'Peridural',
      sedation: 'Sedação',
      local: 'Local',
      block: 'Bloqueio',
      combined: 'Combinada'
    },
    geneticSyndromes: {
      none: 'Sem síndromes genéticas',
      downSyndrome: 'Síndrome de Down',
      other: 'Outras síndromes genéticas'
    }
  };

  // Função para exibir listas de checkboxes marcados com rótulos
  const renderCheckedList = (obj, otherText, labelMap = {}) => {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.none) return labelMap.none || 'Sem alterações';

    const checkedKeys = Object.keys(obj).filter(k => obj[k] && k !== 'none');
    const translated = checkedKeys.map(k => labelMap[k] || k);
    let result = translated.join(', ');

    if (otherText && otherText.trim()) {
      result = result ? result + ', ' + otherText : otherText;
    }

    return result || null;
  };

  if (!isEditing) {
    // Modo visualização
    const evaluation = surgery?.preAnestheticEvaluation || {};

    // Verifica se algum campo de exames laboratoriais foi preenchido
    const hasLabResults =
      evaluation.labResults &&
      Object.values(evaluation.labResults).some(v => v !== undefined && v !== null && v !== '');

    // Verifica se algum campo de exames de imagem foi preenchido
    const hasImaging =
      evaluation.ecgStatus ||
      (evaluation.ecgStatus === 'abnormal' && evaluation.ecgAbnormal) ||
      evaluation.chestXrayStatus ||
      (evaluation.chestXrayStatus === 'abnormal' && evaluation.chestXrayAbnormal) ||
      (evaluation.otherExams && evaluation.otherExams.trim());

    // Verifica se há alguma comorbidade marcada em qualquer sistema
    const comorbSystems = [
      ['Cardiovascular', evaluation.cardiovascular, evaluation.cardiovascularOther, LABELS.cardiovascular],
      ['Respiratório', evaluation.respiratory, evaluation.respiratoryOther, LABELS.respiratory],
      ['Endócrino', evaluation.endocrine, evaluation.endocrineOther, LABELS.endocrine],
      ['Digestivo', evaluation.digestive, evaluation.digestiveOther, {}],
      ['Hematológico', evaluation.hematologic, evaluation.hematologicOther, {}],
      ['Ósseo/Muscular', evaluation.musculoskeletal, evaluation.musculoskeletalOther, {}],
      ['Geniturinário', evaluation.genitourinary, evaluation.genitourinaryOther, {}],
      ['Neurológico', evaluation.neurologic, evaluation.neurologicOther, {}],
      // Adiciona Genética aqui
      ['Genética', evaluation.geneticSyndromes, evaluation.geneticSyndromeOther, LABELS.geneticSyndromes],
    ];
    const hasAnyComorb = comorbSystems.some(
      ([, obj, other]) =>
        (obj && Object.keys(obj).some(k => obj[k])) || (other && other.trim())
    );

    // Verifica se há informações especiais preenchidas
    const hasSpecialInfo =
      evaluation.isPregnant ||
      evaluation.isInfant;

    // Verifica se existe algum dado preenchido
    const hasAnyData =
      evaluation.asaClassification ||
      hasSpecialInfo ||
      hasAnyComorb ||
      evaluation.noPreviousSurgeries ||
      (evaluation.previousSurgeries && evaluation.previousSurgeries.trim()) ||
      evaluation.noAnestheticComplications ||
      (evaluation.anestheticComplications && evaluation.anestheticComplications.trim()) ||
      evaluation.currentMedications ||
      evaluation.noAllergies ||
      (evaluation.allergies && evaluation.allergies.trim()) ||
      evaluation.mallampati ||
      (evaluation.airwayFindings && Object.keys(evaluation.airwayFindings).some(k => evaluation.airwayFindings[k])) ||
      (evaluation.airwayOther && evaluation.airwayOther.trim()) ||
      (evaluation.physicalExam && evaluation.physicalExam.trim()) ||
      hasLabResults ||
      (evaluation.otherLabResults && evaluation.otherLabResults.trim()) ||
      hasImaging ||
      (evaluation.anestheticTechnique && Object.keys(evaluation.anestheticTechnique).some(k => evaluation.anestheticTechnique[k])) ||
      (evaluation.combinedTechnique && evaluation.combinedTechnique.trim()) ||
      evaluation.clearanceStatus;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Avaliação Pré-Anestésica</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary bg-red-500 text-white flex items-center"
          >
            <Edit3 className="h-4 w-4 sm:h-4 sm:w-4 mr-2" />
            Editar
          </button>
        </div>

        {/* Status de liberação - destaque no topo */}
        {evaluation.clearanceStatus && (
          <div
            className={`p-4 rounded-lg border-2 ${
              evaluation.clearanceStatus === 'cleared'
                ? 'bg-green-50 border-green-200'
                : evaluation.clearanceStatus === 'cleared_with_restrictions'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center">
              {evaluation.clearanceStatus === 'cleared' && (
                <Check className="h-5 w-5 text-green-600 mr-2" />
              )}
              {evaluation.clearanceStatus === 'cleared_with_restrictions' && (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              )}
              {evaluation.clearanceStatus === 'not_cleared' && (
                <X className="h-5 w-5 text-red-600 mr-2" />
              )}
              <div>
                <p className="font-medium">
                  {evaluation.clearanceStatus === 'cleared' && 'Liberado sem ressalvas'}
                  {evaluation.clearanceStatus === 'cleared_with_restrictions' && 'Liberado com ressalvas'}
                  {evaluation.clearanceStatus === 'not_cleared' && 'Não liberado'}
                </p>
                {evaluation.clearanceRestrictions && (
                  <p className="text-sm text-yellow-700">Ressalvas: {evaluation.clearanceRestrictions}</p>
                )}
                {evaluation.notClearedReason && (
                  <p className="text-sm text-red-700">Motivo: {evaluation.notClearedReason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-yellow-500" />
            <h4 className="text-base font-semibold text-gray-800">Resumo da Avaliação</h4>
          </div>
          {!hasAnyData ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md">
              <p className="text-sm font-medium">Avaliação pré-anestésica ainda não foi preenchida.</p>
              <p className="text-sm">
                Clique em <span className="font-semibold">Editar</span> para iniciar o preenchimento.
              </p>
            </div>
          ) : (
            <div>
              {/* 1. Informações Especiais */}
              {hasSpecialInfo && (
                <div className="mb-4">
                  <p className="font-semibold">Informações Especiais</p>
                  {evaluation.isPregnant && (
                    <div className="mb-2">
                      <p className="text-sm text-blue-800 font-semibold">
                        👶 Gestante {evaluation.pregnancyWeeks && `- ${evaluation.pregnancyWeeks} semanas de IG`}
                      </p>
                      {renderCheckedList(evaluation.pregnancyComorbidities, evaluation.pregnancyOther) && (
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Comorbidades gestacionais:</span>{' '}
                          {renderCheckedList(evaluation.pregnancyComorbidities, evaluation.pregnancyOther)}
                        </p>
                      )}
                      {renderCheckedList(evaluation.pregnancyConsiderations) && (
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Peculiaridades:</span>{' '}
                          {renderCheckedList(evaluation.pregnancyConsiderations)}
                        </p>
                      )}
                    </div>
                  )}
                  {evaluation.isInfant && (
                    <div className="mb-2">
                      <p className="text-sm text-blue-800 font-semibold">
                        🍼 Criança {'<'} 1 ano {evaluation.infantMonths && `- ${evaluation.infantMonths} meses`}
                      </p>
                      {renderCheckedList(evaluation.pediatricConsiderations, evaluation.pediatricOther) && (
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Considerações pediátricas:</span>{' '}
                          {renderCheckedList(evaluation.pediatricConsiderations, evaluation.pediatricOther)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Comorbidades por Sistema */}
              {hasAnyComorb && (
                <div className="mb-4">
                  <p className="font-semibold">Comorbidades por Sistema</p>
                  <div className="ml-2">
                    {comorbSystems.map(([label, obj, other, labelMap]) => {
                      const val = renderCheckedList(obj, other, labelMap);
                      return val ? (
                        <p key={label} className="text-sm text-gray-700">
                          <span className="font-semibold">{label}:</span> {val}
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* 3. Histórico Cirúrgico/Anestésico */}
              {(evaluation.noPreviousSurgeries ||
                (evaluation.previousSurgeries && evaluation.previousSurgeries.trim()) ||
                evaluation.noAnestheticComplications ||
                (evaluation.anestheticComplications && evaluation.anestheticComplications.trim())) && (
                <div className="mb-4">
                  <p className="font-semibold">Histórico Cirúrgico/Anestésico</p>
                  {evaluation.noPreviousSurgeries && (
                    <p className="text-sm text-gray-700">Sem cirurgias prévias</p>
                  )}
                  {evaluation.previousSurgeries && evaluation.previousSurgeries.trim() && (
                    <p className="text-sm text-gray-700">
                      Cirurgias prévias: {evaluation.previousSurgeries}
                    </p>
                  )}
                  {evaluation.noAnestheticComplications && (
                    <p className="text-sm text-gray-700">Sem complicações anestésicas prévias</p>
                  )}
                  {evaluation.anestheticComplications && evaluation.anestheticComplications.trim() && (
                    <p className="text-sm text-gray-700">
                      Complicações anestésicas prévias: {evaluation.anestheticComplications}
                    </p>
                  )}
                </div>
              )}

              {/* 4. Medicamentos e Alergias */}
              {(evaluation.currentMedications ||
                evaluation.noAllergies ||
                (evaluation.allergies && evaluation.allergies.trim())) && (
                <div className="mb-4">
                  <p className="font-semibold">Medicamentos e Alergias</p>
                  {evaluation.currentMedications && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Medicamentos em uso:</span> {evaluation.currentMedications}
                    </p>
                  )}
                  {evaluation.noAllergies && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Alergias:</span> Nenhuma
                    </p>
                  )}
                  {evaluation.allergies && evaluation.allergies.trim() && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Alergias:</span> {evaluation.allergies}
                    </p>
                  )}
                </div>
              )}

              {/* 5. ASA */}
              {evaluation.asaClassification && (
                <div className="mb-4">
                  <p className="font-semibold">Classificação ASA</p>
                  <p className="text-sm text-gray-700">
                    ASA {evaluation.asaClassification}
                  </p>
                </div>
              )}

              {/* 6. Via Aérea */}
              {(evaluation.mallampati ||
                (evaluation.airwayFindings && Object.keys(evaluation.airwayFindings).some(k => evaluation.airwayFindings[k])) ||
                (evaluation.airwayOther && evaluation.airwayOther.trim())) && (
                <div className="mb-4">
                  <p className="font-semibold">Via Aérea</p>
                  {evaluation.mallampati && (
                    <p className="text-sm text-gray-700">Mallampati: {evaluation.mallampati}</p>
                  )}
                  {renderCheckedList(evaluation.airwayFindings, evaluation.airwayOther, LABELS.airwayFindings) && (
                    <p className="text-sm text-gray-700">
                      Achados: {renderCheckedList(evaluation.airwayFindings, evaluation.airwayOther, LABELS.airwayFindings)}
                    </p>
                  )}
                </div>
              )}

              {/* 7. Exame Físico */}
              {evaluation.physicalExam && evaluation.physicalExam.trim() && (
                <div className="mb-4">
                  <p className="font-semibold">Exame Físico</p>
                  <p className="text-sm text-gray-700">{evaluation.physicalExam}</p>
                </div>
              )}

              {/* 8. Exames Complementares */}
              {(hasLabResults ||
                (evaluation.otherLabResults && evaluation.otherLabResults.trim()) ||
                hasImaging) && (
                <div className="mb-4">
                  <p className="font-semibold">Exames Complementares</p>
                  {/* Laboratório */}
                  {hasLabResults && (
                    <div className="ml-2">
                      {evaluation.labResults?.hemoglobin && (
                        <p className="text-sm text-gray-700">Hb: {evaluation.labResults.hemoglobin} g/dL</p>
                      )}
                      {evaluation.labResults?.hematocrit && (
                        <p className="text-sm text-gray-700">Ht: {evaluation.labResults.hematocrit} %</p>
                      )}
                      {evaluation.labResults?.glucose && (
                        <p className="text-sm text-gray-700">Glicemia: {evaluation.labResults.glucose} mg/dL</p>
                      )}
                      {evaluation.labResults?.urea && (
                        <p className="text-sm text-gray-700">Ureia: {evaluation.labResults.urea} mg/dL</p>
                      )}
                      {evaluation.labResults?.creatinine && (
                        <p className="text-sm text-gray-700">Creatinina: {evaluation.labResults.creatinine} mg/dL</p>
                      )}
                    </div>
                  )}
                  {evaluation.otherLabResults && evaluation.otherLabResults.trim() && (
                    <p className="text-sm text-gray-700">
                      Outros exames laboratoriais: {evaluation.otherLabResults}
                    </p>
                  )}
                  {/* Imagem */}
                  {hasImaging && (
                    <div className="ml-2 mt-2">
                      {evaluation.ecgStatus && (
                        <p className="text-sm text-gray-700">
                          ECG: {evaluation.ecgStatus === 'normal' ? 'Normal' : 'Alterado'}
                          {evaluation.ecgStatus === 'abnormal' && evaluation.ecgAbnormal
                            ? ` (${evaluation.ecgAbnormal})`
                            : ''}
                        </p>
                      )}
                      {evaluation.chestXrayStatus && (
                        <p className="text-sm text-gray-700">
                          RX tórax: {evaluation.chestXrayStatus === 'normal' ? 'Normal' : 'Alterado'}
                          {evaluation.chestXrayStatus === 'abnormal' && evaluation.chestXrayAbnormal
                            ? ` (${evaluation.chestXrayAbnormal})`
                            : ''}
                        </p>
                      )}
                      {evaluation.otherExams && evaluation.otherExams.trim() && (
                        <p className="text-sm text-gray-700">
                          Outros exames de imagem: {evaluation.otherExams}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 9. Técnica Anestésica */}
              {evaluation.anestheticTechnique &&
                Object.keys(evaluation.anestheticTechnique).some(k => evaluation.anestheticTechnique[k]) && (
                  <div className="mb-4">
                    <p className="font-semibold">Técnica Anestésica</p>
                    <p className="text-sm text-gray-700">
                      {renderCheckedList(evaluation.anestheticTechnique, null, LABELS.anestheticTechnique)}
                    </p>
                    {evaluation.anestheticTechnique.combined && evaluation.combinedTechnique && (
                      <p className="text-sm text-gray-700">
                        Técnica combinada: {evaluation.combinedTechnique}
                      </p>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modo edição
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Avaliação Pré-Anestésica</h3>
        <div className="flex flex-row gap-2">
          <button
            type="button"
            onClick={markHealthyPatient}
            className="w-full sm:w-auto px-4 py-1.5 text-sm font-medium bg-green-600 text-white rounded-full hover:bg-green-700 flex items-center justify-center"
          >
            <Heart className="h-5 w-5 sm:h-4 sm:w-4 mr-1" />
            Paciente Hígido
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-1.5 text-sm font-medium bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            Cancelar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        {/* 1. Informações Especiais */}
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
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.placentaPrevia')} />
                      Placenta prévia
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pregnancyComorbidities.prematureLabor')} />
                      Trabalho de parto prematuro
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
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.difficultAirway')} />
                      Via aérea difícil pediátrica
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" {...register('pediatricConsiderations.adaptedFasting')} />
                      Jejum adaptado para idade
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

        {/* 2. Comorbidades por Sistema */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Heart className="h-5 w-5 text-primary-600 mr-2" />
            Comorbidades por Sistema
          </h4>
          
          {/* Cardiovascular */}
          <div className="mb-6">
            <h5 className="font-medium text-red-700 mb-2">CARDIOVASCULAR</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
              className="input-field mt-2"
              rows="1"
              {...register('cardiovascularOther')}
            />
          </div>

          {/* Neurológico */}
          <div className="mb-6">
            <h5 className="font-medium text-pink-700 mb-2">NEUROLÓGICO</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('neurologic.none')} />
                <span className="font-medium">Sem diagnóstico de doença neurológica</span>
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
              className="input-field mt-2"
              rows="1"
              {...register('neurologicOther')}
            />
          </div>

          {/* Respiratório */}
          <div className="mb-6">
            <h5 className="font-medium text-blue-700 mb-2">RESPIRATÓRIO</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('respiratory.none')} />
                <span className="font-medium">Sem diagnóstico de doença respiratória</span>
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
                IVAS
              </label>
            </div>
            <textarea
              placeholder="Outras..."
              className="input-field mt-2"
              rows="1"
              {...register('respiratoryOther')}
            />
          </div>

          {/* Endócrino */}
          <div className="mb-6">
            <h5 className="font-medium text-green-700 mb-2">ENDÓCRINO</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('endocrine.none')} />
                <span className="font-medium">Sem diagnóstico de doença endócrina</span>
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
              className="input-field mt-2"
              rows="1"
              {...register('endocrineOther')}
            />
          </div>

          {/* Digestivo */}
          <div className="mb-6">
            <h5 className="font-medium text-yellow-700 mb-2">DIGESTIVO</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('digestive.none')} />
                <span className="font-medium">Sem diagnóstico de doença do aparelho digestivo</span>
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
                Varises Esofágicas
              </label>
            </div>
            <textarea
              placeholder="Outras..."
              className="input-field mt-2"
              rows="1"
              {...register('digestiveOther')}
            />
          </div>

          {/* Hematológico */}
          <div className="mb-6">
            <h5 className="font-medium text-purple-700 mb-2">HEMATOLÓGICO</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('hematologic.none')} />
                <span className="font-medium">Sem diagnóstico de doença hematológica</span>
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
              className="input-field mt-2"
              rows="1"
              {...register('hematologicOther')}
            />
          </div>

          {/* Ósseo/Muscular */}
          <div className="mb-6">
            <h5 className="font-medium text-orange-700 mb-2">ÓSSEO/MUSCULAR</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
              className="input-field mt-2"
              rows="1"
              {...register('musculoskeletalOther')}
            />
          </div>

          {/* Geniturinário */}
          <div className="mb-6">
            <h5 className="font-medium text-indigo-700 mb-2">GENITURINÁRIO</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('genitourinary.none')} />
                <span className="font-medium">Sem diagnóstico de doença geniturinária</span>
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
              className="input-field mt-2"
              rows="1"
              {...register('genitourinaryOther')}
            />
          </div>
        </div>


        {/* Genética */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h5 className="font-medium text-indigo-700 mb-2">GENÉTICA</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" {...register('geneticSyndromes.none')} />
              Sem síndromes genéticas
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
            className="input-field mt-2"
            rows="1"
            {...register('geneticSyndromeOther')}
          />
        </div>


        {/* 3. Histórico Cirúrgico/Anestésico */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Histórico Cirúrgico/Anestésico</h4>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('noPreviousSurgeries')} />
                <span className="font-medium">Sem cirurgias prévias</span>
              </label>
              <textarea
                placeholder="Cirurgias prévias (listar)..."
                className="input-field mt-2"
                rows="2"
                {...register('previousSurgeries')}
              />
            </div>

            <div>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" {...register('noAnestheticComplications')} />
                <span className="font-medium">Sem complicações anestésicas prévias</span>
              </label>
              <textarea
                placeholder="Complicações anestésicas prévias..."
                className="input-field mt-2"
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
            </div>

            <textarea
              placeholder="Outras alterações da via aérea..."
              className="input-field"
              rows="2"
              {...register('airwayOther')}
            />
          </div>
        </div>

        {/* 7. Exame Físico */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Exame Físico</h4>
          
          <textarea
            className="input-field"
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
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="label text-sm">Hb (g/dL)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="input-field"
                      onChange={(e) => setValue('labResults.hemoglobin', e.target.value.replace(',', '.'))}
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Ht (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="input-field"
                      onChange={(e) => setValue('labResults.hematocrit', e.target.value.replace(',', '.'))}
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Glicemia (mg/dL)</label>
                    <input
                      type="number"
                      className="input-field"
                      {...register('labResults.glucose')}
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Ureia (mg/dL)</label>
                    <input
                      type="number"
                      className="input-field"
                      {...register('labResults.urea')}
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Creatinina (mg/dL)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="input-field"
                      onChange={(e) => setValue('labResults.creatinine', e.target.value.replace(',', '.'))}
                    />
                  </div>
                </div>
              </div>
              <textarea
                placeholder="Outros exames laboratoriais..."
                className="input-field mt-3"
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
                  {watch('ecgStatus') === 'abnormal' && (
                    <textarea
                      placeholder="Descrever alterações do ECG..."
                      className="input-field"
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
                  {watch('chestXrayStatus') === 'abnormal' && (
                    <textarea
                      placeholder="Descrever alterações do RX..."
                      className="input-field"
                      rows="2"
                      {...register('chestXrayAbnormal')}
                    />
                  )}
                </div>

                <textarea
                  placeholder="Outros exames de imagem..."
                  className="input-field"
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
            <Zap className="h-5 w-5 text-primary-600 mr-2" />
            Técnica Anestésica
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
                className="input-field"
                rows="2"
                {...register('clearanceRestrictions', {
                  required: 'Ressalvas são obrigatórias quando liberado com restrições'
                })}
              />
            )}

            {watchClearanceStatus === 'not_cleared' && (
              <textarea
                placeholder="Motivo da não liberação..."
                className="input-field"
                rows="2"
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

        {/* Botão de submit */}
        <div className="sticky bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 p-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center"
          >
            {isSaving ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Avaliação
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreAnestheticEvaluationSection;
      