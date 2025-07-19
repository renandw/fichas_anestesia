import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Printer,
  Edit,
  FileText,
  User,
  Stethoscope,
  Activity,
  CheckCircle,
  UserCheck // NOVO ÍCONE
} from 'lucide-react';
import VitalChart from './VitalChart';
import PreAnestheticPrint from './PreAnestheticPrint'; // NOVA IMPORTAÇÃO
import PreAnestheticPrintYellow from './PreAnestheticPrintYellow';
import toast from 'react-hot-toast';

const FichaPreview = ({ surgery, onEditSection, autoSave, userProfile }) => {
  const componentRef = useRef();
  const [showPreAnestheticPrint, setShowPreAnestheticPrint] = useState(false);
  const [showYellowPreAnesthetic, setShowYellowPreAnesthetic] = useState(false);
  const [fichaHeight, setFichaHeight] = useState(528); // altura padrão estimada

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ficha_Anestesica_${surgery.id}`,
    onBeforeGetContent: () => {
      console.log('Preparando para imprimir...');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('Impressão concluída');
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
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      return years - 1;
    }
    return years;
  };

  const getHospitalName = () => {
    const rawHospital = surgery?.hospital;
  
    if (!rawHospital) return 'Não informado';
  
    if (typeof rawHospital === 'string') {
      try {
        const parsed = JSON.parse(rawHospital);
        return parsed?.name || rawHospital; // se não tiver `.name`, usa o texto bruto
      } catch {
        return rawHospital; // se não é JSON válido, assume que é o nome direto
      }
    }
  
    if (typeof rawHospital === 'object') {
      return rawHospital?.name || 'Não informado';
    }
  
    return 'Não informado';
  };

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

  const getViaName = (code) => {
    const vias = {
      'EV': 'Endovenoso',
      'IM': 'Intramuscular', 
      'IT': 'Intratecal',
      'PD': 'Peridural',
      'PN': 'Perineural',
      'SC': 'Subcutâneo',
      'SL': 'Sublingual',
      'IN': 'Intranasal',
      'TOP': 'Tópico',
      'VO': 'Via Oral',
      'VR': 'Via Respiratória'
    };
    return vias[code] || code;
  };

  const getStartEndTimes = () => {
    const baseTime = surgery?.startTime || surgery?.createdAt;
    if (!baseTime) return { start: 'N/A', end: 'N/A' };

    let startDate;
    if (baseTime.seconds) {
      startDate = new Date(baseTime.seconds * 1000);
    } else if (typeof baseTime === 'string') {
      startDate = new Date(baseTime);
    } else {
      startDate = new Date(baseTime);
    }

    const start = startDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Para o fim, usar o último registro de sinais vitais ou medicação
    let endTime = start;
    
    const allTimes = [
      ...(surgery.medications || []).map(m => m.time),
      ...(surgery.vitalSigns || []).map(v => v.time)
    ].filter(Boolean);

    if (allTimes.length > 0) {
      // Pegar o último horário registrado
      const sortedTimes = allTimes.sort();
      endTime = sortedTimes[sortedTimes.length - 1];
    }

    return { start, end: endTime };
  };

  // NOVA FUNÇÃO: Renderizar resumo da avaliação pré-anestésica
  const renderPreAnestheticSummary = () => {
    const evaluation = surgery?.preAnestheticEvaluation;
    if (!evaluation || Object.keys(evaluation).length === 0) {
      return (
        <div className="text-xs text-gray-500 italic">
          Avaliação pré-anestésica não realizada
        </div>
      );
    }

    const statusMap = {
      'cleared': { text: 'LIBERADO SEM RESSALVAS', style: 'text-green-700 font-bold' },
      'cleared_with_restrictions': { text: 'LIBERADO COM RESSALVAS', style: 'text-yellow-700 font-bold' },
      'not_cleared': { text: 'NÃO LIBERADO', style: 'text-red-700 font-bold' }
    };

    const clearanceStatus = statusMap[evaluation.clearanceStatus];

    return (
      <div className="text-xs space-y-1">
        {/* Status de liberação */}
        {clearanceStatus && (
          <div className={`${clearanceStatus.style} text-center py-1`}>
            {clearanceStatus.text}
          </div>
        )}
        
        {/* Informações principais */}
        <div className="grid grid-cols-3 gap-4">
          {evaluation.asaClassification && (
            <div><strong>ASA:</strong> {evaluation.asaClassification}</div>
          )}
          
          {evaluation.isPregnant && (
            <div><strong>Gestante:</strong> {evaluation.pregnancyWeeks}sem</div>
          )}
          
          {evaluation.isInfant && (
            <div><strong>Criança:</strong> {evaluation.infantMonths}m</div>
          )}
        </div>

        {/* Comorbidades principais */}
        {(() => {
          const mainComorbidities = [];
          
          if (evaluation.cardiovascular && !evaluation.cardiovascular.none) {
            const cardioConditions = [];
            if (evaluation.cardiovascular.hypertension) cardioConditions.push('HAS');
            if (evaluation.cardiovascular.heartFailure) cardioConditions.push('ICC');
            if (evaluation.cardiovascular.coronaryDisease) cardioConditions.push('DAC');
            if (cardioConditions.length > 0) mainComorbidities.push(`CV: ${cardioConditions.join(', ')}`);
          }
          
          if (evaluation.respiratory && !evaluation.respiratory.none) {
            const respConditions = [];
            if (evaluation.respiratory.asthma) respConditions.push('Asma');
            if (evaluation.respiratory.copd) respConditions.push('DPOC');
            if (evaluation.respiratory.smoking) respConditions.push('Tabagismo');
            if (respConditions.length > 0) mainComorbidities.push(`RESP: ${respConditions.join(', ')}`);
          }
          
          if (evaluation.endocrine && !evaluation.endocrine.none) {
            const endoConditions = [];
            if (evaluation.endocrine.diabetes) endoConditions.push('DM');
            if (evaluation.endocrine.obesity) endoConditions.push('Obesidade');
            if (endoConditions.length > 0) mainComorbidities.push(`ENDO: ${endoConditions.join(', ')}`);
          }

          return mainComorbidities.length > 0 ? (
            <div><strong>Comorbidades:</strong> {mainComorbidities.join('; ')}</div>
          ) : (
            <div><strong>Comorbidades:</strong> Paciente hígido</div>
          );
        })()}

        {/* Técnica anestésica planejada */}
        {evaluation.anestheticTechnique && (() => {
          const techniques = [];
          if (evaluation.anestheticTechnique.generalBalanced) techniques.push('Geral balanceada');
          if (evaluation.anestheticTechnique.spinal) techniques.push('Raquianestesia');
          if (evaluation.anestheticTechnique.epidural) techniques.push('Peridural');
          if (evaluation.anestheticTechnique.plexusBlock) techniques.push('Bloqueio');
          if (evaluation.anestheticTechnique.sedation) techniques.push('Sedação');
          if (evaluation.anestheticTechnique.local) techniques.push('Local');
          
          return techniques.length > 0 ? (
            <div><strong>Técnica planejada:</strong> {techniques.join(', ')}</div>
          ) : null;
        })()}

        {/* Alergias */}
        {evaluation.noAllergies ? (
          <div><strong>Alergias:</strong> NENHUMA</div>
        ) : evaluation.allergies ? (
          <div><strong>Alergias:</strong> {evaluation.allergies}</div>
        ) : null}
      </div>
    );
  };

  // Ordenar medicações por horário
  const sortedMedications = (surgery.medications || []).sort((a, b) => {
    return a.time?.localeCompare(b.time) || 0;
  });

  // Ordenar sinais vitais por horário
  const sortedVitalSigns = (surgery.vitalSigns || []).sort((a, b) => {
    return a.time?.localeCompare(b.time) || 0;
  });

  const { start: startTime, end: endTime } = getStartEndTimes();

  useEffect(() => {
    if (componentRef.current) {
      // Medir altura real da ficha
      const realHeight = componentRef.current.scrollHeight;
      
      // Calcular altura escalada para mobile e desktop
      const mobileHeight = realHeight * 0.47;
      const desktopHeight = realHeight;
      
      // Usar altura baseada no breakpoint
      const isMobile = window.innerWidth < 640; // sm breakpoint
      setFichaHeight(isMobile ? mobileHeight : desktopHeight);
    }
  }, [surgery, sortedMedications, sortedVitalSigns]); // Recalcular quando dados mudarem

  // Recalcular altura quando a tela redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (componentRef.current) {
        const realHeight = componentRef.current.scrollHeight;
        const isMobile = window.innerWidth < 640;
        setFichaHeight(isMobile ? realHeight * 0.47 : realHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Se estiver mostrando a impressão da avaliação pré-anestésica
  if (showPreAnestheticPrint) {
    return (
      <div>
        <div className="no-print mb-4">
          <button onClick={() => setShowPreAnestheticPrint(false)} className="btn-secondary">
            ← Voltar para Ficha Completa
          </button>
        </div>
        <PreAnestheticPrint surgery={surgery} onEditSection={onEditSection} />
      </div>
    );
  }

  if (showYellowPreAnesthetic) {
    return (
      <div>
        <div className="no-print mb-4 flex gap-2">
          <button onClick={() => setShowYellowPreAnesthetic(false)} className="btn-secondary">
            ← Voltar para Ficha Completa
          </button>
          <button onClick={() => {
            setShowYellowPreAnesthetic(false);
            setShowPreAnestheticPrint(true);
          }} className="btn-secondary">
            Ver Versão Branca
          </button>
        </div>
        <PreAnestheticPrintYellow surgery={surgery} onEditSection={onEditSection} />
      </div>
    );
  }

  const handleCompleteSurgery = async () => {
    if (!window.confirm('Finalizar cirurgia? Após finalizada, não será possível fazer alterações.')) {
      return;
    }
    
    try {
      const completedAt = new Date().toISOString();
      await autoSave({ 
        status: 'completado',
        completedAt: completedAt,
        completedBy: userProfile.uid,
        completedByName: userProfile.name
      });
      
      toast.success('Cirurgia finalizada! Ficha bloqueada para edição.');
    } catch (error) {
      console.error('Erro ao finalizar cirurgia:', error);
      toast.error('Erro ao finalizar cirurgia');
    }
  };

  return (
    <div className="flex flex-col h-screen gap-2 sm:gap-4 p-4">
      
      {/* BOTÕES SUPERIORES - altura automática */}
      <div className="no-print space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">
        Ficha Anestésica
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2 sm:justify-end">
          <button onClick={() => setShowPreAnestheticPrint(true)} className="btn-secondary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
            <UserCheck className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ver Avaliação Pré-Anestésica</span>
            <span className="sm:hidden">Pré-Anestésica</span>
          </button>

          {surgery.status === 'em_andamento' && (
            <button onClick={handleCompleteSurgery} className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Finalizar Cirurgia</span>
              <span className="sm:hidden">Finalizar</span>
            </button>
          )}
          
          {surgery.status === 'completado' && (
            <div className="bg-green-100 text-green-800 rounded-lg flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cirurgia Finalizada</span>
              <span className="sm:hidden">Finalizada</span>
            </div>
          )}

          <button onClick={() => onEditSection('identification')} className="btn-secondary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
            <Edit className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Editar Dados</span>
            <span className="sm:hidden">Editar Dados</span>
          </button>
          
          <button onClick={handlePrint} className="btn-primary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
            <Printer className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Imprimir Ficha</span>
            <span className="sm:hidden">Imprimir</span>
          </button>
        </div>
      </div>

      {/* FICHA - altura calculada dinamicamente */}
      <div 
        className="overflow-auto flex justify-center items-start flex-shrink-0"
        style={{
          height: `${fichaHeight + 16}px`, // +16px para padding
          maxHeight: `${fichaHeight + 16}px`
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
          {/* CABEÇALHO */}
          <div className="border-b border-gray-800 pb-1 mb-2">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-0">FICHA ANESTÉSICA</h1>
                <div className="flex items-center space-x-6">
                  <p className="text-xs text-gray-600 mb-0">Registro do procedimento anestésico</p>
                  <div className="flex space-x-4 text-xs text-gray-600">
                    <div><strong>HOSPITAL:</strong> {getHospitalName()}</div>
                    <div><strong>ANESTESIOLOGISTA:</strong> {surgery.createdByName || 'N/A'}</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-blue-100 px-2 py-1 rounded text-sm">
                  <span className="font-bold text-blue-800">{surgery.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* INFORMAÇÕES BÁSICAS */}
          <div className="space-y-1 mb-2 text-xs">
            <div className="grid grid-cols-4 gap-4">
              <div><strong>DATA:</strong> {formatDate(surgery.surgeryDate)}</div>
              <div><strong>PACIENTE:</strong> {surgery.patientName || 'N/A'}</div>
              <div><strong>IDADE:</strong> {calculateAge()} anos</div>
              <div><strong>SEXO:</strong> {surgery.patientSex || 'N/A'}</div>
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
              <div><strong>PERÍODO:</strong> {startTime} → {endTime}</div>
            </div>
          </div>

          {/* MEDICAÇÕES */}
          {sortedMedications.length > 0 && (
            <div className="mb-2">
              <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
                MEDICAÇÕES E FLUIDOS
              </h2>
              
              {(() => {
                // Separar cristalóides e hemoderivados
                const specialCategories = ['Cristalóide', 'Hemoderivados'];
                const cristaloides = sortedMedications.filter(med => 
                  med.category === 'Cristalóide'
                );
                const hemoderivados = sortedMedications.filter(med => 
                  med.category === 'Hemoderivados'
                );

                // Medicações regulares (excluindo cristalóides e hemoderivados)
                const regularMeds = sortedMedications.filter(med => 
                  !specialCategories.includes(med.category)
                );

                const regularMedsByRoute = regularMeds.reduce((acc, med) => {
                  const route = med.via || 'EV';
                  if (!acc[route]) acc[route] = [];
                  acc[route].push(med);
                  return acc;
                }, {});

                // Ordem de prioridade das vias
                const routeOrder = ['EV', 'IT', 'PD', 'PN', 'IM', 'SC', 'SL', 'IN', 'TOP', 'VO', 'VR'];
                const sortedRoutes = Object.keys(regularMedsByRoute).sort((a, b) => {
                  const indexA = routeOrder.indexOf(a);
                  const indexB = routeOrder.indexOf(b);
                  return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });

                return (
                  <div className="text-xs leading-tight">
                    {(() => {
                      const sections = [
                        ...(regularMedsByRoute['VR']
                          ? [{ label: 'Via Respiratória', meds: regularMedsByRoute['VR'] }]
                          : []),
                        ...(cristaloides.length > 0
                          ? [{ label: 'Cristaloides', meds: cristaloides }]
                          : []),
                        ...(hemoderivados.length > 0
                          ? [{ label: 'Hemoderivados', meds: hemoderivados }]
                          : []),
                        ...sortedRoutes
                          .filter(route => route !== 'VR')
                          .map(route => ({
                            label: getViaName(route),
                            meds: regularMedsByRoute[route]
                          }))
                      ];
                      return sections.map((section, idx) => (
                        <span key={section.label} className="mr-1">
                          <strong>{section.label}:</strong> {section.meds.map(m => `${m.name} ${m.dose} (${m.time})`).join('; ')}
                          {idx < sections.length - 1 && '; '}
                        </span>
                      ));
                    })()}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SINAIS VITAIS */}
          {sortedVitalSigns.length > 0 && (
            <div className="mb-2">
              <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
                SINAIS VITAIS
              </h2>
              <div className="mb-1 -mx-2">
                <VitalChart 
                  vitalSigns={sortedVitalSigns} 
                  surgery={surgery}
                  showTitle={false}
                  height={270}
                  compact={true}
                />
              </div>
            </div>
          )}

          {/* DESCRIÇÃO */}
          <div className="mb-2">
            <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-400 pb-1">
              DESCRIÇÃO ANESTÉSICA
            </h2>
            <div className="min-h-16 p-2 border border-gray-300 rounded bg-gray-50 text-xs">
              {surgery.description ? (
                <div className="whitespace-pre-wrap">{surgery.description}</div>
              ) : (
                <div className="text-gray-500 italic">Descrição não preenchida</div>
              )}
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="border-t border-gray-400 pt-2 space-y-2 text-xs">
            <div><strong>PROCEDIMENTO:</strong> {getProceduresList()}</div>

            <div className="grid grid-cols-2 gap-4">
              {surgery.type === 'convenio' && surgery.cbhpmProcedures?.length > 0 && (
                <>
                  <div>
                    <strong>CÓDIGOS CBHPM:</strong> {surgery.cbhpmProcedures.filter(p => p.codigo).map(p => p.codigo).join(', ')}
                  </div>
                  <div>
                    <strong>PORTES:</strong> {surgery.cbhpmProcedures.filter(p => p.porte_anestesico).map(p => p.porte_anestesico).join(', ')}
                  </div>
                </>
              )}
              <div>
                <strong>CIRURGIÃO:</strong> {surgery.mainSurgeon || 'N/A'}
              </div>
              <div>
                <strong>POSIÇÃO:</strong> {surgery.patientPosition || 'N/A'}
              </div>
            </div>

            {surgery.auxiliarySurgeons?.some(aux => aux.name) && (
              <div>
                <strong>AUXILIARES:</strong> {surgery.auxiliarySurgeons.filter(aux => aux.name).map(aux => aux.name).join(', ')}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-2 pt-2 border-t border-gray-400 text-center text-xs text-gray-600">
            <div>
              {surgery.status === 'completado' && surgery.completedAt ? (
                <>
                  Ficha finalizada em {new Date(surgery.completedAt).toLocaleString('pt-BR')} | 
                  <strong> Responsável:</strong> {surgery.completedByName || surgery.createdByName || 'N/A'}
                </>
              ) : (
                <>
                  Ficha gerada em {new Date().toLocaleString('pt-BR')} | 
                  <strong> Responsável:</strong> {surgery.createdByName || 'N/A'}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES INFERIORES - altura automática */}
      <div className="no-print grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 flex-shrink-0">
        <button onClick={() => onEditSection('identification')} className="btn-secondary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
          <User className="h-4 w-4 mr-2" />
          Editar Identificação
        </button>
        <button onClick={() => onEditSection('preanesthetic')} className="btn-secondary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
          <UserCheck className="h-4 w-4 mr-2" />
          Editar Pré-Anestésica
        </button>
        <button onClick={() => onEditSection('medications')} className="btn-secondary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
          <Stethoscope className="h-4 w-4 mr-2" />
          Editar Medicações
        </button>
        <button onClick={() => onEditSection('vitals')} className="btn-secondary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
          <Activity className="h-4 w-4 mr-2" />
          Editar Sinais Vitais
        </button>
        <button onClick={() => onEditSection('description')} className="btn-secondary flex items-center justify-center text-xs px-2 py-2 sm:px-4 sm:py-2">
          <FileText className="h-4 w-4 mr-2" />
          Editar Descrição
        </button>
      </div>

    </div>
  );
};

// Estilos globais de impressão para margens consistentes no Safari e outros navegadores
<style>{`
  @media print {
    @page {
      size: A4;
      margin-top: 2cm;
      margin-bottom: 2cm;
      margin-left: 1.5cm;
      margin-right: 1.5cm;
    }
    html, body {
      padding: 0 !important;
      margin: 0 !important;
      height: 100%;
    }
    .print-page {
      padding: 0 !important;
      box-sizing: border-box !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`}</style>

export default FichaPreview;