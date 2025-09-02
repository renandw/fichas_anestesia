import React from 'react';
import { Stethoscope, Building, Clock, User } from 'lucide-react';

const SurgeryDisplay = ({ surgery, compact = false }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Não definida';

    // Se for string de data pura (YYYY-MM-DD), formatar manualmente para evitar timezone
    if (typeof dateString === 'string') {
      const m = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const [, y, mo, d] = m;
        return `${d}/${mo}/${y}`;
      }
    }

    // Caso contrário, tentar via Date (para ISO 8601, Timestamp serializado, etc.)
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');

    // Fallback: mostrar como veio
    return String(dateString);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Agendada': 'bg-blue-100 text-blue-800 border-blue-200',
      'Em andamento': 'bg-green-100 text-green-800 border-green-200',
      'Concluída': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cancelada': 'bg-red-100 text-red-800 border-red-200',
      'Expirada': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Interface Mobile
  const MobileView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
            <h2 className="text-white font-medium text-sm leading-tight truncate">
              {surgery.proposedSurgery 
                || (surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0
                    ? surgery.cbhpmProcedures.map(proc => proc.procedimento).join(', ')
                    : 'Procedimento não especificado')}
            </h2>
              <div className="flex items-center gap-2 text-xs text-green-100">
                <span>{surgery.procedureType === 'sus' ? 'SUS' : 'Convênio'}</span>
                <span>•</span>
                <span>{surgery.patientWeight}kg</span>
              </div>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(surgery.status)} ml-2`}>
            {surgery.status}
          </span>
        </div>
      </div>

      {/* Informações principais */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="text-xs">
          <span className="font-medium text-gray-900">Cirurgião: {surgery.mainSurgeon}</span>
        </div>
        {surgery.surgeryDate && (
          <div className="text-xs mt-1">
            <span className="font-medium text-gray-900">Data: {formatDate(surgery.surgeryDate)}</span>
          </div>
        )}
      </div>

      {/* Seção específica baseada no tipo */}
      {surgery.procedureType === 'sus' && (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100 p-1">
          <div className="text-xs text-blue-800 font-medium">SUS</div>
          <div className="text-xs text-blue-700">
            {surgery.hospitalRecord && `BE: ${surgery.hospitalRecord}`}
          </div>
          <div className="text-xs text-blue-700">
            {surgery.hospital}
          </div>
        </div>
      )}

      {surgery.procedureType === 'convenio' && (
        <div className="flex items-center justify-between px-3 py-2 bg-purple-50 border-b border-purple-100 p-1">
            <div className="text-xs text-purple-700">{surgery.insuranceName}</div>
            <div className="text-xs text-purple-700">{surgery.insuranceNumber && ` ${surgery.insuranceNumber}`}</div>
            <div className="text-xs text-purple-700">{surgery.hospital}</div>
        </div>
      )}
    </div>
  );

  // Interface Desktop/Tablet
  const DesktopView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header horizontal compacto */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-900 py-2">
                {surgery.proposedSurgery 
                  || (surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0
                      ? surgery.cbhpmProcedures.map(proc => proc.procedimento).join(', ')
                      : 'Procedimento não especificado')}
                </h2>
                -
                <h3 className="text-sm font-semibold text-gray-900">
                  {surgery.patientWeight}kg
                </h3>
                <p className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(surgery.status)}`}>
                  {surgery.status}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>{surgery.procedureType === 'sus' ? 'SUS' : 'Convênio'}</span>
                <span>Cirurgião: {surgery.mainSurgeon}</span>
                {surgery.surgeryDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(surgery.surgeryDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seções específicas baseadas no tipo */}
      {surgery.procedureType === 'sus' && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">{surgery.procedureType === 'sus' ? 'SUS' : 'Convênio'}</span>
              -
              <span className="font-medium text-blue-900">{surgery.hospital}</span>
            </div>
            <div className="text-sm text-blue-800">
              {surgery.hospitalRecord && `Registro Hospitalar: ${surgery.hospitalRecord}`}
              {surgery.proposedSurgery && surgery.hospitalRecord && ' • '}
              {surgery.proposedSurgery && `Cirurgia Proposta: ${surgery.proposedSurgery}`}
            </div>
          </div>
        </div>
      )}

      {surgery.procedureType === 'convenio' && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-blue-900">{surgery.hospital}</span>
            </div>
            {surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {surgery.cbhpmProcedures.map((proc, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white text-xs rounded-full border border-purple-200"
                >
                  <code className="text-purple-800">{proc.codigo}</code> - 
                  <span className="text-purple-800"> {proc.procedimento}</span> - 
                  <span className="text-purple-800">Porte {proc.porte_anestesico}</span>
                </span>
              ))}
            </div>
            )}
            <div className="flex items-center justify-between text-xs text-purple-700">
              {surgery.insuranceName}
              {surgery.insuranceNumber && ` • ${surgery.insuranceNumber}`}
              {surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0 && 
                ` • ${surgery.cbhpmProcedures.length} procedimento(s) CBHPM`
              }
            </div>
          </div>          
        </div>
      )}

      {/* Cirurgiões auxiliares se existirem */}
      {surgery.auxiliarySurgeons && surgery.auxiliarySurgeons.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600">Auxiliares:</span>
            <div className="flex flex-wrap gap-1">
              {surgery.auxiliarySurgeons.map((surgeon, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200"
                >
                  {surgeon.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Compact view
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
              {surgery.proposedSurgery 
                || (surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0
                    ? surgery.cbhpmProcedures.map(proc => proc.procedimento).join(', ')
                    : 'Procedimento não especificado')}
              </p>
              <p className="font-medium text-xs text-gray-900 truncate">
                {surgery.patientWeight || 'Peso não especificado'}
              </p>
              <div className="flex gap-2 text-xs text-gray-600 mt-0.5">
                <span>{surgery.procedureType === 'sus' ? 'SUS' : 'Convênio'}</span>
                <span>•</span>
                <span>{surgery.mainSurgeon}</span>
                <span>•</span>
              </div>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(surgery.status)} ml-2`}>
            {surgery.status}
          </span>
        </div>
      </div>
    );
  }

  // Detecta se é mobile baseado na largura da tela
  return (
    <div className="w-full">
      {/* Mobile View - visível apenas em telas pequenas */}
      <div className="block md:hidden">
        <MobileView />
      </div>
      
      {/* Desktop View - visível em telas médias e grandes */}
      <div className="hidden md:block">
        <DesktopView />
      </div>
    </div>
  );
};

export default SurgeryDisplay;