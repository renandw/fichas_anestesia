import React from 'react';
import { Stethoscope, Clock, Activity } from 'lucide-react';

// Normalizador seguro para Date/Timestamp/ISO/pt-BR
const safeToDate = (val) => {
  if (!val) return null;
  try {
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (val && typeof val.toDate === 'function') return val.toDate(); // Firestore Timestamp
    if (typeof val === 'object' && val !== null) {
      if (typeof val.seconds === 'number') return new Date(val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1e6) : 0));
      if (typeof val._seconds === 'number') return new Date(val._seconds * 1000 + (val._nanoseconds ? Math.floor(val._nanoseconds / 1e6) : 0));
    }
    if (typeof val === 'number') return new Date(val < 1e12 ? val * 1000 : val);
    if (typeof val === 'string') {
      const s = val.trim();
      const native = new Date(s);
      if (!isNaN(native.getTime())) return native;
      const meses = { janeiro:0, fevereiro:1, marco:2, março:2, abril:3, maio:4, junho:5, julho:6, agosto:7, setembro:8, outubro:9, novembro:10, dezembro:11 };
      const re = /(\d{1,2})\s+de\s+([a-zçãéó]+)\s+de\s+(\d{4}).*?(\d{1,2}):(\d{2})(?::(\d{2}))?.*?UTC\s*([+-]?\d{1,2})/i;
      const m = s.match(re);
      if (m) {
        const dia = parseInt(m[1], 10);
        const mesNome = m[2].normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const mes = meses[mesNome];
        const ano = parseInt(m[3], 10);
        const hh = parseInt(m[4], 10);
        const mm = parseInt(m[5], 10);
        const ss = m[6] ? parseInt(m[6], 10) : 0;
        const tz = parseInt(m[7], 10) || 0; // e.g., -4
        if (mes !== undefined) {
          const utcMs = Date.UTC(ano, mes, dia, hh - tz, mm, ss, 0);
          return new Date(utcMs);
        }
      }
    }
  } catch (e) {
    console.warn('safeToDate: unable to parse', val, e);
  }
  return null;
};

