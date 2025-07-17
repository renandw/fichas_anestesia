import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, UserCheck } from 'lucide-react';

const PreAnestheticPrint = ({ surgery, onEditSection }) => {
  const componentRef = useRef();
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Avaliacao_Pre_Anestesica_${surgery.id}`,
    onBeforeGetContent: () => {
      console.log('Preparando impressão da avaliação pré-anestésica...');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('Impressão da avaliação concluída');
    },
    removeAfterPrint: false
  });

  // Helper functions
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const calculateAge = () => {
    if (!surgery?.patientBirthDate) return 'N/A';
    
    const birth = new Date(surgery.patientBirthDate);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    let ageText = '';
    if (years > 0) {
      ageText += `${years} ano${years !== 1 ? 's' : ''}`;
      if (months > 0) ageText += `, ${months} mês${months !== 1 ? 'es' : ''}`;
    } else if (months > 0) {
      ageText += `${months} mês${months !== 1 ? 'es' : ''}`;
      if (days > 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
    } else {
      ageText = `${days} dia${days !== 1 ? 's' : ''}`;
    }

    return ageText;
  };

  const getHospitalName = () => {
    try {
      const hospital = typeof surgery?.hospital === 'string' 
        ? JSON.parse(surgery.hospital) 
        : surgery.hospital;
      return hospital?.name || 'Não informado';
    } catch {
      return 'Não informado';
    }
  };

  const evaluation = surgery?.preAnestheticEvaluation || {};

  // Função para renderizar comorbidades de um sistema
  const renderSystemComorbidities = (systemData, systemOther, title) => {
    if (!systemData || Object.keys(systemData).length === 0) return null;

    const conditions = [];
    
    if (systemData.none) {
      return `${title}: Nega diagnóstico`;
    }

    // Mapear as condições baseado no sistema
    const conditionMaps = {
      'CARDIOVASCULAR': {
        hypertension: 'HAS',
        heartFailure: 'ICC',
        coronaryDisease: 'DAC',
        arrhythmias: 'Arritmias',
        valvular: 'Valvulopatias'
      },
      'RESPIRATÓRIO': {
        asthma: 'Asma',
        copd: 'DPOC',
        pneumonia: 'Pneumonia prévia',
        smoking: 'Tabagismo',
        sleepApnea: 'Apneia do sono'
      },
      'ENDÓCRINO': {
        diabetes: 'DM',
        hypothyroid: 'Hipotireoidismo',
        hyperthyroid: 'Hipertireoidismo',
        obesity: 'Obesidade'
      },
      'DIGESTIVO': {
        gerd: 'DRGE',
        hepatopathy: 'Hepatopatia',
        pepticUlcer: 'Úlcera péptica',
        cholelithiasis: 'Colelitíase'
      },
      'HEMATOLÓGICO': {
        anemia: 'Anemia',
        coagulopathy: 'Coagulopatias',
        anticoagulants: 'Uso anticoagulantes'
      },
      'ÓSSEO/MUSCULAR': {
        arthritis: 'Artrite/Artrose',
        osteoporosis: 'Osteoporose',
        myopathy: 'Miopatias'
      },
      'GENITURINÁRIO': {
        chronicKidneyDisease: 'IRC',
        recurrentUti: 'ITU recorrente',
        prostaticHyperplasia: 'Hiperplasia prostática'
      }
    };

    const conditionMap = conditionMaps[title] || {};
    
    Object.keys(systemData).forEach(key => {
      if (key !== 'none' && systemData[key] && conditionMap[key]) {
        conditions.push(conditionMap[key]);
      }
    });

    if (systemOther) {
      conditions.push(systemOther);
    }

    return conditions.length > 0 ? `${title}: ${conditions.join(', ')}` : null;
  };

  const getLibACAOMedications = () => {
    if (!evaluation.clearanceStatus) return null;
    
    const statusMap = {
      'cleared': { text: 'LIBERADO SEM RESSALVAS', color: 'text-green-700', bgColor: 'bg-green-100' },
      'cleared_with_restrictions': { text: 'LIBERADO COM RESSALVAS', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      'not_cleared': { text: 'NÃO LIBERADO', color: 'text-red-700', bgColor: 'bg-red-100' }
    };

    return statusMap[evaluation.clearanceStatus] || null;
  };

  const clearanceInfo = getLibACAOMedications();

  const getProceduresList = () => {
    if (surgery?.type === 'sus') {
      return surgery.proposedSurgery || 'Procedimento não informado';
    }
    
    if (surgery?.cbhpmProcedures?.length > 0) {
      return surgery.cbhpmProcedures
        .filter(p => p.procedimento)
        .map(p => p.procedimento)
        .join('; ');
    }
    
    return 'Procedimento não informado';
  };

  return (
    <div className="space-y-4">
      {/* Header com botões de ação */}
      <div className="no-print flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <UserCheck className="h-5 w-5 text-primary-600 mr-2" />
          Avaliação Pré-Anestésica
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEditSection('preanesthetic')}
            className="btn-secondary flex items-center"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Editar Avaliação
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Avaliação
          </button>
        </div>
      </div>

      {/* Ficha para impressão */}
      <div 
        className="overflow-auto flex justify-center items-start flex-shrink-0"
        style={{
          height: 'calc(100vh - 100px)', // altura ajustável, pode ser dinâmica
          maxHeight: 'calc(100vh - 100px)'
        }}
      >
        <div 
          ref={componentRef}
          className="bg-white px-4 py-2 print-page mx-auto origin-top scale-[0.47] sm:scale-100 print:scale-100 print:overflow-visible print:shadow-none print:border-0 print:p-8"
          style={{
            width: '794px',
            minWidth: '794px',
            maxWidth: '794px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            lineHeight: '1.2',
            color: '#000',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
            boxShadow: 'none',
            border: 'none'
          }}
        >
        {/* Cabeçalho */}
        <div className="border-b-2 border-gray-800 pb-2 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-0">
                AVALIAÇÃO PRÉ-ANESTÉSICA
              </h1>
              <div className="flex items-center space-x-6">
                <p className="text-xs text-gray-600 mb-0">
                  Avaliação do risco anestésico
                </p>
                <div className="flex space-x-4 text-xs text-gray-600">
                  <div><strong>HOSPITAL:</strong> {getHospitalName()}</div>
                  <div><strong>ANESTESIOLOGISTA:</strong> {surgery.createdByName || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-100 px-2 py-1 rounded text-sm">
                <span className="font-bold text-blue-800">
                  {surgery.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações básicas do paciente */}
        <div className="space-y-1 mb-4 text-xs">
          <div className="grid grid-cols-4 gap-4">
            <div><strong>DATA:</strong> {formatDate(surgery.surgeryDate)}</div>
            <div><strong>PACIENTE:</strong> {surgery.patientName || 'N/A'}</div>
            <div><strong>IDADE:</strong> {calculateAge()}</div>
            <div><strong>SEXO:</strong> {(surgery.patientSex || 'N/A').toUpperCase()}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><strong>PESO:</strong> {surgery.patientWeight ? `${surgery.patientWeight}kg` : 'N/A'}</div>
            <div>
              {surgery.type === 'sus'
                ? <><strong>CNS:</strong> {surgery.patientCNS || 'N/A'}</>
                : <><strong>CONVÊNIO:</strong> {surgery.insuranceName || 'N/A'}</>}
            </div>
            <div>
              {surgery.type === 'sus'
                ? <><strong>REGISTRO:</strong> {surgery.hospitalRecord || 'N/A'}</>
                : <><strong>MATRÍCULA:</strong> {surgery.insuranceNumber || 'N/A'}</>}
            </div>
            <div><strong>HORÁRIO:</strong> {surgery.surgeryTime || 'N/A'}</div>
          </div>
        </div>

        {/* Procedimento */}
        <div className="mb-3">
          <h2 
            className="text-sm font-bold mb-2 pb-1"
            style={{ 
              color: '#92400e',
              borderBottom: '1px solid #d97706'
            }}
          >
            PROCEDIMENTO CIRÚRGICO
          </h2>
          <div className="text-xs">
            <div><strong>Procedimento:</strong> {getProceduresList()}</div>
            
            {surgery?.type === 'convenio' && surgery?.cbhpmProcedures?.length > 0 && (
              <>
                <div className="mt-1">
                  <strong>Códigos CBHPM:</strong> {surgery.cbhpmProcedures.filter(p => p.codigo).map(p => p.codigo).join(', ')}
                </div>
                <div>
                  <strong>Portes Anestésicos:</strong> {surgery.cbhpmProcedures.filter(p => p.porte_anestesico).map(p => p.porte_anestesico).join(', ')}
                </div>
              </>
            )}
            
            <div className="mt-1">
              <strong>Cirurgião:</strong> {surgery?.mainSurgeon || 'N/A'}
            </div>
          </div>
        </div>

        {/* Status de liberação - destaque */}
        {clearanceInfo && (
          <div className={`${clearanceInfo.bgColor} border-2 ${clearanceInfo.color.replace('text-', 'border-')} p-3 mb-4 rounded`}>
            <div className="text-center">
              <h2 className={`text-lg font-bold ${clearanceInfo.color} mb-1`}>
                {clearanceInfo.text}
              </h2>
              {evaluation.clearanceRestrictions && (
                <p className="text-sm"><strong>Ressalvas:</strong> {evaluation.clearanceRestrictions}</p>
              )}
              {evaluation.notClearedReason && (
                <p className="text-sm"><strong>Motivo:</strong> {evaluation.notClearedReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Informações especiais */}
        {(evaluation.isPregnant || evaluation.isInfant) && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              INFORMAÇÕES ESPECIAIS
            </h2>
            <div className="text-xs space-y-1">
              {evaluation.isPregnant && (
                <div>
                  <strong>GESTANTE:</strong> {evaluation.pregnancyWeeks} semanas de IG
                  {evaluation.pregnancyOther && <span> - {evaluation.pregnancyOther}</span>}
                </div>
              )}
              {evaluation.isInfant && (
                <div>
                  <strong>CRIANÇA &lt; 1 ANO:</strong> {evaluation.infantMonths} meses
                  {evaluation.pediatricOther && <span> - {evaluation.pediatricOther}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ASA Classification */}
        {evaluation.asaClassification && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              CLASSIFICAÇÃO ASA
            </h2>
            <div className="text-center bg-gray-100 p-2 rounded">
              <span className="text-lg font-bold text-primary-600">
                ASA {evaluation.asaClassification}
              </span>
            </div>
          </div>
        )}

        {/* Comorbidades */}
        <div className="mb-3">
          <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            COMORBIDADES
          </h2>
          <div className="text-xs space-y-1">
            {[
              renderSystemComorbidities(evaluation.cardiovascular, evaluation.cardiovascularOther, 'CARDIOVASCULAR'),
              renderSystemComorbidities(evaluation.respiratory, evaluation.respiratoryOther, 'RESPIRATÓRIO'),
              renderSystemComorbidities(evaluation.endocrine, evaluation.endocrineOther, 'ENDÓCRINO'),
              renderSystemComorbidities(evaluation.digestive, evaluation.digestiveOther, 'DIGESTIVO'),
              renderSystemComorbidities(evaluation.hematologic, evaluation.hematologicOther, 'HEMATOLÓGICO'),
              renderSystemComorbidities(evaluation.musculoskeletal, evaluation.musculoskeletalOther, 'ÓSSEO/MUSCULAR'),
              renderSystemComorbidities(evaluation.genitourinary, evaluation.genitourinaryOther, 'GENITURINÁRIO')
            ].filter(Boolean).map((item, index) => (
              <div key={index}>{item}</div>
            ))}
            
            {[
              evaluation.cardiovascular,
              evaluation.respiratory,
              evaluation.endocrine,
              evaluation.digestive,
              evaluation.hematologic,
              evaluation.musculoskeletal,
              evaluation.genitourinary
            ].every(system => !system || Object.keys(system).length === 0 || system.none) && (
              <div className="italic text-gray-600">Sem comorbidades registradas</div>
            )}
          </div>
        </div>

        {/* Histórico cirúrgico */}
        <div className="mb-3">
          <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            HISTÓRICO CIRÚRGICO/ANESTÉSICO
          </h2>
          <div className="text-xs space-y-1">
            {evaluation.noPreviousSurgeries ? (
              <div>Sem cirurgias prévias</div>
            ) : evaluation.previousSurgeries ? (
              <div><strong>Cirurgias prévias:</strong> {evaluation.previousSurgeries}</div>
            ) : null}
            
            {evaluation.noAnestheticComplications ? (
              <div>Sem complicações anestésicas prévias</div>
            ) : evaluation.anestheticComplications ? (
              <div><strong>Complicações:</strong> {evaluation.anestheticComplications}</div>
            ) : null}
            
            {!evaluation.noPreviousSurgeries && !evaluation.previousSurgeries && 
             !evaluation.noAnestheticComplications && !evaluation.anestheticComplications && (
              <div className="italic text-gray-600">Histórico não informado</div>
            )}
          </div>
        </div>

        {/* Medicamentos e alergias */}
        <div className="mb-3">
          <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            MEDICAMENTOS E ALERGIAS
          </h2>
          <div className="text-xs space-y-1">
            {evaluation.currentMedications ? (
              <div><strong>Medicamentos em uso:</strong> {evaluation.currentMedications}</div>
            ) : (
              <div>Sem medicamentos em uso informados</div>
            )}
            
            {evaluation.noAllergies ? (
              <div><strong>Alergias:</strong> Sem alergias conhecidas</div>
            ) : evaluation.allergies ? (
              <div><strong>Alergias:</strong> {evaluation.allergies}</div>
            ) : (
              <div><strong>Alergias:</strong> Não informado</div>
            )}
          </div>
        </div>

        {/* Via aérea */}
        {(evaluation.mallampati || evaluation.airwayFindings || evaluation.airwayOther) && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              VIA AÉREA
            </h2>
            <div className="text-xs space-y-1">
              {evaluation.mallampati && (
                <div><strong>Mallampati:</strong> {evaluation.mallampati}</div>
              )}
              
              {evaluation.airwayFindings && (
                <div>
                  {Object.entries(evaluation.airwayFindings).filter(([key, value]) => value).map(([key, value]) => {
                    const labels = {
                      mouthOpening: 'Abertura bucal > 3cm',
                      neckLimitation: 'Pescoço curto/limitação cervical',
                      looseTeeth: 'Dentes soltos',
                      dentures: 'Próteses'
                    };
                    return labels[key];
                  }).join(', ')}
                </div>
              )}
              
              {evaluation.airwayOther && (
                <div><strong>Outras alterações:</strong> {evaluation.airwayOther}</div>
              )}
            </div>
          </div>
        )}

        {/* Exame físico */}
        <div className="mb-3">
          <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
            EXAME FÍSICO
          </h2>
          <div className="text-xs">
            {evaluation.physicalExam || 'Sem alterações dignas de nota'}
          </div>
        </div>

        {/* Exames complementares */}
        {(evaluation.labResults || evaluation.otherLabResults || evaluation.ecgStatus || evaluation.chestXrayStatus || evaluation.otherExams) && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              EXAMES COMPLEMENTARES
            </h2>
            <div className="text-xs space-y-1">
              {/* Laboratório */}
              {evaluation.labResults && Object.values(evaluation.labResults).some(val => val) && (
                <div>
                  <strong>Laboratório:</strong> {
                    Object.entries(evaluation.labResults)
                      .filter(([key, value]) => value)
                      .map(([key, value]) => {
                        const labels = {
                          hemoglobin: 'Hb',
                          hematocrit: 'Ht',
                          glucose: 'Glicemia',
                          urea: 'Ureia',
                          creatinine: 'Creatinina'
                        };
                        const units = {
                          hemoglobin: 'g/dL',
                          hematocrit: '%',
                          glucose: 'mg/dL',
                          urea: 'mg/dL',
                          creatinine: 'mg/dL'
                        };
                        return `${labels[key]}: ${value}${units[key]}`;
                      }).join(', ')
                  }
                </div>
              )}
              
              {evaluation.otherLabResults && (
                <div>{evaluation.otherLabResults}</div>
              )}
              
              {/* Imagem */}
              {evaluation.ecgStatus && (
                <div>
                  <strong>ECG:</strong> {evaluation.ecgStatus === 'normal' ? 'Normal' : `Alterado - ${evaluation.ecgAbnormal}`}
                </div>
              )}
              
              {evaluation.chestXrayStatus && (
                <div>
                  <strong>RX Tórax:</strong> {evaluation.chestXrayStatus === 'normal' ? 'Normal' : `Alterado - ${evaluation.chestXrayAbnormal}`}
                </div>
              )}
              
              {evaluation.otherExams && (
                <div><strong>Outros exames:</strong> {evaluation.otherExams}</div>
              )}
            </div>
          </div>
        )}

        {/* Técnica anestésica */}
        {evaluation.anestheticTechnique && Object.values(evaluation.anestheticTechnique).some(val => val) && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              TÉCNICA ANESTÉSICA PLANEJADA
            </h2>
            <div className="text-xs">
              {Object.entries(evaluation.anestheticTechnique)
                .filter(([key, value]) => value)
                .map(([key, value]) => {
                  const labels = {
                    generalBalanced: 'Geral balanceada',
                    generalIv: 'Geral venosa',
                    spinal: 'Raquianestesia',
                    epidural: 'Peridural',
                    plexusBlock: 'Bloqueio de plexo',
                    sedation: 'Sedação',
                    local: 'Local',
                    combined: 'Combinada'
                  };
                  return labels[key];
                }).join(', ')}
              
              {evaluation.combinedTechnique && (
                <span> - {evaluation.combinedTechnique}</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-gray-400 text-center text-xs text-gray-600">
          <div>
            Avaliação realizada em {new Date().toLocaleString('pt-BR')} | 
            <strong> Anestesiologista:</strong> {surgery.createdByName || 'N/A'}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PreAnestheticPrint;