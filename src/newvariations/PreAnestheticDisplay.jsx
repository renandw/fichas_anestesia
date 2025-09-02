
import React from 'react';
import {
  File,
  User,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Baby
} from 'lucide-react';

// ---------------------------------------------
// UI helpers (kept in this file to avoid new files)
// ---------------------------------------------
const Section = ({ title, children }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
    <div className="mb-3 flex items-center gap-2">
      <h4 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h4>
    </div>
    <div className="space-y-3 sm:space-y-4">{children}</div>
  </section>
);

const KeyRow = ({ label, value }) => (
  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3">
    <dt className="sm:col-span-3 text-[13px] sm:text-sm font-medium text-gray-700">{label}</dt>
    <dd className="sm:col-span-9 text-[13px] sm:text-sm text-gray-700">{value}</dd>
  </div>
);

const Chip = ({ children, tone = 'green' }) => (
  <span
    className={[
      'inline-flex items-center rounded-full px-2 py-1 text-[11px] sm:text-xs font-medium',
      tone === 'green' && 'bg-green-100 text-green-800',
      tone === 'blue' && 'bg-blue-100 text-blue-800',
      tone === 'yellow' && 'bg-yellow-100 text-yellow-800',
      tone === 'gray' && 'bg-gray-100 text-gray-800'
    ].filter(Boolean).join(' ')}
  >
    {children}
  </span>
);

const SkeletonGroup = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 w-2/3 rounded bg-gray-200" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="h-3 rounded bg-gray-200" />
      <div className="h-3 rounded bg-gray-200" />
      <div className="h-3 rounded bg-gray-200" />
      <div className="h-3 rounded bg-gray-200" />
    </div>
  </div>
);