const AnesthesiaDisplay = ({ anesthesia, compact = false }) => {
  
  // Função segura para extrair data sem problemas de timezone
  const extractSurgeryDate = (dateInput) => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
    const dateObj = safeToDate(dateInput);
    if (!dateObj) return null;
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Função para converter Date object para string de horário
  const formatTimeFromDate = (dateInput) => {
    if (!dateInput) return null;
    const dateObj = safeToDate(dateInput);
    if (!dateObj) return null;
    return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    if (typeof dateString === 'string') {
      const m = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`; // DD/MM/YYYY
    }
    const d = safeToDate(dateString);
    return d ? d.toLocaleDateString('pt-BR') : 'Data não informada';
  };

  const formatTime = (timeInput) => {
    if (!timeInput) return '--:--';
    if (typeof timeInput === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeInput)) {
      return timeInput.substring(0, 5);
    }
    const d = safeToDate(timeInput);
    return d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '--:--';
  };

  const calculateDuration = (startTime, endTime, baseDate) => {
    if (!startTime) return '--:--';

    const buildFrom = (t) => {
      // HH:MM or HH:MM:SS
      if (typeof t === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(t)) {
        const dateBase = (typeof baseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(baseDate)) ? baseDate : '2025-01-01';
        return new Date(`${dateBase}T${t.substring(0,5)}:00`);
      }
      return safeToDate(t);
    };

    const start = buildFrom(startTime);
    const end = endTime ? buildFrom(endTime) : new Date();
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return '--:--';

    const diffMs = Math.abs(end - start);
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatTechniques = (techniques) => {
    if (!techniques) return 'Não especificada';
    
    // Se é array (nova estrutura), juntar com vírgulas
    if (Array.isArray(techniques)) {
      return techniques.length > 0 ? techniques.join(', ') : 'Não especificada';
    }
    
    // Se é string (compatibilidade), usar mapeamento antigo
    const techniqueMap = {
      generalBalanced: 'Geral Balanceada',
      generalTIVA: 'Geral Venosa Total',
      spinal: 'Raquianestesia',
      epidural: 'Peridural',
      sedation: 'Sedação',
      local: 'Local',
      block: 'Bloqueio nervos periféricos',
      combined: 'Combinada'
    };
    
    return techniqueMap[techniques] || techniques || 'Não especificada';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Em andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluída': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pausada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPositions = (positions, isCompact = false) => {
    if (!positions || positions.length === 0) return 'Não especificada';
    
    if (isCompact && positions.length > 2) {
      return `${positions.slice(0, 2).join(', ')} +${positions.length - 2}`;
    }
    
    return positions.join(', ');
  };

  // Extrair dados com fallback para compatibilidade
  const surgeryDate = anesthesia.surgeryStart 
    ? extractSurgeryDate(anesthesia.surgeryStart)
    : anesthesia.surgeryDate;

  const anesthesiaTimeStart = anesthesia.anesthesiaStart || anesthesia.anesthesiaTimeStart;
  const anesthesiaTimeEnd = anesthesia.anesthesiaEnd || anesthesia.anesthesiaTimeEnd;
  const surgeryTimeStart = anesthesia.surgeryStart || anesthesia.surgeryTimeStart;
  const surgeryTimeEnd = anesthesia.surgeryEnd || anesthesia.surgeryTimeEnd;

  // Interface Mobile
  const MobileView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-medium text-sm leading-tight">
                Anestesia - {formatDate(surgeryDate)}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(anesthesia.status)}`}>
                {anesthesia.status || 'Não especificado'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-100 mt-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatTime(anesthesiaTimeStart)} - {formatTime(anesthesiaTimeEnd)}
              </span>
              <span>•</span>
              <span>Duração: {calculateDuration(anesthesiaTimeStart, anesthesiaTimeEnd, surgeryDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3 space-y-3">
        {/* Técnica */}
        <div className="bg-purple-50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <div className="flex-1">
              <div className="text-xs text-purple-600 font-medium">Técnica Anestésica</div>
              <div className="text-sm text-purple-800 font-medium">
                {formatTechniques(anesthesia.anestheticTechnique)}
              </div>
            </div>
          </div>
        </div>

        {/* Posições */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-600 font-medium mb-1">Posições do Paciente</div>
          <div className="text-sm text-gray-800">
            {formatPositions(anesthesia.patientPosition)}
          </div>
        </div>

        {/* Horários detalhados */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 rounded p-2">
            <div className="text-blue-600 font-medium">Início Cirurgia</div>
            <div className="text-blue-800">{formatTime(surgeryTimeStart)}</div>
          </div>
          <div className="bg-blue-50 rounded p-2">
            <div className="text-blue-600 font-medium">Fim Cirurgia</div>
            <div className="text-blue-800">{formatTime(surgeryTimeEnd)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Interface Desktop/Tablet
  const DesktopView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header horizontal */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Ficha Anestésica - {formatDate(surgeryDate)}
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Início: {formatTime(anesthesiaTimeStart)}
                </span>
                <span>Fim: {formatTime(anesthesiaTimeEnd)}</span>
                <span>Duração: {calculateDuration(anesthesiaTimeStart, anesthesiaTimeEnd, surgeryDate)}</span>
              </div>
            </div>
          </div>
          
          {/* Status destacado à direita */}
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(anesthesia.status)}`}>
              {anesthesia.status || 'Não especificado'}
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo detalhado */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Técnica */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h4 className="font-medium text-purple-900 text-sm">Técnica Anestésica</h4>
            </div>
            <p className="text-sm text-purple-800 font-medium">
              {formatTechniques(anesthesia.anestheticTechnique)}
            </p>
          </div>

          {/* Posições */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 text-sm mb-2">Posições do Paciente</h4>
            <p className="text-sm text-gray-700">
              {formatPositions(anesthesia.patientPosition)}
            </p>
          </div>

          {/* Horários da Cirurgia */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 text-sm mb-2">Horários da Cirurgia</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Início:</span>
                <span className="font-medium">{formatTime(surgeryTimeStart)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fim:</span>
                <span className="font-medium">{formatTime(surgeryTimeEnd)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Compact view
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center">
            <Stethoscope className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm text-gray-900">
                {formatTechniques(anesthesia.anestheticTechnique)}
              </p>
            </div>
            <div className="flex gap-2 text-xs text-gray-600">
              <span>{formatTime(anesthesiaTimeStart)} - {formatTime(anesthesiaTimeEnd)}</span>
              <span>•</span>
              <span>{formatPositions(anesthesia.patientPosition, true)}</span>
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

export default AnesthesiaDisplay;