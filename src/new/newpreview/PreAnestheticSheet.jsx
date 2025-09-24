import React, { useEffect } from 'react';


const PreAnestheticSheet = ({ 
  data, 
  responsibleResolved, 
  preAnesthesia,
  formatFirestoreDate,
  normalizeCbhpmProcedures,
  formatAge
}) => {
    useEffect(() => {
        const prev = document.title;
        const name = (data?.patient?.patientName || '').replace(/[\\/:*?"<>|]/g, '-');
        const code = (data?.surgery?.code || '').replace(/[\\/:*?"<>|]/g, '-');
        if (name || code) document.title = `Ficha Pré Anestesica - ${name} - ${code}`;
        return () => { document.title = prev; };
        }, [data?.patient?.patientName, data?.surgery?.code]);  
        console.log('🟢 PreAnestheticSheet renderizando');
  // Helper para renderizar listas de checkboxes marcados
  const renderCheckedList = (obj, otherText, labelMap = {}) => {
    if (!obj || typeof obj !== 'object') return null;
  
    const checkedKeys = Object.keys(obj).filter(k => obj[k] && k !== 'none' && !k.endsWith('Other'));
  
    if (obj.none && checkedKeys.length === 0) return labelMap.none || 'Sem alterações';
    const translated = checkedKeys.map(k => labelMap[k] || k);
    let result = translated.join(', ');
  
    if (otherText && otherText.trim()) {
      result = result ? result + ', ' + otherText : otherText;
    }
  
    return result || null;
  };

  // Rótulos para os campos
  const LABELS = {
    cardiovascular: {
      hypertension: 'HAS',
      heartFailure: 'ICC',
      coronaryDisease: 'DAC',
      arrhythmias: 'Arritmias',
      valvular: 'Valvulopatias',
      none: 'Sem alterações'
    },
    respiratory: {
      asthma: 'Asma',
      copd: 'DPOC',
      sleepApnea: 'Apneia do sono',
      smoking: 'Tabagismo',
      pneumonia: 'Pneumonia prévia',
      none: 'Sem alterações'
    },
    endocrine: {
      diabetes: 'DM',
      hypothyroid: 'Hipotireoidismo',
      hyperthyroid: 'Hipertireoidismo',
      obesity: 'Obesidade',
      methabolic: 'Síndrome Metabólica',
      none: 'Sem alterações'
    },
    neurologic: {
      stroke: 'AVC',
      seizures: 'Convulsão',
      epilepsy: 'Epilepsia',
      aneurysm: 'Aneurisma',
      cerebralPalsy: 'Paralisia cerebral',
      none: 'Sem alterações'
    },
    digestive: {
      gerd: 'DRGE',
      hepatopathy: 'Hepatopatia',
      pepticUlcer: 'Úlcera péptica',
      varisis: 'Varizes Esofágicas',
      none: 'Sem alterações'
    },
    hematologic: {
      anemia: 'Anemia',
      coagulopathy: 'Coagulopatias',
      anticoagulants: 'Uso anticoagulantes',
      anticoagulantsDisturbs: 'Distúrbios de coagulação',
      none: 'Sem alterações'
    },
    musculoskeletal: {
      arthritis: 'Artrite/Artrose',
      osteoporosis: 'Osteoporose',
      myopathy: 'Miopatias',
      none: 'Sem alterações'
    },
    genitourinary: {
      chronicKidneyDisease: 'DRC',
      recurrentUti: 'ITU recorrente',
      prostaticHyperplasia: 'Hiperplasia prostática',
      uniqueKidney: 'Rim Único',
      none: 'Sem alterações'
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

  // Status de liberação
  const getStatusText = (status) => {
    const statusMap = {
      cleared: 'Liberado sem ressalvas',
      cleared_with_restrictions: 'Liberado com ressalvas',
      not_cleared: 'Não liberado'
    };
    return statusMap[status] || '';
  };

  // ===== Subcomponentes =====
  const Header = () => (
    <div className="mb-4 border-b-2 border-blue-600 pb-1">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold text-gray-900">AVALIAÇÃO PRÉ-ANESTÉSICA</h1>
        <span className="bg-blue-100 px-3 py-1 rounded text-sm text-blue-800 font-bold border border-blue-200 print:bg-blue-100 print:border-blue-200">
          {data.surgery.code}
        </span>
      </div>
      <div className="text-xs text-gray-700 flex justify-between">
        <span><strong>Hospital:</strong> {data.surgery.hospital}</span>
        <span><strong>Responsável:</strong> {responsibleResolved ?? data.surgery.metadata.createdBy}</span>
      </div>
    </div>
  );

  const PatientInfo = () => (
    <div className="mb-2 bg-gray-50 px-3 pb-3 rounded border print:bg-gray-50 print:border-gray-300">
      <h2 className="bg-blue-600 text-white px-2 py-1 font-bold text-xs rounded-t -mx-3 -mt-3 mb-3 print:bg-blue-600 print:text-white">
        IDENTIFICAÇÃO DO PACIENTE
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="col-span-2 grid grid-cols-[2fr_1fr_1fr] gap-x-6 gap-y-2 min-w-0">
          <div className="min-w-0">
            <strong>Paciente:</strong>{' '}
            <span className="inline-block align-bottom max-w-full break-words whitespace-normal" title={data.patient.patientName}>
              {data.patient.patientName}
            </span>
          </div>
          <div><strong>Data:</strong> {formatFirestoreDate(data.surgery.surgeryDate)}</div>
          <div>
            <strong>Idade:</strong>{' '}
            {(() => {
              const prettyAge = formatAge(data.patient.patientBirthDate, data.surgery.surgeryDate);
              return prettyAge ?? '--';
            })()}
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-[1fr_1fr_1.4fr_1fr] gap-x-6 gap-y-2 min-w-0">
          <div><strong>Sexo:</strong> {data.patient.patientSex}</div>
          <div><strong>Peso:</strong> {data.surgery.patientWeight}kg</div>
          {data.surgery.procedureType === 'sus' ? (
            <>
              <div className="min-w-0">
                <strong>CNS:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{data.patient.patientCNS || '--'}</span>
              </div>
              <div className="min-w-0">
                <strong>Registro:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{data.surgery.hospitalRecord || '--'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <strong>Convênio:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{data.surgery.insuranceName || '--'}</span>
              </div>
              <div className="min-w-0">
                <strong>Carteirinha:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{data.surgery.insuranceNumber || '--'}</span>
              </div>
            </>
          )}
        </div>
            {data.surgery.procedureType === 'convenio' ? (
            <div className="text-xs leading-tight space-y-1">
                {(() => {
                const procs = normalizeCbhpmProcedures(data.surgery.cbhpmProcedures || []);
                const procText = data.surgery.proposedSurgery || procs.map(p => p.description).filter(Boolean).join(' ; ');
                return (
                  <>
                    <div><strong>Procedimento:</strong> {procText || '--'}</div>
                  </>
                );
                })()}
            </div>
            ) : (
            <div className="text-xs leading-tight space-y-1">
                <div><strong>Procedimento:</strong> {data.surgery.proposedSurgery || '--'}</div>
                <div><strong>Cirurgião Principal:</strong> {data.surgery.mainSurgeon || '--'}</div>
            </div>
            )}
        </div>
    </div>
  );

  const ClearanceStatus = () => {
    if (!preAnesthesia?.clearanceStatus) return null;
    
    const statusText = getStatusText(preAnesthesia.clearanceStatus);
    const bgColor = preAnesthesia.clearanceStatus === 'cleared' ? 'bg-green-50' :
                   preAnesthesia.clearanceStatus === 'cleared_with_restrictions' ? 'bg-yellow-50' : 'bg-red-50';
    const borderColor = preAnesthesia.clearanceStatus === 'cleared' ? 'border-green-200' :
                       preAnesthesia.clearanceStatus === 'cleared_with_restrictions' ? 'border-yellow-200' : 'border-red-200';

    return (
      <div className={`mb-3 px-3 py-2 rounded border ${bgColor} ${borderColor} print:${bgColor} print:${borderColor}`}>
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500 -mx-3 -mt-2 mb-2">
          STATUS DA AVALIAÇÃO
        </h2>
        <div className="text-xs leading-tight">
        <div><strong>ASA:</strong> {preAnesthesia?.asaClassification ? `ASA ${preAnesthesia.asaClassification}` : '--'}</div>
          <div><strong>Status:</strong> {statusText}</div>
          {preAnesthesia.clearanceRestrictions && (
            <div><strong>Ressalvas:</strong> {preAnesthesia.clearanceRestrictions}</div>
          )}
          {preAnesthesia.notClearedReason && (
            <div><strong>Motivo:</strong> {preAnesthesia.notClearedReason}</div>
          )}
        </div>
      </div>
    );
  };

  const SpecialInfo = () => {
    if (!preAnesthesia?.isPregnant && !preAnesthesia?.isInfant) return null;

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          INFORMAÇÕES ESPECIAIS
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight space-y-1">
            {preAnesthesia.isPregnant && (
              <div>
                <strong>Gestante:</strong> {preAnesthesia.pregnancyWeeks ? `${preAnesthesia.pregnancyWeeks} semanas` : 'Sim'}
                {renderCheckedList(preAnesthesia.pregnancyComorbidities, preAnesthesia.pregnancyOther) && (
                  <span> - Comorbidades: {renderCheckedList(preAnesthesia.pregnancyComorbidities, preAnesthesia.pregnancyOther)}</span>
                )}
              </div>
            )}
            {preAnesthesia.isInfant && (
              <div>
                <strong>Lactente:</strong> {preAnesthesia.infantMonths ? `${preAnesthesia.infantMonths} meses` : 'Sim'}
                {renderCheckedList(preAnesthesia.pediatricConsiderations, preAnesthesia.pediatricOther) && (
                  <span> - Considerações: {renderCheckedList(preAnesthesia.pediatricConsiderations, preAnesthesia.pediatricOther)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Comorbidities = () => {
    const systems = [
      ['Cardiovascular', preAnesthesia?.cardiovascular, preAnesthesia?.cardiovascular?.cardiovascularOther ?? preAnesthesia?.cardiovascularOther, LABELS.cardiovascular],
      ['Respiratório', preAnesthesia?.respiratory, preAnesthesia?.respiratory?.respiratoryOther ?? preAnesthesia?.respiratoryOther, LABELS.respiratory],
      ['Endócrino', preAnesthesia?.endocrine, preAnesthesia?.endocrine?.endocrineOther ?? preAnesthesia?.endocrineOther, LABELS.endocrine],
      ['Neurológico', preAnesthesia?.neurologic, preAnesthesia?.neurologic?.neurologicOther ?? preAnesthesia?.neurologicOther, LABELS.neurologic],
      ['Digestivo', preAnesthesia?.digestive, preAnesthesia?.digestive?.digestiveOther ?? preAnesthesia?.digestiveOther, LABELS.digestive],
      ['Hematológico', preAnesthesia?.hematologic, preAnesthesia?.hematologic?.hematologicOther ?? preAnesthesia?.hematologicOther, LABELS.hematologic],
      ['Osteomuscular', preAnesthesia?.musculoskeletal, preAnesthesia?.musculoskeletal?.musculoskeletalOther ?? preAnesthesia?.musculoskeletalOther, LABELS.musculoskeletal],
      ['Genitourinário', preAnesthesia?.genitourinary, preAnesthesia?.genitourinary?.genitourinaryOther ?? preAnesthesia?.genitourinaryOther, LABELS.genitourinary],
      ['Genética', preAnesthesia?.geneticSyndromes, preAnesthesia?.geneticSyndromes?.geneticSyndromeOther ?? preAnesthesia?.geneticSyndromeOther, LABELS.geneticSyndromes]
    ];

    const hasComorbidities = systems.some(([, obj, other, labelMap]) => {
      const result = renderCheckedList(obj, other, labelMap);
      return !!result;
    });

    if (!hasComorbidities) return null;

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          COMORBIDADES
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight grid grid-cols-2 gap-x-6 gap-y-0.5">
            {systems.map(([systemName, obj, other, labelMap]) => {
              const result = renderCheckedList(obj, other, labelMap);
              return result ? (
                <div key={systemName}>
                  <strong>{systemName}:</strong> {result}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    );
  };

  const History = () => {
    const hasHistory = preAnesthesia?.noPreviousSurgeries || 
                      (preAnesthesia?.previousSurgeries && preAnesthesia.previousSurgeries.trim()) ||
                      preAnesthesia?.noAnestheticComplications || 
                      (preAnesthesia?.anestheticComplications && preAnesthesia.anestheticComplications.trim());

    if (!hasHistory) return null;

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          HISTÓRICO CIRÚRGICO/ANESTÉSICO
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight space-y-0.5">
            {preAnesthesia.noPreviousSurgeries ? (
              <div>Sem cirurgias prévias</div>
            ) : (
              preAnesthesia.previousSurgeries && preAnesthesia.previousSurgeries.trim() && (
                <div><strong>Cirurgias:</strong> {preAnesthesia.previousSurgeries}</div>
              )
            )}
            {preAnesthesia.noAnestheticComplications ? (
              <div>Sem complicações anestésicas prévias</div>
            ) : (
              preAnesthesia.anestheticComplications && preAnesthesia.anestheticComplications.trim() && (
                <div><strong>Complicações:</strong> {preAnesthesia.anestheticComplications}</div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const MedicationsAllergies = () => {
    const hasMedications = preAnesthesia?.currentMedications && preAnesthesia.currentMedications.trim();
    const hasAllergies = preAnesthesia?.noAllergies || (preAnesthesia?.allergies && preAnesthesia.allergies.trim());

    if (!hasMedications && !hasAllergies) return null;

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          MEDICAMENTOS E ALERGIAS
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight space-y-0.5">
            {hasMedications && (
              <div><strong>Medicamentos:</strong> {preAnesthesia.currentMedications}</div>
            )}
            {preAnesthesia.noAllergies ? (
              <div><strong>Alergias:</strong> Nenhuma</div>
            ) : (
              preAnesthesia.allergies && preAnesthesia.allergies.trim() && (
                <div><strong>Alergias:</strong> {preAnesthesia.allergies}</div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const PhysicalExam = () => {
    if (!preAnesthesia?.physicalExam || !preAnesthesia.physicalExam.trim()) return null;

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          EXAME FÍSICO
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight whitespace-pre-wrap">
            {preAnesthesia.physicalExam}
          </div>
        </div>
      </div>
    );
  };

  const AirwayAssessment = () => {
    const hasMallampati = preAnesthesia?.mallampati;
    const hasFindings = renderCheckedList(preAnesthesia?.airwayFindings, preAnesthesia?.airwayOther, LABELS.airwayFindings);

    if (!hasMallampati && (!hasFindings || hasFindings === 'Sem alterações')) return null;

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          AVALIAÇÃO DA VIA AÉREA
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight space-y-0.5">
            {hasMallampati && <div><strong>Mallampati:</strong> {preAnesthesia.mallampati}</div>}
            {hasFindings && hasFindings !== 'Sem alterações' && (
              <div><strong>Achados:</strong> {hasFindings}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LabResults = () => {
    const hasLabResults = preAnesthesia?.labResults && 
      Object.values(preAnesthesia.labResults).some(v => v !== undefined && v !== null && v !== '');
    const hasOtherLab = preAnesthesia?.otherLabResults && preAnesthesia.otherLabResults.trim();
    const hasEcg = preAnesthesia?.ecgStatus;
    const hasXray = preAnesthesia?.chestXrayStatus;
    const hasOtherExams = preAnesthesia?.otherExams && preAnesthesia.otherExams.trim();

    if (!hasLabResults && !hasOtherLab && !hasEcg && !hasXray && !hasOtherExams) return null;

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          EXAMES COMPLEMENTARES
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight space-y-1">
            {hasLabResults && (
              <div>
                <strong>Laboratório:</strong>{' '}
                {preAnesthesia.labResults.hemoglobin && `Hb: ${preAnesthesia.labResults.hemoglobin}g/dL `}
                {preAnesthesia.labResults.hematocrit && `Ht: ${preAnesthesia.labResults.hematocrit}% `}
                {preAnesthesia.labResults.glucose && `Gli: ${preAnesthesia.labResults.glucose}mg/dL `}
                {preAnesthesia.labResults.urea && `Ureia: ${preAnesthesia.labResults.urea}mg/dL `}
                {preAnesthesia.labResults.creatinine && `Cr: ${preAnesthesia.labResults.creatinine}mg/dL`}
              </div>
            )}
            {hasOtherLab && <div><strong>Outros lab:</strong> {preAnesthesia.otherLabResults}</div>}
            {hasEcg && (
              <div>
                <strong>ECG:</strong> {preAnesthesia.ecgStatus === 'normal' ? 'Normal' : 'Alterado'}
                {preAnesthesia.ecgStatus === 'abnormal' && preAnesthesia.ecgAbnormal && ` (${preAnesthesia.ecgAbnormal})`}
              </div>
            )}
            {hasXray && (
              <div>
                <strong>RX tórax:</strong> {preAnesthesia.chestXrayStatus === 'normal' ? 'Normal' : 'Alterado'}
                {preAnesthesia.chestXrayStatus === 'abnormal' && preAnesthesia.chestXrayAbnormal && ` (${preAnesthesia.chestXrayAbnormal})`}
              </div>
            )}
            {hasOtherExams && <div><strong>Outros:</strong> {preAnesthesia.otherExams}</div>}
          </div>
        </div>
      </div>
    );
  };

  const AnestheticTechnique = () => {
    const hasTechniques = preAnesthesia?.anestheticTechnique && 
      Object.keys(preAnesthesia.anestheticTechnique).some(k => preAnesthesia.anestheticTechnique[k]);

    if (!hasTechniques) return null;

    const techniques = Object.keys(preAnesthesia.anestheticTechnique)
      .filter(k => preAnesthesia.anestheticTechnique[k])
      .map(k => LABELS.anestheticTechnique[k] || k)
      .join(', ');

    return (
      <div className="mb-3">
        <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
          TÉCNICA ANESTÉSICA PROPOSTA
        </h2>
        <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
          <div className="text-xs leading-tight">
            <div><strong>Técnica:</strong> {techniques}</div>
            {preAnesthesia.anestheticTechnique.combined && preAnesthesia.combinedTechnique && (
              <div><strong>Combinada:</strong> {preAnesthesia.combinedTechnique}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Footer = () => (
    <div className="mt-8">
      <div className="text-xs text-gray-600 border-t pt-2 flex justify-between">
        <span>Avaliação realizada em {formatFirestoreDate(preAnesthesia?.createdAt || data.surgery.surgeryDate)}</span>
        <span>Responsável: {responsibleResolved ?? data.surgery.metadata.createdBy}</span>
      </div>
    </div>
  );

  return (
    <div className="preanesthesia-container w-[200mm] h-[287mm] p-[10mm] bg-white overflow-hidden print:h-auto print:w-auto print:max-w-none print:overflow-visible">
      {/* CABEÇALHO */}
      <Header />

      {/* INFORMAÇÕES BÁSICAS */}
      <PatientInfo />

      {/* STATUS DA LIBERAÇÃO */}
      <ClearanceStatus />

      {/* INFORMAÇÕES ESPECIAIS */}
      <SpecialInfo />

      {/* COMORBIDADES */}
      <Comorbidities />

      {/* HISTÓRICO CIRÚRGICO/ANESTÉSICO */}
      <History />

      {/* MEDICAMENTOS E ALERGIAS */}
      <MedicationsAllergies />

      {/* EXAME FÍSICO */}
      <PhysicalExam />

      {/* AVALIAÇÃO DA VIA AÉREA */}
      <AirwayAssessment />

      {/* EXAMES COMPLEMENTARES */}
      <LabResults />

      {/* TÉCNICA ANESTÉSICA */}
      <AnestheticTechnique />

      {/* FOOTER */}
      <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] print:relative print:bottom-auto print:left-auto print:right-auto print:mt-8">
        <Footer />
      </div>
    </div>
  );
};

export default PreAnestheticSheet;