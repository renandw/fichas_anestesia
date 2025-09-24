import React, { useEffect } from 'react';
import VitalChart from '../VitalSigns/VitalChart';


const AnesthesiaSheet = ({ 
  data, 
  responsibleResolved, 
  medicationGroups, 
  displayVitalSigns, 
  displayAnesthesia,
  vitalSignsLoading,
  vitalSignsError,
  surgery,
  chartHeight = 250,
  formatFirestoreDate,
  formatTime,
  formatAge,
  formatMedicationTime,
  formatMedicationGroup,
  normalizeCbhpmProcedures
}) => {

  console.log('🔵 AnesthesiaSheet renderizando');
  // Helper: garante que valores tipo {name: "..."} ou arrays virem string segura para JSX
  const asText = (v) => {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (Array.isArray(v)) return v.map(asText).filter(Boolean).join(', ');
    if (typeof v === 'object' && typeof v.name === 'string') return v.name;
    const s = String(v);
    return s === '[object Object]' ? '' : s;
  };

  useEffect(() => {
    const prev = document.title;
    const safeName = asText(data?.patient?.patientName);
    const safeCode = asText(data?.surgery?.code);
    const name = (safeName || '').replace(/[\\/:*?"<>|]/g, '-');
    const code = (safeCode || '').replace(/[\\/:*?"<>|]/g, '-');
    if (name || code) document.title = `Ficha Anestésica - ${name} - ${code}`;
    return () => { document.title = prev; };
  }, [data?.patient?.patientName, data?.surgery?.code]);
  
  // ===== Subcomponentes =====
  const Header = () => (
    <div className="mb-4 border-b-2 border-blue-600 pb-1">
      {/* Primeira linha */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold text-gray-900">FICHA ANESTÉSICA</h1>
        <span className="bg-blue-100 px-3 py-1 rounded text-sm text-blue-800 font-bold border border-blue-200 print:bg-blue-100 print:border-blue-200">
          {asText(data.surgery.code)}
        </span>
      </div>
      {/* Segunda linha */}
      <div className="text-xs text-gray-700 flex justify-between">
        <span><strong>Hospital:</strong> {asText(data.surgery.hospital)}</span>
        <span><strong>Responsável:</strong> {asText(responsibleResolved ?? data.surgery.metadata.createdBy)}</span>
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
            <span
              className="inline-block align-bottom max-w-full break-words whitespace-normal"
              title={asText(data.patient.patientName)}
            >
              {asText(data.patient.patientName)}
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
          <div><strong>Sexo:</strong> {asText(data.patient.patientSex)}</div>
          <div><strong>Peso:</strong> {asText(data.surgery.patientWeight)}kg</div>
          {data.surgery.procedureType === 'sus' ? (
            <>
              <div className="min-w-0">
                <strong>CNS:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{asText(data.patient.patientCNS) || '--'}</span>
              </div>
              <div className="min-w-0">
                <strong>Registro:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{asText(data.surgery.hospitalRecord) || '--'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <strong>Convênio:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{asText(data.surgery.insuranceName) || '--'}</span>
              </div>
              <div className="min-w-0">
                <strong>Carteirinha:</strong>{' '}
                <span className="inline-block max-w-full break-words whitespace-normal">{asText(data.surgery.insuranceNumber) || '--'}</span>
              </div>
            </>
          )}
        </div>
        <div className="col-span-2">
          <strong>Período:</strong> {formatTime(data.anesthesia?.anesthesiaStart) || '--'} → {formatTime(data.anesthesia?.anesthesiaEnd) || '--'}
        </div>
      </div>
    </div>
  );

  const MedicationGroups = () => (
    <div className="mb-3">
      <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
        MEDICAÇÕES E FLUIDOS
      </h2>
      <div className="pt-2 px-3 pb-3 border text-xs border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
        <div className="text-xs leading-tight space-y-0.5">
          {Object.entries(medicationGroups).map(([groupName, medications], index) => {
            const formatted = formatMedicationGroup(groupName, medications);
            return formatted ? (
              <span key={groupName}>
                <strong className="text-black-700 print:text-black-700">{asText(formatted.groupLabel)}:</strong>{" "}
                <span>{asText(formatted.medsText)}</span>
                {index < Object.entries(medicationGroups).length - 1 && '; '}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );

  const VitalSigns = () => {
    if (vitalSignsLoading) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Carregando sinais vitais...</p>
        </div>
      );
    }
  
    if (vitalSignsError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">Erro ao carregar sinais vitais: {asText(vitalSignsError)}</p>
        </div>
      );
    }
  
    if (displayVitalSigns.length > 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm -mx-3 sm:mx-0 overflow-hidden print:overflow-visible">
          <div className="chart-box" style={{ width: '100%', height: `${chartHeight}px` }}>
            <VitalChart
              vitalSigns={displayVitalSigns}
              surgery={surgery}
              anesthesia={displayAnesthesia}
              showTitle={true}
              height={chartHeight}
            />
          </div>
        </div>
      );
    }
  
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">Nenhum sinal vital registrado ainda.</p>
      </div>
    );
  };

  const AnesthesiaDescription = () => (
    <div className="mb-3">
      <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
        DESCRIÇÃO ANESTÉSICA
      </h2>
      <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
        {data.anesthesia?.anesthesiaDescription?.finalDescription ? (
          <div className="whitespace-pre-wrap text-xs leading-tight">
            {asText(data.anesthesia.anesthesiaDescription.finalDescription)}
          </div>
        ) : (
          <div className="text-gray-500 italic text-xs">Descrição não preenchida</div>
        )}
      </div>
    </div>
  );

  const TeamAndProcedures = () => (
    <div className="mb-3">
      <h2 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 print:bg-gray-200 print:border-blue-500">
        EQUIPE CIRÚRGICA E PROCEDIMENTOS
      </h2>
      <div className="pt-2 px-3 pb-3 border border-gray-200 border-t-0 rounded-b bg-white print:border-gray-200">
        {data.surgery.procedureType === 'convenio' ? (
          <div className="text-xs leading-tight space-y-1">
            <div><strong>Cirurgião Principal:</strong> {asText(data.surgery.mainSurgeon) || '--'}</div>
            <div><strong>Auxiliares:</strong> {asText(data.surgery.auxiliarySurgeons) || '--'}</div>
            <div><strong>Posição:</strong> {asText(data.anesthesia.patientPosition) || '--'}</div>
            {(() => {
              const procs = normalizeCbhpmProcedures(data.surgery.cbhpmProcedures || []);

              // Ordena os OBJETOS para manter código, procedimento e porte sincronizados
              const procsSorted = [...procs].sort((a, b) => {
                const pa = Number(a.porte) || 0;
                const pb = Number(b.porte) || 0;
                if (pa !== pb) return pb - pa; // porte desc (maior primeiro)

                const ca = asText(a.code);
                const cb = asText(b.code);
                return ca.localeCompare(cb, 'pt-BR', { numeric: true, sensitivity: 'base' });
              });

              // Depois de ordenar, derivamos os textos a partir do MESMO array
              const procText =
                asText(data.surgery.proposedSurgery) ||
                procsSorted.map(p => asText(p.description)).filter(Boolean).join(' ; ');

              const codes = procsSorted
                .map(p => asText(p.code))
                .filter(Boolean)
                .join(', ');

              const portes = procsSorted
                .map(p => asText(p.porte))
                .filter(Boolean)
                .join(', ');

              return (
                <>
                  <div><strong>Procedimento:</strong> {procText || '--'}</div>
                  <div><strong>Códigos CBHPM:</strong> {codes || '--'}</div>
                  <div><strong>Portes:</strong> {portes || '--'}</div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="text-xs leading-tight space-y-1">
            <div><strong>Procedimento SUS:</strong> {asText(data.surgery.proposedSurgery) || '--'}</div>
            <div><strong>Cirurgião Principal:</strong> {asText(data.surgery.mainSurgeon) || '--'}</div>
            <div><strong>Auxiliares:</strong> {asText(data.surgery.auxiliarySurgeons) || '--'}</div>
            <div><strong>Posição:</strong> {asText(data.anesthesia.patientPosition) || '--'}</div>
            <div><strong>Procedimento:</strong> {asText(data.surgery.proposedSurgery) || '--'}</div>
          </div>
        )}
      </div>
    </div>
  );

  const Footer = () => (
    <div className="mt-8">
      <div className="text-xs text-gray-600 border-t pt-2 flex justify-between">
        <span>Ficha finalizada em {formatTime(data.anesthesia?.anesthesiaEnd) || '--'} {formatFirestoreDate(data.surgery.surgeryDate)} </span>
        <span>Responsável: {asText(responsibleResolved ?? data.surgery.metadata.createdBy)}</span>
      </div>
    </div>
  );


  return (
    <>
    <div className="anesthesia-container w-[200mm] h-[287mm] p-[10mm] bg-white overflow-hidden print:h-auto print:w-auto print:max-w-none print:overflow-visible">
      {/* CABEÇALHO */}
      <Header />

      {/* INFORMAÇÕES BÁSICAS */}
      <PatientInfo />

      {/* MEDICAÇÕES E FLUIDOS */}
      <MedicationGroups />

      {/* VITAL CHARTS */}
      <VitalSigns />

      {/* DESCRIÇÃO ANESTÉSICA */}
      <AnesthesiaDescription />

      {/* EQUIPE CIRÚRGICA E PROCEDIMENTOS */}
      <TeamAndProcedures />

      {/* FOOTER */}
      <div className="mt-8">
        <Footer />
      </div>
    </div>
    </>
  );
};

export default AnesthesiaSheet;