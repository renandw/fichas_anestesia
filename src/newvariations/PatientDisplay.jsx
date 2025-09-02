import React from 'react';
import { User, Calendar } from 'lucide-react';

const PatientDisplay = ({ patient, compact = false }) => {
  const formatDate = (dateString) => {
    // Formatar data pura (YYYY-MM-DD) sem usar Date (evita problemas de fuso)
    if (!dateString || typeof dateString !== 'string') return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [y, m, d] = parts;
    if (!y || !m || !d) return dateString;
    return `${d}/${m}/${y}`;
  };

  const formatCNS = (cns) => {
    // Formatar CNS: 123 4567 8901 2345
    return cns.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  };

  const calculateAge = (birthDate) => {
    // birthDate é data pura (YYYY-MM-DD). Construir Date local para evitar UTC shift
    if (!birthDate || typeof birthDate !== 'string') return '';
    const parts = birthDate.split('-');
    if (parts.length !== 3) return '';
    const [y, m, d] = parts.map(v => parseInt(v, 10));
    if (!y || !m || !d) return '';

    const today = new Date();
    const birth = new Date(y, m - 1, d); // construtor LOCAL

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Interface Mobile
  const MobileView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-medium text-sm leading-tight truncate">
              {patient.patientName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span>{calculateAge(patient.patientBirthDate)} anos</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(patient.patientBirthDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CNS */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">CNS:</span>
          <span className="text-xs font-mono font-medium text-gray-900">
            {formatCNS(patient.patientCNS)}
          </span>
        </div>
      </div>
    </div>
  );

  // Interface Desktop/Tablet
  const DesktopView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header horizontal compacto */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {patient.patientName}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>{calculateAge(patient.patientBirthDate)} anos</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(patient.patientBirthDate)}
                </span>
                <span>{patient.patientSex === 'M' ? 'Masculino' : 'Feminino'}</span>
              </div>
            </div>
          </div>
          
          {/* CNS destacado à direita */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">CNS</div>
            <div className="text-sm font-mono font-semibold text-gray-900">
              {formatCNS(patient.patientCNS)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Compact view (mantém similar ao original mas melhorado)
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{patient.patientName}</p>
            <div className="flex gap-2 text-xs text-gray-600 mt-0.5">
              <span>{calculateAge(patient.patientBirthDate)} anos</span>
              <span>•</span>
              <span>{patient.patientSex === 'M' ? 'M' : 'F'}</span>
              <span>•</span>
              <span className="font-mono">...{patient.patientCNS.slice(-4)}</span>
            </div>
          </div>
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

export default PatientDisplay;