const StatusBanner = ({ status, restrictions, reason }) => {
  const variants = {
    cleared: {
      container: 'bg-green-50 border-green-200',
      icon: <Check className="h-5 w-5 text-green-600" aria-hidden />,
      label: 'Liberado sem ressalvas'
    },
    cleared_with_restrictions: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden />,
      label: 'Liberado com ressalvas'
    },
    not_cleared: {
      container: 'bg-red-50 border-red-200',
      icon: <X className="h-5 w-5 text-red-600" aria-hidden />,
      label: 'Não liberado'
    }
  };

  const v = variants[status];
  if (!v) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border-2 p-3 sm:p-4 ${v.container}`}
    >
      <div className="flex items-start gap-2">
        {v.icon}
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-medium text-gray-900">{v.label}</p>
          {restrictions && (
            <p className="text-xs sm:text-sm text-yellow-700"><span className="font-semibold">Ressalvas:</span> {restrictions}</p>
          )}
          {reason && (
            <p className="text-xs sm:text-sm text-red-700"><span className="font-semibold">Motivo:</span> {reason}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to get plain status label (for compact view)
const getStatusLabel = (status) => {
  const map = {
    cleared: 'Liberado sem ressalvas',
    cleared_with_restrictions: 'Liberado com ressalvas',
    not_cleared: 'Não liberado'
  };
  return map[status] || null;
};

// ---------------------------------------------
// Main component
// ---------------------------------------------
const PreAnestheticDisplay = ({
  preAnesthesia,
  isLoading = false,
  onEdit,
  compact = false
}) => {
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

  // Versão compacta: ignora quando apenas `none` está marcado
  const renderCheckedListCompact = (obj, otherText, labelMap = {}) => {
    if (!obj || typeof obj !== 'object') return null;
    const checkedKeys = Object.keys(obj).filter(k => k !== 'none' && obj[k]);
    let result = checkedKeys.map(k => labelMap[k] || k).join(', ');
    if (otherText && otherText.trim()) {
      result = result ? result + ', ' + otherText : otherText;
    }
    return result || null; // se nada marcado (só none), não mostra
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
      pneumonia: 'Pneumonia prévia',
      none: 'Sem diagnóstico de doença respiratória'
    },
    endocrine: {
      diabetes: 'DM',
      hypothyroid: 'Hipotireoidismo',
      hyperthyroid: 'Hipertireoidismo',
      obesity: 'Obesidade',
      methabolic: 'Síndrome Metabólica',
      none: 'Sem diagnóstico de doença endócrina'
    },
    neurologic: {
      stroke: 'AVC',
      seizures: 'Convulsão',
      epilepsy: 'Epilepsia',
      aneurysm: 'Aneurisma',
      cerebralPalsy: 'Paralisia cerebral',
      none: 'Sem diagnóstico de doença neurológica'
    },
    digestive: {
      gerd: 'DRGE',
      hepatopathy: 'Hepatopatia',
      pepticUlcer: 'Úlcera péptica',
      varisis: 'Varises Esofágicas',
      none: 'Sem diagnóstico de doença digestiva'
    },
    hematologic: {
      anemia: 'Anemia',
      coagulopathy: 'Coagulopatias',
      anticoagulants: 'Uso anticoagulantes',
      anticoagulantsDisturbs: 'Distúrbios de coagulação',
      none: 'Sem diagnóstico de doença hematológica'
    },
    musculoskeletal: {
      arthritis: 'Artrite/Artrose',
      osteoporosis: 'Osteoporose',
      myopathy: 'Miopatias',
      none: 'Sem diagnóstico de doença osteomuscular'
    },
    genitourinary: {
      chronicKidneyDisease: 'DRC',
      recurrentUti: 'ITU recorrente',
      prostaticHyperplasia: 'Hiperplasia prostática',
      uniqueKidney: 'Rim Único',
      none: 'Sem diagnóstico de doença geniturinário'
    },
    geneticSyndromes: {
      none: 'Sem síndromes genéticas',
      downSyndrome: 'Síndrome de Down',
      other: 'Outras síndromes genéticas'
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
      generalIv: 'Geral Venosa Total',
      spinal: 'Raquianestesia',
      epidural: 'Peridural',
      sedation: 'Sedação',
      local: 'Local',
      plexusBlock: 'Bloqueio de plexo',
      combined: 'Combinada'
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Avaliação Pré-Anestésica</h3>
        </div>
        <Section title="Carregando…">
          <SkeletonGroup />
        </Section>
      </div>
    );
  }

  if (!preAnesthesia) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Avaliação Pré-Anestésica</h3>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Edit3 className="h-4 w-4" aria-hidden />
            Criar Avaliação
          </button>
        </div>

        <Section title="Resumo da Avaliação">
          <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-3 sm:p-4">
            <p className="text-sm font-medium text-yellow-900">Avaliação pré-anestésica ainda não foi preenchida.</p>
            <p className="text-sm text-yellow-800 mt-1">
              Clique em <span className="font-semibold">Criar Avaliação</span> para iniciar o preenchimento.
            </p>
          </div>
        </Section>
      </div>
    );
  }

  // Verifica se algum campo de exames laboratoriais foi preenchido
  const hasLabResults =
    preAnesthesia.labResults &&
    Object.values(preAnesthesia.labResults).some(v => v !== undefined && v !== null && v !== '');

  // Verifica se algum campo de exames de imagem foi preenchido
  const hasImaging =
    preAnesthesia.ecgStatus ||
    (preAnesthesia.ecgStatus === 'abnormal' && preAnesthesia.ecgAbnormal) ||
    preAnesthesia.chestXrayStatus ||
    (preAnesthesia.chestXrayStatus === 'abnormal' && preAnesthesia.chestXrayAbnormal) ||
    (preAnesthesia.otherExams && preAnesthesia.otherExams.trim());

  // Verifica se há alguma comorbidade marcada em qualquer sistema
  const comorbSystems = [
    ['Cardiovascular', preAnesthesia.cardiovascular, preAnesthesia.cardiovascularOther, LABELS.cardiovascular],
    ['Respiratório', preAnesthesia.respiratory, preAnesthesia.respiratoryOther, LABELS.respiratory],
    ['Endócrino', preAnesthesia.endocrine, preAnesthesia.endocrineOther, LABELS.endocrine],
    ['Neurológico', preAnesthesia.neurologic, preAnesthesia.neurologicOther, LABELS.neurologic],
    ['Digestivo', preAnesthesia.digestive, preAnesthesia.digestiveOther, LABELS.digestive],
    ['Hematológico', preAnesthesia.hematologic, preAnesthesia.hematologicOther, LABELS.hematologic],
    ['Ósseo/Muscular', preAnesthesia.musculoskeletal, preAnesthesia.musculoskeletalOther, LABELS.musculoskeletal],
    ['Geniturinário', preAnesthesia.genitourinary, preAnesthesia.genitourinaryOther, LABELS.genitourinary],
    ['Genética', preAnesthesia.geneticSyndromes, preAnesthesia.geneticSyndromeOther, LABELS.geneticSyndromes],
  ];
  const hasAnyComorb = comorbSystems.some(
    ([, obj, other]) =>
      (obj && Object.keys(obj).some(k => obj[k])) || (other && other.trim())
  );

  // Verifica se há informações especiais preenchidas
  const hasSpecialInfo = preAnesthesia.isPregnant || preAnesthesia.isInfant;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200 hover:shadow transition">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center">
            <File className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm text-gray-900">
                {getStatusLabel(preAnesthesia.clearanceStatus) || 'Pré-anestésica'}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-2 text-xs text-gray-600">
              {preAnesthesia.asaClassification && (
                <span className="font-semibold text-blue-800">ASA {preAnesthesia.asaClassification}</span>
              )}
              {preAnesthesia.isPregnant && (
                <span>Gestante{preAnesthesia.pregnancyWeeks ? ` (${preAnesthesia.pregnancyWeeks} semanas)` : ''}</span>
              )}
              {preAnesthesia.isInfant && (
                <span>Criança &lt; 1 ano{preAnesthesia.infantMonths ? ` (${preAnesthesia.infantMonths} meses)` : ''}</span>
              )}
              {comorbSystems.some(([label, obj, other, map]) => renderCheckedListCompact(obj, other, map)) && (
                <span>Comorbidades presentes</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Avaliação Pré-Anestésica</h3>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Edit3 className="h-4 w-4" aria-hidden />
          Editar
        </button>
      </div>

      {/* Status */}
      {preAnesthesia.clearanceStatus && (
        <StatusBanner
          status={preAnesthesia.clearanceStatus}
          restrictions={preAnesthesia.clearanceRestrictions}
          reason={preAnesthesia.notClearedReason}
        />
      )}

      {/* Resumo */}
      <Section title={<span className="inline-flex items-center gap-2"><User className="h-5 w-5 text-blue-500" aria-hidden /> Resumo da Avaliação</span>}>
        <div className="space-y-5">
          {/* 1. Informações Especiais */}
          {hasSpecialInfo && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Informações Especiais</p>
              {preAnesthesia.isPregnant && (
                <div className="rounded-r-md border-l-4 border-pink-300 bg-pink-50 p-3">
                  <p className="flex items-center text-sm font-semibold text-pink-800">
                    <Baby className="mr-1 h-4 w-4" aria-hidden />
                    Gestante {preAnesthesia.pregnancyWeeks && `- ${preAnesthesia.pregnancyWeeks} semanas de IG`}
                  </p>
                  {renderCheckedList(preAnesthesia.pregnancyComorbidities, preAnesthesia.pregnancyOther) && (
                    <p className="mt-1 text-sm text-pink-700">
                      <span className="font-semibold">Comorbidades gestacionais:</span>{' '}
                      {renderCheckedList(preAnesthesia.pregnancyComorbidities, preAnesthesia.pregnancyOther)}
                    </p>
                  )}
                  {renderCheckedList(preAnesthesia.pregnancyConsiderations) && (
                    <p className="mt-1 text-sm text-pink-700">
                      <span className="font-semibold">Peculiaridades:</span>{' '}
                      {renderCheckedList(preAnesthesia.pregnancyConsiderations)}
                    </p>
                  )}
                </div>
              )}
              {preAnesthesia.isInfant && (
                <div className="rounded-r-md border-l-4 border-blue-300 bg-blue-50 p-3">
                  <p className="flex items-center text-sm font-semibold text-blue-800">
                    <Baby className="mr-1 h-4 w-4" aria-hidden />
                    Criança {'<'} 1 ano {preAnesthesia.infantMonths && `- ${preAnesthesia.infantMonths} meses`}
                  </p>
                  {renderCheckedList(preAnesthesia.pediatricConsiderations, preAnesthesia.pediatricOther) && (
                    <p className="mt-1 text-sm text-blue-700">
                      <span className="font-semibold">Considerações pediátricas:</span>{' '}
                      {renderCheckedList(preAnesthesia.pediatricConsiderations, preAnesthesia.pediatricOther)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Comorbidades por Sistema */}
          {hasAnyComorb && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900">Comorbidades por Sistema</p>
              <dl className="space-y-2">
                {comorbSystems.map(([label, obj, other, labelMap]) => {
                  const val = renderCheckedList(obj, other, labelMap);
                  return val ? <KeyRow key={label} label={label} value={val} /> : null;
                })}
              </dl>
            </div>
          )}

          {/* 3. Histórico Cirúrgico/Anestésico */}
          {(preAnesthesia.noPreviousSurgeries ||
            (preAnesthesia.previousSurgeries && preAnesthesia.previousSurgeries.trim()) ||
            preAnesthesia.noAnestheticComplications ||
            (preAnesthesia.anestheticComplications && preAnesthesia.anestheticComplications.trim())) && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Histórico Cirúrgico/Anestésico</p>
              <ul className="space-y-1 text-[13px] sm:text-sm text-gray-700">
                {preAnesthesia.noPreviousSurgeries && (
                  <li>• Sem cirurgias prévias</li>
                )}
                {preAnesthesia.previousSurgeries && preAnesthesia.previousSurgeries.trim() && (
                  <li>• Cirurgias prévias: {preAnesthesia.previousSurgeries}</li>
                )}
                {preAnesthesia.noAnestheticComplications && (
                  <li>• Sem complicações anestésicas prévias</li>
                )}
                {preAnesthesia.anestheticComplications && preAnesthesia.anestheticComplications.trim() && (
                  <li>• Complicações anestésicas: {preAnesthesia.anestheticComplications}</li>
                )}
              </ul>
            </div>
          )}

          {/* 4. Medicamentos e Alergias */}
          {(preAnesthesia.currentMedications ||
            preAnesthesia.noAllergies ||
            (preAnesthesia.allergies && preAnesthesia.allergies.trim())) && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Medicamentos e Alergias</p>
              <div className="space-y-1 text-[13px] sm:text-sm text-gray-700">
                {preAnesthesia.currentMedications && (
                  <p>
                    <span className="font-medium">Medicamentos em uso:</span> {preAnesthesia.currentMedications}
                  </p>
                )}
                {preAnesthesia.noAllergies && (
                  <p>
                    <span className="font-medium">Alergias:</span> Nenhuma
                  </p>
                )}
                {preAnesthesia.allergies && preAnesthesia.allergies.trim() && (
                  <p>
                    <span className="font-medium">Alergias:</span> {preAnesthesia.allergies}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. ASA */}
          {preAnesthesia.asaClassification && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Classificação ASA</p>
              <Chip tone="blue">ASA {preAnesthesia.asaClassification}</Chip>
            </div>
          )}

          {/* 6. Via Aérea */}
          {(preAnesthesia.mallampati ||
            (preAnesthesia.airwayFindings && Object.keys(preAnesthesia.airwayFindings).some(k => preAnesthesia.airwayFindings[k])) ||
            (preAnesthesia.airwayOther && preAnesthesia.airwayOther.trim())) && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Via Aérea</p>
              <div className="space-y-1 text-[13px] sm:text-sm text-gray-700">
                {preAnesthesia.mallampati && (
                  <p>Mallampati: {preAnesthesia.mallampati}</p>
                )}
                {renderCheckedList(preAnesthesia.airwayFindings, preAnesthesia.airwayOther, LABELS.airwayFindings) && (
                  <p>
                    Achados: {renderCheckedList(preAnesthesia.airwayFindings, preAnesthesia.airwayOther, LABELS.airwayFindings)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 7. Exame Físico */}
          {preAnesthesia.physicalExam && preAnesthesia.physicalExam.trim() && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900">Exame Físico</p>
              <p className="rounded-md bg-gray-50 p-3 text-[13px] sm:text-sm text-gray-700">{preAnesthesia.physicalExam}</p>
            </div>
          )}

          {/* 8. Exames Complementares */}
          {(hasLabResults ||
            (preAnesthesia.otherLabResults && preAnesthesia.otherLabResults.trim()) ||
            hasImaging) && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Exames Complementares</p>
              <div className="space-y-2">
                {/* Laboratório */}
                {hasLabResults && (
                  <div className="space-y-1">
                    <p className="text-[13px] sm:text-sm font-medium text-gray-800">Laboratório</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[12px] sm:text-xs text-gray-700">
                      {preAnesthesia.labResults?.hemoglobin && (
                        <span>Hb: {preAnesthesia.labResults.hemoglobin} g/dL</span>
                      )}
                      {preAnesthesia.labResults?.hematocrit && (
                        <span>Ht: {preAnesthesia.labResults.hematocrit}%</span>
                      )}
                      {preAnesthesia.labResults?.glucose && (
                        <span>Glicemia: {preAnesthesia.labResults.glucose} mg/dL</span>
                      )}
                      {preAnesthesia.labResults?.urea && (
                        <span>Ureia: {preAnesthesia.labResults.urea} mg/dL</span>
                      )}
                      {preAnesthesia.labResults?.creatinine && (
                        <span>Creatinina: {preAnesthesia.labResults.creatinine} mg/dL</span>
                      )}
                    </div>
                  </div>
                )}
                {preAnesthesia.otherLabResults && preAnesthesia.otherLabResults.trim() && (
                  <p className="text-[13px] sm:text-sm text-gray-700">Outros exames: {preAnesthesia.otherLabResults}</p>
                )}

                {/* Imagem */}
                {hasImaging && (
                  <div className="space-y-1">
                    <p className="text-[13px] sm:text-sm font-medium text-gray-800">Imagem</p>
                    <div className="space-y-1 text-[12px] sm:text-xs text-gray-700">
                      {preAnesthesia.ecgStatus && (
                        <p>
                          ECG: {preAnesthesia.ecgStatus === 'normal' ? 'Normal' : 'Alterado'}
                          {preAnesthesia.ecgStatus === 'abnormal' && preAnesthesia.ecgAbnormal
                            ? ` (${preAnesthesia.ecgAbnormal})`
                            : ''}
                        </p>
                      )}
                      {preAnesthesia.chestXrayStatus && (
                        <p>
                          RX tórax: {preAnesthesia.chestXrayStatus === 'normal' ? 'Normal' : 'Alterado'}
                          {preAnesthesia.chestXrayStatus === 'abnormal' && preAnesthesia.chestXrayAbnormal
                            ? ` (${preAnesthesia.chestXrayAbnormal})`
                            : ''}
                        </p>
                      )}
                      {preAnesthesia.otherExams && preAnesthesia.otherExams.trim() && (
                        <p>Outros: {preAnesthesia.otherExams}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 9. Técnica Anestésica */}
          {preAnesthesia.anestheticTechnique &&
            Object.keys(preAnesthesia.anestheticTechnique).some(k => preAnesthesia.anestheticTechnique[k]) && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">Técnica Anestésica</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(preAnesthesia.anestheticTechnique)
                    .filter(k => preAnesthesia.anestheticTechnique[k])
                    .map(k => (
                      <Chip key={k}>{LABELS.anestheticTechnique[k] || k}</Chip>
                    ))}
                </div>
                {preAnesthesia.anestheticTechnique.combined && preAnesthesia.combinedTechnique && (
                  <p className="mt-1 text-[13px] sm:text-sm text-gray-700">Técnica combinada: {preAnesthesia.combinedTechnique}</p>
                )}
              </div>
            )}
        </div>
      </Section>
    </div>
  );
};

export default PreAnestheticDisplay;